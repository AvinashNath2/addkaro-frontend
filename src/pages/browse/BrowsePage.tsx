import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, MapPin, Zap, Ruler, Calendar, CheckCircle2, ArrowRight, Building2 } from 'lucide-react'
import { searchHoldings, type HoldingSearchParams } from '@/api/holdings.api'
import { addToWishlist, removeFromWishlist, getWishlist } from '@/api/customer.api'
import { useAuthStore } from '@/store/auth.store'
import { loadPreferences } from '@/lib/preferences'
import EmptyState from '@/components/ui/EmptyState'
import type { HoldingCard as HoldingCardType } from '@/types/index'

function formatRupees(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

// Advantage chip colours — same palette as HoldingDetailPage
const ADV_COLORS: Record<string, string> = {
  NATIONAL_HIGHWAY_FACING:   'bg-blue-100 text-blue-700',
  STATE_HIGHWAY_FACING:      'bg-blue-100 text-blue-700',
  MAIN_CITY_ROAD:            'bg-blue-100 text-blue-700',
  SIGNAL_JUNCTION:           'bg-amber-100 text-amber-700',
  FLYOVER_APPROACH:          'bg-amber-100 text-amber-700',
  NEAR_METRO_STATION:        'bg-purple-100 text-purple-700',
  NEAR_RAILWAY_STATION:      'bg-purple-100 text-purple-700',
  NEAR_BUS_STAND:            'bg-purple-100 text-purple-700',
  NEAR_AIRPORT:              'bg-purple-100 text-purple-700',
  HIGH_VEHICLE_TRAFFIC:      'bg-orange-100 text-orange-700',
  PEDESTRIAN_FOOTPATH_ZONE:  'bg-orange-100 text-orange-700',
  NEAR_SHOPPING_MALL:        'bg-pink-100 text-pink-700',
  IN_MARKET_BAZAAR:          'bg-pink-100 text-pink-700',
  NEAR_IT_PARK:              'bg-sky-100 text-sky-700',
  NEAR_INDUSTRIAL_AREA:      'bg-sky-100 text-sky-700',
  UPSCALE_NEIGHBOURHOOD:     'bg-emerald-100 text-emerald-700',
  TOURIST_HERITAGE_AREA:     'bg-teal-100 text-teal-700',
}
function advColor(adv: string) { return ADV_COLORS[adv] ?? 'bg-gray-100 text-gray-600' }

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

      {/* ── Image ─────────────────────────────────────────────────────────── */}
      <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Building2 className="w-10 h-10 text-slate-300" />
            <span className="text-xs text-slate-400 font-medium">No photo</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Type badge — top-left */}
        <span
          className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full text-white"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
        >
          {holdingType ? holdingType.replace(/_/g, ' ') : locationType}
        </span>

        {/* Wishlist button — top-right */}
        {isCustomer && (
          <button
            onClick={(e) => { e.stopPropagation(); onWishlistToggle(id) }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
            title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Heart className={`w-4 h-4 transition-colors ${saved ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
          </button>
        )}

        {/* Bottom overlay: price + illumination */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 flex items-end justify-between">
          <div>
            <p className="text-white font-extrabold text-lg leading-none drop-shadow-sm">
              {formatRupees(rentalCost)}
            </p>
            <p className="text-white/70 text-[11px] font-medium">per month</p>
          </div>
          <div className="flex gap-1.5">
            {isIlluminated && (
              <span
                className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: 'rgba(251,191,36,0.85)', backdropFilter: 'blur(6px)' }}
              >
                <Zap className="w-3 h-3" /> Lit
              </span>
            )}
            {ownerVerified && (
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

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-3.5 pb-4 space-y-3">

        {/* Title + location */}
        <div>
          <h3 className="font-bold text-gray-900 text-[14px] leading-snug line-clamp-1">{title}</h3>
          <div className="flex items-center gap-1 text-[12px] text-gray-400 mt-0.5">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{displayLocation}</span>
          </div>
        </div>

        {/* Key stat pills */}
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
            <Ruler className="w-3 h-3 text-gray-400" />
            {width} × {height} ft
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
            {sqft.toLocaleString('en-IN')} sqft
          </span>
          {minimumBookingMonths && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-lg">
              <Calendar className="w-3 h-3" />
              Min {minimumBookingMonths} mo
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
            {locationType}
          </span>
        </div>

        {/* Location advantage chips */}
        {topAdvantages && topAdvantages.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {topAdvantages.slice(0, 3).map((adv) => (
              <span
                key={adv}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${advColor(adv)}`}
              >
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

        {/* CTA */}
        <button
          onClick={() => navigate(`/holdings/${id}`)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
        >
          View Details
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function BrowsePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

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

  const handleSearch = () => {
    const cleaned: HoldingSearchParams = {}
    if (draftFilters.location) cleaned.location = draftFilters.location
    if (draftFilters.type) cleaned.type = draftFilters.type
    if (draftFilters.minPrice) cleaned.minPrice = draftFilters.minPrice
    if (draftFilters.maxPrice) cleaned.maxPrice = draftFilters.maxPrice
    if (draftFilters.sortBy) cleaned.sortBy = draftFilters.sortBy
    if (draftFilters.city) cleaned.city = draftFilters.city
    if (draftFilters.holdingType) cleaned.holdingType = draftFilters.holdingType
    if (draftFilters.isIlluminated !== undefined) cleaned.isIlluminated = draftFilters.isIlluminated
    if (draftFilters.locationAdvantages?.length) cleaned.locationAdvantages = draftFilters.locationAdvantages
    setCurrentPage(0)
    setAppliedFilters(cleaned)
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Browse Hoardings</h2>
        <p className="page-subtitle">Find the perfect outdoor advertising space</p>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-card">
        {/* City + HoldingType + Illumination row */}
        <div className="flex flex-wrap items-center gap-3 mb-3 pb-3 border-b border-gray-100">
          <select
            className="input-field w-40"
            value={draftFilters.city ?? ''}
            onChange={(e) => setDraftFilters((f) => ({ ...f, city: e.target.value }))}
          >
            <option value="">All Cities</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Delhi">Delhi</option>
          </select>
          <select
            className="input-field w-44"
            value={draftFilters.holdingType ?? ''}
            onChange={(e) => setDraftFilters((f) => ({ ...f, holdingType: e.target.value }))}
          >
            <option value="">All Types</option>
            <option value="BILLBOARD">Billboard</option>
            <option value="UNIPOLE">Unipole</option>
            <option value="GANTRY">Gantry</option>
            <option value="LED_SCREEN">LED Screen</option>
            <option value="WALL_PAINTING">Wall Painting</option>
            <option value="SKYWALK">Skywalk</option>
            <option value="BUS_SHELTER">Bus Shelter</option>
            <option value="SCROLLING">Scrolling</option>
            <option value="POLE_KIOSK">Pole Kiosk</option>
            <option value="AIRPORT">Airport</option>
          </select>
          <select
            className="input-field w-40"
            value={draftFilters.isIlluminated === undefined ? '' : String(draftFilters.isIlluminated)}
            onChange={(e) => setDraftFilters((f) => ({
              ...f,
              isIlluminated: e.target.value === '' ? undefined : e.target.value === 'true',
            }))}
          >
            <option value="">Illumination</option>
            <option value="true">Illuminated</option>
            <option value="false">Non-Illuminated</option>
          </select>
        </div>

        {/* Location advantages */}
        <div className="flex flex-wrap items-start gap-2 mb-3 pb-3 border-b border-gray-100">
          <span className="text-xs font-medium text-gray-500 whitespace-nowrap pt-1">Advantages:</span>
          {[
            'SIGNAL_JUNCTION', 'PEDESTRIAN_FOOTPATH_ZONE', 'NATIONAL_HIGHWAY_FACING',
            'NEAR_METRO_STATION', 'NEAR_AIRPORT', 'NEAR_IT_PARK',
            'NEAR_SHOPPING_MALL', 'HIGH_VEHICLE_TRAFFIC', 'TOURIST_HERITAGE_AREA',
          ].map((adv) => {
            const selected = draftFilters.locationAdvantages?.includes(adv)
            return (
              <button
                key={adv}
                type="button"
                onClick={() => setDraftFilters((f) => ({
                  ...f,
                  locationAdvantages: selected
                    ? f.locationAdvantages?.filter((a) => a !== adv) ?? []
                    : [...(f.locationAdvantages ?? []), adv],
                }))}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                  selected
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400'
                }`}
              >
                {adv.replace(/_/g, ' ')}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-gray-100">
          <select
            className="input-field w-auto"
            value={draftFilters.type ?? ''}
            onChange={(e) => setDraftFilters((f) => ({ ...f, type: e.target.value }))}
          >
            <option value="">All Location Types</option>
            <option value="URBAN">Urban</option>
            <option value="LOCAL">Local</option>
          </select>
          <input
            type="number"
            placeholder="Min Price (₹)"
            className="input-field w-36"
            value={draftFilters.minPrice ?? ''}
            onChange={(e) =>
              setDraftFilters((f) => ({ ...f, minPrice: e.target.value ? Number(e.target.value) : undefined }))
            }
          />
          <input
            type="number"
            placeholder="Max Price (₹)"
            className="input-field w-36"
            value={draftFilters.maxPrice ?? ''}
            onChange={(e) =>
              setDraftFilters((f) => ({ ...f, maxPrice: e.target.value ? Number(e.target.value) : undefined }))
            }
          />
          <select
            className="input-field w-auto"
            value={draftFilters.sortBy ?? ''}
            onChange={(e) => setDraftFilters((f) => ({ ...f, sortBy: e.target.value }))}
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setDraftFilters({
                location: '', type: '', city: '', holdingType: '',
                isIlluminated: undefined, locationAdvantages: [], sortBy: '',
                minPrice: undefined, maxPrice: undefined,
              })
              setCurrentPage(0)
              setAppliedFilters({ page: 0 })
            }}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Clear all filters
          </button>
          <button onClick={handleSearch} className="btn-primary w-auto px-8">
            Apply Filters
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
              <div className="h-44 bg-gray-200" />
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

      {browseData && !isLoading && (
        <p className="text-sm text-gray-500 mb-4">
          {browseData.totalElements} listing{browseData.totalElements !== 1 ? 's' : ''} found
        </p>
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
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-200">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={!browseData.hasPrevious}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {browseData.page + 1} of {browseData.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={!browseData.hasNext}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
