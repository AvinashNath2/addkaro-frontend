import { useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MapPin, Loader2, Building2, Ruler, CheckCircle2, ArrowRight, Heart,
  List, Map, Calculator, FileDown, X, ChevronDown, ChevronUp, Minus, Plus, Info,
} from 'lucide-react'
import { getWishlist, removeFromWishlist } from '@/api/customer.api'
import StatusBadge from '@/components/ui/StatusBadge'
import { cn } from '@/lib/utils'
import { generateBudgetPdf, type BudgetRow } from '@/lib/budgetPdf'
import type { WishlistItem } from '@/types/index'

const WishlistMap = lazy(() => import('@/components/wishlist/WishlistMap'))

function formatRupees(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function formatSavedDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Column-header tooltip ─────────────────────────────────────────────────────
function ColTip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex items-center ml-0.5 align-middle">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(s => !s)}
        className="w-3.5 h-3.5 rounded-full bg-gray-300/60 flex items-center justify-center hover:bg-gray-400/60 transition-colors"
      >
        <Info className="w-2 h-2 text-gray-500" />
      </button>
      {show && (
        <span className="absolute z-50 top-5 left-0 w-56 bg-gray-900 text-white text-[10px] leading-relaxed rounded-xl p-2.5 shadow-xl pointer-events-none font-normal normal-case tracking-normal">
          {text}
          <span className="absolute bottom-full left-2 border-4 border-transparent border-b-gray-900" />
        </span>
      )}
    </span>
  )
}

// ── Per-item calculator ────────────────────────────────────────────────────────
function parseDepositMin(item: WishlistItem): number {
  if (!item.securityDepositRequired || !item.securityDepositRange) return 0
  const parts = item.securityDepositRange.split('_').map(Number)
  return parts.length >= 1 && !isNaN(parts[0]) ? parts[0] : 0
}

function calcRow(item: WishlistItem, months: number): BudgetRow {
  const rate        = item.rentalCost ?? 0
  const discountPct = 0
  const taxPct      = item.taxPct ?? 18
  const base        = rate * months
  const discount    = 0
  const tax         = base * (taxPct / 100)
  const setup       = item.setupCost ?? 0
  const deposit     = parseDepositMin(item)
  const subtotal    = base + tax + setup
  const total       = subtotal + deposit
  return { item, months, base, discount, tax, setup, deposit, subtotal, total, discountPct, taxPct }
}

// ── Budget estimator panel ────────────────────────────────────────────────────
function BudgetEstimatorPanel({
  items,
  onClose,
}: {
  items: WishlistItem[]
  onClose: () => void
}) {
  const [open, setOpen] = useState(true)
  const [monthsMap, setMonthsMap] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {}
    items.forEach(i => { m[i.holdingId] = i.minimumBookingMonths ?? 1 })
    return m
  })

  const rows: BudgetRow[] = items.map(i => calcRow(i, monthsMap[i.holdingId] ?? (i.minimumBookingMonths ?? 1)))
  const grandBase    = rows.reduce((s, r) => s + r.base, 0)
  const grandTax     = rows.reduce((s, r) => s + r.tax, 0)
  const grandSetup   = rows.reduce((s, r) => s + r.setup, 0)
  const grandDeposit = rows.reduce((s, r) => s + r.deposit, 0)
  const grandNow     = rows.reduce((s, r) => s + r.subtotal, 0)
  const grandTotal   = rows.reduce((s, r) => s + r.total, 0)
  const hasDeposit   = grandDeposit > 0

  function stepFor(holdingId: string) { return items.find(i => i.holdingId === holdingId)?.minimumBookingMonths ?? 1 }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-5">
      {/* ── Collapsible header ── */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <Calculator className="w-4 h-4 text-emerald-600" />
          </span>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Campaign Budget Estimate</p>
            <p className="text-xs text-gray-400">{items.length} hoarding{items.length !== 1 ? 's' : ''} · incl. GST & deposit</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-gray-400 leading-none mb-0.5">Total commitment</p>
            <p className="text-lg font-extrabold text-gray-900">{formatRupees(grandTotal)}</p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onClose() }}
            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
          {open
            ? <ChevronUp className="w-4 h-4 text-gray-400" />
            : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {open && (
        <div className="px-5 pb-5 space-y-4">

          {/* ── Per-hoarding table ── */}
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full text-xs min-w-[680px]">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left pb-2.5 text-gray-500 font-semibold pr-3 w-[26%]">Hoarding</th>
                  <th className="text-right pb-2.5 text-gray-500 font-semibold px-2">
                    Rate/mo
                    <ColTip text="Monthly rental rate quoted by the space owner." />
                  </th>
                  <th className="text-center pb-2.5 text-gray-500 font-semibold px-2">
                    Duration
                    <ColTip text="Your chosen booking duration. Adjust using +/– buttons. Steps are based on owner's minimum booking period." />
                  </th>
                  <th className="text-right pb-2.5 text-gray-500 font-semibold px-2">
                    Base Rent
                    <ColTip text="Rate/mo × Duration. The raw rental cost before any taxes or fees." />
                  </th>
                  <th className="text-right pb-2.5 text-purple-500 font-semibold px-2">
                    GST
                    <ColTip text="Goods & Services Tax on advertising services (SAC Code 998363) as per Indian tax law. Rate set by the owner — typically 18%. Applied on base rent." />
                  </th>
                  <th className="text-right pb-2.5 text-orange-500 font-semibold px-2">
                    Setup
                    <ColTip text="One-time installation cost for the entire booking period — covers printing, rigging, labour, and electrical connections." />
                  </th>
                  <th className="text-right pb-2.5 text-amber-600 font-semibold px-2">
                    Deposit
                    <ColTip text="Refundable security deposit (minimum estimate). Held by the owner during the booking period and returned at the end, subject to space condition. Exact amount to be confirmed with the owner." />
                  </th>
                  <th className="text-right pb-2.5 text-emerald-600 font-bold px-2">
                    Payable Now
                    <ColTip text="Amount due at booking: Base Rent + GST + Setup. Does NOT include the refundable deposit." />
                  </th>
                  <th className="text-right pb-2.5 text-gray-900 font-bold pl-2">
                    Total
                    <ColTip text="Full financial commitment: Payable Now + Security Deposit. The deposit portion is returned to you at the end of the term." />
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const s = stepFor(r.item.holdingId)
                  const m = monthsMap[r.item.holdingId] ?? s
                  return (
                    <tr key={r.item.holdingId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-3">
                        <p className="font-semibold text-gray-900 line-clamp-1">{r.item.title}</p>
                        <p className="text-gray-400 text-[10px] truncate">{r.item.location}</p>
                      </td>
                      <td className="py-3 px-2 text-right text-gray-700 whitespace-nowrap">{formatRupees(r.item.rentalCost ?? 0)}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1 justify-center">
                          <button
                            onClick={() => setMonthsMap(prev => ({ ...prev, [r.item.holdingId]: Math.max(s, (prev[r.item.holdingId] ?? s) - s) }))}
                            className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40"
                            disabled={m <= s}
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-10 text-center font-semibold text-gray-900">{m}mo</span>
                          <button
                            onClick={() => setMonthsMap(prev => ({ ...prev, [r.item.holdingId]: Math.min(24, (prev[r.item.holdingId] ?? s) + s) }))}
                            className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40"
                            disabled={m >= 24}
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right text-gray-700 whitespace-nowrap">{formatRupees(r.base)}</td>
                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        <span className="text-purple-600 font-semibold">{formatRupees(r.tax)}</span>
                        <span className="text-purple-400 text-[10px] ml-0.5">({r.taxPct}%)</span>
                      </td>
                      <td className="py-3 px-2 text-right text-orange-600 whitespace-nowrap">{r.setup > 0 ? formatRupees(r.setup) : <span className="text-gray-300">—</span>}</td>
                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        {r.deposit > 0
                          ? <><span className="text-amber-600 font-semibold">{formatRupees(r.deposit)}</span><span className="text-amber-400 text-[10px]">+</span></>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-3 px-2 text-right text-emerald-600 font-bold whitespace-nowrap">{formatRupees(r.subtotal)}</td>
                      <td className="py-3 pl-2 text-right font-extrabold text-gray-900 whitespace-nowrap">{formatRupees(r.total)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── Grand total breakdown ── */}
          <div className="grid grid-cols-2 gap-3">
            {/* Left: component breakdown */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 space-y-1.5 text-xs">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Breakdown</p>
              <div className="flex justify-between text-gray-600">
                <span>Base Rent</span>
                <span className="font-semibold text-gray-900">{formatRupees(grandBase)}</span>
              </div>
              <div className="flex justify-between text-purple-600">
                <span>GST (tax on advertising)</span>
                <span className="font-semibold">{formatRupees(grandTax)}</span>
              </div>
              {grandSetup > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Setup & Installation</span>
                  <span className="font-semibold">{formatRupees(grandSetup)}</span>
                </div>
              )}
              <div className="flex justify-between text-emerald-600 pt-1 border-t border-gray-200 font-semibold">
                <span>Payable Now (excl. deposit)</span>
                <span>{formatRupees(grandNow)}</span>
              </div>
              {hasDeposit && (
                <div className="flex justify-between text-amber-600">
                  <span className="flex items-center gap-1">
                    Security Deposit
                    <span className="text-[9px] bg-amber-100 text-amber-700 px-1 rounded font-bold">REFUNDABLE</span>
                  </span>
                  <span className="font-semibold">{formatRupees(grandDeposit)}+</span>
                </div>
              )}
            </div>

            {/* Right: totals */}
            <div className="space-y-2">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-1">Payable at Booking</p>
                <p className="text-2xl font-extrabold text-emerald-700">{formatRupees(grandNow)}</p>
                {hasDeposit && <p className="text-[10px] text-emerald-500 mt-0.5">Excludes refundable deposit</p>}
              </div>
              {hasDeposit && (
                <div className="bg-gray-900 rounded-xl px-4 py-3">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Commitment</p>
                  <p className="text-2xl font-extrabold" style={{ color: '#C9F31D' }}>{formatRupees(grandTotal)}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Incl. {formatRupees(grandDeposit)}+ refundable deposit</p>
                </div>
              )}
            </div>
          </div>

          {/* ── PDF download ── */}
          <button
            onClick={() => generateBudgetPdf(rows)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            Download Full PDF Report
          </button>
        </div>
      )}
    </div>
  )
}

// ── Wishlist card ─────────────────────────────────────────────────────────────
function WishlistCard({
  item,
  selected,
  onToggle,
  onRemove,
  removing,
}: {
  item: WishlistItem
  selected: boolean
  onToggle: () => void
  onRemove: () => void
  removing: boolean
}) {
  const navigate = useNavigate()
  const sqft = (item.width ?? 0) * (item.height ?? 0)

  return (
    <div className={cn(
      'bg-white rounded-2xl border overflow-hidden hover:shadow-card-md transition-all duration-200 hover:-translate-y-0.5 group',
      selected ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-gray-200',
    )}>
      {/* ── Image ──────────────────────────────────────────────────────── */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Building2 className="w-10 h-10 text-gray-400" />
            <span className="text-xs font-medium text-gray-400">No photo</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Top-left: selection checkbox */}
        <button
          onClick={onToggle}
          className={cn(
            'absolute top-3 left-3 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all',
            selected
              ? 'bg-emerald-500 border-emerald-500'
              : 'bg-white/80 border-white/60 hover:bg-white',
          )}
          title={selected ? 'Deselect' : 'Select for budget estimate'}
        >
          {selected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
        </button>

        {/* Top-right: remove button */}
        <button
          onClick={onRemove}
          disabled={removing}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all"
          style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
          title="Remove from wishlist"
        >
          {removing
            ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            : <Heart className="w-4 h-4 fill-red-500 text-red-500" />
          }
        </button>

        {/* Bottom overlay: price + status */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 flex items-end justify-between">
          <div>
            <p className="text-white font-extrabold text-lg leading-none drop-shadow-sm">
              {item.rentalCost != null ? formatRupees(item.rentalCost) : '—'}
            </p>
            <p className="text-white/70 text-[11px] font-medium">per month</p>
          </div>
          <div className="flex gap-1.5">
            <div className="shrink-0"><StatusBadge status={item.status} /></div>
            {item.ownerVerified && (
              <span
                className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: 'rgba(16,185,129,0.85)', backdropFilter: 'blur(6px)' }}
              >
                <CheckCircle2 className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="px-4 pt-3.5 pb-4 space-y-3">
        <div>
          <h3 className="font-bold text-gray-900 text-[14px] leading-snug line-clamp-1">{item.title}</h3>
          <div className="flex items-center gap-1 text-[12px] text-gray-500 mt-0.5">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {item.width != null && item.height != null && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
              <Ruler className="w-3 h-3 text-gray-400" />
              {item.width} × {item.height} ft
            </span>
          )}
          {sqft > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
              {sqft.toLocaleString('en-IN')} sqft
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
            Saved {formatSavedDate(item.savedAt)}
          </span>
        </div>

        {/* Quick cost line */}
        {item.setupCost != null && (
          <p className="text-[11px] text-gray-400">
            Setup: <span className="font-semibold text-gray-600">{formatRupees(item.setupCost)}</span>
            {item.taxPct != null && <> · GST {item.taxPct}%</>}
          </p>
        )}

        <button
          onClick={() => navigate(`/browse/${item.holdingId}`)}
          className="btn-primary w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-bold transition-all active:scale-[0.98]"
        >
          View Details <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function WishlistPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [showEstimator, setShowEstimator] = useState(false)

  const { data: items, isLoading, isError } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
  })

  const removeMutation = useMutation({
    mutationFn: (holdingId: string) => removeFromWishlist(holdingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      queryClient.invalidateQueries({ queryKey: ['wishlist-check'] })
    },
  })

  function toggleSelect(holdingId: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(holdingId)) next.delete(holdingId)
      else next.add(holdingId)
      return next
    })
  }

  const selectedItems = (items ?? []).filter(i => selectedIds.has(i.holdingId))

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="page-title">My Wishlist</h2>
          <p className="page-subtitle">Save hoardings and estimate your campaign budget</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
            <button
              onClick={() => setViewMode('list')}
              className={cn('flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors',
                viewMode === 'list' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900')}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={cn('flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors',
                viewMode === 'map' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900')}
            >
              <Map className="w-3.5 h-3.5" /> Map
            </button>
          </div>

          {/* Estimate budget button */}
          {selectedIds.size > 0 && (
            <button
              onClick={() => setShowEstimator(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: '#C9F31D', color: '#111' }}
            >
              <Calculator className="w-3.5 h-3.5" />
              Estimate Budget ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600">
          Failed to load your wishlist. Please try again.
        </div>
      )}

      {items && items.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium mb-1">Your wishlist is empty</p>
          <p className="text-sm text-gray-400 mb-5">Save hoardings while browsing to compare them here.</p>
          <button onClick={() => navigate('/browse')} className="btn-primary w-auto px-6">
            Browse Hoardings
          </button>
        </div>
      )}

      {items && items.length > 0 && (
        <>
          {/* Helper tip */}
          {viewMode === 'list' && selectedIds.size === 0 && (
            <p className="text-xs text-gray-400 mb-4">
              ✓ Select hoardings using the checkbox on each card to estimate your combined campaign budget.
            </p>
          )}

          {/* Budget estimator panel */}
          {showEstimator && selectedItems.length > 0 && (
            <BudgetEstimatorPanel
              items={selectedItems}
              onClose={() => setShowEstimator(false)}
            />
          )}

          {/* List view */}
          {viewMode === 'list' && (
            <>
              <p className="text-sm text-gray-500 mb-4">
                {items.length} saved listing{items.length !== 1 ? 's' : ''}
                {selectedIds.size > 0 && <span className="ml-2 text-emerald-600 font-semibold">· {selectedIds.size} selected</span>}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((item) => (
                  <WishlistCard
                    key={item.id}
                    item={item}
                    selected={selectedIds.has(item.holdingId)}
                    onToggle={() => toggleSelect(item.holdingId)}
                    onRemove={() => removeMutation.mutate(item.holdingId)}
                    removing={removeMutation.isPending && removeMutation.variables === item.holdingId}
                  />
                ))}
              </div>
            </>
          )}

          {/* Map view */}
          {viewMode === 'map' && (
            <div>
              <p className="text-sm text-gray-500 mb-3">
                {items.filter(i => i.latitude != null).length} of {items.length} hoardings have location data.
              </p>
              <Suspense fallback={
                <div className="h-[520px] bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              }>
                <WishlistMap items={items} />
              </Suspense>
            </div>
          )}
        </>
      )}
    </div>
  )
}
