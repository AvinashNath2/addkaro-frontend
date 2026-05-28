import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { WishlistItem } from '@/types'

export interface BudgetRow {
  item: WishlistItem
  months: number
  base: number       // rent × months
  discount: number   // discount amount
  tax: number        // GST amount
  setup: number      // one-time installation
  deposit: number    // security deposit (min of range, refundable)
  subtotal: number   // base - discount + tax + setup (payable now, excl. deposit)
  total: number      // subtotal + deposit (total commitment)
  discountPct: number
  taxPct: number
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export function generateBudgetPdf(rows: BudgetRow[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  // ── Header bar ────────────────────────────────────────────────────────────
  doc.setFillColor(201, 243, 29)
  doc.rect(0, 0, 297, 18, 'F')
  doc.setTextColor(17, 17, 17)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('AddKaro — Campaign Budget Estimate', 14, 12)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${today}`, 283, 12, { align: 'right' })

  // ── Sub-header: what each column means ────────────────────────────────────
  doc.setFontSize(7)
  doc.setTextColor(80, 80, 80)
  doc.text(
    'Columns: Base = Monthly Rent × Duration  |  GST = Goods & Services Tax (SAC 998363)  |  Setup = One-time installation cost  |  Deposit = Refundable security deposit (min. estimate)  |  Payable Now = excl. deposit  |  Total = incl. deposit',
    14, 21
  )

  // ── Main table ────────────────────────────────────────────────────────────
  const head = [[
    'Hoarding', 'Location', 'Rate/mo', 'Duration',
    'Base Rent', `GST (%)`, 'Setup Cost',
    'Deposit\n(Refundable)', 'Payable Now\n(excl. deposit)', 'Total\n(incl. deposit)',
  ]]

  const body = rows.map(r => [
    r.item.title,
    r.item.location ?? '—',
    fmt(r.item.rentalCost ?? 0),
    `${r.months} mo`,
    fmt(r.base),
    `${r.taxPct}%\n(${fmt(r.tax)})`,
    r.setup > 0 ? fmt(r.setup) : '—',
    r.deposit > 0 ? `${fmt(r.deposit)}+` : '—',
    fmt(r.subtotal),
    fmt(r.total),
  ])

  // Grand totals row
  const grandBase    = rows.reduce((s, r) => s + r.base, 0)
  const grandTax     = rows.reduce((s, r) => s + r.tax, 0)
  const grandSetup   = rows.reduce((s, r) => s + r.setup, 0)
  const grandDeposit = rows.reduce((s, r) => s + r.deposit, 0)
  const grandNow     = rows.reduce((s, r) => s + r.subtotal, 0)
  const grandTotal   = rows.reduce((s, r) => s + r.total, 0)

  body.push([
    'TOTAL', '', '', '',
    fmt(grandBase),
    fmt(grandTax),
    fmt(grandSetup),
    grandDeposit > 0 ? `${fmt(grandDeposit)}+` : '—',
    fmt(grandNow),
    fmt(grandTotal),
  ])

  autoTable(doc, {
    head,
    body,
    startY: 26,
    styles: { fontSize: 7.5, cellPadding: 2.5, valign: 'middle' },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', halign: 'center' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 32 },
      2: { halign: 'right' },
      3: { halign: 'center' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right', textColor: [180, 120, 20] },      // amber for deposit
      8: { halign: 'right', textColor: [5, 150, 105] },       // emerald for payable now
      9: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.row.index === rows.length && data.section === 'body') {
        data.cell.styles.fillColor = [201, 243, 29]
        data.cell.styles.textColor = [17, 17, 17]
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  const finalY = (doc as any).lastAutoTable.finalY ?? 150

  // ── Summary box ───────────────────────────────────────────────────────────
  const boxX = 14, boxY = finalY + 6, boxW = 269, boxH = 22
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(203, 213, 225)
  doc.roundedRect(boxX, boxY, boxW, boxH, 2, 2, 'FD')

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 17, 17)
  doc.text('Summary', boxX + 4, boxY + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  const cols = [
    ['Base Rent', fmt(grandBase)],
    ['GST (tax)', fmt(grandTax)],
    ['Setup & Install', fmt(grandSetup)],
    ['Payable Now (excl. deposit)', fmt(grandNow)],
    ...(grandDeposit > 0 ? [['Security Deposit (refundable, est. min.)', `${fmt(grandDeposit)}+`]] : []),
    ['TOTAL COMMITMENT', fmt(grandTotal)],
  ]
  const colW = boxW / cols.length
  cols.forEach(([label, val], i) => {
    const x = boxX + 4 + i * colW
    doc.setTextColor(100, 116, 139)
    doc.text(label, x, boxY + 13)
    doc.setTextColor(i === cols.length - 1 ? 17 : 5, i === cols.length - 1 ? 17 : 150, i === cols.length - 1 ? 17 : 105)
    doc.setFont('helvetica', 'bold')
    doc.text(val, x, boxY + 19)
    doc.setFont('helvetica', 'normal')
  })

  // ── Footer notes ──────────────────────────────────────────────────────────
  const noteY = boxY + boxH + 6
  doc.setFontSize(7)
  doc.setTextColor(120, 120, 120)
  doc.setFont('helvetica', 'normal')
  doc.text('Notes:', 14, noteY)
  doc.text('1. GST @ applicable rate (typically 18%) is charged on advertising services under SAC Code 998363 as per Indian GST law (CGST 9% + SGST 9% intra-state, IGST 18% inter-state).', 14, noteY + 5)
  doc.text('2. Security deposit shown is the minimum of the stated range and is fully refundable at the end of the booking term, subject to the condition of the space.', 14, noteY + 10)
  doc.text('3. If your total annual rent payments exceed ₹2,40,000 to a single owner, TDS @ 2% (Sec. 194I) must be deducted if you are a registered business entity.', 14, noteY + 15)
  doc.text('4. Municipal advertisement tax (if any) is typically borne by the space owner and is usually included in the quoted monthly rate. Confirm before signing.', 14, noteY + 20)
  doc.text('5. All prices are indicative estimates. Exact amounts are subject to negotiation with the owner. AddKaro is a connection-only platform and does not guarantee accuracy.', 14, noteY + 25)

  doc.save(`addkaro-budget-estimate-${today.replace(/ /g, '-')}.pdf`)
}
