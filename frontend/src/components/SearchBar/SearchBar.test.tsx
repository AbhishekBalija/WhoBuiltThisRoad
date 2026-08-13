import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { SearchBar } from './SearchBar'
import { searchRoads } from '@/utils/api'

vi.mock('../../utils/api')

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

function setup() {
  return render(
    <BrowserRouter>
      <SearchBar />
    </BrowserRouter>,
  )
}

async function typeAndAdvance(input: HTMLElement, text: string) {
  await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).type(input, text)
  await act(async () => {
    vi.advanceTimersByTime(400)
  })
}

describe('SearchBar', () => {
  it('renders search input with placeholder', () => {
    setup()
    expect(screen.getByPlaceholderText('Search any road in Bengaluru…')).toBeInTheDocument()
  })

  it('shows no dropdown when query is short', async () => {
    setup()
    const input = screen.getByRole('combobox')
    await typeAndAdvance(input, 'ab')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('fetches results when query reaches 3 characters', async () => {
    vi.mocked(searchRoads).mockResolvedValue({ count: 0, results: [] })

    setup()
    const input = screen.getByRole('combobox')
    await typeAndAdvance(input, 'tes')

    expect(searchRoads).toHaveBeenCalledWith('tes')
  })

  it('displays results in dropdown', async () => {
    vi.mocked(searchRoads).mockResolvedValue({
      count: 2,
      results: [
        { id: 1, slug: 'road-a', name: 'Road A', description: null, ward_number: null, ward_name: null, division: 'East', length_km: null },
        { id: 2, slug: 'road-b', name: 'Road B', description: null, ward_number: null, ward_name: 'Ward 1', division: null, length_km: null },
      ],
    })

    setup()
    const input = screen.getByRole('combobox')
    await typeAndAdvance(input, 'roa')

    expect(screen.getByRole('option', { name: /Road A/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Road B/ })).toBeInTheDocument()
  })

  it('navigates to road on selection', async () => {
    vi.mocked(searchRoads).mockResolvedValue({
      count: 1,
      results: [{ id: 1, slug: 'test-road', name: 'Test Road', description: null, ward_number: null, ward_name: null, division: null, length_km: null }],
    })

    setup()
    const input = screen.getByRole('combobox')
    await typeAndAdvance(input, 'tes')

    const option = screen.getByRole('option')
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(option)

    expect(mockNavigate).toHaveBeenCalledWith('/road/test-road')
  })

  it('shows no results message', async () => {
    vi.mocked(searchRoads).mockResolvedValue({ count: 0, results: [] })

    setup()
    const input = screen.getByRole('combobox')
    await typeAndAdvance(input, 'xyz')

    expect(screen.getByText(/No roads found — try a nearby landmark name/i)).toBeInTheDocument()
  })

  it('shows error message when search request fails', async () => {
    vi.mocked(searchRoads).mockRejectedValue(new Error('Network error'))

    setup()
    const input = screen.getByRole('combobox')
    await typeAndAdvance(input, 'xyz')

    expect(screen.getByText('Could not load data. Please try again.')).toBeInTheDocument()
  })

  it('ignores an older failed request after a newer search succeeds', async () => {
    let rejectOlderRequest: (reason?: unknown) => void = () => undefined
    vi.mocked(searchRoads)
      .mockImplementationOnce(() => new Promise((_, reject) => { rejectOlderRequest = reject }))
      .mockResolvedValueOnce({
        count: 1,
        results: [{ id: 2, slug: 'new-road', name: 'New Road', description: null, ward_number: null, ward_name: null, division: 'East', length_km: null }],
      })

    setup()
    const input = screen.getByRole('combobox')
    await typeAndAdvance(input, 'old')

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.clear(input)
    await user.type(input, 'new')
    await act(async () => { vi.advanceTimersByTime(400) })

    expect(screen.getByRole('option', { name: /New Road/ })).toBeInTheDocument()

    await act(async () => { rejectOlderRequest(new Error('Older request failed')) })

    expect(screen.queryByText('Could not load data. Please try again.')).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: /New Road/ })).toBeInTheDocument()
  })

  describe('mobile responsive', () => {
    it('input uses touch-manipulation to prevent double-tap zoom delay', () => {
      setup()
      const input = screen.getByRole('combobox')
      expect(input).toHaveClass('touch-manipulation')
    })

    it('input uses larger padding on mobile (py-3) for taller touch target', () => {
      setup()
      const input = screen.getByRole('combobox')
      expect(input).toHaveClass('py-3')
      expect(input).toHaveClass('sm:py-2.5')
    })

    it('input uses text-base on mobile to prevent iOS zoom-on-focus', () => {
      setup()
      const input = screen.getByRole('combobox')
      expect(input).toHaveClass('text-base')
    })

    it('search results stack name and ward vertically on mobile', async () => {
      vi.mocked(searchRoads).mockResolvedValue({
        count: 1,
        results: [{ id: 1, slug: 'road-a', name: 'Road A', description: null, ward_number: null, ward_name: 'Ward 1', division: 'East', length_km: null }],
      })

      setup()
      const input = screen.getByRole('combobox')
      await typeAndAdvance(input, 'roa')

      const option = screen.getByRole('option')
      const nameEl = option.querySelector('strong')
      expect(nameEl).toHaveClass('block')
      expect(nameEl).toHaveClass('break-words')
    })

    it('dropdown list uses overscroll-contain to prevent scroll chaining', async () => {
      vi.mocked(searchRoads).mockResolvedValue({
        count: 1,
        results: [{ id: 1, slug: 'road-a', name: 'Road A', description: null, ward_number: null, ward_name: 'Ward 1', division: 'East', length_km: null }],
      })

      setup()
      await typeAndAdvance(screen.getByRole('combobox'), 'roa')

      expect(screen.getByRole('listbox')).toHaveClass('overscroll-contain')
    })
  })
})
