import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { Home } from './index'

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  )
}

describe('Home', () => {
  it('renders the title', () => {
    renderHome()
    expect(screen.getByText('Who Built This Road')).toBeInTheDocument()
  })

  it('renders the description paragraph', () => {
    renderHome()
    expect(screen.getByText(/public money was spent/)).toBeInTheDocument()
    expect(screen.getByText(/warranty is still active/)).toBeInTheDocument()
  })

  it('shows the government records source line', () => {
    renderHome()
    expect(screen.getByText(/sourced from government records/)).toBeInTheDocument()
  })

  it('renders the search input', () => {
    renderHome()
    expect(screen.getByPlaceholderText('Search any road in Bengaluru...')).toBeInTheDocument()
  })
})
