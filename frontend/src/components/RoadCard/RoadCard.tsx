import { DLPBadge } from '@/components/DLPBadge'
import { ShareButton } from '@/components/ShareButton'
import { WorkOrderTimeline } from '@/components/WorkOrderTimeline'
import { EXTERNAL_LINKS, resolveSourceUrl } from '@/config/external-links'
import { formatDate, formatCrore } from '@/utils/format'
import type { Road, WorkOrder } from '@/types'

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M4.25 5.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5H6.31l5.47 5.47a.75.75 0 1 1-1.06 1.06L5.25 6.31v1.69a.75.75 0 0 1-1.5 0v-2.5Zm8.25 1.5a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75h-7.5a.75.75 0 0 1-.75-.75v-2.5a.75.75 0 0 1 1.5 0v1.75h6v-6h-1.75a.75.75 0 0 1-.75-.75Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function InfoRow({ label, value, phone }: { label: string; value: string | null; phone?: string | null }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5 py-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
      <span className="min-w-0 shrink-0 text-sm text-gray-500">{label}</span>
      <span className="min-w-0 break-words text-sm text-gray-900 sm:text-right">
        {value}
        {phone && <a href={`tel:${phone}`} className="ml-1 whitespace-nowrap text-emerald-600 hover:underline">· {phone}</a>}
      </span>
    </div>
  )
}

function SourceCitation({ label, url }: { label: string; url: string }) {
  const resolvedUrl = resolveSourceUrl(url)

  return (
    <p className="mt-3 break-words text-xs text-gray-400">
      Source: <a href={resolvedUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">{label}</a>
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
    <article className="overflow-x-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <header>
        <h1 className="break-words text-lg font-bold text-gray-900 sm:text-xl">{road.name}</h1>
        {road.description && <p className="mt-1 break-words text-sm text-gray-600">{road.description}</p>}
        <p className="mt-1 break-words text-sm text-gray-500">
          {[road.ward_name, road.division && `${road.division} Division`, road.length_km && `${road.length_km} km`]
            .filter(Boolean)
            .join(' \u00B7 ')}
        </p>
      </header>

      {latest ? (
        <section className="mt-4 border-t pt-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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

          <WorkOrderTimeline workOrders={workOrders} />
        </section>
      ) : (
        <div className="mt-4 border-t pt-4">
          <p className="break-words text-sm text-gray-500">
            No work order data found for this road yet. View all available government data sources below.
          </p>
          <ul className="mt-2 space-y-2 text-sm text-emerald-600">
            <li>
              <a
                href={EXTERNAL_LINKS.openCityWorkOrders.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 break-words hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <ExternalLinkIcon className="h-4 w-4 shrink-0" />
                {EXTERNAL_LINKS.openCityWorkOrders.label}
              </a>
            </li>
            <li>
              <a
                href={EXTERNAL_LINKS.bbmpWorksBillPublicView.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 break-words hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <ExternalLinkIcon className="h-4 w-4 shrink-0" />
                {EXTERNAL_LINKS.bbmpWorksBillPublicView.label}
              </a>
            </li>
          </ul>
        </div>
      )}

      <ShareButton road={road} latestWorkOrder={latest} />
    </article>
  )
}
