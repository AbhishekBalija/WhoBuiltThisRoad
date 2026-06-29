import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RoadProfile from './RoadProfile'

vi.mock('@/hooks/useRoad', () => ({
  useRoad: vi.fn(),
}))

const { useRoad } = await import('@/hooks/useRoad')

function renderWithRoute(slug = 'test-road') {
  return render(
    <MemoryRouter initialEntries={[`/road/${slug}`]}>
      <Routes>
        <Route path="/road/:slug" element={<RoadProfile />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RoadProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.title = ''
  })

  it('shows loading state', () => {
    vi.mocked(useRoad).mockReturnValue({
      loading: true,
      road: null,
      workOrders: [],
      notFound: false,
      error: null,
    })
    renderWithRoute()
    expect(screen.getByText('Loading road data...')).toBeInTheDocument()
  })

  it('shows error state with message', () => {
    vi.mocked(useRoad).mockReturnValue({
      loading: false,
      road: null,
      workOrders: [],
      notFound: false,
      error: 'API error',
    })
    renderWithRoute()
    expect(screen.getByText('API error')).toBeInTheDocument()
    expect(screen.getByText(/Search again/)).toBeInTheDocument()
  })

  it('shows not found state', () => {
    vi.mocked(useRoad).mockReturnValue({
      loading: false,
      road: null,
      workOrders: [],
      notFound: true,
      error: null,
    })
    renderWithRoute()
    expect(screen.getByText('Road not found')).toBeInTheDocument()
    expect(screen.getByText(/Search again/)).toBeInTheDocument()
  })

  it('renders RoadCard with data', () => {
    vi.mocked(useRoad).mockReturnValue({
      loading: false,
      road: { id: 1, slug: 'test-road', name: 'Test Road', ward_name: 'Ward 1', description: 'desc', division: 'East', length_km: 2, ward_number: null },
      workOrders: [
        { id: 1, contractor_name: 'Builder Co', contractor_phone: null, ae_name: null, ae_phone: null, aee_name: null, aee_phone: null, ee_name: null, ee_phone: null, completion_date: '2023-06-15', dlp_expiry_date: '2025-06-15', dlp_status: 'active' as const, days_remaining: 365, project_cost: null, amount_paid: null, source_document: 'https://example.com', source_label: 'Source' },
      ],
      notFound: false,
      error: null,
    })
    renderWithRoute()
    expect(screen.getByText('Test Road')).toBeInTheDocument()
    expect(screen.getByText('Builder Co')).toBeInTheDocument()
    expect(screen.getByText(/Search another road/)).toBeInTheDocument()
  })

  it('sets document title when road loads', () => {
    vi.mocked(useRoad).mockReturnValue({
      loading: false,
      road: { id: 1, slug: 'test-road', name: 'Test Road', ward_name: 'Ward 1', description: '', division: 'East', length_km: null, ward_number: null },
      workOrders: [],
      notFound: false,
      error: null,
    })
    renderWithRoute()
    expect(document.title).toBe('Test Road — WhoBuiltThisRoad')
  })
})
