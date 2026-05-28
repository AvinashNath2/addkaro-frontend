import { useState, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, ChevronDown, ChevronUp, ExternalLink, MessageCircle, Edit2 } from 'lucide-react'
import { getMyOffers, withdrawOffer } from '@/api/customer.api'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import ChatBox from '@/components/chat/ChatBox'
import type { OfferStatus, CustomerOffer } from '@/types/index'

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'New', value: 'NEW' },
  { label: 'Contacted', value: 'CONTACTED' },
  { label: 'Negotiating', value: 'NEGOTIATING' },
  { label: 'Closed', value: 'CLOSED' },
  { label: 'Declined', value: 'DECLINED' },
]

function formatRupees(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ── Status descriptions shown in the detail panel ────────────────────────────
const STATUS_INFO: Record<OfferStatus, string> = {
  NEW: 'Your offer has been submitted and is waiting for the owner to review it.',
  CONTACTED: 'The owner has viewed your contact details and may reach out to you.',
  NEGOTIATING: 'The owner is interested and you are in negotiation.',
  CLOSED: 'This offer has been closed — a deal was reached.',
  DECLINED: 'The owner has declined this offer.',
  WITHDRAWN: 'You have withdrawn this offer.',
}

// ── Expanded offer detail panel ───────────────────────────────────────────────
function OfferDetailPanel({
  offer,
  onWithdraw,
  withdrawing,
  onNavigate,
  onChat,
  onEdit,
}: {
  offer: CustomerOffer
  onWithdraw: () => void
  withdrawing: boolean
  onNavigate: () => void
  onChat: () => void
  onEdit: () => void
}) {
  return (
    <div className="bg-gray-50 border-t border-gray-100 px-6 py-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Left: offer details */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Offer Details</p>
          <div className="space-y-2 text-sm text-gray-900">
            <div className="flex justify-between">
              <span className="text-gray-500">Your offer</span>
              <span className="font-semibold" style={{ color: '#C9F31D', WebkitTextStroke: '0.5px #999' }}>{formatRupees(offer.offeredPrice)}/mo</span>
            </div>
            {offer.desiredStartDate && (
              <div className="flex justify-between">
                <span className="text-gray-500">Start date</span>
                <span>{formatDate(offer.desiredStartDate)}</span>
              </div>
            )}
            {offer.desiredDuration && (
              <div className="flex justify-between">
                <span className="text-gray-500">Duration</span>
                <span>{offer.desiredDuration} days</span>
              </div>
            )}
            {offer.contactNumber && (
              <div className="flex justify-between">
                <span className="text-gray-500">Your contact</span>
                <span>{offer.contactNumber}</span>
              </div>
            )}
            {offer.message && (
              <div>
                <p className="text-gray-500 mb-1">Message to owner</p>
                <p className="italic text-gray-500 bg-white rounded-lg border border-gray-200 px-3 py-2 text-xs leading-relaxed">
                  "{offer.message}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: status + actions */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={offer.status} />
              <span className="text-xs text-gray-400">· {formatDate(offer.createdAt)}</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              {STATUS_INFO[offer.status as OfferStatus]}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {offer.status !== 'NEW' && (
              <button
                onClick={onChat}
                className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Chat with Owner
              </button>
            )}

            <button
              onClick={onNavigate}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Listing
            </button>

            {offer.status === ('NEW' as OfferStatus) && (
              <>
                <button
                  onClick={onEdit}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Offer
                </button>
                <button
                  onClick={onWithdraw}
                  disabled={withdrawing}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-red-200 text-red-600 bg-white hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {withdrawing && <Loader2 className="w-3 h-3 animate-spin" />}
                  Withdraw Offer
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MyOffersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [activeStatus, setActiveStatus] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)
  const [chatOffer, setChatOffer] = useState<{ offerId: string; holdingTitle: string; lockedMessage?: string } | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-offers', activeStatus, currentPage],
    queryFn: () => getMyOffers(activeStatus || undefined, currentPage, 10),
  })

  const withdrawMutation = useMutation({
    mutationFn: withdrawOffer,
    onSuccess: () => {
      setWithdrawingId(null)
      setWithdrawError(null)
      setExpandedId(null)
      queryClient.invalidateQueries({ queryKey: ['my-offers'] })
    },
    onError: (err: Error) => {
      setWithdrawingId(null)
      setWithdrawError(err.message ?? 'Failed to withdraw offer. Please try again.')
    },
  })

  const handleWithdraw = (offerId: string, holdingTitle: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to withdraw your offer for "${holdingTitle}"? This cannot be undone.`,
    )
    if (confirmed) {
      setWithdrawError(null)
      setWithdrawingId(offerId)
      withdrawMutation.mutate(offerId)
    }
  }

  return (
    <div>
      {chatOffer && (
        <ChatBox
          offerId={chatOffer.offerId}
          offerLabel={`Chat — ${chatOffer.holdingTitle}`}
          onClose={() => setChatOffer(null)}
          lockedMessage={chatOffer.lockedMessage}
        />
      )}

      {withdrawError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {withdrawError}
        </div>
      )}

      <div className="page-header">
        <h2 className="page-title">My Offers</h2>
        <p className="page-subtitle">Track the status of all your submitted offers</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto border border-gray-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setActiveStatus(tab.value); setCurrentPage(0); setExpandedId(null) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeStatus === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
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
          Failed to load your offers. Please try again.
        </div>
      )}

      {data && data.items.length === 0 && (
        <EmptyState
          message={
            activeStatus
              ? `No ${activeStatus.toLowerCase()} offers found.`
              : "You haven't submitted any offers yet. Browse hoardings to make your first offer."
          }
        />
      )}

      {data && data.items.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 w-8"></th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Holding</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Location</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Offered Price</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((offer) => (
                  <Fragment key={offer.offerId}>
                    <tr
                      onClick={() => setExpandedId((prev) => prev === offer.offerId ? null : offer.offerId)}
                      className={`cursor-pointer transition-colors ${
                        expandedId === offer.offerId ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-4 text-gray-400">
                        {expandedId === offer.offerId
                          ? <ChevronUp className="w-4 h-4" />
                          : <ChevronDown className="w-4 h-4" />}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{offer.holdingTitle}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{offer.holdingLocation}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {formatRupees(offer.offeredPrice)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={offer.status} />
                      </td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(offer.createdAt)}</td>
                    </tr>

                    {expandedId === offer.offerId && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <OfferDetailPanel
                            offer={offer}
                            onWithdraw={() => handleWithdraw(offer.offerId, offer.holdingTitle)}
                            withdrawing={withdrawingId === offer.offerId}
                            onNavigate={() => navigate(`/holdings/${offer.holdingId}`, { state: { existingOffer: offer } })}
                            onChat={() => setChatOffer({ offerId: offer.offerId, holdingTitle: offer.holdingTitle, lockedMessage: offer.status === 'DECLINED' ? 'Chat is locked — this offer was declined' : undefined })}
                            onEdit={() => navigate(`/holdings/${offer.holdingId}`, { state: { editOffer: offer } })}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={() => { setCurrentPage((p) => Math.max(0, p - 1)); setExpandedId(null) }}
            disabled={!data.hasPrevious}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {data.page + 1} of {data.totalPages} · {data.totalElements} offers
          </span>
          <button
            onClick={() => { setCurrentPage((p) => p + 1); setExpandedId(null) }}
            disabled={!data.hasNext}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
