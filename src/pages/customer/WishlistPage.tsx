// WishlistPage.tsx — customer's saved hoardings
//
// Shows a grid of saved holdings. Each card has:
//   - Holding details (name, location, size, price)
//   - "View Details" button to go to the detail page
//   - "Remove" button to remove from wishlist
//
// When "Remove" is clicked, useMutation fires the DELETE request, then
// we invalidate the ['wishlist'] query so the grid refreshes without the removed item.

import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Loader2, Trash2 } from 'lucide-react'
import { getWishlist, removeFromWishlist } from '@/api/customer.api'
import StatusBadge from '@/components/ui/StatusBadge'

function formatRupees(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function WishlistPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch all wishlist items for the logged-in customer
  const { data: items, isLoading, isError } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
  })

  // Remove-from-wishlist mutation
  const removeMutation = useMutation({
    mutationFn: (holdingId: string) => removeFromWishlist(holdingId),
    onSuccess: () => {
      // Re-fetch the wishlist so the removed card disappears
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      // Also reset the check state for individual holding detail pages
      queryClient.invalidateQueries({ queryKey: ['wishlist-check'] })
    },
  })

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Wishlist</h2>
        <p className="text-sm text-gray-500 mt-1">
          Hoardings you've saved for later consideration
        </p>
      </div>

      {/* Loading spinner */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          Failed to load your wishlist. Please try again.
        </div>
      )}

      {/* Empty state */}
      {items && items.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm mb-4">
            Your wishlist is empty. Browse hoardings to save ones you like.
          </p>
          <button
            onClick={() => navigate('/browse')}
            className="btn-primary w-auto px-6"
          >
            Browse Hoardings
          </button>
        </div>
      )}

      {/* Wishlist cards grid */}
      {items && items.length > 0 && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {items.length} saved listing{items.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Card photo or placeholder */}
                <div className="h-40 bg-gray-100 relative">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                  {/* Availability badge on the photo */}
                  <div className="absolute bottom-2 left-2">
                    <StatusBadge status={item.status} />
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
                      {item.title}
                    </h3>
                    <span className="shrink-0 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                      {item.locationType}
                    </span>
                  </div>

                  <p className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-gray-500">
                      {item.width} × {item.height} ft
                    </span>
                    <span className="text-sm font-bold text-brand-600">
                      {formatRupees(item.rentalCost)}/mo
                    </span>
                  </div>

                  {/* Actions row */}
                  <div className="flex gap-2">
                    {/* View Details navigates to the holding detail page */}
                    <button
                      onClick={() => navigate(`/holdings/${item.holdingId}`)}
                      className="flex-1 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
                    >
                      View Details
                    </button>

                    {/* Remove from wishlist */}
                    <button
                      onClick={() => removeMutation.mutate(item.holdingId)}
                      disabled={removeMutation.isPending}
                      className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
