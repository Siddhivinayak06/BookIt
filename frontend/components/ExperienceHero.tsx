import React from 'react'

type Props = {
  title: string
  description?: string | null
  imageUrl?: string | null
}

export default function ExperienceHero({ title, description, imageUrl }: Props) {
  return (
    <section className="rounded-lg overflow-hidden shadow-sm mb-6">
      <div className="h-64 bg-slate-100 flex items-center justify-center">
        {imageUrl ? <img src={imageUrl} alt={title} className="w-full h-full object-cover" /> : <div className="text-slate-400">No image</div>}
      </div>
      <div className="p-4 bg-white">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="text-slate-600 mt-2">{description}</p>}
      </div>
    </section>
  )
}
