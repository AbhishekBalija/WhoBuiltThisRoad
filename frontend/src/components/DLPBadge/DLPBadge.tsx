import type { DLPStatus } from '@/types'

const CONFIG: Record<DLPStatus, { label: string; className: string }> = {
  active: {
    label: 'Warranty Active',
    className: 'bg-emerald-100 text-emerald-800',
  },
  expiring_soon: {
    label: 'Warranty Expiring Soon',
    className: 'bg-amber-100 text-amber-800',
  },
  expired: {
    label: 'Warranty Expired',
    className: 'bg-red-100 text-red-800',
  },
  unknown: {
    label: 'Warranty Period Unknown',
    className: 'bg-gray-100 text-gray-800',
  },
}

export interface DLPBadgeProps {
  status: DLPStatus
  daysRemaining?: number | null
}

export function DLPBadge({ status, daysRemaining }: DLPBadgeProps) {
  const cfg = CONFIG[status]

  return (
    <span
      data-testid={`dlp-badge-${status}`}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${cfg.className}`}
    >
      <span>{cfg.label}</span>
      {daysRemaining != null && status === 'expiring_soon' && (
        <span className="opacity-75">({daysRemaining}d)</span>
      )}
    </span>
  )
}
