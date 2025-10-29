import React from 'react'

type Slot = {
  id: number
  slot_at: string // ISO string
  capacity: number
  // optionally include remaining if you compute it server-side
  remaining?: number | null
}

type Props = {
  slot: Slot
  selected?: boolean
  onSelect?: (slotId: number) => void
  disabled?: boolean
}

export default function SlotItem({ slot, selected = false, onSelect, disabled = false }: Props) {
  const dateStr = new Date(slot.slot_at).toLocaleString()
  const soldOut = typeof slot.remaining === 'number' ? slot.remaining <= 0 : false

  return (
    <button
      onClick={() => !disabled && onSelect?.(slot.id)}
      disabled={disabled || soldOut}
      className={`w-full p-3 text-left border rounded flex items-center justify-between transition ${
        selected ? 'border-2 border-brand bg-brand/5' : 'border-slate-200'
      } ${soldOut ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-sm'}`}
    >
      <div>
        <div className="font-medium">{dateStr}</div>
        <div className="text-sm text-slate-500">Capacity: {slot.capacity}{slot.remaining != null ? ` · Remaining: ${slot.remaining}` : ''}</div>
      </div>

      <div className="ml-4 text-sm text-slate-700">{soldOut ? 'Sold out' : (selected ? 'Selected' : 'Select')}</div>
    </button>
  )
}
