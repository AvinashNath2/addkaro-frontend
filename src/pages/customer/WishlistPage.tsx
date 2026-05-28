import { useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MapPin, Loader2, Building2, Ruler, CheckCircle2, ArrowRight, Heart,
  List, Map, Calculator, FileDown, X, ChevronDown, ChevronUp, Minus, Plus,
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

// ── Per-item calculator ────────────────────────────────────────────────────────
function calcRow(item: WishlistItem, months: number): BudgetRow {
  const rate         = item.rentalCost ?? 0
  const discountPct  = 0 // wishlist items don't carry discount tiers
  const taxPct       = item.taxPct ?? 18
  const base         = rate * months
  const discount     = 0 // wishlist items don't carry discount tiers — shown in full calculator on detail page
  const tax          = (base - discount) * (taxPct / 100)
  const setup        = item.setupCost ?? 0
  const total        = base - discount + tax + setup
  return { item, months, base, discount, tax, setup, total, discountPct, taxPct }
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
  const grandTotal  = rows.reduce((s, r) => s + r.total, 0)
  const grandTax    = rows.reduce((s, r) => s + r.tax, 0)
  const grandSetup  = rows.reduce((s, r) => s + r.setup, 0)
  const grandBase   = rows.reduce((s, r) => s + r.base, 0)

  function step(holdingId: string) { return items.find(i => i.holdingId === holdingId)?.minimumBookingMonths ?? 1 }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-5">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <Calculator className="w-4 h-4 text-emerald-600" />
          </span>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Budget Estimate</p>
            <p className="text-xs text-gray-400">{items.length} hoarding{items.length !== 1 ? 's' : ''} selected</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-extrabold text-emerald-600">{formatRupees(grandTotal)}</span>
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
          {/* Per-hoarding breakdown */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-2 text-gray-500 font-semibold pr-3">Hoarding</th>
                  <th className="text-right pb-2 text-gray-500 font-semibold px-2">Rate/mo</th>
                  <th className="text-center pb-2 text-gray-500 font-semibold px-2">Duration</th>
                  <th className="text-right pb-2 text-gray-500 font-semibold px-2">Base</th>
                  <th className="text-right pb-2 text-gray-500 font-semibold px-2">Tax</th>
                  <th className="text-right pb-2 text-gray-500 font-semibold px-2">Setup</th>
                  <th className="text-right pb-2 text-gray-900 font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const s = step(r.item.holdingId)
                  const m = monthsMap[r.item.holdingId] ?? s
                  return (
                    <tr key={r.item.holdingId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 pr-3">
                        <p className="font-semibold text-gray-900 line-clamp-1">{r.item.title}</p>
                        <p className="text-gray-400 text-[10px] truncate">{r.item.location}</p>
                      </td>
                      <td className="py-2.5 px-2 text-right text-gray-700 whitespace-nowrap">{formatRupees(r.item.rentalCost ?? 0)}</td>
                      <td className="py-2.5 px-2">
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
                      <td className="py-2.5 px-2 text-right text-gray-700 whitespace-nowrap">{formatRupees(r.base)}</td>
                      <td className="py-2.5 px-2 text-right text-gray-500 whitespace-nowrap">{formatRupees(r.tax)}</td>
                      <td className="py-2.5 px-2 text-right text-gray-500 whitespace-nowrap">{r.setup > 0 ? formatRupees(r.setup) : '—'}</td>
                      <td className="py-2.5 text-right font-bold text-gray-900 whitespace-nowrap">{formatRupees(r.total)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Grand total */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5 text-xs text-emerald-700">
              <p>Base: <strong>{formatRupees(grandBase)}</strong></p>
              <p>Tax: <strong>{formatRupees(grandTax)}</strong></p>
              {grandSetup > 0 && <p>Setup: <strong>{formatRupees(grandSetup)}</strong></p>}
              <p className="text-[10px] text-emerald-500 mt-1">Security deposits not included</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-600 font-medium">Combined Total</p>
              <p className="text-2xl font-extrabold text-emerald-700">{formatRupees(grandTotal)}</p>
            </div>
          </div>

          {/* PDF download */}
          <button
            onClick={() => generateBudgetPdf(rows)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            Download PDF Report
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
