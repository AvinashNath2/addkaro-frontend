import { useState, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Trash2, ChevronDown, ChevronUp, Edit2, MessageCircle } from 'lucide-react'
import {
  getOwnerHoldings,
  deleteHolding,
  updateHoldingStatus,
  getOwnerOffersByHolding,
  revealContact,
  updateOfferStatus,
} from '@/api/owner.api'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import ChatBox from '@/components/chat/ChatBox'
import type { OwnerHolding, HoldingStatus } from '@/types'

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Pending Review', value: 'PENDING_REVIEW' },
  { label: 'Rejected', value: 'ADMIN_REJECT' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Booked', value: 'BOOKED' },
  { label: 'Paused', value: 'OWNER_PAUSE' },
]

function formatRupees(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Sub-view: status editor ─────────────────────────────────────────────────
function StatusEditor({ holding, onDone }: { holding: OwnerHolding; onDone: () => void }) {
  const queryClient = useQueryClient()
  const [bookedFrom, setBookedFrom] = useState(holding.bookedFrom ?? '')
  const [bookedTo, setBookedTo] = useState(holding.bookedTo ?? '')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (payload: { toStatus: string; bookedFrom?: string | null; bookedTo?: string | null }) =>
      updateHoldingStatus(holding.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-holdings'] })
      onDone()
    },
    onError: (err: Error) => setError(err.message),
  })

  const handleTransition = (toStatus: string) => {
    if (toStatus === 'BOOKED') {
      if (!bookedFrom || !bookedTo) { setError('Please enter both From and To dates for a Booked holding.'); return }
      if (bookedFrom > bookedTo) { setError('From date must be before To date.'); return }
      mutation.mutate({ toStatus, bookedFrom, bookedTo })
    } else {
      mutation.mutate({ toStatus })
    }
  }

  const status = holding.status as HoldingStatus

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-3 space-y-3">
      <p className="text-sm font-semibold text-amber-800">Update Status</p>

      {/* DRAFT: submit for review */}
      {status === 'DRAFT' && (
        <button
          onClick={() => handleTransition('PENDING_REVIEW')}
          disabled={mutation.isPending}
          className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Submit for Review
        </button>
      )}

      {/* ADMIN_REJECT: resubmit */}
      {status === 'ADMIN_REJECT' && (
        <button
          onClick={() => handleTransition('PENDING_REVIEW')}
          disabled={mutation.isPending}
          className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Resubmit for Review
        </button>
      )}

      {/* PUBLISHED: mark as booked or pause */}
      {status === 'PUBLISHED' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700">Mark as Booked (requires date range):</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Booked From</label>
                <input
                  type="date"
                  value={bookedFrom}
                  onChange={(e) => setBookedFrom(e.target.value)}
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Booked To</label>
                <input
                  type="date"
                  value={bookedTo}
                  onChange={(e) => setBookedTo(e.target.value)}
                  className="input-field text-sm"
                />
              </div>
            </div>
            <button
              onClick={() => handleTransition('BOOKED')}
              disabled={mutation.isPending}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Mark as Booked
            </button>
          </div>
          <button
            onClick={() => handleTransition('OWNER_PAUSE')}
            disabled={mutation.isPending}
            className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Pause Listing
          </button>
        </div>
      )}

      {/* BOOKED: mark available again */}
      {status === 'BOOKED' && (
        <button
          onClick={() => handleTransition('PUBLISHED')}
          disabled={mutation.isPending}
          className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Mark Available Again
        </button>
      )}

      {/* OWNER_PAUSE: re-publish */}
      {status === 'OWNER_PAUSE' && (
        <button
          onClick={() => handleTransition('PUBLISHED')}
          disabled={mutation.isPending}
          className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Re-publish Listing
        </button>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        onClick={onDone}
        className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
    </div>
  )
}

// ── Sub-view: offers for a holding ──────────────────────────────────────────
function HoldingOffersPanel({ holdingId }: { holdingId: string }) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [chatOffer, setChatOffer] = useState<{ offerId: string; customerName: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['owner-offers-by-holding', holdingId, page],
    queryFn: () => getOwnerOffersByHolding(holdingId, page, 10),
  })

  const revealMutation = useMutation({
    mutationFn: revealContact,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-offers-by-holding', holdingId] }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ offerId, status }: { offerId: string; status: string }) =>
      updateOfferStatus(offerId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-offers-by-holding', holdingId] }),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-6">
      <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
    </div>
  )

  if (!data || data.items.length === 0) return (
    <p className="text-sm text-gray-500 py-4 text-center">No offers received for this listing yet.</p>
  )

  return (
    <div className="mt-3 space-y-2">
      {chatOffer && (
        <ChatBox
          offerId={chatOffer.offerId}
          offerLabel={`Chat with ${chatOffer.customerName}`}
          onClose={() => setChatOffer(null)}
        />
      )}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Offers ({data.totalElements})
      </p>
      <div className="space-y-2">
        {data.items.map((offer) => (
          <div key={offer.offerId} className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="font-medium text-gray-900">{offer.customerName}</p>
                {offer.contactNumber
                  ? <p className="text-xs text-gray-500 mt-0.5">📞 {offer.contactNumber}</p>
                  : <p className="text-xs text-gray-400 mt-0.5 italic">Contact hidden</p>
                }
                <p className="text-xs text-gray-500 mt-1">
                  {formatRupees(offer.offeredPrice)}/mo
                  {offer.desiredStartDate && ` · from ${formatDate(offer.desiredStartDate)}`}
                  {offer.desiredDuration && ` · ${offer.desiredDuration} days`}
                </p>
                {offer.message && <p className="text-xs text-gray-600 mt-1 italic">"{offer.message}"</p>}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <StatusBadge status={offer.status} />
                <p className="text-xs text-gray-400">{formatDate(offer.createdAt)}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              <button
                onClick={() => setChatOffer({ offerId: offer.offerId, customerName: offer.customerName })}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Chat
              </button>

              {offer.status === 'NEW' && (
                <button
                  onClick={() => revealMutation.mutate(offer.offerId)}
                  disabled={revealMutation.isPending}
                  className="text-xs px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 disabled:opacity-50 transition-colors"
                >
                  Reveal Contact
                </button>
              )}
              {offer.status !== 'NEW' && offer.status !== 'CLOSED' && offer.status !== 'DECLINED' && (
                <>
                  <button
                    onClick={() => statusMutation.mutate({ offerId: offer.offerId, status: 'NEGOTIATING' })}
                    disabled={statusMutation.isPending || offer.status === 'NEGOTIATING'}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    Negotiating
                  </button>
                  <button
                    onClick={() => statusMutation.mutate({ offerId: offer.offerId, status: 'CLOSED' })}
                    disabled={statusMutation.isPending}
                    className="text-xs px-3 py-1.5 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-40 transition-colors"
                  >
                    Close Deal
                  </button>
                  <button
                    onClick={() => statusMutation.mutate({ offerId: offer.offerId, status: 'DECLINED' })}
                    disabled={statusMutation.isPending}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-40 transition-colors"
                  >
                    Decline
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={!data.hasPrevious}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">Page {data.page + 1} of {data.totalPages}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data.hasNext}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

// ── Sub-view panel (expands below a selected holding row) ──────────────────
function HoldingSubView({ holding, onClose: _onClose }: { holding: OwnerHolding; onClose: () => void }) {
  const navigate = useNavigate()
  const [showStatusEditor, setShowStatusEditor] = useState(false)

  // Statuses that allow showing a status editor
  const canEditStatus = ['DRAFT', 'ADMIN_REJECT', 'PUBLISHED', 'BOOKED', 'OWNER_PAUSE'].includes(holding.status)

  return (
    <div className="bg-gray-50 border-t border-brand-200 px-6 py-5">
      {/* Details + actions row */}
      <div className="flex flex-wrap items-start gap-4 justify-between mb-4">
        <div className="space-y-1 text-sm text-gray-700 min-w-0">
          <p><span className="font-medium">Size:</span> {holding.width} × {holding.height} ft</p>
          <p><span className="font-medium">Price:</span> {formatRupees(holding.rentalCost)}/mo</p>
          <p><span className="font-medium">Type:</span> {holding.locationType}</p>
          <p>
            <span className="font-medium">Status:</span>{' '}
            <StatusBadge status={holding.status} />
          </p>
          {holding.status === 'BOOKED' && holding.bookedFrom && holding.bookedTo && (
            <p className="text-xs text-gray-500">
              Booked: {formatDate(holding.bookedFrom)} → {formatDate(holding.bookedTo)}
            </p>
          )}
          {(holding.status === 'ADMIN_REJECT' || holding.status === 'DELISTED_BY_ADMIN') && holding.rejectionReason && (
            <p className="text-xs text-red-600">Admin note: {holding.rejectionReason}</p>
          )}
        </div>

        <div className="flex gap-2 flex-wrap shrink-0">
          {canEditStatus && !showStatusEditor && (
            <button
              onClick={() => setShowStatusEditor(true)}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Change Status
            </button>
          )}
          {(holding.status === 'DRAFT' || holding.status === 'ADMIN_REJECT') && (
            <button
              onClick={() => navigate(`/owner/holdings/${holding.id}/edit`)}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-brand-300 text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Listing
            </button>
          )}
        </div>
      </div>

      {showStatusEditor && (
        <StatusEditor holding={holding} onDone={() => setShowStatusEditor(false)} />
      )}

      <HoldingOffersPanel holdingId={holding.id} />
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function OwnerHoldingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeStatus, setActiveStatus] = useState('')
  const [page, setPage] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['owner-holdings', activeStatus, page],
    queryFn: () => getOwnerHoldings(activeStatus || undefined, page, 10),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteHolding,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-holdings'] }),
  })

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id)
    }
  }

  const handleTabChange = (val: string) => {
    setActiveStatus(val)
    setPage(0)
    setExpandedId(null)
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Listings</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your hoarding listings</p>
        </div>
        <button onClick={() => navigate('/owner/holdings/new')} className="btn-primary w-auto px-5 gap-2">
          <Plus className="w-4 h-4" />
          Add New Listing
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeStatus === tab.value ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
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
          Failed to load your listings. Please try again.
        </div>
      )}

      {data && data.items.length === 0 && (
        <EmptyState message="No listings found. Click 'Add New Listing' to create your first hoarding draft." />
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 font-medium text-gray-500 w-8"></th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Title</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Location</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Price/mo</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Offers</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((holding) => (
                    <Fragment key={holding.id}>
                      <tr
                        onClick={() => setExpandedId((prev) => prev === holding.id ? null : holding.id)}
                        className={`cursor-pointer transition-colors border-b border-gray-100 ${
                          expandedId === holding.id ? 'bg-brand-50 border-brand-200' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-4 text-gray-400">
                          {expandedId === holding.id
                            ? <ChevronUp className="w-4 h-4" />
                            : <ChevronDown className="w-4 h-4" />}
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <p className="font-medium text-gray-900 truncate">{holding.title}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-600 max-w-xs">
                          <span className="truncate block">{holding.location}</span>
                          <span className="text-xs text-gray-400">{holding.locationType}</span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {formatRupees(holding.rentalCost)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={holding.status} />
                        </td>
                        <td className="px-6 py-4 text-gray-600">{holding.offersCount}</td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          {(holding.status === 'DRAFT' || holding.status === 'ADMIN_REJECT') && (
                            <button
                              onClick={() => handleDelete(holding.id, holding.title)}
                              disabled={deleteMutation.isPending}
                              className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>

                      {expandedId === holding.id && (
                        <tr className="border-b border-brand-200">
                          <td colSpan={7} className="p-0">
                            <HoldingSubView holding={holding} onClose={() => setExpandedId(null)} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => { setPage((p) => Math.max(0, p - 1)); setExpandedId(null) }}
                disabled={!data.hasPrevious}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {data.page + 1} of {data.totalPages} · {data.totalElements} listings
              </span>
              <button
                onClick={() => { setPage((p) => p + 1); setExpandedId(null) }}
                disabled={!data.hasNext}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
