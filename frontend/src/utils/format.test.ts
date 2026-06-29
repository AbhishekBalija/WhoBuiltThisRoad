import { describe, it, expect } from 'vitest'
import { formatDate, formatCrore } from './format'

describe('formatDate', () => {
  it('returns em dash for null', () => {
    expect(formatDate(null)).toBe('\u2014')
  })

  it('returns em dash for empty string', () => {
    expect(formatDate('')).toBe('\u2014')
  })

  it('formats ISO date to Indian locale', () => {
    expect(formatDate('2023-06-15')).toBe('15 June 2023')
  })

  it('formats ISO date with time', () => {
    expect(formatDate('2024-01-01T00:00:00Z')).toBe('1 January 2024')
  })
})

describe('formatCrore', () => {
  it('returns em dash for null', () => {
    expect(formatCrore(null)).toBe('\u2014')
  })

  it('formats value in crores', () => {
    expect(formatCrore(50000000)).toBe('₹5.00 Cr')
  })

  it('formats value in lakhs', () => {
    expect(formatCrore(500000)).toBe('₹5.00 L')
  })

  it('formats zero correctly', () => {
    expect(formatCrore(0)).toBe('₹0.00 L')
  })

  it('handles decimal values', () => {
    expect(formatCrore(12500000)).toBe('₹1.25 Cr')
  })
})
