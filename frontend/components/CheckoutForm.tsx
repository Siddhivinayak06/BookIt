import React from 'react'

type Props = {
  name: string
  email: string
  phone?: string
  onChange: (field: 'name' | 'email' | 'phone', value: string) => void
  onSubmit: () => void
  loading?: boolean
}

export default function CheckoutForm({ name, email, phone, onChange, onSubmit, loading = false }: Props) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input value={name} onChange={(e) => onChange('name', e.target.value)} className="w-full p-3 border rounded" placeholder="Full name" required />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input type="email" value={email} onChange={(e) => onChange('email', e.target.value)} className="w-full p-3 border rounded" placeholder="your@email.com" required />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Phone (optional)</label>
        <input value={phone} onChange={(e) => onChange('phone', e.target.value)} className="w-full p-3 border rounded" placeholder="+91 98765 43210" />
      </div>

      <div>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-brand text-white rounded disabled:opacity-60">
          {loading ? 'Processing…' : 'Confirm Booking'}
        </button>
      </div>
    </form>
  )
}
