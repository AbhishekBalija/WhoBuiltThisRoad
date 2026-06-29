export type DLPStatus = 'active' | 'expiring_soon' | 'expired' | 'unknown'

export interface Road {
  id: number
  slug: string
  name: string
  description: string | null
  ward_number: number | null
  ward_name: string | null
  division: string | null
  length_km: number | null
}

export interface WorkOrder {
  id: number
  contractor_name: string | null
  contractor_phone: string | null
  ae_name: string | null
  ae_phone: string | null
  aee_name: string | null
  aee_phone: string | null
  ee_name: string | null
  ee_phone: string | null
  completion_date: string | null
  dlp_expiry_date: string | null
  dlp_status: DLPStatus
  days_remaining: number | null
  project_cost: number | null
  amount_paid: number | null
  source_document: string
  source_label: string
}

export interface Ward {
  ward_number: number
  ward_name: string
  division: string
  road_count: number
}
