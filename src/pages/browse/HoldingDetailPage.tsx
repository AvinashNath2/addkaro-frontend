import { useState, useMemo, lazy, Suspense, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  MapPin, CheckCircle2, Loader2, ArrowLeft, Heart, MessageCircle,
  Zap, Ruler, TrendingUp, Shield, Sun, Car, Camera,
  Droplets, Eye, Wrench, Calendar, Building2, Tag, PlugZap,
  ChevronDown, ChevronUp, Edit2, Star,
} from 'lucide-react'
import { getHoldingDetail } from '@/api/holdings.api'
import { submitOffer, updateOffer, addToWishlist, removeFromWishlist, checkWishlist } from '@/api/customer.api'
import { useAuthStore } from '@/store/auth.store'
import { makeOfferSchema, type OfferFormData } from '@/lib/schemas/offer.schema'
import StatusBadge from '@/components/ui/StatusBadge'
import ChatBox from '@/components/chat/ChatBox'
import { cn } from '@/lib/utils'
import type { HoldingDetail, CustomerOffer } from '@/types'

function formatRupees(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December']

// ── Collapsible section wrapper ───────────────────────────────────────────────
function Section({
  icon, title, accent = 'brand', children,
}: {
  icon: React.ReactNode
  title: string
  accent?: 'brand' | 'green' | 'purple' | 'orange' | 'sky' | 'rose'
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  const colors: Record<string, string> = {
    brand:  'bg-brand-500/15 text-[#C9F31D]',
    green:  'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    sky:    'bg-sky-50 text-sky-600',
    rose:   'bg-rose-50 text-rose-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', colors[accent])}>
            {icon}
          </span>
          <span className="font-semibold text-gray-900 text-sm">{title}</span>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400" />
          : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5 pt-0">{children}</div>}
    </div>
  )
}

// ── Generic label-value row ────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right max-w-[55%]">{value}</span>
    </div>
  )
}

// ── Yes / No pill ──────────────────────────────────────────────────────────────
function BoolPill({ value }: { value: boolean | null }) {
  if (value === null || value === undefined) return null
  return (
    <span className={cn(
      'text-xs font-semibold px-2.5 py-0.5 rounded-full',
      value ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500',
    )}>
      {value ? 'Yes' : 'No'}
    </span>
  )
}

// ── Amenities icon-grid ───────────────────────────────────────────────────────
const AMENITY_DEFS = [
  { key: 'electricityAvailable', label: 'Electricity', Icon: PlugZap },
  { key: 'ladderAccess',         label: 'Ladder Access', Icon: Wrench },
  { key: 'onSiteWatchman',       label: 'Watchman',     Icon: Eye },
  { key: 'nearbyParking',        label: 'Parking',      Icon: Car },
  { key: 'cctvInstalled',        label: 'CCTV',         Icon: Camera },
  { key: 'waterAvailable',       label: 'Water',        Icon: Droplets },
] as const

function AmenitiesGrid({ amenities }: { amenities: HoldingDetail['amenities'] }) {
  if (!amenities) return null
  return (
    <div className="grid grid-cols-3 gap-2 pt-1">
      {AMENITY_DEFS.map(({ key, label, Icon }) => {
        const val = amenities[key as keyof typeof amenities] as boolean | null
        const active = val === true
        return (
          <div
            key={key}
            className={cn(
              'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center transition-colors',
              active
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-gray-50 border-gray-100 opacity-50',
            )}
          >
            <Icon className={cn('w-4 h-4', active ? 'text-emerald-500' : 'text-gray-400')} />
            <span className={cn('text-[11px] font-medium', active ? 'text-emerald-600' : 'text-gray-400')}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Location advantages chips ──────────────────────────────────────────────────
const ADV_COLORS: Record<string, string> = {
  NATIONAL_HIGHWAY_FACING: 'bg-blue-50 text-blue-700',
  STATE_HIGHWAY_FACING:    'bg-blue-50 text-blue-700',
  MAIN_CITY_ROAD:          'bg-blue-50 text-blue-700',
  SIGNAL_JUNCTION:         'bg-amber-50 text-amber-700',
  FLYOVER_APPROACH:        'bg-amber-50 text-amber-700',
  NEAR_METRO_STATION:      'bg-purple-50 text-purple-700',
  NEAR_RAILWAY_STATION:    'bg-purple-50 text-purple-700',
  NEAR_BUS_STAND:          'bg-purple-50 text-purple-700',
  NEAR_AIRPORT:            'bg-purple-50 text-purple-700',
  HIGH_VEHICLE_TRAFFIC:    'bg-orange-50 text-orange-700',
  PEDESTRIAN_FOOTPATH_ZONE:'bg-orange-50 text-orange-700',
  NEAR_SHOPPING_MALL:      'bg-pink-50 text-pink-700',
  IN_MARKET_BAZAAR:        'bg-pink-50 text-pink-700',
  NEAR_IT_PARK:            'bg-sky-50 text-sky-700',
  NEAR_INDUSTRIAL_AREA:    'bg-sky-50 text-sky-700',
  UPSCALE_NEIGHBOURHOOD:   'bg-emerald-50 text-emerald-700',
  TOURIST_HERITAGE_AREA:   'bg-teal-50 text-teal-700',
}
function advColor(adv: string) { return ADV_COLORS[adv] ?? 'bg-gray-100 text-gray-500' }

// ── Pricing discount pills ─────────────────────────────────────────────────────
function DiscountPill({ label, pct }: { label: string; pct: number | null | undefined }) {
  if (!pct) return null
  return (
    <div className="flex flex-col items-center bg-emerald-50 border border-emerald-200 rounded-xl py-3 px-2 text-center">
      <span className="text-xl font-extrabold text-emerald-600">{pct}%</span>
      <span className="text-[11px] text-emerald-500 mt-0.5">{label}</span>
    </div>
  )
}

// ── Lazy map ───────────────────────────────────────────────────────────────────
const HoldingMap = lazy(() => import('@/components/browse/HoldingMap'))

function LocationMap({ lat, lng, title }: { lat: number; lng: number; title: string }) {
  return (
    <Section icon={<MapPin className="w-4 h-4" />} title="Location on Map" accent="sky">
      <div className="mt-1 rounded-xl overflow-hidden border border-gray-100" style={{ height: 220 }}>
        <Suspense fallback={
          <div className="h-full flex items-center justify-center bg-gray-50 text-xs text-gray-400">
            Loading map…
          </div>
        }>
          <HoldingMap lat={lat} lng={lng} title={title} />
        </Suspense>
      </div>
      <p className="text-[11px] text-gray-400 mt-1.5 text-center">
        {lat.toFixed(5)}, {lng.toFixed(5)}
      </p>
    </Section>
  )
}

// ── Availability calendar ──────────────────────────────────────────────────────
function AvailabilityCalendar({ availability }: { availability: string }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  function buildGrid(year: number, month: number): (Date | null)[] {
    const firstDay = new Date(year, month, 1).getDay()
    const days = new Date(year, month + 1, 0).getDate()
    const cells: (Date | null)[] = Array(firstDay).fill(null)
    for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d))
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }
  function dayClass(date: Date | null) {
    if (!date) return ''
    if (date < today) return 'text-gray-300 text-[10px]'
    if (date.toDateString() === today.toDateString())
      return 'bg-[#C9F31D] text-[#111111] rounded font-semibold text-[10px]'
    if (availability === 'BOOKED')   return 'bg-red-100 text-red-500 rounded font-bold text-[10px]'
    if (availability === 'AVAILABLE') return 'bg-emerald-100 text-emerald-600 rounded text-[10px]'
    return 'bg-amber-100 text-amber-600 rounded text-[10px]'
  }
  const isBooked = availability === 'BOOKED'
  const isAvail  = availability === 'AVAILABLE'
  return (
    <Section icon={<Calendar className="w-4 h-4" />} title="Availability — Next 6 Months" accent="green">
      <div className="flex items-center gap-3 text-xs mb-3 mt-1">
        <span className={cn('font-medium px-2.5 py-0.5 rounded-full text-xs',
          isAvail ? 'bg-emerald-50 text-emerald-700' : isBooked ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
        )}>
          {isAvail ? 'Open for Booking' : isBooked ? 'Currently Booked' : 'Partially Available'}
        </span>
        <span className="flex items-center gap-1 text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-300 inline-block"/>Free</span>
        <span className="flex items-center gap-1 text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-red-300 inline-block"/>Booked</span>
      </div>
      <div className="grid grid-cols-3 gap-x-4 gap-y-4">
        {months.map(({ year, month }) => {
          const cells = buildGrid(year, month)
          return (
            <div key={`${year}-${month}`}>
              <p className="text-[10px] font-bold text-gray-500 text-center mb-1 uppercase tracking-wide">
                {MONTH_NAMES[month].slice(0,3)} {year}
              </p>
              <div className="grid grid-cols-7 gap-px">
                {['S','M','T','W','T','F','S'].map((d, i) => (
                  <div key={i} className="text-[9px] text-gray-400 text-center pb-0.5">{d}</div>
                ))}
                {cells.map((date, i) => (
                  <div key={i} className="flex items-center justify-center h-[18px]">
                    {date && (
                      <span className={`w-[18px] h-[18px] flex items-center justify-center ${dayClass(date)}`}>
                        {date.getDate()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

// ── All detail sections ────────────────────────────────────────────────────────
function HoldingSections({ holding }: { holding: HoldingDetail }) {
  const { address, typeSpecs, illumination, amenities, audience, pricing, legal, locationAdvantages, previousAdvertisers } = holding

  return (
    <div className="space-y-3">

      {/* Location advantages */}
      {locationAdvantages && locationAdvantages.length > 0 && (
        <Section icon={<MapPin className="w-4 h-4" />} title="Location Advantages" accent="orange">
          <div className="flex flex-wrap gap-2 pt-1">
            {locationAdvantages.map((adv) => (
              <span key={adv} className={cn('text-xs font-medium px-3 py-1 rounded-full', advColor(adv))}>
                {adv.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Address */}
      {address && (
        <Section icon={<Building2 className="w-4 h-4" />} title="Address & Location" accent="brand">
          {address.landmark && (
            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3 italic">
              📍 Near {address.landmark}
            </p>
          )}
          <InfoRow label="Street"   value={address.street} />
          <InfoRow label="Area"     value={address.area} />
          <InfoRow label="City"     value={address.city} />
          <InfoRow label="State"    value={address.state} />
          <InfoRow label="PIN Code" value={address.pinCode} />
        </Section>
      )}

      {/* Type specs */}
      {typeSpecs && (
        <Section icon={<Ruler className="w-4 h-4" />} title="Hoarding Specifications" accent="purple">
          <InfoRow label="Type"              value={typeSpecs.holdingType?.replace(/_/g, ' ')} />
          <InfoRow label="Faces"             value={typeSpecs.numFaces} />
          <InfoRow label="Display Tech"      value={typeSpecs.displayTechnology?.replace(/_/g, ' ')} />
          <InfoRow label="Printable Area"    value={typeSpecs.printableAreaSqft ? `${typeSpecs.printableAreaSqft} sqft` : null} />
          <InfoRow label="Facing Direction"  value={typeSpecs.facingDirection} />
          <InfoRow label="Mounting Height"   value={typeSpecs.mountingHeightFt ? `${typeSpecs.mountingHeightFt} ft` : null} />
        </Section>
      )}

      {/* Illumination */}
      {illumination && (illumination.illuminationType || illumination.illuminationHours) && (
        <Section icon={<Sun className="w-4 h-4" />} title="Illumination" accent="orange">
          <InfoRow label="Type"  value={illumination.illuminationType?.replace(/_/g, ' ')} />
          <InfoRow label="Hours" value={illumination.illuminationHours?.replace(/_/g, ' ')} />
        </Section>
      )}

      {/* Audience & traffic */}
      {audience && (
        <Section icon={<TrendingUp className="w-4 h-4" />} title="Audience & Traffic" accent="sky">
          <div className="grid grid-cols-2 gap-3 pt-1">
            {audience.dailyVehiclesRange && (
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wide text-sky-600 mb-1">Daily Vehicles</p>
                <p className="text-sm font-bold text-sky-700">
                  {audience.dailyVehiclesRange.replace(/_/g, ' – ')}
                </p>
              </div>
            )}
            {audience.dailyFootfallRange && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wide text-purple-600 mb-1">Daily Footfall</p>
                <p className="text-sm font-bold text-purple-700">
                  {audience.dailyFootfallRange.replace(/_/g, ' – ')}
                </p>
              </div>
            )}
          </div>
          {audience.trafficDataSource && (
            <p className="text-[11px] text-gray-400 mt-2 text-center">
              Source: {audience.trafficDataSource.replace(/_/g, ' ')}
            </p>
          )}
        </Section>
      )}

      {/* Pricing */}
      {pricing && (
        <Section icon={<Tag className="w-4 h-4" />} title="Pricing & Discounts" accent="green">
          {/* Discount trio */}
          {(pricing.quarterlyDiscountPct || pricing.halfYearlyDiscountPct || pricing.yearlyDiscountPct) && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              <DiscountPill label="Quarterly"   pct={pricing.quarterlyDiscountPct} />
              <DiscountPill label="Half-Yearly" pct={pricing.halfYearlyDiscountPct} />
              <DiscountPill label="Yearly"      pct={pricing.yearlyDiscountPct} />
            </div>
          )}
          <InfoRow label="Min. Booking"      value={pricing.minimumBookingMonths ? `${pricing.minimumBookingMonths} month${pricing.minimumBookingMonths > 1 ? 's' : ''}` : null} />
          <InfoRow label="Security Deposit"  value={<BoolPill value={pricing.securityDepositRequired} />} />
          <InfoRow label="Deposit Range"     value={pricing.securityDepositRange?.replace(/_/g, ' – ')} />
          <InfoRow label="Installation Cost" value={pricing.installationCostRange?.replace(/_/g, ' – ')} />
        </Section>
      )}

      {/* Amenities */}
      {amenities && (
        <Section icon={<Zap className="w-4 h-4" />} title="Amenities & Features" accent="brand">
          {amenities.powerSupplyType && (
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3">
              Power: <span className="font-medium text-gray-900">{amenities.powerSupplyType.replace(/_/g, ' ')}</span>
            </p>
          )}
          <AmenitiesGrid amenities={amenities} />
        </Section>
      )}

      {/* Legal */}
      {legal && (
        <Section icon={<Shield className="w-4 h-4" />} title="Legal & Permits" accent="rose">
          <div className="flex items-center gap-2 mb-3 mt-1">
            {legal.permitStatus && (
              <span className={cn('text-xs font-bold px-3 py-1 rounded-full',
                legal.permitStatus === 'YES'     ? 'bg-emerald-50 text-emerald-700' :
                legal.permitStatus === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                                                   'bg-red-50 text-red-700'
              )}>
                Permit: {legal.permitStatus}
              </span>
            )}
            {legal.nocFromAuthority && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">
                NOC Obtained
              </span>
            )}
          </div>
          <InfoRow label="Permit No."   value={legal.permitNumber} />
          <InfoRow label="Valid Till"   value={legal.permitValidTill} />
        </Section>
      )}

      {/* Previous Advertisers */}
      {previousAdvertisers && previousAdvertisers.length > 0 && (
        <Section icon={<Star className="w-4 h-4" />} title="Previous Advertisers" accent="purple">
          <div className="space-y-3 pt-1">
            {previousAdvertisers.map((adv) => (
              <div key={adv.id} className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-purple-900">{adv.brandName}</p>
                {adv.description && (
                  <p className="text-xs text-purple-600 mt-0.5">{adv.description}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function HoldingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  // State passed from MyOffersPage when viewing/editing an existing offer
  const locationState = (location.state ?? {}) as {
    existingOffer?: CustomerOffer
    editOffer?: CustomerOffer
  }
  const viewOffer = locationState.existingOffer ?? null
  const editOffer = locationState.editOffer ?? null

  const [submittedOfferId, setSubmittedOfferId] = useState<string | null>(null)
  const [chatOpen, setChatOpen] = useState(false)

  const { data: holding, isLoading, isError } = useQuery({
    queryKey: ['holding', id],
    queryFn: () => getHoldingDetail(id!),
    enabled: !!id,
  })

  const { data: wishlistStatus } = useQuery({
    queryKey: ['wishlist-check', id],
    queryFn: () => checkWishlist(id!),
    enabled: !!id && !!user && user.role.toUpperCase() === 'CUSTOMER',
  })

  const isSaved = wishlistStatus?.saved ?? false

  const wishlistMutation = useMutation({
    mutationFn: () => isSaved ? removeFromWishlist(id!) : addToWishlist(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-check', id] })
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })

  // Dynamic schema: duration must be a multiple of minBookingMonths * 30 days
  const minBookingDays = useMemo(
    () => Math.max(1, (holding?.pricing?.minimumBookingMonths ?? 1) * 30),
    [holding?.pricing?.minimumBookingMonths]
  )
  const dynamicOfferSchema = useMemo(() => makeOfferSchema(minBookingDays), [minBookingDays])

  const tomorrowStr = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }, [])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<OfferFormData>({
    resolver: zodResolver(dynamicOfferSchema),
  })

  // Pre-fill form when editing an existing offer
  useEffect(() => {
    if (editOffer) {
      reset({
        offeredPrice: editOffer.offeredPrice,
        desiredStartDate: editOffer.desiredStartDate ?? '',
        desiredDuration: editOffer.desiredDuration ?? minBookingDays,
        message: editOffer.message ?? '',
        contactNumber: editOffer.contactNumber ?? '',
      })
    }
  }, [editOffer, reset, minBookingDays])

  const invalidateOffers = () => {
    queryClient.invalidateQueries({ queryKey: ['my-offers'] })
  }

  const offerMutation = useMutation({
    mutationFn: (data: OfferFormData) => submitOffer(id!, {
      offeredPrice: data.offeredPrice,
      contactNumber: data.contactNumber,
      desiredStartDate: data.desiredStartDate || undefined,
      desiredDuration: Number(data.desiredDuration),
      message: data.message || undefined,
    }),
    onSuccess: (data) => {
      setSubmittedOfferId(data.offerId)
      reset()
      invalidateOffers()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: OfferFormData) => updateOffer(editOffer!.offerId, {
      offeredPrice: data.offeredPrice,
      contactNumber: data.contactNumber,
      desiredStartDate: data.desiredStartDate || undefined,
      desiredDuration: Number(data.desiredDuration),
      message: data.message || undefined,
    }),
    onSuccess: () => {
      setSubmittedOfferId(editOffer!.offerId)
      invalidateOffers()
    },
  })

  const handleFormSubmit = (data: OfferFormData) => {
    if (editOffer) updateMutation.mutate(data)
    else offerMutation.mutate(data)
  }

  const activeMutation = editOffer ? updateMutation : offerMutation

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 animate-spin text-[#C9F31D]" />
    </div>
  )

  if (isError || !holding) return (
    <div className="text-center py-24">
      <p className="text-gray-500">Failed to load listing details.</p>
      <button onClick={() => navigate('/browse')} className="mt-4 text-gray-900 font-medium text-sm hover:underline">
        Back to Browse
      </button>
    </div>
  )

  const isCustomer = user?.role.toUpperCase() === 'CUSTOMER'

  return (
    <div>
      {/* Back nav */}
      <button
        onClick={() => navigate('/browse')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Browse
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* ── Hero photo card ─────────────────────────────────────────── */}
          <div className="relative rounded-2xl overflow-hidden shadow-md bg-gray-100">
            {holding.photos.length > 0 ? (
              <img
                src={holding.photos[0]}
                alt={holding.title}
                className="w-full h-72 object-cover opacity-90"
              />
            ) : (
              <div className="h-72 flex items-center justify-center">
                <Building2 className="w-20 h-20 text-gray-400" />
              </div>
            )}

            {/* Gradient overlay with title */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white leading-tight drop-shadow">
                    {holding.title}
                  </h2>
                  <p className="flex items-center gap-1 text-white/80 text-sm mt-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {holding.location}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <StatusBadge status={holding.status} />
                  {holding.ownerVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/90 text-white">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Thumbnail strip */}
            {holding.photos.length > 1 && (
              <div className="absolute top-3 right-3 flex gap-1.5">
                {holding.photos.slice(1, 4).map((url, i) => (
                  <img key={i} src={url} alt="" className="w-12 h-12 object-cover rounded-lg border-2 border-white/60 shadow" />
                ))}
              </div>
            )}
          </div>

          {/* ── Key facts strip ─────────────────────────────────────────── */}
          <div className="overflow-x-auto pb-0.5">
            <div className="flex gap-3 min-w-max">
              {/* Size */}
              <div className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center">
                  <Ruler className="w-4 h-4 text-[#C9F31D]" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Size</p>
                  <p className="text-sm font-semibold text-gray-900">{holding.width} × {holding.height} ft</p>
                </div>
              </div>

              {/* Rate */}
              <div className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Monthly Rate</p>
                  <p className="text-sm font-semibold text-emerald-600">{formatRupees(holding.rentalCost)}</p>
                </div>
              </div>

              {/* Location type */}
              <div className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-sky-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Location</p>
                  <p className="text-sm font-semibold text-gray-900">{holding.locationType}</p>
                </div>
              </div>

              {/* Holding type */}
              {holding.typeSpecs?.holdingType && (
                <div className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Format</p>
                    <p className="text-sm font-semibold text-gray-900">{holding.typeSpecs.holdingType.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              )}

              {/* Illuminated */}
              {holding.illumination?.isIlluminated !== undefined && (
                <div className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center',
                    holding.illumination.isIlluminated ? 'bg-amber-50' : 'bg-gray-50'
                  )}>
                    <Zap className={cn('w-4 h-4', holding.illumination.isIlluminated ? 'text-amber-500' : 'text-gray-400')} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Illuminated</p>
                    <p className={cn('text-sm font-semibold', holding.illumination.isIlluminated ? 'text-amber-600' : 'text-gray-400')}>
                      {holding.illumination.isIlluminated ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              )}

              {/* Min booking */}
              {holding.pricing?.minimumBookingMonths && (
                <div className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Min. Booking</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {holding.pricing.minimumBookingMonths} mo
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Detail sections ──────────────────────────────────────────── */}
          <HoldingSections holding={holding} />

          {/* ── Map ─────────────────────────────────────────────────────── */}
          {holding.coordinates?.latitude && holding.coordinates?.longitude && (
            <LocationMap
              lat={holding.coordinates.latitude}
              lng={holding.coordinates.longitude}
              title={holding.title}
            />
          )}

          {/* ── Availability calendar ────────────────────────────────────── */}
          <AvailabilityCalendar availability={holding.availability} />
        </div>

        {/* ── Right column: sticky offer panel ────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-3">

            {/* Price card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 text-center" style={{ background: 'linear-gradient(135deg, #C9F31D 0%, #a8cc0f 100%)' }}>
                <p className="text-3xl font-extrabold tracking-tight" style={{ color: '#111111' }}>
                  {formatRupees(holding.rentalCost)}
                </p>
                <p className="text-sm mt-0.5" style={{ color: '#333' }}>per month</p>
                {holding.pricing?.minimumBookingMonths && holding.pricing.minimumBookingMonths > 1 && (
                  <p className="text-xs mt-1" style={{ color: '#444' }}>
                    Minimum {holding.pricing.minimumBookingMonths} months
                  </p>
                )}
              </div>

              <div className="p-4 space-y-3">
                {/* Wishlist */}
                {isCustomer && (
                  <button
                    onClick={() => wishlistMutation.mutate()}
                    disabled={wishlistMutation.isPending}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                      isSaved
                        ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50',
                    )}
                  >
                    <Heart className={cn('w-4 h-4', isSaved && 'fill-red-500 text-red-500')} />
                    {isSaved ? 'Saved to Wishlist' : 'Save to Wishlist'}
                  </button>
                )}

                {/* Not logged in */}
                {!user && (
                  <div className="text-center py-3">
                    <p className="text-sm text-gray-500 mb-3">Sign in to submit an offer</p>
                    <button onClick={() => navigate('/login')} className="btn-primary">Sign In</button>
                  </div>
                )}

                {/* Non-customer */}
                {user && !isCustomer && (
                  <p className="text-center text-sm text-gray-500 py-2">Only customers can submit offers.</p>
                )}

                {isCustomer && (
                  <>
                    {/* Chat panel overlay */}
                    {chatOpen && submittedOfferId && (
                      <ChatBox
                        offerId={submittedOfferId}
                        offerLabel={`Chat — ${holding.title}`}
                        onClose={() => setChatOpen(false)}
                      />
                    )}

                    {/* SUCCESS: offer submitted or updated */}
                    {submittedOfferId && (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 mb-1">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          {editOffer ? 'Offer Updated!' : 'Offer Submitted!'}
                        </div>
                        <p className="text-xs text-emerald-600 mb-3">
                          Your offer is with the owner. Start a chat to discuss details.
                        </p>
                        <button
                          onClick={() => setChatOpen(true)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors"
                          style={{ background: '#C9F31D', color: '#111111' }}
                        >
                          <MessageCircle className="w-4 h-4" />
                          Chat with Owner
                        </button>
                      </div>
                    )}

                    {/* VIEW MODE: read-only existing offer (from My Offers → View Listing) */}
                    {!submittedOfferId && viewOffer && (
                      <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Your Existing Offer</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Offered Price</span>
                            <span className="font-semibold text-gray-900">{formatRupees(viewOffer.offeredPrice)}/mo</span>
                          </div>
                          {viewOffer.desiredDuration && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Duration</span>
                              <span className="text-gray-900">{viewOffer.desiredDuration} days</span>
                            </div>
                          )}
                          {viewOffer.desiredStartDate && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Start Date</span>
                              <span className="text-gray-900">{new Date(viewOffer.desiredStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </div>
                          )}
                          {viewOffer.contactNumber && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Contact</span>
                              <span className="text-gray-900">{viewOffer.contactNumber}</span>
                            </div>
                          )}
                          {viewOffer.message && (
                            <p className="text-xs text-gray-500 italic bg-white border border-gray-100 rounded-lg px-3 py-2 mt-1">"{viewOffer.message}"</p>
                          )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                          <StatusBadge status={viewOffer.status} />
                          <span className="text-[10px] text-gray-400">
                            {new Date(viewOffer.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        {viewOffer.status === 'NEW' && (
                          <p className="text-[10px] text-gray-400 mt-2 text-center">
                            To edit, go to My Offers → Edit Offer
                          </p>
                        )}
                      </div>
                    )}

                    {/* FORM MODE: new offer or edit existing */}
                    {!submittedOfferId && !viewOffer && (
                      <>
                        {/* Booked notice (only for fresh new offers, not edit) */}
                        {!editOffer && holding.availability !== 'AVAILABLE' && (
                          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-center">
                            <p className="text-sm font-semibold text-red-700">
                              {holding.availability === 'BOOKED' ? 'Currently Booked' : 'Partially Available'}
                            </p>
                            <p className="text-xs text-red-500 mt-1">
                              {holding.availability === 'BOOKED'
                                ? 'This space is booked. Check back later.'
                                : 'Contact the owner to check available dates.'}
                            </p>
                          </div>
                        )}

                        {/* Offer form — shown for edit mode always, or new offer when available */}
                        {(editOffer || holding.availability === 'AVAILABLE') && (
                          <>
                            {/* Edit mode banner */}
                            {editOffer && (
                              <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-2.5 flex items-center gap-2">
                                <Edit2 className="w-4 h-4 text-blue-600 shrink-0" />
                                <p className="text-xs font-medium text-blue-700">Editing your existing offer</p>
                              </div>
                            )}

                            <h3 className="font-semibold text-gray-900 text-sm pt-1">
                              {editOffer ? 'Update Your Offer' : 'Submit an Offer'}
                            </h3>

                            <form
                              onSubmit={handleSubmit(handleFormSubmit)}
                              noValidate
                              className="space-y-3"
                            >
                              <div>
                                <label className="label">Offered Price (₹/month)</label>
                                <input
                                  type="number"
                                  placeholder={`e.g. ${holding.rentalCost}`}
                                  className={cn('input-field', errors.offeredPrice && 'input-error')}
                                  {...register('offeredPrice')}
                                />
                                {errors.offeredPrice && <p className="error-text">{errors.offeredPrice.message}</p>}
                              </div>

                              <div>
                                <label className="label">Your Contact Number</label>
                                <input
                                  type="tel"
                                  placeholder="10-digit mobile"
                                  maxLength={10}
                                  className={cn('input-field', errors.contactNumber && 'input-error')}
                                  {...register('contactNumber')}
                                />
                                {errors.contactNumber && <p className="error-text">{errors.contactNumber.message}</p>}
                              </div>

                              <div>
                                <label className="label">Start Date</label>
                                <input
                                  type="date"
                                  min={tomorrowStr}
                                  className={cn('input-field', errors.desiredStartDate && 'input-error')}
                                  {...register('desiredStartDate')}
                                />
                                {errors.desiredStartDate
                                  ? <p className="error-text">{errors.desiredStartDate.message}</p>
                                  : <p className="text-[10px] text-gray-400 mt-1">Must be a future date</p>
                                }
                              </div>

                              <div>
                                <label className="label">Duration in Days</label>
                                <input
                                  type="number"
                                  placeholder={`e.g. ${minBookingDays}`}
                                  className={cn('input-field', errors.desiredDuration && 'input-error')}
                                  {...register('desiredDuration')}
                                />
                                {errors.desiredDuration
                                  ? <p className="error-text">{errors.desiredDuration.message}</p>
                                  : <p className="text-[10px] text-gray-400 mt-1">
                                      Min {minBookingDays} days · must be a multiple of {minBookingDays}
                                      {minBookingDays > 1 && ` (e.g. ${minBookingDays}, ${minBookingDays * 2}, ${minBookingDays * 3})`}
                                    </p>
                                }
                              </div>

                              <div>
                                <label className="label">Message (optional)</label>
                                <textarea
                                  placeholder="Tell the owner about your campaign…"
                                  rows={3}
                                  className="input-field resize-none"
                                  {...register('message')}
                                />
                              </div>

                              {activeMutation.isError && (
                                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                                  {activeMutation.error.message}
                                </div>
                              )}

                              <button type="submit" disabled={activeMutation.isPending} className="btn-primary">
                                {activeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                {activeMutation.isPending
                                  ? (editOffer ? 'Updating…' : 'Submitting…')
                                  : (editOffer ? 'Update Offer' : 'Submit Offer')
                                }
                              </button>
                            </form>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Owner type badge */}
            {holding.ownerType && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-xs text-gray-500">
                  Owner: <span className="font-semibold text-gray-900">{holding.ownerType}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
