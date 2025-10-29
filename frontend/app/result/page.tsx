// app/result/page.tsx
'use client'

import React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function ResultPage() {
  const search = useSearchParams()
  const router = useRouter()

  const success = search.get('success') === 'true'
  const ref = search.get('ref')

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {success ? (
        <>
          <div className="text-3xl font-semibold text-emerald-600 mb-4">Booking Confirmed!</div>
          <p className="text-slate-700 mb-6">
            Your booking reference: <span className="font-mono font-medium">{ref}</span>
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 rounded-md text-slate-900 font-medium transition"
          >
            Back to Home
          </button>
        </>
      ) : (
        <>
          <div className="text-3xl font-semibold text-rose-600 mb-4">Booking Failed</div>
          <p className="text-slate-700 mb-6">
            Something went wrong. Please try again later.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-slate-200 hover:bg-slate-300 rounded-md text-slate-900 font-medium transition"
          >
            Go Home
          </button>
        </>
      )}
    </div>
  )
}
