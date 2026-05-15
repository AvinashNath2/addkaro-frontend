// AdminHoldingsPage.tsx — full holdings management for admins
//
// Flow: admin clicks "View Details" → modal opens with full holding info
// → admin can approve / reject / delist / re-enable from inside the modal.
// All transitions go through PATCH /admin/holdings/:id/status.

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, CheckCircle, XCircle, AlertTriangle, Eye, MapPin, X } from 'lucide-react'
import {
  getAllAdminHoldings,
  updateAdminHoldingStatus,
} from '@/api/admin.api'
import type { AdminHolding } from '@/types/index'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Pending Review', value: 'PENDING_REVIEW' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Rejected', value: 'ADMIN_REJECT' },
  { label: 'Delisted', value: 'DELISTED_BY_ADMIN' },
  { label: 'Draft', value: 'DRAFT' },
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

export default function AdminHoldingsPage() {
  const queryClient = useQueryClient()
  const [activeStatus, setActiveStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(0)

  // The holding currently open in the detail modal (null = modal closed)
  const [selectedHolding, setSelectedHolding] = useState<AdminHolding | null>(null)

  // Reason inputs for reject / delist
  const [reason, setReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [showDelistInput, setShowDelistInput] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-holdings', activeStatus, currentPage],
    queryFn: () =>
      getAllAdminHoldings({ status: activeStatus || undefined, page: currentPage, limit: 15 }),
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
    setShowDelistInput(false)
  }

  const statusMutation = useMutation({
    mutationFn: ({ toStatus, r }: { toStatus: string; r?: string }) =>
      updateAdminHoldingStatus(selectedHolding!.id, toStatus, r),
    onSuccess: () => { closeModal(); invalidateAll() },
  })

  const handleStatusChange = (status: string) => {
    setActiveStatus(status)
    setCurrentPage(0)
  }

  const openModal = (holding: AdminHolding) => {
    setSelectedHolding(holding)
    setReason('')
    setShowRejectInput(false)
    setShowDelistInput(false)
  }

  const anyPending = statusMutation.isPending

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">All Holdings</h2>
        <p className="text-sm text-gray-500 mt-1">
          Click "View Details" to review a listing before approving or rejecting
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleStatusChange(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeStatus === tab.value
                ? 'bg-white text-brand-600 shadow-sm'
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
        <EmptyState
          message={
            activeStatus
              ? `No ${activeStatus.toLowerCase().replace(/_/g, ' ')} holdings found.`
              : 'No holdings on the platform yet.'
          }
        />
      )}

      {data && data.items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
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
                  <tr key={holding.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 max-w-xs">
                      <p className="font-medium text-gray-900 truncate">{holding.title}</p>
                      {holding.rejectionReason && (
                        <p className="text-xs text-red-600 mt-0.5 truncate">
                          Note: {holding.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{holding.ownerName}</p>
                      <p className="text-xs text-gray-500">{holding.ownerEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs">
                      <p className="truncate">{holding.location}</p>
                      <span className="text-xs text-gray-400">{holding.locationType}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {formatRupees(holding.rentalCost)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={holding.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-600">{holding.offersCount}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openModal(holding)}
                        className="flex items-center gap-1.5 text-xs font-medium text-brand-600 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors"
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

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={!data.hasPrevious}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {data.page + 1} of {data.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={!data.hasNext}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* ── Holding Detail Modal ──────────────────────────────────────────── */}
      {selectedHolding && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Photo */}
            {selectedHolding.photos.length > 0 ? (
              <div className="h-56 rounded-t-2xl overflow-hidden">
                <img
                  src={selectedHolding.photos[0]}
                  alt={selectedHolding.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-48 bg-gray-100 rounded-t-2xl flex items-center justify-center">
                <MapPin className="w-16 h-16 text-gray-300" />
              </div>
            )}

            <div className="p-6">
              {/* Header row: title + status + close */}
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedHolding.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedHolding.location}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={selectedHolding.status} />
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Type</p>
                  <p className="font-medium text-gray-800">{selectedHolding.locationType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Size</p>
                  <p className="font-medium text-gray-800">
                    {selectedHolding.width} × {selectedHolding.height} ft
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Monthly Price</p>
                  <p className="font-semibold text-brand-600">
                    {formatRupees(selectedHolding.rentalCost)}
                  </p>
                </div>
              </div>

              {/* Owner info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm">
                <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">
                  Owner
                </p>
                <p className="font-semibold text-gray-900">{selectedHolding.ownerName}</p>
                <p className="text-gray-500">{selectedHolding.ownerEmail}</p>
                {selectedHolding.ownerVerified && (
                  <p className="text-xs text-green-600 font-medium mt-1">Verified Owner</p>
                )}
              </div>

              {/* Preferred ad types */}
              {selectedHolding.preferredAdTypes.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">
                    Preferred Ad Types
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedHolding.preferredAdTypes.map((t) => (
                      <span
                        key={t}
                        className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Coordinates */}
              {(selectedHolding.latitude || selectedHolding.longitude) && (
                <p className="text-xs text-gray-400 mb-4">
                  Coordinates: {selectedHolding.latitude}, {selectedHolding.longitude}
                </p>
              )}

              {/* Submitted date */}
              <p className="text-xs text-gray-400 mb-4">
                Submitted: {formatDate(selectedHolding.createdAt)}
              </p>

              {/* Existing rejection / delist reason */}
              {selectedHolding.rejectionReason && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 text-sm">
                  <p className="text-xs text-red-400 font-medium uppercase tracking-wide mb-1">
                    Admin Note
                  </p>
                  <p className="text-red-700">{selectedHolding.rejectionReason}</p>
                </div>
              )}

              {/* ── Action buttons ───────────────────────────────────────── */}
              <div className="border-t border-gray-100 pt-4 space-y-3">

                {/* PENDING_REVIEW: Approve + Reject */}
                {selectedHolding.status === 'PENDING_REVIEW' && (
                  <>
                    <button
                      onClick={() => statusMutation.mutate({ toStatus: 'PUBLISHED' })}
                      disabled={anyPending}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {statusMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Approve — Publish Holding
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
                          onClick={() => {
                            if (reason.trim())
                              statusMutation.mutate({ toStatus: 'ADMIN_REJECT', r: reason.trim() })
                          }}
                          disabled={!reason.trim() || anyPending}
                          className="shrink-0 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {statusMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Reject'
                          )}
                        </button>
                        <button
                          onClick={() => { setShowRejectInput(false); setReason('') }}
                          className="shrink-0 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowRejectInput(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject Holding
                      </button>
                    )}
                  </>
                )}

                {/* PUBLISHED: Delist */}
                {selectedHolding.status === 'PUBLISHED' && (
                  <>
                    {showDelistInput ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Reason for delisting (required)…"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="input-field flex-1 text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            if (reason.trim())
                              statusMutation.mutate({ toStatus: 'DELISTED_BY_ADMIN', r: reason.trim() })
                          }}
                          disabled={!reason.trim() || anyPending}
                          className="shrink-0 px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 disabled:opacity-50 transition-colors"
                        >
                          {statusMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Delist'
                          )}
                        </button>
                        <button
                          onClick={() => { setShowDelistInput(false); setReason('') }}
                          className="shrink-0 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDelistInput(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200 text-rose-600 text-sm font-medium hover:bg-rose-50 transition-colors"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Delist Holding
                      </button>
                    )}
                  </>
                )}

                {/* DELISTED_BY_ADMIN: Re-enable */}
                {selectedHolding.status === 'DELISTED_BY_ADMIN' && (
                  <button
                    onClick={() => statusMutation.mutate({ toStatus: 'PUBLISHED' })}
                    disabled={anyPending}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {statusMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Re-enable Holding
                  </button>
                )}

                {/* ADMIN_REJECT: read-only */}
                {selectedHolding.status === 'ADMIN_REJECT' && (
                  <p className="text-center text-sm text-gray-400 py-2">
                    This holding has been rejected. The owner can edit and resubmit.
                  </p>
                )}

                {/* DRAFT / BOOKED / OWNER_PAUSE: read-only */}
                {['DRAFT', 'BOOKED', 'OWNER_PAUSE'].includes(selectedHolding.status) && (
                  <p className="text-center text-sm text-gray-400 py-2">
                    No admin actions available for this status.
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
