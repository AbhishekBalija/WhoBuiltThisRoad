import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RoadCard } from '@/components/RoadCard'
import { useRoad } from '@/hooks/useRoad'

function LoadingState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-500">Loading road data...</p>
    </main>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 p-4">
      <p className="text-sm text-red-600">{message}</p>
      <Link to="/" className="text-sm text-emerald-600 hover:underline">&larr; Search again</Link>
    </main>
  )
}

function NotFoundState() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 p-4">
      <h2 className="text-lg font-semibold text-gray-900">Road not found</h2>
      <Link to="/" className="text-sm text-emerald-600 hover:underline">&larr; Search again</Link>
    </main>
  )
}

export default function RoadProfile() {
  const { slug } = useParams<{ slug: string }>()
  const { loading, road, workOrders, notFound, error } = useRoad(slug!)

  useEffect(() => {
    if (road) document.title = `${road.name} — WhoBuiltThisRoad`
  }, [road])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (notFound || !road) return <NotFoundState />

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <Link to="/" className="text-emerald-600 hover:underline">&larr; Search another road</Link>
      <div className="mx-auto mt-4 max-w-2xl space-y-4">
        <RoadCard road={road} workOrders={workOrders} />
      </div>
    </main>
  )
}
