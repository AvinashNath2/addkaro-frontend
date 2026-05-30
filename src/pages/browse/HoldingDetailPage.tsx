import { useState, lazy, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, MapPin, Ruler, Zap, CheckCircle2, Bookmark, BookmarkCheck, MessageSquare,
  ChevronLeft, ChevronRight, Loader2, ShieldCheck, X,
} from 'lucide-react'
import { getHoldingDetail } from '@/api/holdings.api'
import { submitOffer, addToWishlist, removeFromWishlist, checkWishlist } from '@/api/customer.api'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'
import { formatRupees, formatLabel } from '@/lib/formatters'
import type { OfferRequest, HoldingDetail } from '@/types/index'

const HoldingMap = lazy(() => import('@/components/browse/HoldingMap'))

const offerSchema = z.object({
  offeredPrice:     z.number({ invalid_type_error: 'Required' }).min(1, 'Enter a valid amount'),
  contactNumber:    z.string().min(10, 'Enter a valid phone number'),
  desiredStartDate: z.string().optional(),
  desiredDuration:  z.number({ invalid_type_error: 'Required' }).min(1).optional(),
  message:          z.string().optional(),
})
type OfferForm = z.infer<typeof offerSchema>

function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const [idx, setIdx] = useState(0)
  if (!photos.length) {
    return (
      <div className="w-full aspect-video flex items-center justify-center" style={{ background: '#e5e0d8' }}>
        <span className="text-sm" style={{ color: '#999' }}>No photos</span>
      </div>
    )
  }
  const prev = () => setIdx((i) => (i - 1 + photos.length) % photos.length)
  const next = () => setIdx((i) => (i + 1) % photos.length)
  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9', background: '#111' }}>
      <img src={photos[idx]} alt={title} className="w-full h-full object-cover" />
      {photos.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}>
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className="w-2 h-2 rounded-full transition-colors" style={{ background: i === idx ? '#C9F31D' : 'rgba(255,255,255,0.4)' }} />
            ))}
          </div>
        </>
      )}
      <div className="absolute top-3 right-3 px-2 py-1 text-xs font-bold" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
        {idx + 1} / {photos.length}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === false || value === '') return null
  return (
    <div className="flex items-start gap-2 py-2 border-b" style={{ borderColor: '#e5e0d8' }}>
      <span className="text-xs font-semibold uppercase tracking-wider shrink-0 w-36" style={{ color: '#999' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: '#222' }}>{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-6" style={{ background: '#f0ece6' }}>
      <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#999' }}>{title}</h3>
      {children}
    </div>
  )
}

function OfferPanel({ holding, onClose }: { holding: HoldingDetail; onClose: () => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm<OfferForm>({
    resolver: zodResolver(offerSchema),
    defaultValues: { offeredPrice: holding.rentalCost },
  })

  const mutation = useMutation({
    mutationFn: (data: OfferForm) => {
      const payload: OfferRequest = {
        offeredPrice: data.offeredPrice,
        contactNumber: data.contactNumber,
        desiredStartDate: data.desiredStartDate || undefined,
        desiredDuration: data.desiredDuration,
        message: data.message,
      }
      return submitOffer(holding.id, payload)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-offers'] }),
  })

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md lp-modal"
        style={{ background: '#f5f1eb' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#e0dbd4' }}>
          <h2 className="text-sm font-bold uppercase tracking-wider">Make an Offer</h2>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: '#555' }} /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="label">Your Offered Price (₹/month)</label>
            <input type="number" className={cn('input-field', errors.offeredPrice && 'input-error')} {...register('offeredPrice', { valueAsNumber: true })} />
            {errors.offeredPrice && <p className="error-text">{errors.offeredPrice.message}</p>}
            <p className="mt-1 text-xs" style={{ color: '#999' }}>Listed at {formatRupees(holding.rentalCost)}/month</p>
          </div>
          <div>
            <label className="label">Contact Number</label>
            <input type="tel" className={cn('input-field', errors.contactNumber && 'input-error')} {...register('contactNumber')} />
            {errors.contactNumber && <p className="error-text">{errors.contactNumber.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date</label>
              <input type="date" className="input-field" {...register('desiredStartDate')} />
            </div>
            <div>
              <label className="label">Duration (months)</label>
              <input type="number" min={1} className="input-field" {...register('desiredDuration', { valueAsNumber: true })} />
            </div>
          </div>
          <div>
            <label className="label">Message (optional)</label>
            <textarea rows={3} className="input-field resize-none" {...register('message')} placeholder="Describe your campaign…" />
          </div>
          {mutation.isError && (
            <div className="px-4 py-3 text-sm" style={{ background: '#fee2e2', color: '#b91c1c' }}>
              {(mutation.error as Error).message}
            </div>
          )}
          {mutation.isSuccess && (
            <div className="px-4 py-3 text-sm" style={{ background: '#dcfce7', color: '#15803d' }}>
              Offer submitted! The owner will review it shortly.
            </div>
          )}
          <button type="submit" disabled={mutation.isPending || mutation.isSuccess} className="btn-primary">
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {mutation.isPending ? 'Submitting…' : mutation.isSuccess ? 'Offer Sent!' : 'Submit Offer'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default function HoldingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isCustomer = user?.role?.toUpperCase() === 'CUSTOMER'
  const [showOffer, setShowOffer] = useState(false)
  const qc = useQueryClient()

  const { data: holding, isLoading, isError } = useQuery<HoldingDetail>({
    queryKey: ['holding', id],
    queryFn: () => getHoldingDetail(id!),
    enabled: !!id,
  })

  const { data: wishlistStatus } = useQuery({
    queryKey: ['wishlist-check', id],
    queryFn: () => checkWishlist(id!),
    enabled: !!id && isCustomer,
  })
  const isSaved = wishlistStatus?.saved ?? false

  const wishlistMutation = useMutation({
    mutationFn: () => isSaved ? removeFromWishlist(id!) : addToWishlist(id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist-check', id] }),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#1a3560' }} />
      </div>
    )
  }

  if (isError || !holding) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-sm" style={{ color: '#666' }}>Could not load this hoarding.</p>
        <button onClick={() => navigate('/browse')} className="btn-primary w-auto px-6">Back to Browse</button>
      </div>
    )
  }

  const addr = holding.address
  const specs = holding.typeSpecs
  const illum = holding.illumination
  const pricing = holding.pricing
  const amenities = holding.amenities
  const audience = holding.audience

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 page-enter">

      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: '#555' }}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        {isCustomer && (
          <button
            onClick={() => wishlistMutation.mutate()}
            disabled={wishlistMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold border"
            style={{ borderColor: isSaved ? '#16a34a' : '#ddd', color: isSaved ? '#16a34a' : '#666' }}
          >
            {isSaved
              ? <BookmarkCheck className="w-4 h-4" />
              : <Bookmark className="w-4 h-4" />
            }
            {isSaved ? 'Saved' : 'Save'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-4">
          <PhotoGallery photos={holding.photos} title={holding.title} />

          <div>
            <div className="flex items-start justify-between gap-3 mb-1">
              <h1 className="page-title">{holding.title}</h1>
              {holding.ownerVerified && (
                <span className="inline-flex items-center gap-1 shrink-0 px-2 py-1 text-xs font-bold" style={{ background: '#dcfce7', color: '#15803d' }}>
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm" style={{ color: '#666' }}>
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {holding.location}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold" style={{ background: '#f0ece6' }}>
              <Ruler className="w-3.5 h-3.5" /> {holding.width}×{holding.height} ft
            </span>
            {specs?.holdingType && (
              <span className="px-3 py-1.5 text-xs font-bold" style={{ background: '#f0ece6' }}>
                {formatLabel(specs.holdingType)}
              </span>
            )}
            {illum?.isIlluminated && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold" style={{ background: '#fefce8', color: '#854d0e' }}>
                <Zap className="w-3.5 h-3.5" /> Illuminated
              </span>
            )}
            <span className="px-3 py-1.5 text-xs font-bold"
              style={{ background: holding.availability === 'AVAILABLE' ? '#dcfce7' : '#fee2e2', color: holding.availability === 'AVAILABLE' ? '#15803d' : '#b91c1c' }}>
              {formatLabel(holding.availability)}
            </span>
          </div>

          {specs && (
            <Section title="Specs">
              <InfoRow label="Type" value={specs.holdingType ? formatLabel(specs.holdingType) : null} />
              <InfoRow label="Faces" value={specs.numFaces} />
              <InfoRow label="Technology" value={specs.displayTechnology} />
              <InfoRow label="Printable Area" value={specs.printableAreaSqft ? `${specs.printableAreaSqft} sq ft` : null} />
              <InfoRow label="Facing" value={specs.facingDirection} />
              <InfoRow label="Mounting Height" value={specs.mountingHeightFt ? `${specs.mountingHeightFt} ft` : null} />
            </Section>
          )}

          {illum?.isIlluminated && (
            <Section title="Illumination">
              <InfoRow label="Type" value={illum.illuminationType} />
              <InfoRow label="Hours" value={illum.illuminationHours} />
            </Section>
          )}

          {amenities && (
            <Section title="Amenities">
              {([
                ['Electricity', amenities.electricityAvailable],
                ['Power Supply', amenities.powerSupplyType],
                ['Ladder Access', amenities.ladderAccess],
                ['On-site Watchman', amenities.onSiteWatchman],
                ['Nearby Parking', amenities.nearbyParking],
                ['CCTV', amenities.cctvInstalled],
                ['Water', amenities.waterAvailable],
              ] as [string, unknown][]).filter(([, v]) => v !== null && v !== undefined && v !== false).map(([label, val]) => (
                <div key={label} className="flex items-center gap-2 py-1.5 border-b" style={{ borderColor: '#e5e0d8' }}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#15803d' }} />
                  <span className="text-sm">{label}{typeof val === 'string' ? `: ${val}` : ''}</span>
                </div>
              ))}
            </Section>
          )}

          {audience && (
            <Section title="Audience & Traffic">
              <InfoRow label="Daily Vehicles" value={audience.dailyVehiclesRange} />
              <InfoRow label="Daily Footfall" value={audience.dailyFootfallRange} />
              <InfoRow label="Data Source" value={audience.trafficDataSource} />
            </Section>
          )}

          {holding.locationAdvantages.length > 0 && (
            <Section title="Location Advantages">
              <div className="flex flex-wrap gap-2">
                {holding.locationAdvantages.map((adv) => (
                  <span key={adv} className="px-2.5 py-1 text-xs font-semibold" style={{ background: '#e8f4fd', color: '#1a3560' }}>
                    {formatLabel(adv)}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {addr && (
            <Section title="Address">
              <InfoRow label="Street" value={addr.street} />
              <InfoRow label="Area" value={addr.area} />
              <InfoRow label="City" value={addr.city} />
              <InfoRow label="State" value={addr.state} />
              <InfoRow label="PIN" value={addr.pinCode} />
              <InfoRow label="Landmark" value={addr.landmark} />
            </Section>
          )}

          {holding.coordinates?.latitude && holding.coordinates?.longitude && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-0" style={{ color: '#999', padding: '24px 24px 12px' }}>Location on Map</h3>
              <div style={{ height: 280, position: 'relative' }}>
                <Suspense fallback={
                  <div className="w-full h-full flex items-center justify-center" style={{ background: '#f0ece6' }}>
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#1a3560' }} />
                  </div>
                }>
                  <HoldingMap
                    lat={holding.coordinates.latitude}
                    lng={holding.coordinates.longitude}
                    title={holding.title}
                  />
                </Suspense>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="p-6" style={{ background: '#1a3560' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#a0b4d0' }}>Monthly Rate</p>
            <p className="text-3xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              {formatRupees(holding.rentalCost)}
            </p>
            {pricing?.minimumBookingMonths && (
              <p className="text-xs mt-1" style={{ color: '#a0b4d0' }}>Min. {pricing.minimumBookingMonths} month{pricing.minimumBookingMonths > 1 ? 's' : ''}</p>
            )}

            {isCustomer ? (
              <button
                onClick={() => setShowOffer(true)}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 py-3 text-sm font-bold"
                style={{ background: '#C9F31D', color: '#111' }}
              >
                <MessageSquare className="w-4 h-4" /> Make an Offer
              </button>
            ) : (
              <Link
                to="/login"
                className="mt-5 block text-center py-3 text-sm font-bold"
                style={{ background: '#C9F31D', color: '#111' }}
              >
                Sign in to Make an Offer
              </Link>
            )}
          </div>

          {pricing && (
            <Section title="Pricing Details">
              <InfoRow label="Monthly Rate" value={pricing.monthlyRate ? formatRupees(pricing.monthlyRate) : null} />
              <InfoRow label="Setup Cost" value={pricing.setupCost ? formatRupees(pricing.setupCost) : null} />
              <InfoRow label="Tax" value={pricing.taxPct ? `${pricing.taxPct}%` : null} />
              <InfoRow label="Quarterly Disc." value={pricing.quarterlyDiscountPct ? `${pricing.quarterlyDiscountPct}%` : null} />
              <InfoRow label="Half-yearly Disc." value={pricing.halfYearlyDiscountPct ? `${pricing.halfYearlyDiscountPct}%` : null} />
              <InfoRow label="Yearly Disc." value={pricing.yearlyDiscountPct ? `${pricing.yearlyDiscountPct}%` : null} />
              {pricing.securityDepositRequired && (
                <InfoRow label="Security Deposit" value={pricing.securityDepositRange ?? 'Required'} />
              )}
            </Section>
          )}

          {holding.previousAdvertisers.length > 0 && (
            <Section title="Previous Advertisers">
              <div className="space-y-2">
                {holding.previousAdvertisers.map((adv) => (
                  <div key={adv.id} className="py-2 border-b" style={{ borderColor: '#e5e0d8' }}>
                    <p className="text-sm font-semibold">{adv.brandName}</p>
                    {adv.description && <p className="text-xs mt-0.5" style={{ color: '#666' }}>{adv.description}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>

      {showOffer && <OfferPanel holding={holding} onClose={() => setShowOffer(false)} />}
    </div>
  )
}
