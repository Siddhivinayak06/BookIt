import React from 'react'

export default function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 rounded bg-slate-100 animate-pulse" />
      ))}
    </div>
  )
}
