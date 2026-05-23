// HoldingDetailPage.tsx — full detail view for a single hoarding
//
// URL: /holdings/:id  (the :id is pulled out using useParams)
//
// Left 2/3: photo gallery + holding specifications
// Right 1/3: sticky "Submit Offer" card with a form
//
// The offer form is inline on the page (not a modal) so the user can see
// the holding details while filling in their offer.

import { useState, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin, CheckCircle2, Loader2, ArrowLeft, Heart, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { getHoldingDetail } from '@/api/holdings.api'
import { submitOffer, addToWishlist, removeFromWishlist, checkWishlist } from '@/api/customer.api'
import { useAuthStore } from '@/store/auth.store'
import { offerSchema, type OfferFormData } from '@/lib/schemas/offer.schema'
import StatusBadge from '@/components/ui/StatusBadge'
import ChatBox from '@/components/chat/ChatBox'
import { cn } from '@/lib/utils'
import type { HoldingDetail } from '@/types'

function formatRupees(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December']

// ── Section accordion panel ────────────────────────────────────────────────
function SectionPanel({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900 text-sm">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-6 pb-5 pt-1">{children}</div>}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500 uppercase tracking-wide w-1/2 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-right">{value}</span>
    </div>
  )
}

function BoolBadge({ value }: { value: boolean | null }) {
  if (value === null) return null
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
      {value ? 'Yes' : 'No'}
    </span>
  )
}

function HoldingSections({ holding }: { holding: HoldingDetail }) {
  const { address, typeSpecs, illumination, amenities, audience, pricing, legal, locationAdvantages } = holding

  return (
    <div className="space-y-4">
      {/* Location Advantages */}
      {locationAdvantages && locationAdvantages.length > 0 && (
        <SectionPanel title="Location Advantages">
          <div className="flex flex-wrap gap-2 pt-1">
            {locationAdvantages.map((adv) => (
              <span key={adv} className="text-xs font-medium bg-brand-50 text-brand-700 px-2.5 py-1 rounded-lg">
                {adv.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </SectionPanel>
      )}

      {/* Address */}
      {address && (
        <SectionPanel title="Address & Location">
          <InfoRow label="Street" value={address.street} />
          <InfoRow label="Area" value={address.area} />
          <InfoRow label="City" value={address.city} />
          <InfoRow label="State" value={address.state} />
          <InfoRow label="PIN Code" value={address.pinCode} />
          <InfoRow label="Landmark" value={address.landmark} />
        </SectionPanel>
      )}

      {/* Type Specifications */}
      {typeSpecs && (
        <SectionPanel title="Type & Specifications">
          <InfoRow label="Holding Type" value={typeSpecs.holdingType} />
          <InfoRow label="Number of Faces" value={typeSpecs.numFaces} />
          <InfoRow label="Display Technology" value={typeSpecs.displayTechnology} />
          <InfoRow label="Printable Area" value={typeSpecs.printableAreaSqft ? `${typeSpecs.printableAreaSqft} sqft` : null} />
          <InfoRow label="Facing Direction" value={typeSpecs.facingDirection} />
          <InfoRow label="Mounting Height" value={typeSpecs.mountingHeightFt ? `${typeSpecs.mountingHeightFt} ft` : null} />
        </SectionPanel>
      )}

      {/* Illumination */}
      {illumination && (
        <SectionPanel title="Illumination">
          <InfoRow label="Type" value={illumination.illuminationType} />
          <InfoRow label="Hours" value={illumination.illuminationHours} />
        </SectionPanel>
      )}

      {/* Audience */}
      {audience && (
        <SectionPanel title="Audience & Traffic">
          <InfoRow label="Daily Vehicles" value={audience.dailyVehiclesRange} />
          <InfoRow label="Daily Footfall" value={audience.dailyFootfallRange} />
          <InfoRow label="Traffic Data Source" value={audience.trafficDataSource} />
        </SectionPanel>
      )}

      {/* Pricing */}
      {pricing && (
        <SectionPanel title="Pricing Details">
          <InfoRow label="Monthly Rate" value={pricing.monthlyRate ? `₹${pricing.monthlyRate.toLocaleString('en-IN')}` : null} />
          <InfoRow label="Min. Booking" value={pricing.minimumBookingMonths ? `${pricing.minimumBookingMonths} month${pricing.minimumBookingMonths > 1 ? 's' : ''}` : null} />
          <InfoRow label="Quarterly Discount" value={pricing.quarterlyDiscountPct ? `${pricing.quarterlyDiscountPct}%` : null} />
          <InfoRow label="Half-Yearly Discount" value={pricing.halfYearlyDiscountPct ? `${pricing.halfYearlyDiscountPct}%` : null} />
          <InfoRow label="Yearly Discount" value={pricing.yearlyDiscountPct ? `${pricing.yearlyDiscountPct}%` : null} />
          <InfoRow label="Security Deposit" value={<BoolBadge value={pricing.securityDepositRequired} />} />
          <InfoRow label="Deposit Range" value={pricing.securityDepositRange} />
          <InfoRow label="Installation Cost" value={pricing.installationCostRange} />
        </SectionPanel>
      )}

      {/* Amenities */}
      {amenities && (
        <SectionPanel title="Amenities & Features">
          <div className="grid grid-cols-2 gap-x-4">
            <InfoRow label="Electricity" value={<BoolBadge value={amenities.electricityAvailable} />} />
            <InfoRow label="Power Supply" value={amenities.powerSupplyType?.replace(/_/g, ' ')} />
            <InfoRow label="Ladder Access" value={<BoolBadge value={amenities.ladderAccess} />} />
            <InfoRow label="On-site Watchman" value={<BoolBadge value={amenities.onSiteWatchman} />} />
            <InfoRow label="Nearby Parking" value={<BoolBadge value={amenities.nearbyParking} />} />
            <InfoRow label="CCTV" value={<BoolBadge value={amenities.cctvInstalled} />} />
            <InfoRow label="Water Available" value={<BoolBadge value={amenities.waterAvailable} />} />
          </div>
        </SectionPanel>
      )}

      {/* Legal */}
      {legal && (
        <SectionPanel title="Legal & Permits">
          <InfoRow label="Permit Status" value={legal.permitStatus} />
          <InfoRow label="Permit Number" value={legal.permitNumber} />
          <InfoRow label="Valid Till" value={legal.permitValidTill} />
          <InfoRow label="NOC from Authority" value={<BoolBadge value={legal.nocFromAuthority} />} />
        </SectionPanel>
      )}
    </div>
  )
}

// ── Location map — lazy-loaded so leaflet tiles don't block the initial render ─
const HoldingMap = lazy(() => import('@/components/browse/HoldingMap'))

function HoldingLocationMap({ lat, lng, title }: { lat: number; lng: number; title: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 pt-3 pb-2">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-brand-600" />
          Location
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      </div>
      <div style={{ height: 220 }}>
        <Suspense fallback={
          <div className="h-full flex items-center justify-center bg-gray-50 text-xs text-gray-400">
            Loading map…
          </div>
        }>
          <HoldingMap lat={lat} lng={lng} title={title} />
        </Suspense>
      </div>
    </div>
  )
}

function AvailabilityCalendar({ availability }: { availability: string }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 6 months starting from the current month
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  function buildMonthGrid(year: number, month: number): (Date | null)[] {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (Date | null)[] = Array(firstDay).fill(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }

  function dayClass(date: Date | null): string {
    if (!date) return ''
    if (date < today) return 'text-gray-300 text-[10px]'
    if (date.toDateString() === today.toDateString())
      return 'bg-brand-600 text-white rounded font-semibold text-[10px]'
    if (availability === 'BOOKED')
      return 'bg-red-100 text-red-700 rounded font-bold text-[10px]'
    if (availability === 'AVAILABLE')
      return 'bg-green-100 text-green-700 rounded text-[10px]'
    // PARTIAL
    return 'bg-yellow-100 text-yellow-700 rounded text-[10px]'
  }

  const isBooked = availability === 'BOOKED'
  const isAvailable = availability === 'AVAILABLE'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">Availability — Next 6 Months</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {isAvailable
              ? 'Open for booking'
              : isBooked
              ? 'Currently booked — not available'
              : 'Partially available — contact owner for exact dates'}
          </p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 text-xs shrink-0">
          <span className="flex items-center gap-1 text-gray-500">
            <span className="w-3 h-3 rounded-sm bg-green-200 inline-block" />
            Free
          </span>
          <span className="flex items-center gap-1 text-gray-500">
            <span className="w-3 h-3 rounded-sm bg-red-200 inline-block" />
            Booked
          </span>
          <span className="flex items-center gap-1 text-gray-500">
            <span className="w-3 h-3 rounded-sm bg-brand-500 inline-block" />
            Today
          </span>
        </div>
      </div>

      {/* 3 × 2 grid of months */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-4">
        {months.map(({ year, month }) => {
          const cells = buildMonthGrid(year, month)
          return (
            <div key={`${year}-${month}`}>
              <p className="text-[10px] font-bold text-gray-600 text-center mb-1 uppercase tracking-wide">
                {MONTH_NAMES[month].slice(0, 3)} {year}
              </p>
              <div className="grid grid-cols-7 gap-px">
                {/* Day headers — single letter */}
                {['S','M','T','W','T','F','S'].map((d, i) => (
                  <div key={i} className="text-[9px] text-gray-400 text-center pb-0.5">{d}</div>
                ))}
                {/* Day cells */}
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
    </div>
  )
}

export default function HoldingDetailPage() {
  // useParams extracts the dynamic :id segment from the URL path
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  const [submittedOfferId, setSubmittedOfferId] = useState<string | null>(null)
  const [chatOpen, setChatOpen] = useState(false)

  // ── Holding data ──────────────────────────────────────────────────────────
  const { data: holding, isLoading, isError } = useQuery({
    queryKey: ['holding', id],
    queryFn: () => getHoldingDetail(id!),
    enabled: !!id, // don't run if id is undefined
  })

  // ── Wishlist status ───────────────────────────────────────────────────────
  // Check if this holding is already in the user's wishlist
  const { data: wishlistStatus } = useQuery({
    queryKey: ['wishlist-check', id],
    queryFn: () => checkWishlist(id!),
    enabled: !!id && !!user && user.role.toUpperCase() === 'CUSTOMER',
  })

  const isSaved = wishlistStatus?.saved ?? false

  const wishlistMutation = useMutation({
    mutationFn: () => isSaved ? removeFromWishlist(id!) : addToWishlist(id!),
    onSuccess: () => {
      // Refresh the wishlist check so the heart icon updates
      queryClient.invalidateQueries({ queryKey: ['wishlist-check', id] })
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })

  // ── Offer form ────────────────────────────────────────────────────────────
  const { register, handleSubmit, reset, formState: { errors } } = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
  })

  const offerMutation = useMutation({
    mutationFn: (data: OfferFormData) => {
      // Build the payload — convert empty strings to undefined
      return submitOffer(id!, {
        offeredPrice: data.offeredPrice,
        contactNumber: data.contactNumber,
        desiredStartDate: data.desiredStartDate || undefined,
        desiredDuration: data.desiredDuration ? Number(data.desiredDuration) : undefined,
        message: data.message || undefined,
      })
    },
    onSuccess: (data) => {
      setSubmittedOfferId(data.offerId)
      reset()
    },
  })

  // ── Loading / error states ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    )
  }

  if (isError || !holding) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-500">Failed to load listing details.</p>
        <button onClick={() => navigate('/browse')} className="mt-4 text-brand-600 text-sm hover:underline">
          Back to Browse
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Back navigation */}
      <button
        onClick={() => navigate('/browse')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Browse
      </button>

      {/* Page title row */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{holding.title}</h2>
          <p className="flex items-center gap-1 text-gray-500 mt-1">
            <MapPin className="w-4 h-4 shrink-0" />
            {holding.location}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <StatusBadge status={holding.status} />
          {holding.ownerVerified && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle2 className="w-3 h-3" /> Verified
            </span>
          )}
        </div>
      </div>

      {/* Two-column layout: details + offer form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left: Photos + specs (takes 2/3 of width on large screens) ─── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Photo gallery */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {holding.photos.length > 0 ? (
              <div>
                {/* Main large photo */}
                <img
                  src={holding.photos[0]}
                  alt={holding.title}
                  className="w-full h-72 object-cover"
                />
                {/* Thumbnail strip (if more than one photo) */}
                {holding.photos.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto">
                    {holding.photos.slice(1).map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Photo ${i + 2}`}
                        className="h-16 w-24 object-cover rounded-lg shrink-0"
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // No photos placeholder
              <div className="h-72 bg-gray-100 flex items-center justify-center">
                <MapPin className="w-16 h-16 text-gray-300" />
              </div>
            )}
          </div>

          {/* Details grid */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Listing Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Size</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {holding.width} × {holding.height} ft
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Location Type</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{holding.locationType}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Monthly Rental</p>
                <p className="text-sm font-bold text-brand-600 mt-1">
                  {formatRupees(holding.rentalCost)}/month
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Availability</p>
                <div className="mt-1">
                  <StatusBadge status={holding.status} />
                </div>
              </div>
              {holding.typeSpecs?.holdingType && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Type</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{holding.typeSpecs.holdingType.replace(/_/g, ' ')}</p>
                </div>
              )}
              {holding.illumination?.isIlluminated !== null && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Illuminated</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {holding.illumination?.isIlluminated ? '✓ Yes' : 'No'}
                  </p>
                </div>
              )}
              {holding.coordinates && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Coordinates</p>
                  <p className="text-sm text-gray-700 mt-1">
                    {holding.coordinates.latitude?.toFixed(4)}, {holding.coordinates.longitude?.toFixed(4)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Section panels ───────────────────────────────────────── */}
          <HoldingSections holding={holding} />

          {/* Location map */}
          {holding.coordinates?.latitude && holding.coordinates?.longitude && (
            <HoldingLocationMap
              lat={holding.coordinates.latitude}
              lng={holding.coordinates.longitude}
              title={holding.title}
            />
          )}

          {/* Availability calendar */}
          <AvailabilityCalendar availability={holding.availability} />
        </div>

        {/* ── Right: Offer form (sticky so it stays visible while scrolling) ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">

            {/* Rental cost highlight */}
            <div className="text-center pb-4 border-b border-gray-100 mb-4">
              <p className="text-2xl font-bold text-brand-600">
                {formatRupees(holding.rentalCost)}
              </p>
              <p className="text-sm text-gray-500">per month</p>
            </div>

            {/* Wishlist button (only for customers) */}
            {user?.role.toUpperCase() === 'CUSTOMER' && (
              <button
                onClick={() => wishlistMutation.mutate()}
                disabled={wishlistMutation.isPending}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium mb-4 transition-colors',
                  isSaved
                    ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50',
                )}
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500' : ''}`} />
                {isSaved ? 'Saved to Wishlist' : 'Save to Wishlist'}
              </button>
            )}

            {/* Offer form — only shown to authenticated customers */}
            {!user && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-3">Sign in to submit an offer</p>
                <button
                  onClick={() => navigate('/login')}
                  className="btn-primary"
                >
                  Sign In
                </button>
              </div>
            )}

            {user && user.role.toUpperCase() !== 'CUSTOMER' && (
              <p className="text-center text-sm text-gray-500 py-4">
                Only customers can submit offers.
              </p>
            )}

            {user && user.role.toUpperCase() === 'CUSTOMER' && holding.availability !== 'AVAILABLE' && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-4 text-center">
                <p className="text-sm font-semibold text-red-700 mb-1">
                  {holding.availability === 'BOOKED' ? 'Currently Booked' : 'Partially Available'}
                </p>
                <p className="text-xs text-red-600">
                  {holding.availability === 'BOOKED'
                    ? 'This hoarding is booked. Check back later.'
                    : 'Contact the owner to check available dates.'}
                </p>
              </div>
            )}

            {user && user.role.toUpperCase() === 'CUSTOMER' && holding.availability === 'AVAILABLE' && (
              <>
                {/* ── Post-submission state: show chat CTA, hide the form ── */}
                {submittedOfferId ? (
                  <>
                    {chatOpen && (
                      <ChatBox
                        offerId={submittedOfferId}
                        offerLabel={`Chat — ${holding.title}`}
                        onClose={() => setChatOpen(false)}
                      />
                    )}
                    <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-green-700 mb-1">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        Offer Submitted!
                      </div>
                      <p className="text-xs text-green-600 mb-3">
                        Your offer is with the owner. Chat to discuss details.
                      </p>
                      <button
                        onClick={() => setChatOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Chat with Owner
                      </button>
                    </div>
                  </>
                ) : (
                  /* ── Offer form ─────────────────────────────────────────── */
                  <>
                    <h3 className="font-semibold text-gray-900 mb-4">Submit an Offer</h3>

                    <form
                      onSubmit={handleSubmit((d) => offerMutation.mutate(d))}
                      noValidate
                      className="space-y-3"
                    >
                      {/* Offered price */}
                      <div>
                        <label className="label">Offered Price (₹/month)</label>
                        <input
                          type="number"
                          placeholder={`e.g. ${holding.rentalCost}`}
                          className={cn('input-field', errors.offeredPrice && 'input-error')}
                          {...register('offeredPrice')}
                        />
                        {errors.offeredPrice && (
                          <p className="error-text">{errors.offeredPrice.message}</p>
                        )}
                      </div>

                      {/* Contact number */}
                      <div>
                        <label className="label">Your Contact Number</label>
                        <input
                          type="tel"
                          placeholder="10-digit mobile number"
                          maxLength={10}
                          className={cn('input-field', errors.contactNumber && 'input-error')}
                          {...register('contactNumber')}
                        />
                        {errors.contactNumber && (
                          <p className="error-text">{errors.contactNumber.message}</p>
                        )}
                      </div>

                      {/* Desired start date (optional) */}
                      <div>
                        <label className="label">Start Date (optional)</label>
                        <input
                          type="date"
                          className="input-field"
                          {...register('desiredStartDate')}
                        />
                      </div>

                      {/* Duration (optional) */}
                      <div>
                        <label className="label">Duration in Days (optional)</label>
                        <input
                          type="number"
                          placeholder="e.g. 30"
                          className={cn('input-field', errors.desiredDuration && 'input-error')}
                          {...register('desiredDuration')}
                        />
                        {errors.desiredDuration && (
                          <p className="error-text">{errors.desiredDuration.message}</p>
                        )}
                      </div>

                      {/* Message (optional) */}
                      <div>
                        <label className="label">Message (optional)</label>
                        <textarea
                          placeholder="Tell the owner about your campaign…"
                          rows={3}
                          className="input-field resize-none"
                          {...register('message')}
                        />
                      </div>

                      {/* API error */}
                      {offerMutation.isError && (
                        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                          {offerMutation.error.message}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={offerMutation.isPending}
                        className="btn-primary"
                      >
                        {offerMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {offerMutation.isPending ? 'Submitting…' : 'Submit Offer'}
                      </button>
                    </form>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
