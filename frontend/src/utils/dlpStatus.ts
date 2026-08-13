import type { DLPStatus } from '@/types'

export const DLP_STATUS_TEXT: Record<DLPStatus, string> = {
  active: 'still active',
  expiring_soon: 'expiring soon',
  expired: 'expired',
  unknown: 'status unknown',
}
