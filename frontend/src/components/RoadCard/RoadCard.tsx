import { DLPBadge } from '@/components/DLPBadge'
import { ShareButton } from '@/components/ShareButton'
import { formatDate, formatCrore } from '@/utils/format'
import type { Road, WorkOrder } from '@/types'

function InfoRow({ label, value, phone }: { label: string; value: string | null; phone?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-baseline justify-between gap-2 py-1.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">
        {value}
        {phone && <a href={`tel:${phone}`} className="ml-1 text-emerald-600 hover:underline">· {phone}</a>}
      </span>
    </div>
  )
}

function SourceCitation({ label, url }: { label: string; url: string }) {
  return (
    <p className="mt-3 text-xs text-gray-400">
      Source: <a href={url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:underline">{label}</a>
    </p>
  )
}

export interface RoadCardProps {
  road: Road
  workOrders: WorkOrder[]
}

export function RoadCard({ road, workOrders }: RoadCardProps) {
  const latest = workOrders[0]

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <header>
        <h1 className="text-xl font-bold text-gray-900">{road.name}</h1>
        {road.description && <p className="mt-1 text-sm text-gray-600">{road.description}</p>}
        <p className="mt-1 text-sm text-gray-500">
          {[road.ward_name, road.division && `${road.division} Division`, road.length_km && `${road.length_km} km`]
            .filter(Boolean)
            .join(' \u00B7 ')}
        </p>
      </header>

      {latest ? (
        <section className="mt-4 border-t pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Latest Work Order</h2>
            <DLPBadge status={latest.dlp_status} daysRemaining={latest.days_remaining} />
          </div>

          <div className="space-y-px">
            <InfoRow label="Contractor" value={latest.contractor_name} phone={latest.contractor_phone} />
            <InfoRow label="Assistant Engineer" value={latest.ae_name} phone={latest.ae_phone} />
            <InfoRow label="Asst. Executive Engineer" value={latest.aee_name} phone={latest.aee_phone} />
            <InfoRow label="Executive Engineer" value={latest.ee_name} phone={latest.ee_phone} />
          </div>

          <div className="mt-3 space-y-px border-t pt-3">
            <InfoRow label="Completed" value={formatDate(latest.completion_date)} />
            <InfoRow label="Warranty expires" value={formatDate(latest.dlp_expiry_date)} />
            <InfoRow label="Project cost" value={formatCrore(latest.project_cost)} />
            <InfoRow label="Amount paid" value={formatCrore(latest.amount_paid)} />
          </div>

          <SourceCitation label={latest.source_label} url={latest.source_document} />
        </section>
      ) : (
        <p className="mt-4 border-t pt-4 text-sm text-gray-500">No work order data available for this road yet.</p>
      )}

      <ShareButton road={road} latestWorkOrder={latest} />
    </article>
  )
}
