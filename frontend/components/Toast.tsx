import React, { useEffect, useState } from 'react'

type Props = {
  message?: string | null
  type?: 'info' | 'success' | 'error'
  duration?: number
  onClose?: () => void
}

export default function Toast({ message = null, type = 'info', duration = 4000, onClose }: Props) {
  const [visible, setVisible] = useState(!!message)

  useEffect(() => {
    setVisible(!!message)
    if (!message) return
    const t = setTimeout(() => {
      setVisible(false)
      onClose?.()
    }, duration)
    return () => clearTimeout(t)
  }, [message, duration, onClose])

  if (!visible || !message) return null

  const bg = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : 'bg-slate-800'

  return (
    <div className={`fixed right-4 bottom-6 z-50 px-4 py-3 rounded text-white ${bg} shadow-lg`}>
      {message}
    </div>
  )
}
