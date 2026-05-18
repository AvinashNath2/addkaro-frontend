// BrowsePage.tsx — the main hoarding discovery page
//
// Two modes:
//   "browse"  — text search with filters (existing behaviour)
//   "nearby"  — map-based location search, shows holdings within a radius
//
// On first load:
//   - The browser's geolocation API is used to detect the user's location.
//   - The coordinates are reverse-geocoded (Nominatim API, free/no key) to get
//     the area name, which is pre-filled into the Browse search filter.
//   - The map in "Near Me" mode is centred on the detected location.

import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, MapPin, Loader2, Search, Navigation, Map as MapIcon, List } from 'lucide-react'
import { searchHoldings, nearbyHoldings, type HoldingSearchParams } from '@/api/holdings.api'
import { addToWishlist, removeFromWishlist, getWishlist } from '@/api/customer.api'
import { useAuthStore } from '@/store/auth.store'
import { loadPreferences } from '@/lib/preferences'
import EmptyState from '@/components/ui/EmptyState'

function formatRupees(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function HoldingCard({
  id, title, location, locationType, width, height, rentalCost,
  ownerVerified, photos, thumbnail, distanceKm, saved, isCustomer, onWishlistToggle,
}: {
  id: string; title: string; location: string; locationType: string
  width: number; height: number; rentalCost: number
  ownerVerified: boolean; photos?: string[]; thumbnail?: string | null
  distanceKm?: number; saved: boolean; isCustomer: boolean
  onWishlistToggle: (id: string) => void
}) {
  const navigate = useNavigate()
  const imageUrl = photos?.[0] ?? thumbnail ?? null

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card hover:shadow-card-md transition-all duration-200 hover:-translate-y-0.5 cursor-default"
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <MapPin className="w-10 h-10 text-slate-300" />
            <span className="text-xs text-slate-400 font-medium">No photo</span>
          </div>
        )}

        {/* Dark gradient overlay at bottom */}
        {imageUrl && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        )}

        {/* Type badge — top-left */}
        <span className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full text-white"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
          {locationType}
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

        {/* Price badge — bottom-left, overlaid on gradient */}
        <div className="absolute bottom-3 left-3">
          <span className="text-white font-extrabold text-base leading-none drop-shadow-sm">
            {formatRupees(rentalCost)}
            <span className="text-[11px] font-semibold text-white/80">/mo</span>
          </span>
        </div>

        {/* Distance pill — bottom-right */}
        {distanceKm !== undefined && (
          <div className="absolute bottom-3 right-3 text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
            {distanceKm.toFixed(1)} km
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-4 pt-3.5 pb-4">
        <h3 className="font-bold text-gray-900 text-[14px] leading-snug line-clamp-1 mb-1.5">{title}</h3>

        <div className="flex items-center gap-1 text-[12px] text-gray-400 mb-3">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{location}</span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
            {width} × {height} ft
          </span>
          {ownerVerified && (
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
              ✓ Verified
            </span>
          )}
        </div>

        <button
          onClick={() => navigate(`/holdings/${id}`)}
          className="w-full py-2.5 rounded-xl text-[13px] font-bold text-white transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
        >
          View Details
        </button>
      </div>
    </div>
  )
}

// Lazy-load the map component so Leaflet's heavy bundle only loads when needed
const LocationPickerMap = lazy(() => import('@/components/browse/LocationPickerMap'))

interface LatLng { lat: number; lng: number }

// Reverse-geocode a lat/lng to a readable city/area name using OpenStreetMap Nominatim.
// Returns something like "Koramangala, Bangalore" or "Connaught Place, Delhi".
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } },
    )
    const data = await res.json()
    // Use district/county level for Indian addresses — avoids overly specific suburbs
    const a = data.address ?? {}
    const parts = [
      a.county || a.district || a.state_district,
      a.state,
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : data.display_name?.split(',')[0] ?? ''
  } catch {
    return ''
  }
}

export default function BrowsePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  // ── Mode: "browse" (list/search) or "nearby" (map-based) ─────────────────
  const [mode, setMode] = useState<'browse' | 'nearby'>('browse')

  // ── Geolocation state ─────────────────────────────────────────────────────
  const [mapCenter, setMapCenter] = useState<LatLng>({ lat: 12.9716, lng: 77.5946 }) // Bangalore default
  const [locationName, setLocationName] = useState('') // human-readable area name
  const [locating, setLocating] = useState(false)

  // Default date range: today → today + 7 days
  const defaultDateRange = (() => {
    const from = new Date()
    const to = new Date()
    to.setDate(to.getDate() + 7)
    return {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    }
  })()

  // ── Browse mode filter state (seeded from saved preferences) ────────────
  const [draftFilters, setDraftFilters] = useState<HoldingSearchParams>(() => {
    const prefs = loadPreferences()
    return {
      location: prefs.defaultLocation || '',
      type: prefs.preferredType || '',
      minPrice: prefs.minPrice ? Number(prefs.minPrice) : undefined,
      maxPrice: prefs.maxPrice ? Number(prefs.maxPrice) : undefined,
      sortBy: '',
      availableFrom: defaultDateRange.from,
      availableTo: defaultDateRange.to,
      city: '',
      holdingType: '',
      isIlluminated: undefined,
      locationAdvantages: [],
    }
  })
  const [appliedFilters, setAppliedFilters] = useState<HoldingSearchParams>({
    page: 0,
    availableFrom: defaultDateRange.from,
    availableTo: defaultDateRange.to,
  })
  const [currentPage, setCurrentPage] = useState(0)

  // ── Local wishlist toggle state (for instant UI feedback) ─────────────────
  // Key = holdingId, value = true/false (explicitly toggled by user this session)
  const [wishlisted, setWishlisted] = useState<Record<string, boolean>>({})

  const isCustomer = !!user && user.role.toUpperCase() === 'CUSTOMER'

  // ── Auto-detect location on mount ─────────────────────────────────────────
  // Requests browser geolocation, reverse-geocodes to area name, pre-fills filter.
  useEffect(() => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setMapCenter({ lat, lng })
        const name = await reverseGeocode(lat, lng)
        if (name) {
          setLocationName(name)
          // Pre-fill the browse search filter with the detected area
          setDraftFilters((f) => ({ ...f, location: name }))
        }
        setLocating(false)
      },
      () => setLocating(false), // user denied permission — silently skip
    )
  }, [])

  // ── Wishlist: fetch existing saved items to pre-populate heart icons ───────
  // Only customers have a wishlist; guests and owners skip this fetch.
  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
    enabled: isCustomer,
  })

  // Build a Set of holdingIds already saved — used as fallback if wishlisted[id] is unset
  const savedIds = useMemo(
    () => new Set(wishlistData?.map((item) => item.holdingId) ?? []),
    [wishlistData],
  )

  // True if holding is saved: explicit toggle this session OR pre-loaded from wishlist
  const isSaved = (holdingId: string): boolean =>
    holdingId in wishlisted ? wishlisted[holdingId] : savedIds.has(holdingId)

  // ── Browse mode: text-search query ────────────────────────────────────────
  const { data: browseData, isLoading: browseLoading, isError: browseError } = useQuery({
    queryKey: ['holdings', appliedFilters, currentPage],
    queryFn: () => searchHoldings({ ...appliedFilters, page: currentPage, limit: 12 }),
    enabled: mode === 'browse',
  })

  // ── Nearby mode: radius search query ──────────────────────────────────────
  const { data: nearbyData, isLoading: nearbyLoading, isError: nearbyError } = useQuery({
    queryKey: ['holdings-nearby', mapCenter],
    queryFn: () => nearbyHoldings({ lat: mapCenter.lat, lng: mapCenter.lng, radiusKm: 15 }),
    enabled: mode === 'nearby',
  })

  // ── Wishlist mutations ────────────────────────────────────────────────────
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
    if (draftFilters.availableFrom) cleaned.availableFrom = draftFilters.availableFrom
    if (draftFilters.availableTo) cleaned.availableTo = draftFilters.availableTo
    if (draftFilters.city) cleaned.city = draftFilters.city
    if (draftFilters.holdingType) cleaned.holdingType = draftFilters.holdingType
    if (draftFilters.isIlluminated !== undefined) cleaned.isIlluminated = draftFilters.isIlluminated
    if (draftFilters.locationAdvantages?.length) cleaned.locationAdvantages = draftFilters.locationAdvantages
    setCurrentPage(0)
    setAppliedFilters(cleaned)
  }

  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setMapCenter({ lat, lng })
        const name = await reverseGeocode(lat, lng)
        if (name) setLocationName(name)
        setLocating(false)
        setMode('nearby')
      },
      () => setLocating(false),
    )
  }

  // When user clicks map: update center + reverse-geocode to update display name
  const handleMapLocationChange = async (coords: LatLng) => {
    setMapCenter(coords)
    const name = await reverseGeocode(coords.lat, coords.lng)
    if (name) setLocationName(name)
  }


  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Browse Hoardings</h2>
        <p className="page-subtitle">Find the perfect outdoor advertising space</p>
      </div>

      {/* ── Mode tabs: Browse | Near Me ───────────────────────────────────── */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setMode('browse')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'browse' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <List className="w-4 h-4" />
          Browse All
        </button>
        <button
          onClick={() => { setMode('nearby') }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'nearby' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MapIcon className="w-4 h-4" />
          Near Me
          {locationName && mode !== 'nearby' && (
            <span className="text-xs text-gray-400 font-normal hidden sm:inline">
              · {locationName.split(',')[0]}
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          BROWSE MODE
        ══════════════════════════════════════════════════════════════════════ */}
      {mode === 'browse' && (
        <>
          {/* Search & filter bar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-card">
            <div className="flex gap-3 mb-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by location (e.g. Mumbai, MG Road…)"
                  className="input-field pl-9"
                  value={draftFilters.location ?? ''}
                  onChange={(e) => setDraftFilters((f) => ({ ...f, location: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button onClick={handleSearch} className="btn-primary w-auto px-6">
                Search
              </button>
              {/* "Use my location" shortcut — fills location from geolocation */}
              <button
                onClick={handleUseMyLocation}
                disabled={locating}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 shrink-0"
                title="Use my current location"
              >
                {locating
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Navigation className="w-4 h-4" />}
                <span className="hidden sm:inline">My Location</span>
              </button>
            </div>

            {/* City + HoldingType + Illumination row */}
            <div className="flex flex-wrap items-center gap-3 mb-3 pb-3 border-b border-gray-100">
              <input
                type="text"
                placeholder="City (e.g. Mumbai)"
                className="input-field w-36"
                value={draftFilters.city ?? ''}
                onChange={(e) => setDraftFilters((f) => ({ ...f, city: e.target.value }))}
              />
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
                className="input-field w-36"
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

            {/* Date range filter */}
            <div className="flex flex-wrap items-center gap-3 mb-3 pb-3 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Available between:</span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="input-field text-sm w-40"
                  value={draftFilters.availableFrom ?? ''}
                  onChange={(e) => setDraftFilters((f) => ({ ...f, availableFrom: e.target.value }))}
                />
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="date"
                  className="input-field text-sm w-40"
                  value={draftFilters.availableTo ?? ''}
                  onChange={(e) => setDraftFilters((f) => ({ ...f, availableTo: e.target.value }))}
                />
              </div>
              <button
                onClick={() => setDraftFilters((f) => ({ ...f, availableFrom: undefined, availableTo: undefined }))}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear dates
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                className="input-field w-auto"
                value={draftFilters.type ?? ''}
                onChange={(e) => setDraftFilters((f) => ({ ...f, type: e.target.value }))}
              >
                <option value="">All Types</option>
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
          </div>

          {browseLoading && (
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

          {browseError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
              Failed to load listings. Please try again.
            </div>
          )}

          {browseData && !browseLoading && (
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
                  id={h.id}
                  title={h.title}
                  location={h.location}
                  locationType={h.locationType}
                  width={h.width}
                  height={h.height}
                  rentalCost={h.rentalCost}
                  ownerVerified={h.ownerVerified}
                  photos={h.photos}
                  saved={isSaved(h.id)}
                  isCustomer={isCustomer}
                  onWishlistToggle={handleWishlistToggle}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
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
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          NEAR ME MODE
        ══════════════════════════════════════════════════════════════════════ */}
      {mode === 'nearby' && (
        <>
          {/* Location info bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-sm">
              <Navigation className="w-4 h-4 text-brand-600 shrink-0" />
              <span className="font-medium text-gray-800">
                {locationName || `${mapCenter.lat.toFixed(4)}, ${mapCenter.lng.toFixed(4)}`}
              </span>
              <span className="text-gray-400">· 15 km radius</span>
            </div>
            <button
              onClick={handleUseMyLocation}
              disabled={locating}
              className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50"
            >
              {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
              Reset to my location
            </button>
          </div>

          {/* Map — click anywhere to move the search center */}
          <div className="mb-5 rounded-xl overflow-hidden shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 bg-gray-50 px-4 py-2 border-b border-gray-200">
              Click on the map to search around a different location
            </p>
            <Suspense fallback={
              <div className="h-80 flex items-center justify-center bg-gray-100">
                <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
              </div>
            }>
              <LocationPickerMap
                center={mapCenter}
                onLocationChange={handleMapLocationChange}
                height="320px"
                holdings={nearbyData ?? []}
              />
            </Suspense>
          </div>

          {/* Nearby results */}
          {nearbyLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
            </div>
          )}

          {nearbyError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
              Failed to load nearby hoardings. Please try again.
            </div>
          )}

          {nearbyData && !nearbyLoading && (
            <p className="text-sm text-gray-500 mb-4">
              {nearbyData.length} hoarding{nearbyData.length !== 1 ? 's' : ''} within 15 km
            </p>
          )}

          {nearbyData && nearbyData.length === 0 && (
            <EmptyState message="No hoardings found near this location. Try clicking a different spot on the map." />
          )}

          {nearbyData && nearbyData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {nearbyData.map((h) => (
                <HoldingCard
                  key={h.id}
                  id={h.id}
                  title={h.title}
                  location={h.location}
                  locationType={h.locationType}
                  width={h.width}
                  height={h.height}
                  rentalCost={h.rentalCost}
                  ownerVerified={h.ownerVerified}
                  thumbnail={h.thumbnail}
                  distanceKm={h.distanceKm}
                  saved={isSaved(h.id)}
                  isCustomer={isCustomer}
                  onWishlistToggle={handleWishlistToggle}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
