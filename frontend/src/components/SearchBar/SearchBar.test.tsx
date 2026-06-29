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
    expect(screen.getByPlaceholderText('Search any road in Bengaluru...')).toBeInTheDocument()
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

    expect(screen.getByText(/no roads found/i)).toBeInTheDocument()
  })
})
