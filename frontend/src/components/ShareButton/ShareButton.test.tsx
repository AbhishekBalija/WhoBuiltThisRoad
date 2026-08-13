import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ShareButton } from './ShareButton'

const mockOpen = vi.fn()
const mockWriteText = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('open', mockOpen)
  vi.stubGlobal('navigator', { clipboard: { writeText: mockWriteText } })
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

const baseProps = {
  road: { slug: 'test-road', name: 'Test Road', ward_name: 'Ward 1' },
  latestWorkOrder: { contractor_name: 'ABC Constructions', dlp_status: 'active' as const },
}

describe('ShareButton', () => {
  it('renders all three share buttons with icon labels', () => {
    render(<ShareButton {...baseProps} />)
    expect(screen.getByRole('button', { name: 'Share on WhatsApp' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Share on X' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument()
  })

  it('opens WhatsApp with share text and URL', async () => {
    render(<ShareButton {...baseProps} />)
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole('button', { name: 'Share on WhatsApp' }))

    expect(mockOpen).toHaveBeenCalledTimes(1)
    const url = mockOpen.mock.calls[0][0]
    expect(url).toContain('wa.me')
    expect(decodeURIComponent(url)).toContain('Test Road')
    expect(decodeURIComponent(url)).toContain('Ward 1')
    expect(decodeURIComponent(url)).toContain('ABC Constructions')
    expect(decodeURIComponent(url)).toContain('/road/test-road')
  })

  it('opens X with share text and URL', async () => {
    render(<ShareButton {...baseProps} />)
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole('button', { name: 'Share on X' }))

    expect(mockOpen).toHaveBeenCalledTimes(1)
    const url = mockOpen.mock.calls[0][0]
    expect(url).toContain('x.com/intent/tweet')
    expect(decodeURIComponent(url)).toContain('Test Road')
    expect(decodeURIComponent(url)).toContain('/road/test-road')
  })

  it('copies URL to clipboard and shows confirmation', async () => {
    render(<ShareButton {...baseProps} />)
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole('button', { name: 'Copy link' }))

    expect(screen.getByRole('button', { name: 'Link copied' })).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument()
  })

  it('handles missing work order gracefully', () => {
    render(<ShareButton road={baseProps.road} />)
    expect(screen.getByRole('button', { name: 'Share on WhatsApp' })).toBeInTheDocument()
  })

  it('includes warranty status text for active', async () => {
    render(<ShareButton {...baseProps} />)
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole('button', { name: 'Share on WhatsApp' }))
    expect(decodeURIComponent(mockOpen.mock.calls[0][0])).toContain('warranty still active')
  })

  describe('mobile responsive', () => {
    it('share buttons use p-3 for 44px minimum touch target', () => {
      render(<ShareButton {...baseProps} />)
      const whatsappBtn = screen.getByRole('button', { name: 'Share on WhatsApp' })
      expect(whatsappBtn).toHaveClass('p-3')
    })

    it('share buttons have focus-visible ring for keyboard navigation', () => {
      render(<ShareButton {...baseProps} />)
      const xBtn = screen.getByRole('button', { name: 'Share on X' })
      expect(xBtn).toHaveClass('focus-visible:ring-2')
    })

    it('share label uses break-words to prevent overflow', () => {
      render(<ShareButton {...baseProps} />)
      const label = screen.getByText(/Share this road's public record/)
      expect(label).toHaveClass('break-words')
    })
  })
})
