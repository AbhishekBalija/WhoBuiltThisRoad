import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRoad } from './useRoad'

const mockRoad = {
  id: 1,
  slug: 'test-road',
  name: 'Test Road',
  description: 'A test road',
  ward_number: null,
  ward_name: 'Ward 1',
  division: 'East',
  length_km: 2.5,
}

const mockWorkOrders = [
  {
    id: 1,
    contractor_name: 'Test Contractor',
    contractor_phone: null,
    ae_name: null,
    ae_phone: null,
    aee_name: null,
    aee_phone: null,
    ee_name: null,
    ee_phone: null,
    completion_date: '2023-06-15',
    dlp_expiry_date: '2025-06-15',
    dlp_status: 'expired' as const,
    days_remaining: -365,
    project_cost: 50000000,
    amount_paid: 45000000,
    source_document: 'https://example.com/doc',
    source_label: 'Test Source',
  },
]

vi.mock('@/utils/api', () => ({
  getRoad: vi.fn(),
}))

const { getRoad } = await import('@/utils/api')

describe('useRoad', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts in loading state', () => {
    vi.mocked(getRoad).mockReturnValue(new Promise<never>(() => {}))
    const { result } = renderHook(() => useRoad('test-road'))
    expect(result.current.loading).toBe(true)
    expect(result.current.road).toBeNull()
    expect(result.current.notFound).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('returns road data on success', async () => {
    vi.mocked(getRoad).mockResolvedValue({ road: mockRoad, work_orders: mockWorkOrders })
    const { result } = renderHook(() => useRoad('test-road'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.road).toEqual(mockRoad)
    expect(result.current.workOrders).toEqual(mockWorkOrders)
    expect(result.current.notFound).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('sets notFound when API returns null', async () => {
    vi.mocked(getRoad).mockResolvedValue(null)
    const { result } = renderHook(() => useRoad('missing-road'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.notFound).toBe(true)
    expect(result.current.road).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('sets error message on API failure', async () => {
    vi.mocked(getRoad).mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useRoad('test-road'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Network error')
    expect(result.current.road).toBeNull()
    expect(result.current.notFound).toBe(false)
  })

  it('cancels state updates on unmount', async () => {
    vi.mocked(getRoad).mockResolvedValue({ road: mockRoad, work_orders: mockWorkOrders })
    const { unmount } = renderHook(() => useRoad('test-road'))
    unmount()
    await waitFor(() => expect(vi.mocked(getRoad)).toHaveBeenCalledTimes(1))
  })
})
