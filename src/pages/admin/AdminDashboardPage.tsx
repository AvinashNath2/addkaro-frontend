// AdminDashboardPage.tsx — platform administration home screen
//
// Two sections:
//   1. Stats row — platform-wide counts (users, holdings, offers, pending approvals)
//   2. Pending Holdings table — holdings awaiting admin approval, with inline actions
//
// Admin actions:
//   - Approve: transitions PENDING_REVIEW → PUBLISHED
//   - Reject: shows an inline text input for the rejection reason, then sends ADMIN_REJECT
//
// Both mutations invalidate ['pending-holdings'] and ['admin-dashboard'] queries
// so the page updates instantly after an action.

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import {
  getAdminDashboard,
  getPendingHoldings,
  approveHolding,
  rejectHolding,
} from '@/api/admin.api'
import StatCard from '@/components/ui/StatCard'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'

function formatRupees(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function AdminDashboardPage() {
  const queryClient = useQueryClient()

  // Track which holding has the rejection reason input open
  // Key = holdingId, value = the reason text being typed
  const [rejectInputs, setRejectInputs] = useState<Record<string, string>>({})

  // Fetch platform summary stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getAdminDashboard,
  })

  // Fetch pending-review holdings
  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-holdings'],
    queryFn: getPendingHoldings,
  })

  // Refresh all affected queries after any holding action
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['pending-holdings'] })
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['admin-holdings'] })
  }

  // Approve mutation: PENDING_REVIEW → PUBLISHED
  const approveMutation = useMutation({
    mutationFn: (id: string) => approveHolding(id),
    onSuccess: invalidateAll,
  })

  // Reject mutation: PENDING_REVIEW → ADMIN_REJECT
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectHolding(id, reason),
    onSuccess: (_, { id }) => {
      // Clear the reject input for this holding
      setRejectInputs((prev) => {
        const copy = { ...prev }
        delete copy[id]
        return copy
      })
      invalidateAll()
    },
  })

  const handleRejectClick = (holdingId: string) => {
    // Toggle the reject input visibility
    setRejectInputs((prev) =>
      holdingId in prev
        ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== holdingId))
        : { ...prev, [holdingId]: '' },
    )
  }

  const handleRejectSubmit = (holdingId: string) => {
    const reason = rejectInputs[holdingId]?.trim()
    if (!reason) return
    rejectMutation.mutate({ id: holdingId, reason })
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Admin Dashboard</h2>
        <p className="page-subtitle">Platform overview and pending approvals</p>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      {statsLoading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Users"        value={stats.totalUsers}         accent="bg-brand-500" />
          <StatCard label="Customers"          value={stats.totalCustomers}     accent="bg-blue-500" />
          <StatCard label="Owners"             value={stats.totalOwners}        accent="bg-purple-500" />
          <StatCard label="Total Holdings"     value={stats.totalHoldings}      accent="bg-gray-400" />
          <StatCard label="Pending Approvals"  value={stats.pendingApprovals}   accent="bg-yellow-400" />
          <StatCard label="Published Holdings" value={stats.activeHoldings}     accent="bg-green-500" />
          <StatCard label="Delisted"           value={stats.suspendedHoldings}  accent="bg-red-400" />
          <StatCard label="Total Offers"       value={stats.totalOffers}        accent="bg-orange-400" />
        </div>
      )}

      {/* ── Pending Approvals table ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Pending Approvals</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Holdings submitted by owners that need your review
          </p>
        </div>

        {pendingLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
          </div>
        )}

        {pendingData && pendingData.items.length === 0 && (
          <EmptyState message="No pending approvals. You're all caught up!" />
        )}

        {pendingData && pendingData.items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Title</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Owner</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Location</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Size</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Price</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingData.items.map((holding) => (
                  <tr key={holding.id} className="bg-white hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{holding.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{holding.ownerName}</p>
                      <p className="text-xs text-gray-500">{holding.ownerEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      <p className="truncate max-w-xs">{holding.location}</p>
                      <span className="text-xs text-gray-500">{holding.locationType}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {holding.width}×{holding.height} ft
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {formatRupees(holding.rentalCost)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={holding.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          {/* Approve button */}
                          <button
                            onClick={() => approveMutation.mutate(holding.id)}
                            disabled={approveMutation.isPending}
                            className="flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Approve
                          </button>

                          {/* Reject toggle button */}
                          <button
                            onClick={() => handleRejectClick(holding.id)}
                            className="flex items-center gap-1 text-xs font-medium bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
                        </div>

                        {/* Inline rejection reason input — visible only when Reject is clicked */}
                        {holding.id in rejectInputs && (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Reason for rejection…"
                              value={rejectInputs[holding.id]}
                              onChange={(e) =>
                                setRejectInputs((prev) => ({
                                  ...prev,
                                  [holding.id]: e.target.value,
                                }))
                              }
                              className="input-field text-xs py-1.5"
                            />
                            <button
                              onClick={() => handleRejectSubmit(holding.id)}
                              disabled={
                                !rejectInputs[holding.id]?.trim() || rejectMutation.isPending
                              }
                              className="shrink-0 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                            >
                              {rejectMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Send'
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
