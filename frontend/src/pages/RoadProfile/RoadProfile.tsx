import { Link, useParams } from 'react-router-dom'
import { Meta } from '@/components/Meta'
import { RoadCard } from '@/components/RoadCard'
import { useRoad } from '@/hooks/useRoad'
import type { DLPStatus } from '@/types'
import { DLP_STATUS_TEXT } from '@/utils/dlpStatus'

function LoadingState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-500">Loading road data…</p>
    </main>
  )
}

function ErrorState() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 p-4">
      <p className="text-sm text-red-600">Could not load data. Please try again.</p>
      <Link to="/" className="text-sm text-emerald-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">&larr; Search again</Link>
    </main>
  )
}

function NotFoundState() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 p-4">
      <h2 className="text-lg font-semibold text-gray-900">Road not found</h2>
      <Link to="/" className="text-sm text-emerald-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">&larr; Search again</Link>
    </main>
  )
}

function buildMetaDescription(roadName: string, latest?: { contractor_name: string | null; dlp_status: DLPStatus }) {
  const contractor = latest?.contractor_name ?? 'unknown contractor'
  const warranty = DLP_STATUS_TEXT[latest?.dlp_status ?? 'unknown']
  return `${roadName} — built by ${contractor}. Warranty: ${warranty}. View the public record on WhoBuiltThisRoad.`
}

export default function RoadProfile() {
  const { slug } = useParams<{ slug: string }>()
  const { loading, road, workOrders, notFound, error } = useRoad(slug!)

  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (notFound || !road) return <NotFoundState />

  const latest = workOrders[0]
  const title = `${road.name} — WhoBuiltThisRoad`
  const description = buildMetaDescription(road.name, latest)

  return (
    <>
      <Meta title={title} description={description} />
      <main className="min-h-screen overflow-x-hidden bg-gray-50 p-4">
        <Link to="/" className="text-sm text-emerald-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:text-base">&larr; Search another road</Link>
        <div className="mx-auto mt-4 max-w-2xl space-y-4">
          <RoadCard road={road} workOrders={workOrders} />
        </div>
      </main>
    </>
  )
}
