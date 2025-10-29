'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

export default function NotFoundPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-bold text-slate-900 mb-4">404 - Page Not Found</h1>
      <p className="text-slate-600 mb-8">
        Oops! The page you’re looking for doesn’t exist or has been moved.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-yellow-400 rounded-md text-slate-900 font-medium hover:bg-yellow-500"
        >
          Go Home
        </button>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50"
        >
          Go Back
        </button>
      </div>
    </div>
  )
}
