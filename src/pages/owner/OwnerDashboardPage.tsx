import { useState, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Loader2, ArrowRight, ChevronDown, ChevronUp, MessageCircle,
  Clock, CheckCircle2, XCircle, PauseCircle, ExternalLink,
} from 'lucide-react'
import { getOwnerDashboard, getOwnerOffers, revealContact, updateOfferStatus } from '@/api/owner.api'
import StatCard from '@/components/ui/StatCard'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import ChatBox from '@/components/chat/ChatBox'
import StatusChangeModal from '@/components/ui/StatusChangeModal'
import { formatRupees, formatDate } from '@/lib/formatters'
import type { OwnerOffer, OwnerDashboard } from '@/types'

type PendingAction = { fromStatus: string; toStatus: string; onConfirm: () => void }

function chatLock(offer: OwnerOffer): string | undefined {
  if (offer.status === 'NEW') return 'Reveal contact to start chatting'
  if (offer.status === 'DECLINED') return 'Chat is locked — offer was declined'
  return undefined
}

// ── Stage definitions ─────────────────────────────────────────────────────────
type StageKey = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED'

interface Stage {
  key: StageKey
  label: string
  icon: React.ElementType
  accent: string
  bg: string
  border: string
  description: string
  next: string
  cta: string
  ctaStatus: string
}

const STAGES: Stage[] = [
  {
    key: 'PENDING',
    label: 'Pending Review',
    icon: Clock,
    accent: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    description: 'Your listing has been submitted and is waiting for an admin to review it. It is not yet visible to customers on the browse map.',
    next: 'Once approved, it moves to Active. If rejected, you will see the admin\'s note and can edit & resubmit.',
    cta: 'View Pending',
    ctaStatus: 'PENDING',
  },
  {
    key: 'ACTIVE',
    label: 'Active',
    icon: CheckCircle2,
    accent: '#059669',
    bg: '#f0fdf4',
    border: '#6ee7b7',
    description: 'Your listing is live on the public browse map and search results. Customers can view it and submit offers.',
    next: 'Monitor incoming offers from your dashboard. Reveal contact details to unlock chat with interested customers.',
    cta: 'View Active',
    ctaStatus: 'ACTIVE',
  },
  {
    key: 'REJECTED',
    label: 'Rejected',
    icon: XCircle,
    accent: '#dc2626',
    bg: '#fff1f2',
    border: '#fca5a5',
    description: 'Admin has reviewed your listing and rejected it, usually with a note explaining why.',
    next: 'Go to My Listings, read the admin note, make the necessary changes, and resubmit for review.',
    cta: 'View Rejected',
    ctaStatus: 'REJECTED',
  },
  {
    key: 'SUSPENDED',
    label: 'Suspended',
    icon: PauseCircle,
    accent: '#4b5563',
    bg: '#f9fafb',
    border: '#d1d5db',
    description: 'Admin has temporarily hidden this listing from the public browse map, usually due to a policy concern.',
    next: 'Contact support for more details. Your other listings are unaffected.',
    cta: 'View Suspended',
    ctaStatus: 'SUSPENDED',
  },
]

// ── Holdings lifecycle component ──────────────────────────────────────────────
function HoldingsLifecycle({
  stats,
  activeStage,
  onStageClick,
}: {
  stats: OwnerDashboard
  activeStage: StageKey | null
  onStageClick: (key: StageKey) => void
}) {
  const navigate = useNavigate()

  const countFor = (key: StageKey): number => {
    if (key === 'PENDING')   return stats.pendingHoldings
    if (key === 'ACTIVE')    return stats.activeHoldings
    if (key === 'REJECTED')  return stats.rejectedHoldings
    if (key === 'SUSPENDED') return stats.suspendedHoldings
    return 0
  }

  const activeInfo = activeStage ? STAGES.find((s) => s.key === activeStage) : null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
        Holdings Lifecycle — click a tile above to explore each stage
      </p>

      {/* Flow nodes */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {STAGES.map((stage, i) => {
          const Icon = stage.icon
          const count = countFor(stage.key)
          const isActive = activeStage === stage.key

          return (
            <div key={stage.key} className="flex items-center gap-2">
              <button
                onClick={() => onStageClick(stage.key)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 text-left"
                style={{
                  background: isActive ? stage.bg : '#f9fafb',
                  borderColor: isActive ? stage.accent : '#e5e7eb',
                  boxShadow: isActive ? `0 0 0 3px ${stage.accent}22` : undefined,
                  transform: isActive ? 'translateY(-1px)' : undefined,
                }}
              >
                <Icon
                  className="w-4 h-4 shrink-0 transition-colors"
                  style={{ color: isActive ? stage.accent : '#9ca3af' }}
                />
                <div className="text-left">
                  <p
                    className="text-xs font-bold leading-tight transition-colors"
                    style={{ color: isActive ? stage.accent : '#6b7280' }}
                  >
                    {stage.label}
                  </p>
                  <p
                    className="text-lg font-extrabold leading-tight"
                    style={{ color: isActive ? stage.accent : '#111827' }}
                  >
                    {count}
                  </p>
                </div>
              </button>

              {i < STAGES.length - 1 && (
                <span className="text-gray-200 font-light text-xl select-none">→</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Detail panel — slides in when a stage is selected */}
      {activeInfo && (
        <div
          className="rounded-xl border p-4 animate-fade-up"
          style={{ background: activeInfo.bg, borderColor: activeInfo.border }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <activeInfo.icon className="w-4 h-4 shrink-0" style={{ color: activeInfo.accent }} />
                <p className="font-bold text-sm" style={{ color: activeInfo.accent }}>
                  {activeInfo.label}
                  <span className="ml-2 font-extrabold text-base">{countFor(activeInfo.key)}</span>
                  <span className="text-xs font-medium ml-1">listing{countFor(activeInfo.key) !== 1 ? 's' : ''}</span>
                </p>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-2">{activeInfo.description}</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                <span className="font-semibold text-gray-600">What's next: </span>
                {activeInfo.next}
              </p>
            </div>
            <button
              onClick={() => navigate('/owner/holdings', { state: { initialStatus: activeInfo.ctaStatus } })}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border font-semibold shrink-0 transition-colors hover:opacity-80"
              style={{ borderColor: activeInfo.accent, color: activeInfo.accent, background: 'white' }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {activeInfo.cta}
            </button>
          </div>
        </div>
      )}

      {!activeInfo && (
        <p className="text-xs text-gray-400 text-center py-2">
          Click any stage above to see what it means and what to do next.
        </p>
      )}
    </div>
  )
}

// ── Expanded offer detail panel ───────────────────────────────────────────────
function OfferDetailPanel({
  offer,
  onChat,
  onConfirmAction,
  revealPending,
  statusPending,
}: {
  offer: OwnerOffer
  onChat: () => void
  onConfirmAction: (fromStatus: string, toStatus: string, fn: () => void) => void
  revealPending: boolean
  statusPending: boolean
}) {
  return (
    <div className="bg-gray-50 border-t border-gray-100 px-6 py-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-2 text-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Offer Details</p>
          <div className="flex justify-between">
            <span className="text-gray-500">Offered price</span>
            <span className="font-semibold">{formatRupees(offer.offeredPrice)}/mo</span>
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
              <span className="text-gray-500">Contact</span>
              <span>📞 {offer.contactNumber}</span>
            </div>
          )}
          {!offer.contactNumber && offer.status === 'NEW' && (
            <div className="flex justify-between">
              <span className="text-gray-500">Contact</span>
              <span className="text-gray-400 italic text-xs">Hidden — reveal to see</span>
            </div>
          )}
          {offer.message && (
            <div className="mt-2">
              <p className="text-gray-500 mb-1">Message</p>
              <p className="italic text-gray-500 bg-white rounded-lg border border-gray-200 px-3 py-2 text-xs leading-relaxed">
                "{offer.message}"
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onChat}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: '#1a3560', color: '#ffffff' }}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {offer.status === 'NEW' ? 'View Message' : 'Chat'}
            </button>
            {offer.status === 'NEW' && (
              <button
                onClick={() => onConfirmAction('NEW', 'CONTACTED', () => {})}
                disabled={revealPending}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {revealPending && <Loader2 className="w-3 h-3 animate-spin" />}
                Reveal Contact
              </button>
            )}
            {(offer.status === 'CONTACTED' || offer.status === 'NEGOTIATING') && (
              <>
                <button
                  onClick={() => onConfirmAction(offer.status, 'NEGOTIATING', () => {})}
                  disabled={statusPending || offer.status === 'NEGOTIATING'}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  Negotiating
                </button>
                <button
                  onClick={() => onConfirmAction(offer.status, 'CLOSED', () => {})}
                  disabled={statusPending}
                  className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 disabled:opacity-40 transition-colors"
                >
                  Close Deal
                </button>
                <button
                  onClick={() => onConfirmAction(offer.status, 'DECLINED', () => {})}
                  disabled={statusPending}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 disabled:opacity-40 transition-colors"
                >
                  Decline
                </button>
              </>
            )}
            {offer.status === 'DECLINED' && (
              <button
                onClick={() => onConfirmAction('DECLINED', 'NEGOTIATING', () => {})}
                disabled={statusPending}
                className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 transition-colors"
              >
                Move to Negotiating
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OwnerDashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeStage, setActiveStage] = useState<StageKey | null>(null)
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null)
  const [chatOffer, setChatOffer] = useState<{ offerId: string; customerName: string; lockedMessage?: string } | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['owner-dashboard'],
    queryFn: getOwnerDashboard,
  })

  const { data: offersData, isLoading: offersLoading } = useQuery({
    queryKey: ['owner-offers'],
    queryFn: () => getOwnerOffers(),
  })

  const recentOffers = offersData?.items.slice(0, 5) ?? []

  const revealMutation = useMutation({
    mutationFn: revealContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-offers'] })
      queryClient.invalidateQueries({ queryKey: ['owner-dashboard'] })
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ offerId, status }: { offerId: string; status: string }) =>
      updateOfferStatus(offerId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-offers'] })
      queryClient.invalidateQueries({ queryKey: ['owner-dashboard'] })
    },
  })

  // Map stat card click → lifecycle stage
  const handleStatClick = (stage: StageKey) => {
    setActiveStage((prev) => (prev === stage ? null : stage))
  }

  return (
    <div>
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

      <div className="page-header">
        <h2 className="page-title">Dashboard</h2>
        <p className="page-subtitle">Overview of your listings and offers</p>
      </div>

      {statsLoading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {stats && (
        <>
          {/* ── Stat cards ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Listings"
              value={stats.totalHoldings}
              accent="bg-brand-500"
              onClick={() => navigate('/owner/holdings')}
            />
            <StatCard
              label="Active Listings"
              value={stats.activeHoldings}
              accent="bg-green-500"
              onClick={() => handleStatClick('ACTIVE')}
            />
            <StatCard
              label="Pending Review"
              value={stats.pendingHoldings}
              accent="bg-yellow-400"
              onClick={() => handleStatClick('PENDING')}
            />
            <StatCard
              label="Rejected"
              value={stats.rejectedHoldings}
              accent="bg-red-400"
              onClick={() => handleStatClick('REJECTED')}
            />
            <StatCard label="Total Offers"  value={stats.totalOffersReceived} accent="bg-purple-500" />
            <StatCard label="New Offers"    value={stats.newOffers}           accent="bg-blue-500" />
            <StatCard label="Negotiations"  value={stats.activeNegotiations}  accent="bg-orange-400" />
          </div>

          {/* ── Interactive lifecycle ────────────────────────────────────── */}
          <HoldingsLifecycle
            stats={stats}
            activeStage={activeStage}
            onStageClick={(key) => setActiveStage((prev) => (prev === key ? null : key))}
          />
        </>
      )}

      {/* ── Recent offers table ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Recent Offers</h3>
          <button
            onClick={() => navigate('/owner/holdings')}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            View All Listings
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {offersLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        )}

        {!offersLoading && recentOffers.length === 0 && (
          <EmptyState message="No offers received yet. Once customers submit offers on your listings, they'll appear here." />
        )}

        {recentOffers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 w-8"></th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Customer</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Holding</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Offered Price</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOffers.map((offer) => (
                  <Fragment key={offer.offerId}>
                    <tr
                      onClick={() => setExpandedOfferId((prev) => prev === offer.offerId ? null : offer.offerId)}
                      className={`cursor-pointer transition-colors ${
                        expandedOfferId === offer.offerId ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-4 text-gray-400">
                        {expandedOfferId === offer.offerId
                          ? <ChevronUp className="w-4 h-4" />
                          : <ChevronDown className="w-4 h-4" />}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{offer.customerName}</p>
                        {offer.contactNumber && offer.status !== 'NEW' && (
                          <p className="text-xs text-gray-500 font-normal mt-0.5">{offer.contactNumber}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{offer.holdingTitle}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {formatRupees(offer.offeredPrice)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={offer.status} />
                      </td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(offer.createdAt)}</td>
                    </tr>

                    {expandedOfferId === offer.offerId && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <OfferDetailPanel
                            offer={offer}
                            onChat={() => setChatOffer({
                              offerId: offer.offerId,
                              customerName: offer.customerName,
                              lockedMessage: chatLock(offer),
                            })}
                            onConfirmAction={(fromStatus, toStatus, _fn) => {
                              const actualFn = toStatus === 'CONTACTED'
                                ? () => revealMutation.mutate(offer.offerId)
                                : () => statusMutation.mutate({ offerId: offer.offerId, status: toStatus })
                              setPendingAction({ fromStatus, toStatus, onConfirm: actualFn })
                            }}
                            revealPending={revealMutation.isPending && revealMutation.variables === offer.offerId}
                            statusPending={statusMutation.isPending}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
