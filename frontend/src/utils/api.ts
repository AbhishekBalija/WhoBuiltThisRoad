import type { Road, WorkOrder, Ward } from '@/types'

const BASE = import.meta.env.VITE_API_URL || ''

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function searchRoads(query: string): Promise<{ count: number; results: Road[] }> {
  return apiFetch(`/api/roads/search?q=${encodeURIComponent(query)}`)
}

export async function getRoad(slug: string): Promise<{ road: Road; work_orders: WorkOrder[] } | null> {
  const res = await fetch(`${BASE}/api/roads/${slug}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Failed to load road')
  return res.json()
}

export async function getWards(): Promise<{ wards: Ward[] }> {
  return apiFetch('/api/wards')
}
