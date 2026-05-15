// customer.api.ts — API functions for authenticated CUSTOMER operations
//
// All these endpoints require a valid JWT (the axios interceptor adds it automatically).
// A user with role CUSTOMER can submit offers, manage their wishlist, and view their offer history.

import api from './axios'
import type { CoreResponse } from '@/types/auth.types'
import type { CustomerOffer, OfferRequest, WishlistItem, PageResponse } from '@/types/index'

// ── Offers ─────────────────────────────────────────────────────────────────

// POST /api/v1/holdings/:holdingId/offers
// Submit a new offer on a specific holding.
// Returns the created offer object so we can show confirmation details.
export async function submitOffer(holdingId: string, payload: OfferRequest): Promise<CustomerOffer> {
  const res = await api.post<CoreResponse<CustomerOffer>>(`/holdings/${holdingId}/offers`, payload)
  return res.data.data
}

// GET /api/v1/customer/offers?status=NEW&page=0&limit=10
export async function getMyOffers(status?: string, page = 0, limit = 10): Promise<PageResponse<CustomerOffer>> {
  const params: Record<string, unknown> = { page, limit }
  if (status) params.status = status
  const res = await api.get<CoreResponse<PageResponse<CustomerOffer>>>('/customer/offers', { params })
  return res.data.data
}

// DELETE /api/v1/customer/offers/:offerId
// Withdraw (delete) a submitted offer. Only allowed while status is NEW.
export async function withdrawOffer(offerId: string): Promise<void> {
  await api.delete(`/customer/offers/${offerId}`)
}

// ── Wishlist ───────────────────────────────────────────────────────────────

// GET /api/v1/customer/wishlist
// Returns all wishlist items for the logged-in customer.
// Each item includes a snapshot of the holding details so cards render without extra fetches.
export async function getWishlist(): Promise<WishlistItem[]> {
  const res = await api.get<CoreResponse<WishlistItem[]>>('/customer/wishlist')
  return res.data.data
}

// POST /api/v1/customer/wishlist/:holdingId
// Add a holding to the wishlist. No request body needed — the holding ID is in the URL.
export async function addToWishlist(holdingId: string): Promise<void> {
  await api.post(`/customer/wishlist/${holdingId}`)
}

// DELETE /api/v1/customer/wishlist/:holdingId
// Remove a holding from the wishlist.
export async function removeFromWishlist(holdingId: string): Promise<void> {
  await api.delete(`/customer/wishlist/${holdingId}`)
}

// GET /api/v1/customer/wishlist/:holdingId/check
// Check whether a specific holding is already in the customer's wishlist.
// Backend returns { holdingId, saved } — we only consume `.saved` in the UI.
export async function checkWishlist(holdingId: string): Promise<{ holdingId: string; saved: boolean }> {
  const res = await api.get<CoreResponse<{ holdingId: string; saved: boolean }>>(`/customer/wishlist/${holdingId}/check`)
  return res.data.data
}
