import dotenv from 'dotenv'
dotenv.config({ path: process.env.DOTENV_PATH ?? '.env.local' })

import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { supabaseServer } from './supabaseServer.js'

const app = express()
app.use(express.json())
app.use(morgan('dev'))
app.use(cors({ origin: process.env.CORS_ORIGIN || true }))

// Health check
app.get('/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }))

// GET /experiences -> optionally accepts ?slotId=NN to return the experience that owns that slot
app.get('/experiences', async (req, res) => {
  try {
    const q = (req.query.q ?? '').toString().trim()
    const slotIdRaw = req.query.slotId ?? null
    const slotId = slotIdRaw ? Number(slotIdRaw) : null

    // If client asked for a slotId, return just that slot + its experience
    if (slotId && Number.isInteger(slotId) && slotId > 0) {
      // join slots -> experiences, compute remaining seats if needed
      const { data: slotRow, error: slotErr } = await supabaseServer
        .from('slots')
        .select('id, experience_id, slot_at, capacity')
        .eq('id', slotId)
        .maybeSingle()

      if (slotErr) {
        console.error('GET /experiences?slotId supabase slotErr', slotErr)
        return res.status(500).json({ ok: false, error: slotErr.message })
      }
      if (!slotRow) return res.status(404).json({ ok: false, error: 'slot_not_found' })

      // fetch experience
      const { data: exp, error: expErr } = await supabaseServer
        .from('experiences')
        .select('id, title, slug, description, image_url, price_cents, created_at')
        .eq('id', slotRow.experience_id)
        .maybeSingle()

      if (expErr) {
        console.error('GET /experiences?slotId supabase expErr', expErr)
        return res.status(500).json({ ok: false, error: expErr.message })
      }
      if (!exp) return res.status(404).json({ ok: false, error: 'experience_not_found' })

      // compute remaining using bookings aggregation (so we don't rely on RPC)
      const { data: bookedRows, error: bErr } = await supabaseServer
        .from('bookings')
        .select('quantity')
        .eq('slot_id', slotId)

      if (bErr) {
        console.error('GET /experiences?slotId bookings err', bErr)
        return res.status(500).json({ ok: false, error: bErr.message })
      }

      const booked = (bookedRows || []).reduce((a, b) => a + (b.quantity || 0), 0)
      const remaining = Math.max(0, (slotRow.capacity || 0) - booked)

      // return the experience + single slot (same shape that frontend expects)
      return res.json({
        ok: true,
        data: [exp], // keep top-level list shape for compatibility
        experience: exp,
        slots: [{ id: slotRow.id, slot_at: slotRow.slot_at, capacity: slotRow.capacity, remaining }]
      })
    }

    // Normal path: search / list behaviour (with optional q filter)
    let query = supabaseServer
      .from('experiences')
      .select('id, title, slug, description, image_url, price_cents, created_at')
      .order('created_at', { ascending: false })

    if (q.length > 0) {
      // safe filtering: if your supabase client version supports .or you can extend search across description
      try {
        query = query.ilike('title', `%${q}%`)
      } catch (e) {
        // fallback: leave unfiltered
      }
    }

    const { data, error } = await query
    if (error) {
      console.error('GET /experiences supabase error:', error)
      return res.status(500).json({ ok: false, error: error.message })
    }

    return res.json({ ok: true, data })
  } catch (err) {
    console.error('GET /experiences error', err)
    return res.status(500).json({ ok: false, error: 'server_error' })
  }
})


// GET /experiences/:id -> experience details + slots_with_remaining
app.get('/experiences/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || !isFinite(id) || id <= 0) {
    return res.status(400).json({ ok: false, error: 'invalid_id' })
  }

  try {
    // fetch experience (maybeSingle to avoid throwing if not found)
    const { data: exp, error: expErr } = await supabaseServer
      .from('experiences')
      .select('id, title, slug, description, image_url, price_cents, created_at')
      .eq('id', id)
      .maybeSingle()

    if (expErr) {
      console.error('GET /experiences/:id expErr', expErr)
      return res.status(500).json({ ok: false, error: expErr.message })
    }
    if (!exp) return res.status(404).json({ ok: false, error: 'experience_not_found' })

    // try RPC that returns slots with remaining (preferred)
    const { data: slotsRpc, error: rpcErr } = await supabaseServer.rpc('get_slots_with_remaining', { p_experience_id: id })

    if (!rpcErr && Array.isArray(slotsRpc)) {
      return res.json({ ok: true, experience: exp, slots: slotsRpc })
    }

    // fallback: query slots and compute remaining using bookings aggregation
    const { data: rawSlots, error: slotsErr } = await supabaseServer
      .from('slots')
      .select('id, experience_id, slot_at, capacity, created_at, bookings ( quantity )')
      .eq('experience_id', id)
      .order('slot_at', { ascending: true })

    if (slotsErr) {
      console.error('GET /experiences/:id slotsErr', slotsErr)
      return res.status(500).json({ ok: false, error: slotsErr.message })
    }

    const computed = (rawSlots || []).map((s) => {
      const booked = (s.bookings || []).reduce((a, b) => a + (b.quantity || 0), 0)
      return { id: s.id, slot_at: s.slot_at, capacity: s.capacity, remaining: Math.max(0, s.capacity - booked) }
    })

    return res.json({ ok: true, experience: exp, slots: computed })
  } catch (err) {
    console.error('GET /experiences/:id unexpected error', err)
    return res.status(500).json({ ok: false, error: 'server_error' })
  }
})

// POST /promo/validate -> { code, amount_cents }
app.post('/promo/validate', async (req, res) => {
  try {
    const rawCode = (req.body?.code ?? '').toString()
    const code = rawCode.trim().toUpperCase()
    const amount_cents = Number(req.body?.amount_cents ?? 0)

    if (!code) return res.status(400).json({ ok: false, error: 'missing_code' })
    if (!Number.isFinite(amount_cents) || amount_cents < 0) {
      return res.status(400).json({ ok: false, error: 'invalid_amount' })
    }

    const { data: promo, error } = await supabaseServer
      .from('promos')
      .select('id, code, type, value, active, expires_at')
      .eq('code', code)
      .eq('active', true)
      .maybeSingle()

    if (error) {
      console.error('POST /promo/validate supabase error', error)
      return res.status(500).json({ ok: false, error: error.message })
    }

    if (!promo) {
      // intentionally return ok:true but valid:false (client-friendly)
      return res.json({ ok: true, valid: false })
    }

    // check expiry
    if (promo.expires_at && new Date(promo.expires_at) <= new Date()) {
      return res.json({ ok: true, valid: false })
    }

    let discounted = amount_cents
    if (promo.type === 'percentage') {
      discounted = Math.floor((amount_cents * (100 - promo.value)) / 100)
    } else {
      // flat: promo.value is assumed to be in cents
      discounted = Math.max(0, amount_cents - Number(promo.value || 0))
    }

    return res.json({
      ok: true,
      valid: true,
      promo: { code: promo.code, type: promo.type, value: promo.value },
      discounted_cents: discounted
    })
  } catch (err) {
    console.error('POST /promo/validate unexpected error', err)
    return res.status(500).json({ ok: false, error: 'server_error' })
  }
})

// POST /bookings
app.post('/bookings', async (req, res) => {
  try {
    const slotId = Number(req.body?.slotId)
    const name = (req.body?.name ?? '').toString()
    const email = (req.body?.email ?? '').toLowerCase().trim()
    const phone = (req.body?.phone ?? '').toString()
    const quantity = Number(req.body?.quantity)
    const promoCode = (req.body?.promoCode ?? '').trim().toUpperCase()
    const expectedTotalCents = Number(req.body?.expectedTotalCents)

    if (!slotId || !name || !email || !quantity || !expectedTotalCents)
      return res.status(400).json({ ok: false, error: 'missing_fields' })

    // ✅ 1. Check if user already booked this slot
    const { data: existingBooking, error: existingErr } = await supabaseServer
      .from('bookings')
      .select('id')
      .eq('slot_id', slotId)
      .eq('email', email)
      .maybeSingle()

    if (existingErr) throw existingErr
    if (existingBooking)
      return res.status(400).json({
        ok: false,
        error: 'You have already booked this slot.',
      })

    // ✅ 2. Check remaining capacity before booking
    const { data: slotData, error: slotErr } = await supabaseServer
      .from('slots')
      .select('capacity, bookings(quantity)')
      .eq('id', slotId)
      .single()

    if (slotErr || !slotData)
      return res.status(404).json({ ok: false, error: 'Slot not found' })

    const bookedQty = (slotData.bookings || []).reduce(
      (sum, b) => sum + (b.quantity || 0),
      0
    )
    const remaining = slotData.capacity - bookedQty

    if (remaining < quantity)
      return res.status(400).json({
        ok: false,
        error: 'Not enough seats available for this slot.',
      })

    // ✅ 3. Insert booking safely
    const params = {
      p_slot_id: slotId,
      p_name: name,
      p_email: email,
      p_phone: phone,
      p_quantity: quantity,
      p_promo_code: promoCode,
      p_expected_total_cents: expectedTotalCents,
    }

    const { data, error } = await supabaseServer.rpc('rpc_create_booking', params)
    if (error) throw error

    res.json({ ok: true, data })
  } catch (err) {
    console.error('Booking error:', err)
    const msg = err.message || 'server_error'
    if (msg.includes('unique constraint'))
      return res.status(400).json({
        ok: false,
        error: 'Duplicate booking not allowed for the same slot.',
      })
    res.status(500).json({ ok: false, error: msg })
  }
})



const port = Number(process.env.PORT) || 4000
app.listen(port, () => console.log(`BookIt backend listening on port ${port}`))
