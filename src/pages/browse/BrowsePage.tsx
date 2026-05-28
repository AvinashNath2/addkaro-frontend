import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Heart, MapPin, Zap, Ruler, Calendar, CheckCircle2, ArrowRight,
  Building2, SlidersHorizontal, X, ChevronDown,
} from 'lucide-react'
import { searchHoldings, type HoldingSearchParams } from '@/api/holdings.api'
import { addToWishlist, removeFromWishlist, getWishlist } from '@/api/customer.api'
import { useAuthStore } from '@/store/auth.store'
import { loadPreferences } from '@/lib/preferences'
import { cn } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'
import type { HoldingCard as HoldingCardType } from '@/types/index'

function formatRupees(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

const ADV_COLORS: Record<string, string> = {
  NATIONAL_HIGHWAY_FACING:   'bg-blue-50 text-blue-700',
  STATE_HIGHWAY_FACING:      'bg-blue-50 text-blue-700',
  MAIN_CITY_ROAD:            'bg-blue-50 text-blue-700',
  SIGNAL_JUNCTION:           'bg-amber-50 text-amber-700',
  FLYOVER_APPROACH:          'bg-amber-50 text-amber-700',
  NEAR_METRO_STATION:        'bg-purple-50 text-purple-700',
  NEAR_RAILWAY_STATION:      'bg-purple-50 text-purple-700',
  NEAR_BUS_STAND:            'bg-purple-50 text-purple-700',
  NEAR_AIRPORT:              'bg-purple-50 text-purple-700',
  HIGH_VEHICLE_TRAFFIC:      'bg-orange-50 text-orange-700',
  PEDESTRIAN_FOOTPATH_ZONE:  'bg-orange-50 text-orange-700',
  NEAR_SHOPPING_MALL:        'bg-pink-50 text-pink-700',
  IN_MARKET_BAZAAR:          'bg-pink-50 text-pink-700',
  NEAR_IT_PARK:              'bg-sky-50 text-sky-700',
  NEAR_INDUSTRIAL_AREA:      'bg-sky-50 text-sky-700',
  UPSCALE_NEIGHBOURHOOD:     'bg-emerald-50 text-emerald-700',
  TOURIST_HERITAGE_AREA:     'bg-teal-50 text-teal-700',
}
function advColor(adv: string) { return ADV_COLORS[adv] ?? 'bg-gray-100 text-gray-500' }

function HoldingCard({
  id, title, location, locationType, holdingType, city, area,
  width, height, rentalCost, ownerVerified, isIlluminated,
  minimumBookingMonths, topAdvantages,
  photos, saved, isCustomer, onWishlistToggle,
}: HoldingCardType & { saved: boolean; isCustomer: boolean; onWishlistToggle: (id: string) => void }) {
  const navigate = useNavigate()
  const imageUrl = photos?.[0] ?? null
  const displayLocation = city ? (area ? `${area}, ${city}` : city) : location
  const sqft = width * height

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card hover:shadow-card-md transition-all duration-200 hover:-translate-y-0.5 group">
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Building2 className="w-10 h-10 text-gray-400" />
            <span className="text-xs text-gray-400 font-medium">No photo</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <span
          className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full text-white"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
        >
          {holdingType ? holdingType.replace(/_/g, ' ') : locationType}
        </span>
        {isCustomer && (
          <button
            onClick={(e) => { e.stopPropagation(); onWishlistToggle(id) }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
            title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Heart className={`w-4 h-4 transition-colors ${saved ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
        )}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 flex items-end justify-between">
          <div>
            <p className="text-white font-extrabold text-lg leading-none drop-shadow-sm">{formatRupees(rentalCost)}</p>
            <p className="text-white/70 text-[11px] font-medium">per month</p>
          </div>
          <div className="flex gap-1.5">
            {isIlluminated && (
              <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(251,191,36,0.85)', backdropFilter: 'blur(6px)' }}>
                <Zap className="w-3 h-3" /> Lit
              </span>
            )}
            {ownerVerified && (
              <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(16,185,129,0.85)', backdropFilter: 'blur(6px)' }}>
                <CheckCircle2 className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-3.5 pb-4 space-y-3">
        <div>
          <h3 className="font-bold text-gray-900 text-[14px] leading-snug line-clamp-1">{title}</h3>
          <div className="flex items-center gap-1 text-[12px] text-gray-500 mt-0.5">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{displayLocation}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg">
            <Ruler className="w-3 h-3 text-gray-400" />{width} × {height} ft
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg">
            {sqft.toLocaleString('en-IN')} sqft
          </span>
          {minimumBookingMonths && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C9F31D] bg-brand-500/10 border border-brand-500/20 px-2.5 py-1 rounded-lg">
              <Calendar className="w-3 h-3" />Min {minimumBookingMonths} mo
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg">
            {locationType}
          </span>
        </div>
        {topAdvantages && topAdvantages.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {topAdvantages.slice(0, 3).map((adv) => (
              <span key={adv} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${advColor(adv)}`}>
                {adv.replace(/_/g, ' ')}
              </span>
            ))}
            {topAdvantages.length > 3 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                +{topAdvantages.length - 3} more
              </span>
            )}
          </div>
        )}
        <button
          onClick={() => navigate(`/holdings/${id}`)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-bold transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #C9F31D 0%, #a8cc0f 100%)', color: '#111111' }}
        >
          View Details <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Filter section wrapper ─────────────────────────────────────────────────────
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-b border-gray-100 last:border-0 pb-5 last:pb-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full mb-3"
      >
        <span className="text-xs font-black uppercase tracking-widest text-gray-400">{title}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-gray-300 transition-transform', open && 'rotate-180')} />
      </button>
      {open && children}
    </div>
  )
}

const ADVANTAGES = [
  { value: 'SIGNAL_JUNCTION',          label: 'Signal Junction' },
  { value: 'PEDESTRIAN_FOOTPATH_ZONE', label: 'Pedestrian Zone' },
  { value: 'NATIONAL_HIGHWAY_FACING',  label: 'National Highway' },
  { value: 'NEAR_METRO_STATION',       label: 'Near Metro' },
  { value: 'NEAR_AIRPORT',             label: 'Near Airport' },
  { value: 'NEAR_IT_PARK',             label: 'Near IT Park' },
  { value: 'NEAR_SHOPPING_MALL',       label: 'Shopping Mall' },
  { value: 'HIGH_VEHICLE_TRAFFIC',     label: 'High Traffic' },
  { value: 'TOURIST_HERITAGE_AREA',    label: 'Tourist Area' },
  { value: 'UPSCALE_NEIGHBOURHOOD',    label: 'Upscale Area' },
  { value: 'NEAR_RAILWAY_STATION',     label: 'Near Railway' },
  { value: 'IN_MARKET_BAZAAR',         label: 'Market / Bazaar' },
]

export default function BrowsePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  const [filterOpen, setFilterOpen] = useState(false)

  const [draftFilters, setDraftFilters] = useState<HoldingSearchParams>(() => {
    const prefs = loadPreferences()
    return {
      location: prefs.defaultLocation || '',
      type: prefs.preferredType || '',
      minPrice: prefs.minPrice ? Number(prefs.minPrice) : undefined,
      maxPrice: prefs.maxPrice ? Number(prefs.maxPrice) : undefined,
      sortBy: '',
      city: '',
      holdingType: '',
      isIlluminated: undefined,
      locationAdvantages: [],
    }
  })
  const [appliedFilters, setAppliedFilters] = useState<HoldingSearchParams>({ page: 0 })
  const [currentPage, setCurrentPage] = useState(0)
  const [wishlisted, setWishlisted] = useState<Record<string, boolean>>({})

  const isCustomer = !!user && user.role.toUpperCase() === 'CUSTOMER'

  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
    enabled: isCustomer,
  })

  const savedIds = useMemo(
    () => new Set(wishlistData?.map((item) => item.holdingId) ?? []),
    [wishlistData],
  )

  const isSaved = (holdingId: string): boolean =>
    holdingId in wishlisted ? wishlisted[holdingId] : savedIds.has(holdingId)

  const { data: browseData, isLoading, isError } = useQuery({
    queryKey: ['holdings', appliedFilters, currentPage],
    queryFn: () => searchHoldings({ ...appliedFilters, page: currentPage, limit: 12 }),
  })

  const addMutation = useMutation({
    mutationFn: addToWishlist,
    onSuccess: (_, holdingId) => {
      setWishlisted((prev) => ({ ...prev, [holdingId]: true }))
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })
  const removeMutation = useMutation({
    mutationFn: removeFromWishlist,
    onSuccess: (_, holdingId) => {
      setWishlisted((prev) => ({ ...prev, [holdingId]: false }))
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })

  const handleWishlistToggle = (holdingId: string) => {
    if (!user) { navigate('/login'); return }
    if (!isCustomer) return
    if (isSaved(holdingId)) removeMutation.mutate(holdingId)
    else addMutation.mutate(holdingId)
  }

  const handleApply = () => {
    const cleaned: HoldingSearchParams = {}
    if (draftFilters.location)   cleaned.location    = draftFilters.location
    if (draftFilters.type)       cleaned.type        = draftFilters.type
    if (draftFilters.minPrice)   cleaned.minPrice    = draftFilters.minPrice
    if (draftFilters.maxPrice)   cleaned.maxPrice    = draftFilters.maxPrice
    if (draftFilters.sortBy)     cleaned.sortBy      = draftFilters.sortBy
    if (draftFilters.city)       cleaned.city        = draftFilters.city
    if (draftFilters.holdingType) cleaned.holdingType = draftFilters.holdingType
    if (draftFilters.isIlluminated !== undefined) cleaned.isIlluminated = draftFilters.isIlluminated
    if (draftFilters.locationAdvantages?.length)  cleaned.locationAdvantages = draftFilters.locationAdvantages
    setCurrentPage(0)
    setAppliedFilters(cleaned)
    setFilterOpen(false)
  }

  const handleClear = () => {
    const empty: HoldingSearchParams = {
      location: '', type: '', city: '', holdingType: '',
      isIlluminated: undefined, locationAdvantages: [], sortBy: '',
      minPrice: undefined, maxPrice: undefined,
    }
    setDraftFilters(empty)
    setCurrentPage(0)
    setAppliedFilters({ page: 0 })
    setFilterOpen(false)
  }

  // Count applied (non-default) filters for badge
  const activeFilterCount = [
    appliedFilters.city,
    appliedFilters.holdingType,
    appliedFilters.type,
    appliedFilters.isIlluminated !== undefined ? 'y' : '',
    appliedFilters.minPrice,
    appliedFilters.maxPrice,
    appliedFilters.sortBy,
    ...(appliedFilters.locationAdvantages ?? []),
  ].filter(Boolean).length

  return (
    <div className="pb-28">
      <div className="page-header">
        <h2 className="page-title">Browse Hoardings</h2>
        <p className="page-subtitle">Find the perfect outdoor advertising space</p>
      </div>

      {/* Result count */}
      {browseData && !isLoading && (
        <p className="text-sm text-gray-500 mb-4">
          {browseData.totalElements} listing{browseData.totalElements !== 1 ? 's' : ''} found
          {activeFilterCount > 0 && (
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#C9F31D', color: '#111' }}>
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
            </span>
          )}
        </p>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="h-44 bg-gray-100" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          Failed to load listings. Please try again.
        </div>
      )}

      {browseData && browseData.items.length === 0 && (
        <EmptyState message="No hoardings found. Try adjusting your search filters." />
      )}

      {browseData && browseData.items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {browseData.items.map((h) => (
            <HoldingCard
              key={h.id}
              {...h}
              saved={isSaved(h.id)}
              isCustomer={isCustomer}
              onWishlistToggle={handleWishlistToggle}
            />
          ))}
        </div>
      )}

      {browseData && browseData.totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-100">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={!browseData.hasPrevious}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {browseData.page + 1} of {browseData.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={!browseData.hasNext}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* ── Floating filter button ───────────────────────────────────────────── */}
      <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-20">
        <button
          onClick={() => setFilterOpen(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-full shadow-2xl font-bold text-sm transition-all active:scale-95 hover:scale-105"
          style={{ background: '#C9F31D', color: '#111111', boxShadow: '0 8px 32px rgba(201,243,29,0.4)' }}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold" style={{ background: '#111', color: '#C9F31D' }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Filter drawer backdrop ───────────────────────────────────────────── */}
      {filterOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setFilterOpen(false)}
        />
      )}

      {/* ── Filter drawer (bottom sheet) ─────────────────────────────────────── */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out flex flex-col',
          filterOpen ? 'translate-y-0' : 'translate-y-full',
        )}
        style={{ maxHeight: '88vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-extrabold text-gray-900 text-base">Filter Hoardings</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Narrow down to the perfect space</p>
          </div>
          <button
            onClick={() => setFilterOpen(false)}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Scrollable filter content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Sort */}
          <FilterSection title="Sort By">
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: '',           label: 'Newest' },
                { value: 'price_asc',  label: 'Price ↑' },
                { value: 'price_desc', label: 'Price ↓' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDraftFilters(f => ({ ...f, sortBy: opt.value }))}
                  className={cn(
                    'py-2.5 rounded-xl border text-xs font-semibold transition-colors',
                    draftFilters.sortBy === opt.value
                      ? 'border-transparent text-[#111]'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400',
                  )}
                  style={draftFilters.sortBy === opt.value ? { background: '#C9F31D' } : {}}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Price range */}
          <FilterSection title="Price Range">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1.5 block">Min (₹/mo)</label>
                <input
                  type="number"
                  placeholder="e.g. 10000"
                  className="input-field w-full"
                  value={draftFilters.minPrice ?? ''}
                  onChange={e => setDraftFilters(f => ({ ...f, minPrice: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1.5 block">Max (₹/mo)</label>
                <input
                  type="number"
                  placeholder="e.g. 200000"
                  className="input-field w-full"
                  value={draftFilters.maxPrice ?? ''}
                  onChange={e => setDraftFilters(f => ({ ...f, maxPrice: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </div>
            </div>
          </FilterSection>

          {/* City & Location type */}
          <FilterSection title="Location">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1.5 block">City</label>
                <select
                  className="input-field w-full"
                  value={draftFilters.city ?? ''}
                  onChange={e => setDraftFilters(f => ({ ...f, city: e.target.value }))}
                >
                  <option value="">All Cities</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Delhi">Delhi</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1.5 block">Area Type</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { value: '',       label: 'All' },
                    { value: 'URBAN',  label: 'Urban' },
                    { value: 'LOCAL',  label: 'Local' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setDraftFilters(f => ({ ...f, type: opt.value }))}
                      className={cn(
                        'py-2 rounded-lg border text-xs font-semibold transition-colors col-span-1',
                        opt.value === '' && 'col-span-2',
                        draftFilters.type === opt.value
                          ? 'border-transparent text-[#111]'
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400',
                      )}
                      style={draftFilters.type === opt.value ? { background: '#C9F31D' } : {}}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </FilterSection>

          {/* Hoarding type */}
          <FilterSection title="Hoarding Type">
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: '',              label: 'All' },
                { value: 'BILLBOARD',     label: 'Billboard' },
                { value: 'UNIPOLE',       label: 'Unipole' },
                { value: 'GANTRY',        label: 'Gantry' },
                { value: 'LED_SCREEN',    label: 'LED Screen' },
                { value: 'WALL_PAINTING', label: 'Wall Paint' },
                { value: 'SKYWALK',       label: 'Skywalk' },
                { value: 'BUS_SHELTER',   label: 'Bus Shelter' },
                { value: 'SCROLLING',     label: 'Scrolling' },
                { value: 'POLE_KIOSK',    label: 'Pole Kiosk' },
                { value: 'AIRPORT',       label: 'Airport' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDraftFilters(f => ({ ...f, holdingType: opt.value }))}
                  className={cn(
                    'py-2 rounded-xl border text-xs font-semibold transition-colors',
                    opt.value === '' && 'col-span-3',
                    draftFilters.holdingType === opt.value
                      ? 'border-transparent text-[#111]'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400',
                  )}
                  style={draftFilters.holdingType === opt.value ? { background: '#C9F31D' } : {}}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Illumination */}
          <FilterSection title="Illumination">
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: '',      label: 'Any' },
                { value: 'true',  label: '💡 Illuminated' },
                { value: 'false', label: 'Non-Lit' },
              ].map(opt => {
                const current = draftFilters.isIlluminated === undefined ? '' : String(draftFilters.isIlluminated)
                return (
                  <button
                    key={opt.value}
                    onClick={() => setDraftFilters(f => ({
                      ...f,
                      isIlluminated: opt.value === '' ? undefined : opt.value === 'true',
                    }))}
                    className={cn(
                      'py-2.5 rounded-xl border text-xs font-semibold transition-colors',
                      current === opt.value
                        ? 'border-transparent text-[#111]'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400',
                    )}
                    style={current === opt.value ? { background: '#C9F31D' } : {}}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </FilterSection>

          {/* Location advantages */}
          <FilterSection title="Location Advantages">
            <div className="flex flex-wrap gap-2">
              {ADVANTAGES.map(({ value, label }) => {
                const selected = draftFilters.locationAdvantages?.includes(value)
                return (
                  <button
                    key={value}
                    onClick={() => setDraftFilters(f => ({
                      ...f,
                      locationAdvantages: selected
                        ? f.locationAdvantages?.filter(a => a !== value) ?? []
                        : [...(f.locationAdvantages ?? []), value],
                    }))}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors',
                      selected
                        ? 'border-transparent text-[#111]'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400',
                    )}
                    style={selected ? { background: '#C9F31D' } : {}}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </FilterSection>
        </div>

        {/* ── Sticky footer: Clear + Apply ── */}
        <div className="shrink-0 border-t border-gray-100 px-6 py-4 flex gap-3 bg-white">
          <button
            onClick={handleClear}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="flex-[2] py-3 rounded-xl text-sm font-extrabold transition-all active:scale-[0.98]"
            style={{ background: '#C9F31D', color: '#111111' }}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}
