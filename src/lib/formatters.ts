const rupeeFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const dateLocale: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
}

export function formatRupees(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return rupeeFmt.format(amount)
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-IN', dateLocale)
}

export function formatLabel(s: string): string {
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}
