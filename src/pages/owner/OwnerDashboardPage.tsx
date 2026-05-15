// OwnerDashboardPage.tsx — owner's home screen
//
// Shows:
//   1. A row of stat cards (total listings, active, pending, rejected, offers)
//   2. A preview table of recent offers received (first 5)
//
// Two separate queries run in parallel:
//   - getOwnerDashboard()  → summary counts for stat cards
//   - getOwnerOffers()     → recent offers for the table

import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2, ArrowRight } from 'lucide-react'
import { getOwnerDashboard, getOwnerOffers } from '@/api/owner.api'
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function OwnerDashboardPage() {
  const navigate = useNavigate()

  // Fetch dashboard summary counts
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['owner-dashboard'],
    queryFn: getOwnerDashboard,
  })

  // Fetch recent offers — we show only the first 5 in the preview table
  const { data: offersData, isLoading: offersLoading } = useQuery({
    queryKey: ['owner-offers'],
    queryFn: () => getOwnerOffers(),
  })

  // The first 5 offers for the preview table
  const recentOffers = offersData?.items.slice(0, 5) ?? []

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Dashboard</h2>
        <p className="page-subtitle">Overview of your listings and offers</p>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      {statsLoading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Listings"   value={stats.totalHoldings}        accent="bg-brand-500" />
          <StatCard label="Active Listings"  value={stats.activeHoldings}       accent="bg-green-500" />
          <StatCard label="Pending Review"   value={stats.pendingHoldings}      accent="bg-yellow-400" />
          <StatCard label="Rejected"         value={stats.rejectedHoldings}     accent="bg-red-400" />
          <StatCard label="Total Offers"     value={stats.totalOffersReceived}  accent="bg-purple-500" />
          <StatCard label="New Offers"       value={stats.newOffers}            accent="bg-blue-500" />
          <StatCard label="Negotiations"     value={stats.activeNegotiations}   accent="bg-orange-400" />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        {/* Section header with "View All" link */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Recent Offers</h3>
          <button
            onClick={() => navigate('/owner/holdings')}
            className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            View All Listings
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {offersLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
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
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Customer</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Holding</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Offered Price</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOffers.map((offer) => (
                  <tr key={offer.offerId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {offer.customerName}
                      {/* Show contact number only if it's been revealed (status != NEW) */}
                      {offer.contactNumber && offer.status !== 'NEW' && (
                        <p className="text-xs text-gray-500 font-normal mt-0.5">
                          {offer.contactNumber}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{offer.holdingTitle}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {formatRupees(offer.offeredPrice)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={offer.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(offer.createdAt)}</td>
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
