import { render } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Meta } from './Meta'

function getMeta(attribute: string, name: string): string | null {
  const el = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`)
  return el?.getAttribute('content') ?? null
}

describe('Meta', () => {
  beforeEach(() => {
    document.title = ''
    document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]').forEach((el) => {
      el.remove()
    })
  })

  afterEach(() => {
    document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]').forEach((el) => {
      el.remove()
    })
  })

  it('sets document title', () => {
    render(<Meta title="Test Road — WhoBuiltThisRoad" description="Built by Test Co" />)
    expect(document.title).toBe('Test Road — WhoBuiltThisRoad')
  })

  it('sets Open Graph meta tags', () => {
    render(<Meta title="Test Road" description="Built by Test Co. Warranty: active." />)

    expect(getMeta('property', 'og:title')).toBe('Test Road')
    expect(getMeta('property', 'og:description')).toBe('Built by Test Co. Warranty: active.')
    expect(getMeta('property', 'og:type')).toBe('website')
    expect(getMeta('property', 'og:url')).toBe(window.location.href)
  })

  it('sets Twitter Card meta tags', () => {
    render(<Meta title="Test Road" description="Built by Test Co. Warranty: active." />)

    expect(getMeta('name', 'twitter:card')).toBe('summary')
    expect(getMeta('name', 'twitter:title')).toBe('Test Road')
    expect(getMeta('name', 'twitter:description')).toBe('Built by Test Co. Warranty: active.')
  })

  it('updates existing meta tags on re-render', () => {
    const { rerender } = render(<Meta title="First Road" description="First description" />)

    expect(getMeta('property', 'og:title')).toBe('First Road')

    rerender(<Meta title="Second Road" description="Second description" />)

    expect(document.title).toBe('Second Road')
    expect(getMeta('property', 'og:title')).toBe('Second Road')
    expect(getMeta('property', 'og:description')).toBe('Second description')
  })
})
