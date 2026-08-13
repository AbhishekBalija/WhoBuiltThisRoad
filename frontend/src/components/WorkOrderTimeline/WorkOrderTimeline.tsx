import type { WorkOrder } from '@/types'
import { resolveSourceUrl } from '@/config/external-links'

function formatYear(dateStr: string | null): string {
  if (!dateStr) return '?'
  return String(new Date(dateStr).getFullYear())
}

function formatAmount(amount: number | null): string | null {
  if (amount === null || amount === undefined) return null
  return `₹${amount.toLocaleString('en-IN')}`
}

export interface WorkOrderTimelineProps {
  workOrders: WorkOrder[]
}

export function WorkOrderTimeline({ workOrders }: WorkOrderTimelineProps) {
  if (workOrders.length < 2) return null

  return (
    <section className="mt-6 border-t pt-4" aria-label="Full construction history">
      <h3 className="text-sm font-semibold text-gray-700">Full Construction History</h3>
      <p className="mt-1 text-xs text-gray-500">
        This road has multiple recorded work orders. Each represents a separate public expenditure.
      </p>

      <div className="overflow-x-auto">
        <div className="relative mt-4">
          <div className="absolute bottom-2 left-4 top-2 w-px bg-gray-200" aria-hidden="true" />
          <ol className="space-y-4">
          {workOrders.map((wo, i) => {
          const year = formatYear(wo.completion_date)
          const amount = formatAmount(wo.amount_paid)

          return (
            <li
              key={wo.id}
              className={`relative grid grid-cols-[2.5rem_1fr] gap-2 sm:grid-cols-[3rem_1fr] sm:gap-3 ${i === 0 ? 'opacity-100' : 'opacity-80'}`}
            >
              <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-[0.65rem] font-semibold text-gray-700 sm:text-xs">
                {year}
              </div>
              <div className="min-w-0 space-y-1">
                <div className="break-words text-sm font-medium text-gray-900">
                  {wo.contractor_name || 'Contractor not on record'}
                </div>
                {amount !== null && (
                  <div className="text-sm text-gray-600">{amount}</div>
                )}
                <div>
                  <a
                    href={resolveSourceUrl(wo.source_document)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                    aria-label={`Source for work order ${i + 1} of ${workOrders.length}${year !== '?' ? `, completed ${year}` : ''}`}
                  >
                    Source ↗
                  </a>
                </div>
              </div>
            </li>
          )
          })}
          </ol>
        </div>
      </div>
    </section>
  )
}
