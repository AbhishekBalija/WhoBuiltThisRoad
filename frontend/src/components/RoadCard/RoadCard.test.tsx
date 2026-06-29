import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { RoadCard } from './RoadCard'
import type { Road, WorkOrder } from '@/types'

const mockRoad: Road = {
  id: 1,
  slug: 'test-road',
  name: 'Test Road',
  description: 'A test road description',
  ward_number: null,
  ward_name: 'Ward 1',
  division: 'East',
  length_km: 2.5,
}

const mockWorkOrder: WorkOrder = {
  id: 1,
  contractor_name: 'ABC Constructions',
  contractor_phone: '9876543210',
  ae_name: 'AE Name',
  ae_phone: '9123456789',
  aee_name: 'AEE Name',
  aee_phone: null,
  ee_name: 'EE Name',
  ee_phone: '9988776655',
  completion_date: '2023-06-15',
  dlp_expiry_date: '2025-06-15',
  dlp_status: 'expired',
  days_remaining: -365,
  project_cost: 50000000,
  amount_paid: 45000000,
  source_document: 'https://example.com/doc',
  source_label: 'BBMP DLP Register',
}

describe('RoadCard', () => {
  it('renders road name and description', () => {
    render(<RoadCard road={mockRoad} workOrders={[mockWorkOrder]} />)
    expect(screen.getByText('Test Road')).toBeInTheDocument()
    expect(screen.getByText('A test road description')).toBeInTheDocument()
  })

  it('renders ward, division, and length in meta', () => {
    render(<RoadCard road={mockRoad} workOrders={[mockWorkOrder]} />)
    expect(screen.getByText(/Ward 1/)).toBeInTheDocument()
    expect(screen.getByText(/East Division/)).toBeInTheDocument()
    expect(screen.getByText(/2.5 km/)).toBeInTheDocument()
  })

  it('renders DLP badge for latest work order', () => {
    render(<RoadCard road={mockRoad} workOrders={[mockWorkOrder]} />)
    expect(screen.getByText('Warranty Expired')).toBeInTheDocument()
  })

  it('renders contractor name with phone link', () => {
    render(<RoadCard road={mockRoad} workOrders={[mockWorkOrder]} />)
    expect(screen.getByText('ABC Constructions')).toBeInTheDocument()
    const phoneLink = screen.getByRole('link', { name: /9876543210/ })
    expect(phoneLink).toHaveAttribute('href', 'tel:9876543210')
  })

  it('renders all engineer names', () => {
    render(<RoadCard road={mockRoad} workOrders={[mockWorkOrder]} />)
    expect(screen.getByText('AE Name')).toBeInTheDocument()
    expect(screen.getByText('AEE Name')).toBeInTheDocument()
    expect(screen.getByText('EE Name')).toBeInTheDocument()
  })

  it('formats project cost in crores', () => {
    render(<RoadCard road={mockRoad} workOrders={[mockWorkOrder]} />)
    expect(screen.getByText('₹5.00 Cr')).toBeInTheDocument()
  })

  it('formats amount paid in crores', () => {
    render(<RoadCard road={mockRoad} workOrders={[mockWorkOrder]} />)
    expect(screen.getByText('₹4.50 Cr')).toBeInTheDocument()
  })

  it('renders source citation with link', () => {
    render(<RoadCard road={mockRoad} workOrders={[mockWorkOrder]} />)
    const sourceLink = screen.getByRole('link', { name: 'BBMP DLP Register' })
    expect(sourceLink).toHaveAttribute('href', 'https://example.com/doc')
  })

  it('renders completion and warranty dates', () => {
    render(<RoadCard road={mockRoad} workOrders={[mockWorkOrder]} />)
    expect(screen.getByText('15 June 2023')).toBeInTheDocument()
    expect(screen.getByText('15 June 2025')).toBeInTheDocument()
  })

  it('shows no-data message when workOrders is empty', () => {
    render(<RoadCard road={mockRoad} workOrders={[]} />)
    expect(screen.getByText('No work order data available for this road yet.')).toBeInTheDocument()
  })

  it('handles missing optional fields', () => {
    const minimalRoad: Road = {
      id: 2,
      slug: 'minimal',
      name: 'Minimal Road',
      description: null,
      ward_number: null,
      ward_name: null,
      division: null,
      length_km: null,
    }
    render(<RoadCard road={minimalRoad} workOrders={[mockWorkOrder]} />)
    expect(screen.getByText('Minimal Road')).toBeInTheDocument()
  })

  it('hides null InfoRow values', () => {
    const woNoEngineers: WorkOrder = {
      ...mockWorkOrder,
      ae_name: null,
      aee_name: null,
      ee_name: null,
    }
    render(<RoadCard road={mockRoad} workOrders={[woNoEngineers]} />)
    expect(screen.queryByText('AE Name')).not.toBeInTheDocument()
    expect(screen.queryByText('AEE Name')).not.toBeInTheDocument()
    expect(screen.queryByText('EE Name')).not.toBeInTheDocument()
  })
})
