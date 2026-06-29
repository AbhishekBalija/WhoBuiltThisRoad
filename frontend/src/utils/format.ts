export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '\u2014'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatCrore(amount: number | null): string {
  if (amount == null) return '\u2014'
  const crore = amount / 10_000_000
  return crore >= 1
    ? `\u20B9${crore.toFixed(2)} Cr`
    : `\u20B9${(amount / 100_000).toFixed(2)} L`
}
