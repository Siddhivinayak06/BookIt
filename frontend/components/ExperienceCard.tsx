import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'

type Props = {
  id: number
  title: string
  imageUrl?: string
  priceCents: number
  location?: string
  description?: string
  highlighted?: boolean
}

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(cents / 100)

export default function ExperienceCard({
  id,
  title,
  imageUrl,
  priceCents,
  location = 'Udupi',
  description,
  highlighted = false,
}: Props) {
  const router = useRouter()

  const onViewDetailsClick = (e: React.MouseEvent) => {
    // Prevent the button click from bubbling to the outer link twice
    e.stopPropagation()
    e.preventDefault()
    router.push(`/experience/${id}`)
  }

  return (
    <div className={`${highlighted ? 'card-highlight' : ''} rounded-lg-custom overflow-visible`}>
      <div className="card-inner rounded-lg-custom bg-card-bg border border-[var(--card-border)] shadow-soft overflow-hidden">
        {/* Outer link — makes the whole card clickable and accessible */}
        <Link href={`/experience/${id}`} className="block group" aria-label={`View ${title}`}>
          <div className="h-44 md:h-48 img-zoom bg-slate-100">
            {imageUrl ? (
              <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">No image</div>
            )}
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-500 mt-2 line-clamp-2">{description ?? 'Curated small-group experience. Certified guide. Safety first with gear included.'}</p>
              </div>

              <div className="ml-3 shrink-0">
                <span className="inline-block bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-md">{location}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">From</div>
                <div className="text-lg font-bold text-slate-800">{formatPrice(priceCents)}</div>
              </div>

              {/* Button (not a link) — stops propagation and navigates client-side */}
              <div>
                <button
                  onClick={onViewDetailsClick}
                  className="px-3 py-2 bg-accent hover:bg-accent-hover text-slate-900 font-medium rounded-md shadow"
                  aria-label={`View details for ${title}`}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
