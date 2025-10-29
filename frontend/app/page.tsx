'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ExperienceCard from '../components/ExperienceCard'

type Experience = {
  id: number
  title: string
  image_url?: string | null
  price_cents: number
  description?: string | null
}

export default function Page() {
  const [items, setItems] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const query = (searchParams.get('q') ?? '').toLowerCase()

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000'

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch(`${BACKEND}/experiences`)
        if (!res.ok) throw new Error(`Failed to fetch experiences (${res.status})`)
        const payload = await res.json()
        if (!payload.ok) throw new Error(payload.error || 'invalid_response')
        if (mounted) setItems(payload.data || [])
      } catch (err: any) {
        console.error('Home fetch error', err)
        if (mounted) setError(err.message ?? 'Failed to load experiences')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // 🔍 Filter client-side based on query
  const filtered = items.filter((x) => x.title.toLowerCase().includes(query))

  return (
    <div>
     

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 border rounded animate-pulse h-64" />
          ))}
        </div>
      ) : error ? (
        <div className="text-rose-600">Error: {error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-slate-600">No experiences found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((exp) => (
            <ExperienceCard
              key={exp.id}
              id={exp.id}
              title={exp.title}
              imageUrl={exp.image_url ?? undefined}
              priceCents={exp.price_cents}
            />
          ))}
        </div>
      )}
    </div>
  )
}
