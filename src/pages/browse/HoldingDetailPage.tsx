// HoldingDetailPage.tsx — full detail view for a single hoarding
//
// URL: /holdings/:id  (the :id is pulled out using useParams)
//
// Left 2/3: photo gallery + holding specifications
// Right 1/3: sticky "Submit Offer" card with a form
//
// The offer form is inline on the page (not a modal) so the user can see
// the holding details while filling in their offer.

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin, CheckCircle2, Loader2, ArrowLeft, Heart, MessageCircle } from 'lucide-react'
import { getHoldingDetail } from '@/api/holdings.api'
import { submitOffer, addToWishlist, removeFromWishlist, checkWishlist } from '@/api/customer.api'
import { useAuthStore } from '@/store/auth.store'
import { offerSchema, type OfferFormData } from '@/lib/schemas/offer.schema'
import StatusBadge from '@/components/ui/StatusBadge'
import ChatBox from '@/components/chat/ChatBox'
import { cn } from '@/lib/utils'

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

function AvailabilityCalendar({
  status,
  bookedFrom,
  bookedTo,
}: {
  status: string
  bookedFrom: string | null
  bookedTo: string | null
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const from = bookedFrom ? new Date(bookedFrom + 'T00:00:00') : null
  const to   = bookedTo   ? new Date(bookedTo   + 'T00:00:00') : null

  // Returns the 6-week grid for a given year/month (0-indexed)
  function buildMonthGrid(year: number, month: number): (Date | null)[] {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (Date | null)[] = Array(firstDay).fill(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }

  function classForDay(date: Date | null): string {
    if (!date) return ''
    const isPast = date < today
    if (isPast) return 'text-gray-300'
    if (status === 'BOOKED') {
      if (from && to && date >= from && date <= to) {
        return 'bg-red-500 text-white rounded-full font-medium'
      }
    }
    if (date.toDateString() === today.toDateString()) {
      return 'bg-brand-100 text-brand-700 rounded-full font-semibold'
    }
    return status === 'PUBLISHED'
      ? 'text-green-700'
      : 'text-gray-700'
  }

  const months = [
    { year: today.getFullYear(), month: today.getMonth() },
    {
      year: today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear(),
      month: (today.getMonth() + 1) % 12,
    },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-1">Availability Calendar</h3>
      <p className="text-xs text-gray-500 mb-4">
        {status === 'BOOKED' && from && to
          ? `Booked from ${from.toLocaleDateString('en-IN', { day:'2-digit', month:'short' })} to ${to.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}`
          : status === 'PUBLISHED'
          ? 'Available for booking'
          : 'Currently unavailable'}
      </p>

      <div className="flex gap-6 flex-wrap">
        {months.map(({ year, month }) => {
          const cells = buildMonthGrid(year, month)
          return (
            <div key={`${year}-${month}`} className="min-w-[196px]">
              <p className="text-xs font-semibold text-gray-700 mb-2 text-center">
                {MONTH_NAMES[month]} {year}
              </p>
              <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="py-1 text-gray-400 font-medium">{d}</div>
                ))}
                {cells.map((date, i) => (
                  <div key={i} className="py-1 flex items-center justify-center">
                    {date && (
                      <span className={`w-7 h-7 flex items-center justify-center text-xs ${classForDay(date)}`}>
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

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
        {status === 'BOOKED' && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
            Booked
          </span>
        )}
        {status === 'PUBLISHED' && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
            Available
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-brand-200 inline-block" />
          Today
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-200 inline-block" />
          Past
        </span>
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
              {holding.coordinates && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Coordinates</p>
                  <p className="text-sm text-gray-700 mt-1">
                    {holding.coordinates.latitude?.toFixed(4)}, {holding.coordinates.longitude?.toFixed(4)}
                  </p>
                </div>
              )}
              {holding.preferredAdTypes && holding.preferredAdTypes.length > 0 && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Preferred Ad Types</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {holding.preferredAdTypes.map((type) => (
                      <span key={type} className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Availability calendar */}
          <AvailabilityCalendar
            status={holding.status}
            bookedFrom={holding.bookedFrom ?? null}
            bookedTo={holding.bookedTo ?? null}
          />
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

            {user && user.role.toUpperCase() === 'CUSTOMER' && holding.status !== 'PUBLISHED' && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-4 text-center">
                <p className="text-sm font-semibold text-red-700 mb-1">
                  {holding.status === 'BOOKED' ? 'Currently Booked' : 'Not Available'}
                </p>
                <p className="text-xs text-red-600">This hoarding is not available for offers right now.</p>
              </div>
            )}

            {user && user.role.toUpperCase() === 'CUSTOMER' && holding.status === 'PUBLISHED' && (
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
