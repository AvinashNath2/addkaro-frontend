import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Loader2, CheckCircle, XCircle, AlertTriangle, Eye, MapPin, X,
  Zap, Wrench, Users, DollarSign, FileText, Tag, ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  getAllAdminHoldings,
  approveHolding,
  rejectHolding,
  suspendHolding,
} from '@/api/admin.api'
import { getHoldingDetail } from '@/api/holdings.api'
import type { AdminHolding, HoldingDetail } from '@/types/index'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import { formatRupees, formatDate } from '@/lib/formatters'

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Pending Review', value: 'PENDING' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Suspended', value: 'SUSPENDED' },
]

function bool(v: boolean | null | undefined) {
  if (v == null) return '—'
  return v ? 'Yes' : 'No'
}

function val(v: string | number | null | undefined, suffix = '') {
  if (v == null || v === '') return '—'
  return `${v}${suffix}`
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-6 h-6 rounded-md bg-brand-500/10 flex items-center justify-center text-brand-600">{icon}</div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 py-1.5 text-sm border-b border-gray-50 last:border-0">
      <span className="text-gray-400 shrink-0 text-xs">{label}</span>
      <span className="text-gray-800 font-medium text-right">{value}</span>
    </div>
  )
}

function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const [idx, setIdx] = useState(0)
  if (!photos.length) {
    return (
      <div className="h-52 bg-gray-100 rounded-t-2xl flex items-center justify-center">
        <MapPin className="w-16 h-16 text-gray-300" />
      </div>
    )
  }
  return (
    <div className="relative h-52 rounded-t-2xl overflow-hidden bg-gray-900">
      <img src={photos[idx]} alt={title} className="w-full h-full object-cover" />
      {photos.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white disabled:opacity-30 hover:bg-black/70 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIdx((i) => Math.min(photos.length - 1, i + 1))}
            disabled={idx === photos.length - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white disabled:opacity-30 hover:bg-black/70 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function AdminHoldingsPage() {
  const queryClient = useQueryClient()
  const [activeStatus, setActiveStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedHolding, setSelectedHolding] = useState<AdminHolding | null>(null)
  const [reason, setReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [showSuspendInput, setShowSuspendInput] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-holdings', activeStatus, currentPage],
    queryFn: () => getAllAdminHoldings({ status: activeStatus || undefined, page: currentPage, limit: 15 }),
  })

  const { data: fullDetail, isLoading: detailLoading } = useQuery<HoldingDetail>({
    queryKey: ['holding-detail', selectedHolding?.id],
    queryFn: () => getHoldingDetail(selectedHolding!.id),
    enabled: !!selectedHolding,
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-holdings'] })
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['pending-holdings'] })
  }

  const closeModal = () => {
    setSelectedHolding(null)
    setReason('')
    setShowRejectInput(false)
    setShowSuspendInput(false)
  }

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveHolding(id),
    onSuccess: () => { closeModal(); invalidateAll() },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, r }: { id: string; r: string }) => rejectHolding(id, r),
    onSuccess: () => { closeModal(); invalidateAll() },
  })

  const suspendMutation = useMutation({
    mutationFn: ({ id, r }: { id: string; r: string }) => suspendHolding(id, r),
    onSuccess: () => { closeModal(); invalidateAll() },
  })

  const anyPending = approveMutation.isPending || rejectMutation.isPending || suspendMutation.isPending

  const openModal = (holding: AdminHolding) => {
    setSelectedHolding(holding)
    setReason('')
    setShowRejectInput(false)
    setShowSuspendInput(false)
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">All Holdings</h2>
        <p className="text-sm text-gray-500 mt-1">Click "View Details" to review a listing before approving or rejecting</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setActiveStatus(tab.value); setCurrentPage(0) }}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeStatus === tab.value
                ? 'border-b-2 border-brand-500 text-brand-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          Failed to load holdings. Please try again.
        </div>
      )}

      {data && !isLoading && (
        <p className="text-sm text-gray-500 mb-4">
          {data.totalElements} holding{data.totalElements !== 1 ? 's' : ''} found
        </p>
      )}

      {data && data.items.length === 0 && (
        <EmptyState message={activeStatus ? `No ${activeStatus.toLowerCase()} holdings found.` : 'No holdings on the platform yet.'} />
      )}

      {data && data.items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Title</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Owner</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Location</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Price</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Offers</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((holding) => (
                  <tr key={holding.id} className="bg-white hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 max-w-xs">
                      <p className="font-medium text-gray-900 truncate">{holding.title}</p>
                      {holding.rejectionReason && (
                        <p className="text-xs text-red-600 mt-0.5 truncate">Note: {holding.rejectionReason}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{holding.ownerName}</p>
                      <p className="text-xs text-gray-500">{holding.ownerEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs">
                      <p className="truncate">{holding.location}</p>
                      <span className="text-xs text-gray-500">{holding.locationType}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {formatRupees(holding.rentalCost)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={holding.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-500">{holding.offersCount}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openModal(holding)}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-700 border border-gray-200 bg-gray-50 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={!data.hasPrevious}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {data.page + 1} of {data.totalPages}</span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={!data.hasNext}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* ── Full Holding Detail Modal ─────────────────────────────────────── */}
      {selectedHolding && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-3xl border border-gray-200 mb-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Photo gallery */}
            <PhotoGallery photos={selectedHolding.photos} title={selectedHolding.title} />

            <div className="p-6">
              {/* Title row */}
              <div className="flex items-start justify-between gap-3 mb-1">
                <h3 className="text-xl font-bold text-gray-900 leading-tight">{selectedHolding.title}</h3>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={selectedHolding.status} />
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="flex items-center gap-1 text-sm text-gray-500 mb-5">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {selectedHolding.location}
              </p>

              {/* Quick specs strip */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
                {[
                  { label: 'Size', v: `${selectedHolding.width}×${selectedHolding.height} ft` },
                  { label: 'Price/mo', v: formatRupees(selectedHolding.rentalCost) },
                  { label: 'Type', v: val(fullDetail?.typeSpecs?.holdingType) },
                  { label: 'Faces', v: val(fullDetail?.typeSpecs?.numFaces) },
                  { label: 'Offers', v: String(selectedHolding.offersCount) },
                  { label: 'Listed', v: formatDate(selectedHolding.createdAt) },
                ].map(({ label, v }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{v}</p>
                  </div>
                ))}
              </div>

              {detailLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                  <span className="ml-2 text-sm text-gray-500">Loading full details…</span>
                </div>
              )}

              {fullDetail && !detailLoading && (
                <div className="space-y-5">
                  {/* ── Type & Specs ────────────────────────────────────── */}
                  {fullDetail.typeSpecs && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <SectionTitle icon={<Tag className="w-3.5 h-3.5" />} label="Type & Specs" />
                      <div className="space-y-0.5">
                        <Row label="Holding type"        value={val(fullDetail.typeSpecs.holdingType)} />
                        <Row label="Number of faces"     value={val(fullDetail.typeSpecs.numFaces)} />
                        <Row label="Display technology"  value={val(fullDetail.typeSpecs.displayTechnology)} />
                        <Row label="Printable area"      value={val(fullDetail.typeSpecs.printableAreaSqft, ' sq ft')} />
                        <Row label="Facing direction"    value={val(fullDetail.typeSpecs.facingDirection)} />
                        <Row label="Mounting height"     value={val(fullDetail.typeSpecs.mountingHeightFt, ' ft')} />
                      </div>
                    </div>
                  )}

                  {/* ── Address ─────────────────────────────────────────── */}
                  {fullDetail.address && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <SectionTitle icon={<MapPin className="w-3.5 h-3.5" />} label="Address" />
                      <div className="space-y-0.5">
                        <Row label="Street"    value={val(fullDetail.address.street)} />
                        <Row label="Area"      value={val(fullDetail.address.area)} />
                        <Row label="City"      value={val(fullDetail.address.city)} />
                        <Row label="State"     value={val(fullDetail.address.state)} />
                        <Row label="Pin code"  value={val(fullDetail.address.pinCode)} />
                        <Row label="Landmark"  value={val(fullDetail.address.landmark)} />
                        <Row label="Lat / Lng" value={fullDetail.coordinates
                          ? `${fullDetail.coordinates.latitude.toFixed(5)}, ${fullDetail.coordinates.longitude.toFixed(5)}`
                          : '—'} />
                      </div>
                    </div>
                  )}

                  {/* ── Illumination ─────────────────────────────────────── */}
                  {fullDetail.illumination && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <SectionTitle icon={<Zap className="w-3.5 h-3.5" />} label="Illumination" />
                      <div className="space-y-0.5">
                        <Row label="Illuminated"  value={bool(fullDetail.illumination.isIlluminated)} />
                        <Row label="Type"         value={val(fullDetail.illumination.illuminationType)} />
                        <Row label="Hours"        value={val(fullDetail.illumination.illuminationHours)} />
                      </div>
                    </div>
                  )}

                  {/* ── Amenities ────────────────────────────────────────── */}
                  {fullDetail.amenities && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <SectionTitle icon={<Wrench className="w-3.5 h-3.5" />} label="Amenities" />
                      <div className="space-y-0.5">
                        <Row label="Electricity"     value={bool(fullDetail.amenities.electricityAvailable)} />
                        <Row label="Power supply"    value={val(fullDetail.amenities.powerSupplyType)} />
                        <Row label="Ladder access"   value={bool(fullDetail.amenities.ladderAccess)} />
                        <Row label="On-site watchman" value={bool(fullDetail.amenities.onSiteWatchman)} />
                        <Row label="Nearby parking"  value={bool(fullDetail.amenities.nearbyParking)} />
                        <Row label="CCTV installed"  value={bool(fullDetail.amenities.cctvInstalled)} />
                        <Row label="Water available" value={bool(fullDetail.amenities.waterAvailable)} />
                      </div>
                    </div>
                  )}

                  {/* ── Audience ─────────────────────────────────────────── */}
                  {fullDetail.audience && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <SectionTitle icon={<Users className="w-3.5 h-3.5" />} label="Audience & Traffic" />
                      <div className="space-y-0.5">
                        <Row label="Daily vehicles"   value={val(fullDetail.audience.dailyVehiclesRange)} />
                        <Row label="Daily footfall"   value={val(fullDetail.audience.dailyFootfallRange)} />
                        <Row label="Data source"      value={val(fullDetail.audience.trafficDataSource)} />
                      </div>
                    </div>
                  )}

                  {/* ── Pricing ──────────────────────────────────────────── */}
                  {fullDetail.pricing && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <SectionTitle icon={<DollarSign className="w-3.5 h-3.5" />} label="Pricing Details" />
                      <div className="space-y-0.5">
                        <Row label="Monthly rate"         value={formatRupees(fullDetail.pricing.monthlyRate)} />
                        <Row label="Min booking"          value={val(fullDetail.pricing.minimumBookingMonths, ' months')} />
                        <Row label="Quarterly discount"   value={val(fullDetail.pricing.quarterlyDiscountPct, '%')} />
                        <Row label="Half-yearly discount" value={val(fullDetail.pricing.halfYearlyDiscountPct, '%')} />
                        <Row label="Yearly discount"      value={val(fullDetail.pricing.yearlyDiscountPct, '%')} />
                        <Row label="Security deposit"     value={bool(fullDetail.pricing.securityDepositRequired)} />
                        <Row label="Deposit range"        value={val(fullDetail.pricing.securityDepositRange)} />
                        <Row label="Installation cost"    value={val(fullDetail.pricing.installationCostRange)} />
                        <Row label="Setup cost"           value={formatRupees(fullDetail.pricing.setupCost)} />
                        <Row label="Tax"                  value={val(fullDetail.pricing.taxPct, '%')} />
                      </div>
                    </div>
                  )}

                  {/* ── Legal ────────────────────────────────────────────── */}
                  {fullDetail.legal && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <SectionTitle icon={<FileText className="w-3.5 h-3.5" />} label="Legal & Permits" />
                      <div className="space-y-0.5">
                        <Row label="Permit status"   value={val(fullDetail.legal.permitStatus)} />
                        <Row label="Permit number"   value={val(fullDetail.legal.permitNumber)} />
                        <Row label="Valid till"      value={val(fullDetail.legal.permitValidTill)} />
                        <Row label="NOC obtained"    value={bool(fullDetail.legal.nocFromAuthority)} />
                      </div>
                    </div>
                  )}

                  {/* ── Location Advantages ──────────────────────────────── */}
                  {fullDetail.locationAdvantages?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Location Advantages</p>
                      <div className="flex flex-wrap gap-2">
                        {fullDetail.locationAdvantages.map((adv) => (
                          <span key={adv} className="px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-700 text-xs font-medium">
                            {adv.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Owner info ───────────────────────────────────────────── */}
              <div className="bg-gray-50 rounded-xl p-4 mt-5 border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Owner</p>
                <p className="font-semibold text-gray-900">{selectedHolding.ownerName}</p>
                <p className="text-sm text-gray-500">{selectedHolding.ownerEmail}</p>
                {selectedHolding.ownerVerified && (
                  <p className="text-xs text-emerald-700 font-medium mt-1">Verified Owner</p>
                )}
              </div>

              {selectedHolding.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4 text-sm">
                  <p className="text-xs text-red-700 font-bold uppercase tracking-wide mb-1">Admin Note</p>
                  <p className="text-red-700">{selectedHolding.rejectionReason}</p>
                </div>
              )}

              {/* ── Admin actions ─────────────────────────────────────────── */}
              <div className="border-t border-gray-100 pt-5 mt-5 space-y-3">
                {selectedHolding.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => approveMutation.mutate(selectedHolding.id)}
                      disabled={anyPending}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-medium hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                    >
                      {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Approve — Make Active
                    </button>

                    {showRejectInput ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter rejection reason (required)…"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="input-field flex-1 text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => { if (reason.trim()) rejectMutation.mutate({ id: selectedHolding.id, r: reason.trim() }) }}
                          disabled={!reason.trim() || anyPending}
                          className="shrink-0 px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject'}
                        </button>
                        <button
                          onClick={() => { setShowRejectInput(false); setReason('') }}
                          className="shrink-0 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowRejectInput(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm font-medium hover:bg-red-100 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject Holding
                      </button>
                    )}
                  </>
                )}

                {selectedHolding.status === 'ACTIVE' && (
                  <>
                    {showSuspendInput ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Reason for suspension (required)…"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="input-field flex-1 text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => { if (reason.trim()) suspendMutation.mutate({ id: selectedHolding.id, r: reason.trim() }) }}
                          disabled={!reason.trim() || anyPending}
                          className="shrink-0 px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          {suspendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Suspend'}
                        </button>
                        <button
                          onClick={() => { setShowSuspendInput(false); setReason('') }}
                          className="shrink-0 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowSuspendInput(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 text-sm font-medium hover:bg-orange-100 transition-colors"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Suspend Holding
                      </button>
                    )}
                  </>
                )}

                {(selectedHolding.status === 'REJECTED' || selectedHolding.status === 'SUSPENDED') && (
                  <p className="text-center text-sm text-gray-500 py-2">
                    No further admin actions available for this status.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
