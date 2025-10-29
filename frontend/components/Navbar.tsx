'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

export default function Navbar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initial = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initial)

  // debounce timer ref
  const debounceRef = useRef<number | null>(null)

  // keep input in sync when URL changes externally (back/forward)
  useEffect(() => {
    const current = searchParams.get('q') ?? ''
    if (current !== query) setQuery(current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()])

  // update URL as user types (debounced)
  useEffect(() => {
    // clear previous timer
    if (debounceRef.current) window.clearTimeout(debounceRef.current)

    // minimal typing length to trigger (optional): trigger even on empty to clear query
    debounceRef.current = window.setTimeout(() => {
      const trimmed = query.trim()
      const newUrl = trimmed ? `/?q=${encodeURIComponent(trimmed)}` : '/'
      // use replace to avoid creating history entries for every keystroke
      router.replace(newUrl)
    }, 300) // 300ms debounce

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [query, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // pushing here is optional — but replace already set the q param
    const q = query.trim()
    router.replace(q ? `/?q=${encodeURIComponent(q)}` : '/')
  }

  return (
    <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 md:px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <img src="/HDlogo.png" alt="BookIt" className="h-9 w-auto" />
        </Link>

        {/* Live search input */}
        <div className="flex-1 max-w-md mx-6">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex shadow-sm">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text"
                placeholder="Search experiences"
                aria-label="Search experiences"
                className="flex-1 px-4 py-2 rounded-l-md border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:ring-1 focus:ring-yellow-300 focus:border-yellow-300 outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-medium rounded-r-md text-sm transition"
              >
                Search
              </button>
            </div>
          </form>
        </div>

      
      </div>
    </header>
  )
}
