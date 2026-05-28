import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { WishlistItem } from '@/types'

export interface BudgetRow {
  item: WishlistItem
  months: number
  base: number
  discount: number
  tax: number
  setup: number
  total: number
  discountPct: number
  taxPct: number
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export function generateBudgetPdf(rows: BudgetRow[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  // ── Header ───────────────────────────────────────────────────────────────
  doc.setFillColor(201, 243, 29) // brand yellow-green
  doc.rect(0, 0, 297, 18, 'F')
  doc.setTextColor(17, 17, 17)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('AddKaro — Wishlist Budget Estimate', 14, 12)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${today}`, 260, 12, { align: 'right' })

  // ── Table ─────────────────────────────────────────────────────────────────
  const head = [['Hoarding', 'Location', 'Monthly Rate', 'Duration', 'Base Amount', `Discount`, 'Tax (GST)', 'Setup Cost', 'Total']]
  const body = rows.map(r => [
    r.item.title,
    r.item.location ?? '—',
    fmt(r.item.rentalCost ?? 0),
    `${r.months} mo`,
    fmt(r.base),
    r.discountPct > 0 ? `${r.discountPct}% (${fmt(r.discount)})` : '—',
    `${r.taxPct}% (${fmt(r.tax)})`,
    r.setup > 0 ? fmt(r.setup) : '—',
    fmt(r.total),
  ])

  // Totals row
  const grandTotal = rows.reduce((s, r) => s + r.total, 0)
  const grandBase  = rows.reduce((s, r) => s + r.base, 0)
  const grandDisc  = rows.reduce((s, r) => s + r.discount, 0)
  const grandTax   = rows.reduce((s, r) => s + r.tax, 0)
  const grandSetup = rows.reduce((s, r) => s + r.setup, 0)
  body.push(['TOTAL', '', fmt(grandBase / rows.length) + ' avg', '', fmt(grandBase), fmt(grandDisc), fmt(grandTax), fmt(grandSetup), fmt(grandTotal)])

  autoTable(doc, {
    head,
    body,
    startY: 24,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [55, 65, 81], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    foot: [],
    didParseCell: (data) => {
      // Highlight grand total row
      if (data.row.index === rows.length && data.section === 'body') {
        data.cell.styles.fillColor = [201, 243, 29]
        data.cell.styles.textColor = [17, 17, 17]
        data.cell.styles.fontStyle = 'bold'
      }
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 38 },
    },
  })

  // ── Footer note ───────────────────────────────────────────────────────────
  const finalY = (doc as any).lastAutoTable.finalY ?? 150
  doc.setFontSize(7.5)
  doc.setTextColor(120, 120, 120)
  doc.text(
    'Note: Security deposits are not included in these totals. Prices are indicative and subject to negotiation with the owner.',
    14, finalY + 8
  )
  doc.text('AddKaro is a connection-only platform and does not guarantee the accuracy of the above estimates.', 14, finalY + 14)

  doc.save(`addkaro-budget-estimate-${today.replace(/ /g, '-')}.pdf`)
}
