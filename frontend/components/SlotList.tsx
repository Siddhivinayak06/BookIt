import React from 'react'
import SlotItem from './SlotItem'

type Slot = {
  id: number
  slot_at: string
  capacity: number
  remaining?: number | null
}

type Props = {
  slots: Slot[]
  selectedId?: number | null
  onSelect?: (slotId: number) => void
}

export default function SlotList({ slots, selectedId = null, onSelect }: Props) {
  if (!slots || slots.length === 0) {
    return <div className="text-slate-500">No slots available.</div>
  }

  return (
    <div className="space-y-3">
      {slots.map((s) => (
        <SlotItem key={s.id} slot={s} selected={selectedId === s.id} onSelect={onSelect} />
      ))}
    </div>
  )
}
