import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, CheckCircle, XCircle, AlertTriangle, Eye, MapPin, X } from 'lucide-react'
import {
  getAllAdminHoldings,
  approveHolding,
  rejectHolding,
  suspendHolding,
} from '@/api/admin.api'
import type { AdminHolding } from '@/types/index'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Pending Review', value: 'PENDING' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Suspended', value: 'SUSPENDED' },
]

function formatRupees(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
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

      {/* ── Holding Detail Modal ──────────────────────────────────────────── */}
      {selectedHolding && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
            {selectedHolding.photos.length > 0 ? (
              <div className="h-56 rounded-t-2xl overflow-hidden">
                <img src={selectedHolding.photos[0]} alt={selectedHolding.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="h-48 bg-gray-100 rounded-t-2xl flex items-center justify-center">
                <MapPin className="w-16 h-16 text-gray-400" />
              </div>
            )}

            <div className="p-6">
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
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Type</p>
                  <p className="font-medium text-gray-900">{selectedHolding.locationType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Size</p>
                  <p className="font-medium text-gray-900">{selectedHolding.width} × {selectedHolding.height} ft</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Monthly Price</p>
                  <p className="font-semibold text-gray-900">{formatRupees(selectedHolding.rentalCost)}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm border border-gray-100">
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Owner</p>
                <p className="font-semibold text-gray-900">{selectedHolding.ownerName}</p>
                <p className="text-gray-500">{selectedHolding.ownerEmail}</p>
                {selectedHolding.ownerVerified && (
                  <p className="text-xs text-emerald-700 font-medium mt-1">Verified Owner</p>
                )}
              </div>

              <p className="text-xs text-gray-500 mb-4">Submitted: {formatDate(selectedHolding.createdAt)}</p>

              {selectedHolding.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm">
                  <p className="text-xs text-red-700 font-medium uppercase tracking-wide mb-1">Admin Note</p>
                  <p className="text-red-700">{selectedHolding.rejectionReason}</p>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 space-y-3">
                {/* PENDING: Approve + Reject */}
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

                {/* ACTIVE: Suspend */}
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

                {/* REJECTED / SUSPENDED: read-only */}
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
