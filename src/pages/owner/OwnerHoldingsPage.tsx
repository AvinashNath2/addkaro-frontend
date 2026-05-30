import { useState, Fragment } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Trash2, ChevronDown, ChevronUp, Edit2, MessageCircle } from 'lucide-react'
import {
  getOwnerHoldings,
  deleteHolding,
  getOwnerOffersByHolding,
  revealContact,
  updateOfferStatus,
} from '@/api/owner.api'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import ChatBox from '@/components/chat/ChatBox'
import StatusChangeModal from '@/components/ui/StatusChangeModal'
import { formatRupees, formatDate } from '@/lib/formatters'
import type { OwnerHolding, OwnerOffer } from '@/types'

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Drafts', value: 'DRAFT' },
  { label: 'Pending Review', value: 'PENDING' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Suspended', value: 'SUSPENDED' },
]

type PendingAction = { fromStatus: string; toStatus: string; onConfirm: () => void }

function chatLock(offer: OwnerOffer): string | undefined {
  if (offer.status === 'NEW') return 'Reveal contact to start chatting'
  if (offer.status === 'DECLINED') return 'Chat is locked — offer was declined'
  return undefined
}

// ── Sub-view: offers for a holding ──────────────────────────────────────────
function HoldingOffersPanel({ holdingId }: { holdingId: string }) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [chatOffer, setChatOffer] = useState<{ offerId: string; customerName: string; lockedMessage?: string } | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['owner-offers-by-holding', holdingId, page],
    queryFn: () => getOwnerOffersByHolding(holdingId, page, 5),
  })

  const revealMutation = useMutation({
    mutationFn: revealContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-offers-by-holding', holdingId] })
      queryClient.invalidateQueries({ queryKey: ['owner-dashboard'] })
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ offerId, status }: { offerId: string; status: string }) =>
      updateOfferStatus(offerId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-offers-by-holding', holdingId] })
      queryClient.invalidateQueries({ queryKey: ['owner-dashboard'] })
    },
  })

  const confirm = (fromStatus: string, toStatus: string, onConfirm: () => void) =>
    setPendingAction({ fromStatus, toStatus, onConfirm })

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
          lockedMessage={chatOffer.lockedMessage}
        />
      )}
      {pendingAction && (
        <StatusChangeModal
          fromStatus={pendingAction.fromStatus}
          toStatus={pendingAction.toStatus}
          onConfirm={pendingAction.onConfirm}
          onCancel={() => setPendingAction(null)}
        />
      )}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Offers ({data.totalElements})
      </p>
      <div className="space-y-2">
        {data.items.map((offer) => (
          <div key={offer.offerId} className="bg-white border border-gray-100 rounded-lg px-4 py-3 text-sm">
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
                {offer.message && <p className="text-xs text-gray-500 mt-1 italic">"{offer.message}"</p>}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <StatusBadge status={offer.status} />
                <p className="text-xs text-gray-500">{formatDate(offer.createdAt)}</p>
              </div>
            </div>

            <div className="flex gap-2 mt-2 flex-wrap">
              {/* Chat — always visible; locked for NEW and DECLINED */}
              <button
                onClick={() => setChatOffer({ offerId: offer.offerId, customerName: offer.customerName, lockedMessage: chatLock(offer) })}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-opacity"
                style={{ background: '#1a3560', color: '#ffffff' }}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                {offer.status === 'NEW' ? 'View Message' : 'Chat'}
              </button>

              {/* Reveal Contact — only for NEW */}
              {offer.status === 'NEW' && (
                <button
                  onClick={() => confirm('NEW', 'CONTACTED', () => revealMutation.mutate(offer.offerId))}
                  disabled={revealMutation.isPending}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Reveal Contact
                </button>
              )}

              {/* Active status actions — CONTACTED or NEGOTIATING */}
              {(offer.status === 'CONTACTED' || offer.status === 'NEGOTIATING') && (
                <>
                  <button
                    onClick={() => confirm(offer.status, 'NEGOTIATING', () => statusMutation.mutate({ offerId: offer.offerId, status: 'NEGOTIATING' }))}
                    disabled={statusMutation.isPending || offer.status === 'NEGOTIATING'}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    Negotiating
                  </button>
                  <button
                    onClick={() => confirm(offer.status, 'CLOSED', () => statusMutation.mutate({ offerId: offer.offerId, status: 'CLOSED' }))}
                    disabled={statusMutation.isPending}
                    className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 disabled:opacity-40 transition-colors"
                  >
                    Close Deal
                  </button>
                  <button
                    onClick={() => confirm(offer.status, 'DECLINED', () => statusMutation.mutate({ offerId: offer.offerId, status: 'DECLINED' }))}
                    disabled={statusMutation.isPending}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 disabled:opacity-40 transition-colors"
                  >
                    Decline
                  </button>
                </>
              )}

              {/* Reopen from DECLINED */}
              {offer.status === 'DECLINED' && (
                <button
                  onClick={() => confirm('DECLINED', 'NEGOTIATING', () => statusMutation.mutate({ offerId: offer.offerId, status: 'NEGOTIATING' }))}
                  disabled={statusMutation.isPending}
                  className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 transition-colors"
                >
                  Move to Negotiating
                </button>
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
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">Page {data.page + 1} of {data.totalPages}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data.hasNext}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

// ── Sub-view panel (expands below a selected holding row) ──────────────────
function HoldingSubView({ holding }: { holding: OwnerHolding }) {
  const navigate = useNavigate()
  const canEdit = holding.status === 'DRAFT' || holding.status === 'PENDING' || holding.status === 'REJECTED'

  return (
    <div className="bg-gray-50 border-t border-gray-100 px-6 py-5">
      <div className="flex flex-wrap items-start gap-4 justify-between mb-4">
        <div className="space-y-1 text-sm text-gray-500 min-w-0">
          <p><span className="font-medium text-gray-900">Size:</span> {holding.width ?? '—'} × {holding.height ?? '—'} ft</p>
          <p><span className="font-medium text-gray-900">Price:</span> {holding.rentalCost != null ? formatRupees(holding.rentalCost) : '—'}/mo</p>
          <p><span className="font-medium text-gray-900">Type:</span> {holding.locationType ?? '—'}</p>
          <p>
            <span className="font-medium text-gray-900">Status:</span>{' '}
            <StatusBadge status={holding.status} />
          </p>
          {(holding.status === 'REJECTED' || holding.status === 'SUSPENDED') && holding.rejectionReason && (
            <p className="text-xs text-red-500">Admin note: {holding.rejectionReason}</p>
          )}
        </div>

        {canEdit && (
          <button
            onClick={() => navigate(`/owner/holdings/${holding.id}/edit`)}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors shrink-0"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit Listing
          </button>
        )}
      </div>

      <HoldingOffersPanel holdingId={holding.id} />
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function OwnerHoldingsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [activeStatus, setActiveStatus] = useState<string>((location.state as { initialStatus?: string } | null)?.initialStatus ?? '')
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
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeStatus === tab.value
                ? 'border-b-2 border-gray-900 text-gray-900'
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
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600">
          Failed to load your listings. Please try again.
        </div>
      )}

      {data && data.items.length === 0 && (
        <EmptyState message="No listings found. Click 'Add New Listing' to create your first hoarding." />
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
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
                          expandedId === holding.id ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
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
                        <td className="px-6 py-4 text-gray-500 max-w-xs">
                          <span className="truncate block">{holding.location}</span>
                          <span className="text-xs text-gray-400">{holding.locationType}</span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {holding.rentalCost != null ? formatRupees(holding.rentalCost) : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={holding.status} />
                        </td>
                        <td className="px-6 py-4 text-gray-500">{holding.offersCount}</td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          {(holding.status === 'PENDING' || holding.status === 'REJECTED') && (
                            <button
                              onClick={() => handleDelete(holding.id, holding.title)}
                              disabled={deleteMutation.isPending}
                              className="flex items-center gap-1 text-xs font-medium bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>

                      {expandedId === holding.id && (
                        <tr className="border-b border-gray-100">
                          <td colSpan={7} className="p-0">
                            <HoldingSubView holding={holding} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => { setPage((p) => Math.max(0, p - 1)); setExpandedId(null) }}
                disabled={!data.hasPrevious}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {data.page + 1} of {data.totalPages} · {data.totalElements} listings
              </span>
              <button
                onClick={() => { setPage((p) => p + 1); setExpandedId(null) }}
                disabled={!data.hasNext}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
