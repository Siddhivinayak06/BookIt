'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type Experience = {
  id: number
  title: string
  description?: string | null
  image_url?: string | null
  price_cents: number
}

type SlotRow = {
  id: number
  experience_id: number
  slot_at: string // ISO
  capacity: number
  remaining?: number | null
}

export default function ExperienceClient({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [experience, setExperience] = useState<Experience | null>(null)
  const [slots, setSlots] = useState<SlotRow[]>([])
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null) // 'YYYY-MM-DD'
  const [quantity, setQuantity] = useState<number>(1)
  const [error, setError] = useState<string | null>(null)

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000'

  useEffect(() => {
    let mounted = true
    if (!id) {
      setError('Invalid experience id')
      setLoading(false)
      return
    }

    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch(`${BACKEND}/experiences/${id}`)
        if (!res.ok) throw new Error(`Failed to fetch experience (${res.status})`)
        const payload = await res.json()
        if (!payload.ok) throw new Error(payload.error || 'invalid_response')
        if (!mounted) return
        setExperience(payload.experience ?? null)
        setSlots(payload.slots ?? [])
        // set default selected date to earliest slot date
        const dates = (payload.slots || []).map((s: SlotRow) => s.slot_at.slice(0, 10))
        const uniq = Array.from(new Set(dates))
        if (uniq.length) setSelectedDate(String(uniq[0]))
      } catch (err: any) {
        console.error('Error loading experience', err)
        if (mounted) setError(err.message ?? 'Failed to load')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [id])

  // Group slots by date 'YYYY-MM-DD'
  const slotsByDate = useMemo(() => {
    const map = new Map<string, SlotRow[]>()
    slots.forEach((s) => {
      const d = s.slot_at.slice(0, 10)
      if (!map.has(d)) map.set(d, [])
      map.get(d)!.push(s)
    })
    // sort times within each date by time
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => (a.slot_at > b.slot_at ? 1 : -1))
    }
    return map
  }, [slots])

  // list of available dates sorted
  const dateList = useMemo(() => Array.from(slotsByDate.keys()).sort(), [slotsByDate])

  // slots for currently selected date
  const timesForSelectedDate = useMemo(() => {
    if (!selectedDate) return []
    return slotsByDate.get(selectedDate) ?? []
  }, [selectedDate, slotsByDate])

  // price computations
  const subtotalCents = (experience?.price_cents ?? 0) * quantity
  const taxesCents = Math.round(subtotalCents * 0.06) // 6% GST-like tax
  const totalCents = subtotalCents + taxesCents

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(cents / 100)

  const selectTimeSlot = (slotId: number) => {
    const s = slots.find((x) => x.id === slotId)
    if (!s) return
    if ((s.remaining ?? s.capacity) <= 0) return
    setSelectedSlot(slotId)
  }

  const handleProceedToCheckout = () => {
  if (!selectedSlot) {
    setError('Please choose a time slot before proceeding.')
    return
  }
  const qs = new URLSearchParams({
    experienceId: String(experience?.id ?? ''), 
    slotId: String(selectedSlot),
    quantity: String(quantity)
  }).toString()
  router.push(`/checkout?${qs}`)
}


  if (loading) {
    return (
      <div className="py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-slate-200 rounded-md" />
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="h-48 bg-slate-200 rounded" />
        </div>
      </div>
    )
  }

  if (error) return <div className="text-rose-600 py-8">{error}</div>
  if (!experience) return <div className="text-center text-slate-600 py-8">Experience not found.</div>

  // small helpers to format friendly date and time
  const friendlyDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric' })
  }
  const friendlyTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="px-4 md:px-8 lg:px-12 pb-16">
      {/* Back link */}
      <div className="mb-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-slate-700">
          ← Details
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: hero image, title, description, selectors */}
        <div className="lg:col-span-2">
          <div className="rounded-xl overflow-hidden bg-slate-100">
            {experience.image_url ? (
              <img src={experience.image_url} alt={experience.title} className="w-full h-64 md:h-80 object-cover rounded-xl" />
            ) : (
              <div className="w-full h-64 md:h-80 bg-slate-200" />
            )}
          </div>

          <h1 className="text-2xl font-semibold mt-6">{experience.title}</h1>
          <p className="text-slate-600 mt-3">{experience.description ?? 'Curated small-group experience. Certified guide. Safety first with gear included.'}</p>

          {/* Choose date */}
          <div className="mt-8">
            <h3 className="font-medium mb-3">Choose date</h3>
            <div className="flex gap-3 flex-wrap">
              {dateList.length === 0 ? (
                <div className="text-slate-500">No dates available</div>
              ) : (
                dateList.map((d) => {
                  const active = d === selectedDate
                  return (
                    <button
                      key={d}
                      onClick={() => { setSelectedDate(d); setSelectedSlot(null) }}
                      className={`px-3 py-2 rounded-md text-sm border ${active ? 'bg-yellow-100 border-yellow-300' : 'bg-white border-slate-200'} focus:outline-none`}
                    >
                      {friendlyDate(d)}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Choose time */}
          <div className="mt-6">
            <h3 className="font-medium mb-3">Choose time</h3>
            <div className="flex flex-wrap gap-3">
              {timesForSelectedDate.length === 0 ? (
                <div className="text-slate-500">No times for this date</div>
              ) : (
                timesForSelectedDate.map((s) => {
                  const rem = typeof s.remaining === 'number' ? s.remaining : s.capacity
                  const soldOut = rem <= 0
                  const isSelected = selectedSlot === s.id
                  return (
                    <button
                      key={s.id}
                      onClick={() => selectTimeSlot(s.id)}
                      disabled={soldOut}
                      className={`px-3 py-2 rounded-md text-sm border inline-flex items-center gap-2 ${soldOut ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : isSelected ? 'bg-yellow-100 border-yellow-300' : 'bg-white border-slate-200 hover:shadow-sm'}`}
                    >
                      <span className="font-medium">{friendlyTime(s.slot_at)}</span>
                      {!soldOut && <span className="text-xs text-slate-500 ml-2">{rem} left</span>}
                      {soldOut && <span className="text-xs text-rose-600 ml-2">Sold out</span>}
                    </button>
                  )
                })
              )}
            </div>

            <div className="mt-3 text-xs text-slate-400">All times are in IST (GMT +5:30)</div>
          </div>

          {/* About */}
          <div className="mt-8">
            <h3 className="font-medium mb-2">About</h3>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded text-sm text-slate-600">
              Scenic routes, trained guides, and safety briefing. Minimum age 10. Helmet and life jackets provided.
            </div>
          </div>
        </div>

        {/* Right: order summary card (sticky on large) */}
        <aside className="lg:col-span-1">
          <div className="p-5 bg-white border border-slate-100 rounded-lg shadow-soft sticky top-24">
            <div className="flex items-start justify-between">
              <div className="text-sm text-slate-500">Starts at</div>
              <div className="text-lg font-semibold">{formatPrice(experience.price_cents)}</div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-slate-500 mb-2">Quantity</div>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-8 h-8 rounded border border-slate-200">−</button>
                <div className="min-w-[36px] text-center">{quantity}</div>
                <button onClick={() => setQuantity((q) => q + 1)} className="w-8 h-8 rounded border border-slate-200">+</button>
              </div>
            </div>

            <div className="mt-6 text-sm text-slate-600">
              <div className="flex justify-between"><div>Subtotal</div><div>{formatPrice(subtotalCents)}</div></div>
              <div className="flex justify-between mt-2"><div>Taxes</div><div>{formatPrice(taxesCents)}</div></div>
              <hr className="my-4 border-slate-100" />
              <div className="flex justify-between font-semibold text-slate-900"><div>Total</div><div>{formatPrice(totalCents)}</div></div>
            </div>

            <div className="mt-5">
              <button
                onClick={handleProceedToCheckout}
                disabled={!selectedSlot}
                className={`w-full px-4 py-3 rounded-md font-medium ${selectedSlot ? 'bg-yellow-400 hover:bg-yellow-500 text-slate-900' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
