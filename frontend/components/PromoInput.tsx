import React, { useState } from 'react'

type Props = {
  onApply: (code: string) => Promise<void> | void
  loading?: boolean
}

export default function PromoInput({ onApply, loading = false }: Props) {
  const [code, setCode] = useState('')

  const handleApply = async () => {
    if (!code) return
    await onApply(code.trim().toUpperCase())
  }

  return (
    <div className="flex gap-2">
      <input
        className="flex-1 p-3 border rounded"
        placeholder="Promo code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button onClick={handleApply} disabled={loading} className="px-4 py-2 bg-brand text-white rounded disabled:opacity-60">
        {loading ? 'Applying…' : 'Apply'}
      </button>
    </div>
  )
}
