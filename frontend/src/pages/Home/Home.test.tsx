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
    expect(screen.getByPlaceholderText('Search any road in Bengaluru…')).toBeInTheDocument()
  })

  it('sets the default page metadata', () => {
    document.title = 'Old Road — WhoBuiltThisRoad'
    renderHome()

    expect(document.title).toBe('Who Built This Road')
    expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute('content', 'Who Built This Road')
    expect(document.querySelector('meta[property="og:url"]')).toHaveAttribute('content', window.location.href)
  })

  describe('mobile responsive', () => {
    it('heading uses responsive font sizing (text-2xl on mobile, text-4xl on sm)', () => {
      renderHome()
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveClass('text-2xl')
      expect(heading).toHaveClass('sm:text-4xl')
    })

    it('main container prevents horizontal overflow', () => {
      renderHome()
      const main = screen.getByRole('main')
      expect(main).toHaveClass('overflow-x-hidden')
    })

    it('text container uses w-full to allow full width on mobile', () => {
      renderHome()
      const main = screen.getByRole('main')
      const textDiv = main.querySelector('div')
      expect(textDiv).toHaveClass('w-full')
    })
  })
})
