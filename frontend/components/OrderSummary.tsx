import React from 'react'

type Props = {
  title?: string
  priceCents: number
  quantity: number
  discountCents?: number
}

const format = (cents: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(cents / 100)

export default function OrderSummary({ title = 'Order Summary', priceCents, quantity, discountCents = 0 }: Props) {
  const subtotal = priceCents * quantity
  const total = Math.max(0, subtotal - (discountCents ?? 0))

  return (
    <aside className="p-4 border rounded">
      <h3 className="font-semibold">{title}</h3>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between"><span>Price</span><span>{format(priceCents)}</span></div>
        <div className="flex justify-between"><span>Quantity</span><span>{quantity}</span></div>
        <div className="flex justify-between"><span>Subtotal</span><span>{format(subtotal)}</span></div>
        {discountCents ? (
          <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{format(discountCents)}</span></div>
        ) : null}
        <hr className="my-3" />
        <div className="flex justify-between font-semibold"><span>Total</span><span>{format(total)}</span></div>
      </div>
    </aside>
  )
}
