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

// ── Custom hoarding type SVG icons ────────────────────────────────────────────
function HoardingTypeIcon({ type, size = 38 }: { type: string; size?: number }) {
  const s = size
  switch (type) {
    case 'BILLBOARD': return (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <rect x="3" y="6" width="34" height="20" rx="2.5" fill="currentColor" fillOpacity=".15" stroke="currentColor" strokeWidth="2"/>
        <line x1="8" y1="13" x2="32" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity=".5"/>
        <line x1="8" y1="18" x2="22" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity=".4"/>
        <line x1="14" y1="26" x2="12" y2="37" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="26" y1="26" x2="28" y2="37" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="9" y1="37" x2="31" y2="37" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity=".3"/>
      </svg>
    )
    case 'UNIPOLE': return (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <rect x="4" y="3" width="32" height="18" rx="2.5" fill="currentColor" fillOpacity=".15" stroke="currentColor" strokeWidth="2"/>
        <line x1="9" y1="10" x2="31" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity=".5"/>
        <line x1="9" y1="15" x2="22" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity=".4"/>
        <line x1="20" y1="21" x2="20" y2="38" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <line x1="15" y1="38" x2="25" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity=".5"/>
      </svg>
    )
    case 'GANTRY': return (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <line x1="5" y1="38" x2="5" y2="8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="35" y1="38" x2="35" y2="8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="5" y1="8" x2="35" y2="8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <rect x="7" y="11" width="26" height="14" rx="1.5" fill="currentColor" fillOpacity=".15" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="11" y1="16" x2="29" y2="16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity=".5"/>
        <line x1="11" y1="20" x2="22" y2="20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity=".4"/>
        <line x1="3" y1="35" x2="37" y2="35" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeOpacity=".2" strokeDasharray="3 3"/>
      </svg>
    )
    case 'SKYWALK': return (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <line x1="7" y1="38" x2="7" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="33" y1="38" x2="33" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <rect x="3" y="18" width="34" height="10" rx="2" fill="currentColor" fillOpacity=".1" stroke="currentColor" strokeWidth="2"/>
        <line x1="3" y1="18" x2="37" y2="18" stroke="currentColor" strokeWidth="1.5" strokeOpacity=".7"/>
        <rect x="11" y="10" width="18" height="8" rx="1.5" fill="currentColor" fillOpacity=".2" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="15" y1="13.5" x2="25" y2="13.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeOpacity=".5"/>
      </svg>
    )
    case 'BUS_SHELTER': return (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <rect x="4" y="6" width="26" height="4" rx="1.5" fill="currentColor" fillOpacity=".25" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="5" y1="10" x2="5" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <rect x="5" y="10" width="5" height="20" rx="1" fill="currentColor" fillOpacity=".1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="12" y="12" width="14" height="14" rx="1.5" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="15" y1="17" x2="23" y2="17" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeOpacity=".5"/>
        <line x1="15" y1="21" x2="21" y2="21" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeOpacity=".4"/>
        <line x1="9" y1="32" x2="30" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeOpacity=".4"/>
        <line x1="4" y1="36" x2="36" y2="36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity=".25"/>
      </svg>
    )
    case 'WALL_PAINTING': return (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <rect x="3" y="5" width="34" height="30" rx="2" fill="currentColor" fillOpacity=".07" stroke="currentColor" strokeWidth="2"/>
        <rect x="7" y="9" width="12" height="10" rx="1" fill="currentColor" fillOpacity=".25"/>
        <rect x="21" y="9" width="12" height="10" rx="1" fill="currentColor" fillOpacity=".15"/>
        <rect x="7" y="21" width="7" height="9" rx="1" fill="currentColor" fillOpacity=".2"/>
        <rect x="16" y="21" width="17" height="9" rx="1" fill="currentColor" fillOpacity=".12"/>
        <circle cx="34" cy="7" r="3.5" fill="currentColor" fillOpacity=".5"/>
        <line x1="34" y1="10.5" x2="34" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
    case 'LED_SCREEN': return (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <rect x="2" y="5" width="36" height="24" rx="3" fill="currentColor" fillOpacity=".1" stroke="currentColor" strokeWidth="2"/>
        <rect x="5" y="8" width="30" height="18" rx="1.5" fill="currentColor" fillOpacity=".08"/>
        {/* LED dot grid 3 rows × 5 cols */}
        {[11,17,23].flatMap(y => [9,15,20,25,31].map(x =>
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="currentColor" fillOpacity=".45"/>
        ))}
        <line x1="20" y1="29" x2="20" y2="36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="13" y1="36" x2="27" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
    case 'SCROLLING': return (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <rect x="2" y="5" width="36" height="26" rx="2" fill="currentColor" fillOpacity=".07" stroke="currentColor" strokeWidth="2"/>
        <rect x="2" y="5" width="36" height="5" rx="2" fill="currentColor" fillOpacity=".3"/>
        <rect x="2" y="26" width="36" height="5" rx="2" fill="currentColor" fillOpacity=".3"/>
        <line x1="8" y1="15" x2="32" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity=".55"/>
        <line x1="8" y1="20" x2="26" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity=".38"/>
        <line x1="8" y1="25" x2="29" y2="25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity=".22"/>
        <path d="M35 17 L38 20 L35 23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity=".6"/>
        <line x1="10" y1="34" x2="30" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity=".2"/>
      </svg>
    )
    case 'POLE_KIOSK': return (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <ellipse cx="20" cy="9" rx="11" ry="3.5" fill="currentColor" fillOpacity=".25" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="9" y="9" width="22" height="17" fill="currentColor" fillOpacity=".08"/>
        <line x1="9" y1="9" x2="9" y2="26" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="31" y1="9" x2="31" y2="26" stroke="currentColor" strokeWidth="1.5"/>
        <ellipse cx="20" cy="26" rx="11" ry="3.5" fill="currentColor" fillOpacity=".18" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="13" y="11" width="14" height="12" rx="1" fill="currentColor" fillOpacity=".2" stroke="currentColor" strokeWidth="1"/>
        <line x1="16" y1="15" x2="24" y2="15" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeOpacity=".5"/>
        <line x1="16" y1="19" x2="22" y2="19" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeOpacity=".4"/>
        <line x1="20" y1="29.5" x2="20" y2="38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    )
    case 'AIRPORT': return (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <path d="M6 24 L22 13 L30 15.5 L23 22 L26 30 L21 27.5 L19 22 L11 26 Z" fill="currentColor" fillOpacity=".2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M13 21.5 L5 28 L9.5 28 L17 24" fill="currentColor" fillOpacity=".15" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
        <line x1="3" y1="36" x2="37" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity=".3"/>
        <rect x="30" y="26" width="7" height="10" rx="1" fill="currentColor" fillOpacity=".15" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="32" y1="29" x2="35" y2="29" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeOpacity=".5"/>
      </svg>
    )
    default: return (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <rect x="5" y="5" width="30" height="30" rx="4" fill="currentColor" fillOpacity=".1" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    )
  }
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
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card group hover-lift" style={{ transition: 'transform 0.28s cubic-bezier(0.16,1,0.3,1), box-shadow 0.28s cubic-bezier(0.16,1,0.3,1)' }}>
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

// ── Filter section wrapper ────────────────────────────────────────────────────
function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full py-3 group"
      >
        <span className="text-[13px] font-bold text-gray-800 tracking-tight">{title}</span>
        <ChevronDown className={cn(
          'w-4 h-4 text-gray-400 transition-transform duration-200 group-hover:text-gray-600',
          open && 'rotate-180'
        )} />
      </button>
      {open && <div className="pb-5">{children}</div>}
      <div className="h-px bg-gray-100" />
    </div>
  )
}

const HOARDING_TYPES = [
  { value: '',              label: 'All Types',   span: true },
  { value: 'BILLBOARD',    label: 'Billboard' },
  { value: 'UNIPOLE',      label: 'Unipole' },
  { value: 'GANTRY',       label: 'Gantry' },
  { value: 'LED_SCREEN',   label: 'LED Screen' },
  { value: 'WALL_PAINTING',label: 'Wall Paint' },
  { value: 'SKYWALK',      label: 'Skywalk' },
  { value: 'BUS_SHELTER',  label: 'Bus Shelter' },
  { value: 'SCROLLING',    label: 'Scrolling' },
  { value: 'POLE_KIOSK',   label: 'Pole Kiosk' },
  { value: 'AIRPORT',      label: 'Airport' },
]

const ADVANTAGES = [
  { value: 'SIGNAL_JUNCTION',          label: 'Signal Junction',  emoji: '🚦' },
  { value: 'PEDESTRIAN_FOOTPATH_ZONE', label: 'Pedestrian Zone',  emoji: '🚶' },
  { value: 'NATIONAL_HIGHWAY_FACING',  label: 'National Highway', emoji: '🛣️' },
  { value: 'NEAR_METRO_STATION',       label: 'Near Metro',       emoji: '🚇' },
  { value: 'NEAR_AIRPORT',             label: 'Near Airport',     emoji: '✈️' },
  { value: 'NEAR_IT_PARK',             label: 'Near IT Park',     emoji: '💻' },
  { value: 'NEAR_SHOPPING_MALL',       label: 'Shopping Mall',    emoji: '🛍️' },
  { value: 'HIGH_VEHICLE_TRAFFIC',     label: 'High Traffic',     emoji: '🚗' },
  { value: 'TOURIST_HERITAGE_AREA',    label: 'Tourist Area',     emoji: '🏛️' },
  { value: 'UPSCALE_NEIGHBOURHOOD',    label: 'Upscale Area',     emoji: '💎' },
  { value: 'NEAR_RAILWAY_STATION',     label: 'Near Railway',     emoji: '🚂' },
  { value: 'IN_MARKET_BAZAAR',         label: 'Market / Bazaar',  emoji: '🏪' },
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
    if (draftFilters.location)    cleaned.location    = draftFilters.location
    if (draftFilters.type)        cleaned.type        = draftFilters.type
    if (draftFilters.minPrice)    cleaned.minPrice    = draftFilters.minPrice
    if (draftFilters.maxPrice)    cleaned.maxPrice    = draftFilters.maxPrice
    if (draftFilters.sortBy)      cleaned.sortBy      = draftFilters.sortBy
    if (draftFilters.city)        cleaned.city        = draftFilters.city
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

  const sortOptions = [
    { value: '',           label: 'Newest' },
    { value: 'price_asc',  label: 'Price ↑' },
    { value: 'price_desc', label: 'Price ↓' },
  ]

  const illumOptions = [
    { value: '',      label: 'Any',       icon: '◐' },
    { value: 'true',  label: 'Lit',       icon: '☀️' },
    { value: 'false', label: 'Non-Lit',   icon: '🌙' },
  ]

  return (
    <div className="pb-28">
      <div className="page-header">
        <h2 className="page-title">Browse Hoardings</h2>
        <p className="page-subtitle">Find the perfect outdoor advertising space</p>
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
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
      <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <button
          onClick={() => setFilterOpen(true)}
          className="pointer-events-auto flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-[13px] tracking-tight active:scale-95 hover:scale-105 pulse-glow"
          style={{
            background: '#C9F31D',
            color: '#111111',
            boxShadow: '0 8px 40px rgba(201,243,29,0.55), 0 2px 12px rgba(0,0,0,0.12)',
            transition: 'transform 0.22s cubic-bezier(0.16,1,0.3,1), box-shadow 0.22s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold"
              style={{ background: '#111', color: '#C9F31D' }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Filter drawer backdrop ───────────────────────────────────────────── */}
      {filterOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          onClick={() => setFilterOpen(false)}
        />
      )}

      {/* ── Filter drawer (bottom sheet) ─────────────────────────────────────── */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out flex flex-col',
          filterOpen ? 'translate-y-0' : 'translate-y-full',
        )}
        style={{ maxHeight: '90vh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab">
          <div className="w-12 h-1.5 rounded-full bg-gray-200" />
        </div>

        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#C9F31D' }}
            >
              <SlidersHorizontal className="w-4.5 h-4.5 text-gray-900" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-[15px] leading-none">Filter Hoardings</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Narrow down to the perfect space</p>
            </div>
          </div>
          <button
            onClick={() => setFilterOpen(false)}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 pt-2 pb-2">

          {/* Sort By */}
          <FilterSection title="Sort By">
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              {sortOptions.map((opt, i) => {
                const active = draftFilters.sortBy === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setDraftFilters(f => ({ ...f, sortBy: opt.value }))}
                    className={cn(
                      'flex-1 py-2.5 text-xs font-bold transition-colors',
                      i > 0 && 'border-l border-gray-200',
                      active ? 'text-gray-900' : 'bg-gray-50 text-gray-500 hover:bg-gray-100',
                    )}
                    style={active ? { background: '#C9F31D' } : {}}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </FilterSection>

          {/* Price Range */}
          <FilterSection title="Price Range (₹/month)">
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold pointer-events-none">₹</span>
                <input
                  type="number"
                  placeholder="Min price"
                  className="input-field w-full pl-7"
                  value={draftFilters.minPrice ?? ''}
                  onChange={e => setDraftFilters(f => ({ ...f, minPrice: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold pointer-events-none">₹</span>
                <input
                  type="number"
                  placeholder="Max price"
                  className="input-field w-full pl-7"
                  value={draftFilters.maxPrice ?? ''}
                  onChange={e => setDraftFilters(f => ({ ...f, maxPrice: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </div>
            </div>
            {/* Quick price chips */}
            <div className="flex flex-wrap gap-2 mt-2.5">
              {[
                { label: 'Under ₹25K',   min: undefined,  max: 25000 },
                { label: '₹25K–₹75K',   min: 25000,      max: 75000 },
                { label: '₹75K–₹2L',    min: 75000,      max: 200000 },
                { label: '₹2L+',         min: 200000,     max: undefined },
              ].map(p => {
                const active = draftFilters.minPrice === p.min && draftFilters.maxPrice === p.max
                return (
                  <button
                    key={p.label}
                    onClick={() => setDraftFilters(f => ({ ...f, minPrice: p.min, maxPrice: p.max }))}
                    className={cn(
                      'text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors',
                      active ? 'border-transparent text-gray-900' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400',
                    )}
                    style={active ? { background: '#C9F31D' } : {}}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </FilterSection>

          {/* Location */}
          <FilterSection title="Location">
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-1.5 block">City</label>
                <select
                  className="input-field w-full"
                  value={draftFilters.city ?? ''}
                  onChange={e => setDraftFilters(f => ({ ...f, city: e.target.value }))}
                >
                  <option value="">All Cities</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Pune">Pune</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-1.5 block">Area Type</label>
                <div className="flex rounded-xl overflow-hidden border border-gray-200">
                  {[
                    { value: '',       label: 'All Areas' },
                    { value: 'URBAN',  label: '🏙️ Urban' },
                    { value: 'LOCAL',  label: '🌿 Local' },
                  ].map((opt, i) => {
                    const active = draftFilters.type === opt.value
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setDraftFilters(f => ({ ...f, type: opt.value }))}
                        className={cn(
                          'flex-1 py-2.5 text-xs font-bold transition-colors',
                          i > 0 && 'border-l border-gray-200',
                          active ? 'text-gray-900' : 'bg-gray-50 text-gray-500 hover:bg-gray-100',
                        )}
                        style={active ? { background: '#C9F31D' } : {}}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </FilterSection>

          {/* Hoarding Type */}
          <FilterSection title="Hoarding Type">
            <div className="grid grid-cols-2 gap-2.5">
              {HOARDING_TYPES.map(opt => {
                const active = draftFilters.holdingType === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setDraftFilters(f => ({ ...f, holdingType: opt.value }))}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-2xl border-2 transition-all duration-150 relative',
                      opt.span && 'col-span-2 flex-row gap-3 py-3',
                      active
                        ? 'border-transparent shadow-sm'
                        : 'bg-white border-gray-150 hover:border-gray-300 hover:shadow-sm',
                    )}
                    style={active
                      ? { background: '#C9F31D', borderColor: '#b8df0e' }
                      : { borderColor: '#e8ecf0' }
                    }
                  >
                    {!opt.span && (
                      <span className={cn('transition-colors', active ? 'text-gray-800' : 'text-gray-400')}>
                        <HoardingTypeIcon type={opt.value} size={36} />
                      </span>
                    )}
                    {opt.span && (
                      <span className={cn('transition-colors', active ? 'text-gray-800' : 'text-gray-400')}>
                        <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
                          <rect x="4" y="8" width="32" height="6" rx="1.5" fill="currentColor" fillOpacity=".3"/>
                          <rect x="4" y="18" width="32" height="6" rx="1.5" fill="currentColor" fillOpacity=".2"/>
                          <rect x="4" y="28" width="32" height="6" rx="1.5" fill="currentColor" fillOpacity=".15"/>
                        </svg>
                      </span>
                    )}
                    <span className={cn(
                      'text-[12px] font-bold leading-tight',
                      active ? 'text-gray-900' : 'text-gray-600',
                    )}>
                      {opt.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </FilterSection>

          {/* Illumination */}
          <FilterSection title="Illumination">
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              {illumOptions.map((opt, i) => {
                const current = draftFilters.isIlluminated === undefined ? '' : String(draftFilters.isIlluminated)
                const active = current === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setDraftFilters(f => ({
                      ...f,
                      isIlluminated: opt.value === '' ? undefined : opt.value === 'true',
                    }))}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-bold transition-colors',
                      i > 0 && 'border-l border-gray-200',
                      active ? 'text-gray-900' : 'bg-gray-50 text-gray-500 hover:bg-gray-100',
                    )}
                    style={active ? { background: '#C9F31D' } : {}}
                  >
                    <span className="text-lg leading-none">{opt.icon}</span>
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </FilterSection>

          {/* Location Advantages */}
          <FilterSection title="Location Advantages" defaultOpen={false}>
            <div className="flex flex-wrap gap-2">
              {ADVANTAGES.map(({ value, label, emoji }) => {
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
                      'flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-xl border-2 transition-all',
                      selected
                        ? 'border-transparent text-gray-900'
                        : 'bg-white text-gray-500 hover:border-gray-300',
                    )}
                    style={selected
                      ? { background: '#C9F31D', borderColor: '#b8df0e' }
                      : { borderColor: '#e8ecf0' }
                    }
                  >
                    <span className="text-sm leading-none">{emoji}</span>
                    {label}
                  </button>
                )
              })}
            </div>
          </FilterSection>

          <div className="h-4" />
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 border-t border-gray-100 px-6 py-4 flex gap-3 bg-white">
          <button
            onClick={handleClear}
            className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="flex-[2] py-3.5 rounded-2xl text-sm font-extrabold transition-all active:scale-[0.98] hover:opacity-90"
            style={{ background: '#C9F31D', color: '#111111' }}
          >
            Apply Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 text-xs bg-black/15 px-2 py-0.5 rounded-full">{activeFilterCount} active</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
