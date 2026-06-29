import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { DLPBadge } from './DLPBadge'

function badgeFor(status: string) {
  return screen.getByTestId(`dlp-badge-${status}`)
}

describe('DLPBadge', () => {
  it('renders active status', () => {
    render(<DLPBadge status="active" />)
    const badge = screen.getByText('Warranty Active')
    expect(badge).toBeInTheDocument()
  })

  it('renders expired status', () => {
    render(<DLPBadge status="expired" />)
    expect(screen.getByText('Warranty Expired')).toBeInTheDocument()
  })

  it('renders expiring soon status without days', () => {
    render(<DLPBadge status="expiring_soon" />)
    expect(screen.getByText('Warranty Expiring Soon')).toBeInTheDocument()
  })

  it('renders expiring soon status with days remaining', () => {
    render(<DLPBadge status="expiring_soon" daysRemaining={45} />)
    expect(screen.getByText('Warranty Expiring Soon')).toBeInTheDocument()
    expect(screen.getByText('(45d)')).toBeInTheDocument()
  })

  it('renders unknown status', () => {
    render(<DLPBadge status="unknown" />)
    expect(screen.getByText('Warranty Period Unknown')).toBeInTheDocument()
  })

  it('does not show days count for non-expiring statuses', () => {
    render(<DLPBadge status="active" daysRemaining={10} />)
    expect(screen.queryByText(/\(\d+d\)/)).not.toBeInTheDocument()
  })

  it('handles null daysRemaining gracefully', () => {
    render(<DLPBadge status="expiring_soon" daysRemaining={null} />)
    expect(screen.getByText('Warranty Expiring Soon')).toBeInTheDocument()
    expect(screen.queryByText(/\(\d+d\)/)).not.toBeInTheDocument()
  })

  it.each([
    { status: 'active' as const, expectedClass: 'bg-emerald-100' },
    { status: 'expiring_soon' as const, expectedClass: 'bg-amber-100' },
    { status: 'expired' as const, expectedClass: 'bg-red-100' },
    { status: 'unknown' as const, expectedClass: 'bg-gray-100' },
  ])('uses $expectedClass for $status', ({ status, expectedClass }) => {
    render(<DLPBadge status={status} />)
    expect(badgeFor(status).className).toContain(expectedClass)
  })
})
