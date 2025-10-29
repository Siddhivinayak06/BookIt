// Server component
import ExperienceClient from './ExperienceClient'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params // ✅ unwrap the Promise
  return <ExperienceClient id={id} />
}
