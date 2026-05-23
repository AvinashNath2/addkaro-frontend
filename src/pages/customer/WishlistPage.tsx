import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Loader2, Trash2, Building2, Ruler, CheckCircle2, ArrowRight, Heart } from 'lucide-react'
import { getWishlist, removeFromWishlist } from '@/api/customer.api'
import StatusBadge from '@/components/ui/StatusBadge'
import type { WishlistItem } from '@/types/index'

function formatRupees(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatSavedDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function WishlistCard({
  item,
  onRemove,
  removing,
}: {
  item: WishlistItem
  onRemove: () => void
  removing: boolean
}) {
  const navigate = useNavigate()
  const sqft = item.width * item.height

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card hover:shadow-card-md transition-all duration-200 hover:-translate-y-0.5 group">

      {/* ── Image ──────────────────────────────────────────────────────── */}
      <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Building2 className="w-10 h-10 text-slate-300" />
            <span className="text-xs text-slate-400 font-medium">No photo</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Top-left: location type */}
        <span
          className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full text-white"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
        >
          {item.locationType}
        </span>

        {/* Top-right: remove button */}
        <button
          onClick={onRemove}
          disabled={removing}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all"
          style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
          title="Remove from wishlist"
        >
          {removing
            ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            : <Heart className="w-4 h-4 fill-red-500 text-red-500" />
          }
        </button>

        {/* Bottom overlay: price + verified */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 flex items-end justify-between">
          <div>
            <p className="text-white font-extrabold text-lg leading-none drop-shadow-sm">
              {formatRupees(item.rentalCost)}
            </p>
            <p className="text-white/70 text-[11px] font-medium">per month</p>
          </div>
          <div className="flex gap-1.5">
            <div className="shrink-0">
              <StatusBadge status={item.status} />
            </div>
            {item.ownerVerified && (
              <span
                className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: 'rgba(16,185,129,0.85)', backdropFilter: 'blur(6px)' }}
              >
                <CheckCircle2 className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="px-4 pt-3.5 pb-4 space-y-3">

        {/* Title + location */}
        <div>
          <h3 className="font-bold text-gray-900 text-[14px] leading-snug line-clamp-1">{item.title}</h3>
          <div className="flex items-center gap-1 text-[12px] text-gray-400 mt-0.5">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
        </div>

        {/* Stat pills */}
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
            <Ruler className="w-3 h-3 text-gray-400" />
            {item.width} × {item.height} ft
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
            {sqft.toLocaleString('en-IN')} sqft
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
            Saved {formatSavedDate(item.savedAt)}
          </span>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate(`/holdings/${item.holdingId}`)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
        >
          View Details
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function WishlistPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: items, isLoading, isError } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
  })

  const removeMutation = useMutation({
    mutationFn: (holdingId: string) => removeFromWishlist(holdingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      queryClient.invalidateQueries({ queryKey: ['wishlist-check'] })
    },
  })

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">My Wishlist</h2>
        <p className="page-subtitle">Hoardings you've saved for later consideration</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          Failed to load your wishlist. Please try again.
        </div>
      )}

      {items && items.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium mb-1">Your wishlist is empty</p>
          <p className="text-gray-400 text-sm mb-5">Save hoardings while browsing to find them here.</p>
          <button onClick={() => navigate('/browse')} className="btn-primary w-auto px-6">
            Browse Hoardings
          </button>
        </div>
      )}

      {items && items.length > 0 && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {items.length} saved listing{items.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <WishlistCard
                key={item.id}
                item={item}
                onRemove={() => removeMutation.mutate(item.holdingId)}
                removing={removeMutation.isPending && removeMutation.variables === item.holdingId}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
