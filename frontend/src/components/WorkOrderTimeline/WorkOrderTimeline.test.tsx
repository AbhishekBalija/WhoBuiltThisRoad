import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { WorkOrderTimeline } from './WorkOrderTimeline'
import type { WorkOrder } from '@/types'

const baseWorkOrder: WorkOrder = {
  id: 1,
  contractor_name: 'ABC Constructions',
  contractor_phone: '9876543210',
  ae_name: null,
  ae_phone: null,
  aee_name: null,
  aee_phone: null,
  ee_name: null,
  ee_phone: null,
  completion_date: '2023-06-15',
  dlp_expiry_date: '2025-06-15',
  dlp_status: 'expired',
  days_remaining: -365,
  project_cost: 50000000,
  amount_paid: 45000000,
  source_document: 'https://example.com/doc1',
  source_label: 'BBMP DLP Register',
}

const secondWorkOrder: WorkOrder = {
  ...baseWorkOrder,
  id: 2,
  contractor_name: 'XYZ Builders',
  completion_date: '2019-03-10',
  amount_paid: 25000000,
  source_document: 'https://example.com/doc2',
}

const thirdWorkOrder: WorkOrder = {
  ...baseWorkOrder,
  id: 3,
  contractor_name: null,
  completion_date: null,
  amount_paid: 0,
  source_document: 'https://example.com/doc3',
}

describe('WorkOrderTimeline', () => {
  it('renders nothing with fewer than 2 work orders', () => {
    const { container } = render(<WorkOrderTimeline workOrders={[baseWorkOrder]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders heading and note when 2+ work orders exist', () => {
    render(<WorkOrderTimeline workOrders={[baseWorkOrder, secondWorkOrder]} />)
    expect(screen.getByText('Full Construction History')).toBeInTheDocument()
    expect(
      screen.getByText(/This road has multiple recorded work orders/)
    ).toBeInTheDocument()
  })

  it('renders each work order contractor and year', () => {
    render(<WorkOrderTimeline workOrders={[baseWorkOrder, secondWorkOrder]} />)
    expect(screen.getByText('ABC Constructions')).toBeInTheDocument()
    expect(screen.getByText('XYZ Builders')).toBeInTheDocument()
    expect(screen.getByText('2023')).toBeInTheDocument()
    expect(screen.getByText('2019')).toBeInTheDocument()
  })

  it('renders amount paid formatted with en-IN locale', () => {
    render(<WorkOrderTimeline workOrders={[baseWorkOrder, secondWorkOrder]} />)
    expect(screen.getByText('₹4,50,00,000')).toBeInTheDocument()
    expect(screen.getByText('₹2,50,00,000')).toBeInTheDocument()
  })

  it('renders source links for each work order with distinct aria-labels', () => {
    render(<WorkOrderTimeline workOrders={[baseWorkOrder, secondWorkOrder]} />)
    const links = screen.getAllByRole('link', { name: /Source for work order/ })
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute('href', 'https://example.com/doc1')
    expect(links[1]).toHaveAttribute('href', 'https://example.com/doc2')
  })

  it('shows fallback for missing contractor name', () => {
    render(<WorkOrderTimeline workOrders={[baseWorkOrder, thirdWorkOrder]} />)
    expect(screen.getByText('Contractor not on record')).toBeInTheDocument()
  })

  it('shows fallback year when completion date is missing', () => {
    render(<WorkOrderTimeline workOrders={[baseWorkOrder, thirdWorkOrder]} />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('does not render amount when amount_paid is null', () => {
    const woNoAmount = { ...thirdWorkOrder, amount_paid: null }
    render(<WorkOrderTimeline workOrders={[baseWorkOrder, woNoAmount]} />)
    expect(screen.queryByText('₹0')).not.toBeInTheDocument()
  })

  describe('mobile responsive', () => {
    it('timeline wrapper has overflow-x-auto for horizontal scroll on mobile', () => {
      const { container } = render(<WorkOrderTimeline workOrders={[baseWorkOrder, secondWorkOrder]} />)
      const section = container.querySelector('section')
      const scrollWrapper = section?.querySelector('div')
      expect(scrollWrapper).toHaveClass('overflow-x-auto')
    })

    it('timeline items use responsive grid (narrower on mobile)', () => {
      const { container } = render(<WorkOrderTimeline workOrders={[baseWorkOrder, secondWorkOrder]} />)
      const items = container.querySelectorAll('ol li')
      expect(items[0]).toHaveClass('grid-cols-[2.5rem_1fr]')
      expect(items[0]).toHaveClass('sm:grid-cols-[3rem_1fr]')
    })

    it('contractor name uses break-words to prevent overflow', () => {
      render(<WorkOrderTimeline workOrders={[baseWorkOrder, secondWorkOrder]} />)
      const contractorEl = screen.getByText('ABC Constructions')
      expect(contractorEl).toHaveClass('break-words')
    })

    it('timeline content uses min-w-0 to allow text truncation', () => {
      const { container } = render(<WorkOrderTimeline workOrders={[baseWorkOrder, secondWorkOrder]} />)
      const contentDivs = container.querySelectorAll('ol li > div:last-child')
      expect(contentDivs[0]).toHaveClass('min-w-0')
    })
  })
})
