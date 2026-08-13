import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { RoadCard } from './RoadCard'
import { EXTERNAL_LINKS } from '@/config/external-links'
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

  it('resolves the imported DLP filename to its public OpenCity source', () => {
    render(<RoadCard road={mockRoad} workOrders={[{ ...mockWorkOrder, source_document: 'dlp_east_2017.pdf' }]} />)
    expect(screen.getByRole('link', { name: 'BBMP DLP Register' })).toHaveAttribute(
      'href',
      EXTERNAL_LINKS.dlpRegister2017.url,
    )
  })

  it('renders completion and warranty dates', () => {
    render(<RoadCard road={mockRoad} workOrders={[mockWorkOrder]} />)
    expect(screen.getByText('15 June 2023')).toBeInTheDocument()
    expect(screen.getByText('15 June 2025')).toBeInTheDocument()
  })

  it('shows no-data message with data source links when workOrders is empty', () => {
    render(<RoadCard road={mockRoad} workOrders={[]} />)
    expect(screen.getByText('No work order data found for this road yet. View all available government data sources below.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: EXTERNAL_LINKS.openCityWorkOrders.label })).toHaveAttribute(
      'href',
      EXTERNAL_LINKS.openCityWorkOrders.url,
    )
    expect(screen.getByRole('link', { name: EXTERNAL_LINKS.bbmpWorksBillPublicView.label })).toHaveAttribute(
      'href',
      EXTERNAL_LINKS.bbmpWorksBillPublicView.url,
    )
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

  it('renders WorkOrderTimeline when there are multiple work orders', () => {
    const olderWorkOrder: WorkOrder = {
      ...mockWorkOrder,
      id: 2,
      contractor_name: 'Old Contractor',
      completion_date: '2018-01-01',
      amount_paid: 12000000,
      source_document: 'https://example.com/old',
      source_label: 'Old Source',
    }
    render(<RoadCard road={mockRoad} workOrders={[mockWorkOrder, olderWorkOrder]} />)
    expect(screen.getByText('Full Construction History')).toBeInTheDocument()
    expect(screen.getByText('Old Contractor')).toBeInTheDocument()
    expect(screen.getByText('2018')).toBeInTheDocument()
  })

  it('does not render WorkOrderTimeline when there is only one work order', () => {
    render(<RoadCard road={mockRoad} workOrders={[mockWorkOrder]} />)
    expect(screen.queryByText('Full Construction History')).not.toBeInTheDocument()
  })

  describe('mobile responsive', () => {
    it('InfoRow uses flex-col on mobile (label and value stack vertically)', () => {
      render(<RoadCard road={mockRoad} workOrders={[mockWorkOrder]} />)
      const contractorRow = screen.getByText('Contractor').parentElement
      expect(contractorRow).toHaveClass('flex-col')
      expect(contractorRow).toHaveClass('sm:flex-row')
    })

    it('DLP badge and heading stack vertically on mobile', () => {
      render(<RoadCard road={mockRoad} workOrders={[mockWorkOrder]} />)
      const badge = screen.getByText('Warranty Expired').parentElement
      const container = badge?.parentElement
      expect(container).toHaveClass('flex-col')
      expect(container).toHaveClass('sm:flex-row')
    })

    it('road name uses break-words to prevent overflow', () => {
      render(<RoadCard road={mockRoad} workOrders={[mockWorkOrder]} />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveClass('break-words')
    })

    it('article container prevents horizontal overflow', () => {
      render(<RoadCard road={mockRoad} workOrders={[mockWorkOrder]} />)
      const article = screen.getByRole('article')
      expect(article).toHaveClass('overflow-x-hidden')
    })

    it('uses smaller padding on mobile (p-4) and larger on sm (p-6)', () => {
      render(<RoadCard road={mockRoad} workOrders={[mockWorkOrder]} />)
      const article = screen.getByRole('article')
      expect(article).toHaveClass('p-4')
      expect(article).toHaveClass('sm:p-6')
    })

    it('heading uses responsive font sizing (text-lg on mobile, text-xl on sm)', () => {
      render(<RoadCard road={mockRoad} workOrders={[mockWorkOrder]} />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveClass('text-lg')
      expect(heading).toHaveClass('sm:text-xl')
    })
  })
})
