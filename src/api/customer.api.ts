import api from './axios'
import type { CustomerOffer, OfferRequest, WishlistItem, PageResponse } from '@/types/index'
import { IS_MOCK, mockFetch } from '@/lib/mockMode'
import { fromSpringPage } from '@/lib/springPage'

// ── Offers ─────────────────────────────────────────────────────────────────

export async function submitOffer(holdingId: string, payload: OfferRequest): Promise<CustomerOffer> {
  if (IS_MOCK) {
    return {
      offerId: 'off-new-' + Date.now(),
      holdingId,
      holdingTitle: 'Premium Billboard',
      holdingLocation: 'Demo Location',
      offeredPrice: payload.offeredPrice,
      desiredStartDate: payload.desiredStartDate ?? null,
      desiredDuration: payload.desiredDuration ?? null,
      message: payload.message ?? null,
      contactNumber: payload.contactNumber,
      status: 'NEW',
      createdAt: new Date().toISOString(),
    }
  }
  const res = await api.post<CustomerOffer>(`/holdings/${holdingId}/offers`, payload)
  return res.data
}

export async function getMyOffers(status?: string, page = 0, limit = 10): Promise<PageResponse<CustomerOffer>> {
  if (IS_MOCK) {
    const data = await mockFetch<PageResponse<CustomerOffer>>('customer-offers.json')
    const filtered = status ? { ...data, items: data.items.filter((o) => o.status === status) } : data
    return filtered
  }
  const params: Record<string, unknown> = { page, limit }
  if (status) params.status = status
  const res = await api.get('/customer/offers', { params })
  return fromSpringPage<CustomerOffer>(res.data)
}

export async function withdrawOffer(offerId: string): Promise<void> {
  if (IS_MOCK) { console.log('MOCK: withdrawOffer', offerId); return }
  await api.delete(`/customer/offers/${offerId}`)
}

// ── Wishlist ───────────────────────────────────────────────────────────────

export async function getWishlist(): Promise<WishlistItem[]> {
  if (IS_MOCK) return mockFetch<WishlistItem[]>('wishlist.json')
  const res = await api.get<WishlistItem[]>('/customer/wishlist')
  return res.data
}

export async function addToWishlist(holdingId: string): Promise<void> {
  if (IS_MOCK) { console.log('MOCK: addToWishlist', holdingId); return }
  await api.post(`/customer/wishlist/${holdingId}`)
}

export async function removeFromWishlist(holdingId: string): Promise<void> {
  if (IS_MOCK) { console.log('MOCK: removeFromWishlist', holdingId); return }
  await api.delete(`/customer/wishlist/${holdingId}`)
}

export async function checkWishlist(holdingId: string): Promise<{ holdingId: string; wishlisted: boolean }> {
  if (IS_MOCK) {
    const wishlisted = ['hd002', 'hd004', 'hd010', 'hd011'].includes(holdingId)
    return { holdingId, wishlisted }
  }
  const res = await api.get<{ holdingId: string; wishlisted: boolean }>(`/customer/wishlist/${holdingId}/check`)
  return res.data
}
