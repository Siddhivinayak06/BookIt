'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const search = useSearchParams()
  const router = useRouter()

  // Query params
  const slotIdParam = search.get('slotId')
  const experienceIdParam = search.get('experienceId')
  const quantityParam = search.get('quantity') ?? '1'

  // State
  const [slot, setSlot] = useState<any | null>(null)
  const [experience, setExperience] = useState<any | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [promo, setPromo] = useState('')
  const [promoApplied, setPromoApplied] = useState<any | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const slotId = slotIdParam ? Number(slotIdParam) : null
  const experienceId = experienceIdParam ? Number(experienceIdParam) : null
  const quantity = Math.max(1, Number(quantityParam))
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000'

  // Field errors for live validation & red borders
  const [fieldErrors, setFieldErrors] = useState<{ [k: string]: string }>({})

  // Basic validators
  const validateAll = () => {
    const errs: any = {}
    if (!name.trim() || name.trim().length < 2) errs.name = 'Name must be at least 2 characters'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) errs.email = 'Enter a valid email'
    if (phone && !/^\d{10,}$/.test(phone.trim())) errs.phone = 'Phone must be 10+ digits'
    if (!agreed) errs.agreed = 'You must agree to terms'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const isFormValid = useMemo(() => {
    return (
      name.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
      (!phone || /^\d{10,}$/.test(phone.trim())) &&
      agreed
    )
  }, [name, email, phone, agreed])

  // Load slot & experience when params change (reactive; no reload)
  useEffect(() => {
    if (!slotId || isNaN(slotId)) return
    let mounted = true

    ;(async () => {
      setLoading(true)
      setError(null)

      try {
        if (experienceId && Number.isFinite(experienceId) && experienceId > 0) {
          const expResp = await fetch(`${BACKEND}/experiences/${experienceId}`)
          if (!expResp.ok) throw new Error(`Failed to fetch experience (${expResp.status})`)
          const expJson = await expResp.json()
          if (!expJson.ok) throw new Error(expJson.error || 'invalid_response')
          if (!mounted) return
          const s = (expJson.slots || []).find((sl: any) => Number(sl.id) === Number(slotId))
          if (!s) {
            setError('Slot not found for the provided experience.')
            setLoading(false)
            return
          }
          setSlot(s)
          setExperience(expJson.experience)
          setLoading(false)
          return
        }

        // fallback scan (rare)
        const listResp = await fetch(`${BACKEND}/experiences`)
        if (!listResp.ok) throw new Error('Failed to fetch experiences')
        const listJson = await listResp.json()
        if (!listJson.ok) throw new Error(listJson.error || 'invalid_response')

        let found = false
        for (const e of listJson.data) {
          if (!mounted) break
          const expResp = await fetch(`${BACKEND}/experiences/${e.id}`)
          if (!expResp.ok) continue
          const expJson = await expResp.json()
          if (!expJson.ok) continue
          const s = (expJson.slots || []).find((sl: any) => Number(sl.id) === Number(slotId))
          if (s) {
            setSlot(s)
            setExperience(expJson.experience)
            found = true
            break
          }
        }

        if (!found) setError('Slot not found')
      } catch (err: any) {
        console.error('Checkout fetch error', err)
        setError(err.message ?? 'Failed to load booking data')
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => { mounted = false }
  }, [slotId, experienceId, search])

  const computeSubtotal = () => (experience ? experience.price_cents * quantity : 0)
  const subtotal = computeSubtotal()
  const afterPromo = subtotal - (promoApplied?.savedCents ?? 0)
  const taxes = Math.round(afterPromo * 0.06)
  const total = afterPromo + taxes

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(cents / 100)

  // Promo
  const applyPromo = async () => {
    // Make promo optional:
    // - empty promo => clear any applied promo and return (no error)
    // - otherwise validate with backend (if experience missing, subtotal is 0)
    if (!promo || !promo.trim()) {
      setPromoApplied(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`${BACKEND}/promo/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promo.trim().toUpperCase(), amount_cents: computeSubtotal() })
      })
      const json = await resp.json()
      if (!resp.ok) throw new Error(json.error || 'Promo validation failed')
      if (!json.valid) {
        // Keep behaviour: show error and clear any previously applied promo
        setError('Promo not valid or expired')
        setPromoApplied(null)
        return
      }
      const discounted = json.discounted_cents ?? computeSubtotal()
      setPromoApplied({ code: promo.trim().toUpperCase(), savedCents: computeSubtotal() - discounted })
    } catch (err: any) {
      console.error(err)
      setError(err.message ?? 'Promo error')
    } finally {
      setLoading(false)
    }
  }

  // replace your existing handleConfirm with this function
const handleConfirm = async () => {
  setError(null)
  if (!validateAll()) return

  if (!slot || !experience) {
    setError('Missing booking info')
    return
  }

  setLoading(true)
  try {
    const expectedTotal = afterPromo

    // Send promo code as empty string if none (keeps RPC parameter present)
    const payload = {
      slotId: slot.id,
      name,
      email,
      phone,
      quantity,
      promoCode: promoApplied?.code ?? '',
      expectedTotalCents: expectedTotal
    }

    const resp = await fetch(`${BACKEND}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    // parse body once and reuse
    const json = await resp.json().catch(() => null)
    // helpful console log for debugging server-side shapes
    // eslint-disable-next-line no-console
    console.info('POST /bookings response', resp.status, json)

    if (!resp.ok || !json || !json.ok) {
      // If server returned a PL/pgSQL error that mentions v_promo (or similar),
      // show a friendly suggestion to remove the promo and try again.
      const serverMsg = (json && (json.error || (typeof json === 'string' ? json : undefined))) || `Booking failed (${resp.status})`

      // Detect known RPC SQL bug pattern
      if (serverMsg.toString().toLowerCase().includes('v_promo') || serverMsg.toString().toLowerCase().includes('not assigned')) {
        setError('Server had a problem processing the promo code. Try removing the promo and try again.')
      } else {
        setError(serverMsg)
      }
      setLoading(false)
      return
    }

    // Success path
    const bookingId = json.data?.booking_id ?? null
    const ref = bookingId ? `BK${String(bookingId).padStart(6, '0')}` : Math.random().toString(36).slice(2,9).toUpperCase()
    router.push(`/result?success=true&ref=${encodeURIComponent(ref)}`)
  } catch (err: any) {
    console.error('Booking error:', err)
    // Fallback message
    setError(err?.message ?? 'Booking failed')
  } finally {
    setLoading(false)
  }
}


  // Small helpers for UI
  const inputBase = 'w-full px-4 py-3 rounded-md outline-none transition'
  const invalidClass = (k: string) => fieldErrors[k] ? 'border-rose-500 ring-1 ring-rose-100' : 'border-slate-200'
  const placeholderClass = 'placeholder:text-slate-400'

  return (
    <div className="px-6 md:px-12 lg:px-20 py-8">
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-slate-700 mb-6">← Checkout</button>

      {loading ? (
        <div className="text-slate-500">Loading…</div>
      ) : error ? (
        <div className="text-rose-600 mb-4">{error}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: form */}
          <div className="lg:col-span-2">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full name */}
                <div>
                  <label className="block text-xs text-slate-600 mb-2">Full name</label>
                  <input
                    value={name}
                    onChange={(e) => { setName(e.target.value); setFieldErrors(prev => ({ ...prev, name: '' })) }}
                    placeholder="Your name"
                    className={`${inputBase} ${invalidClass('name')} ${placeholderClass} bg-white`}
                  />
                  {fieldErrors.name && <div className="text-rose-600 text-xs mt-1">{fieldErrors.name}</div>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs text-slate-600 mb-2">Email</label>
                  <input
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: '' })) }}
                    placeholder="you@example.com"
                    className={`${inputBase} ${invalidClass('email')} ${placeholderClass} bg-white`}
                  />
                  {fieldErrors.email && <div className="text-rose-600 text-xs mt-1">{fieldErrors.email}</div>}
                </div>
              </div>

              {/* Promo */}
              <div className="mt-4 flex items-center gap-3">
                <input
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  placeholder="Promo code"
                  className="flex-1 px-4 py-3 rounded-md bg-white border border-slate-200 placeholder:text-slate-400"
                />
                <button onClick={applyPromo} disabled={loading} className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800">Apply</button>
              </div>

              {/* Terms */}
              <div className="mt-4 flex items-start gap-3">
                <input id="agree" type="checkbox" checked={agreed} onChange={() => { setAgreed(v => !v); setFieldErrors(prev => ({ ...prev, agreed: '' })) }} className="mt-1" />
                <div>
                  <label htmlFor="agree" className="text-sm text-slate-600">I agree to the terms and safety policy</label>
                  {fieldErrors.agreed && <div className="text-rose-600 text-xs mt-1">{fieldErrors.agreed}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: summary */}
          <aside className="lg:col-span-1">
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-soft sticky top-24">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Experience</span>
                <span className="text-slate-700">{experience?.title ?? '-'}</span>
              </div>

              <div className="mt-3 flex justify-between text-sm text-slate-500">
                <span>Date</span>
                <span className="text-slate-700">{slot?.slot_at?.slice(0,10) ?? '-'}</span>
              </div>

              <div className="mt-2 flex justify-between text-sm text-slate-500">
                <span>Time</span>
                <span className="text-slate-700">{slot ? new Date(slot.slot_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-'}</span>
              </div>

              <div className="mt-2 flex justify-between text-sm text-slate-500">
                <span>Qty</span>
                <span className="text-slate-700">{quantity}</span>
              </div>

              <div className="mt-4 border-t pt-3 text-sm text-slate-600">
                <div className="flex justify-between"><span>Subtotal</span><span className="text-slate-700">{formatPrice(subtotal)}</span></div>
                {promoApplied && <div className="flex justify-between text-emerald-700 mt-2"><span>Promo ({promoApplied.code})</span><span>-{formatPrice(promoApplied.savedCents)}</span></div>}
                <div className="flex justify-between mt-2"><span>Taxes</span><span className="text-slate-700">{formatPrice(taxes)}</span></div>
                <hr className="my-3 border-slate-100" />
                <div className="flex justify-between font-semibold text-slate-900"><span>Total</span><span>{formatPrice(total)}</span></div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={!isFormValid || loading}
                className={`mt-5 w-full py-3 rounded-md font-medium ${isFormValid ? 'bg-yellow-400 hover:bg-yellow-500 text-slate-900' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                {loading ? 'Processing…' : 'Pay and Confirm'}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
