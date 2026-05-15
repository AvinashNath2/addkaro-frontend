// owner.api.ts — API functions for authenticated OWNER operations
//
// Owners manage their own hoarding listings and respond to offers they receive.
// All endpoints require a JWT with role = OWNER.

import api from './axios'
import type { CoreResponse } from '@/types/auth.types'
import type { OwnerDashboard, OwnerHolding, OwnerOffer, PageResponse } from '@/types/index'

// ── Dashboard ──────────────────────────────────────────────────────────────

// GET /api/v1/owner/dashboard
// Returns summary counts: total listings, active, pending, rejected, offers, etc.
export async function getOwnerDashboard(): Promise<OwnerDashboard> {
  const res = await api.get<CoreResponse<OwnerDashboard>>('/owner/dashboard')
  return res.data.data
}

// ── Holdings (listings) ────────────────────────────────────────────────────

// GET /api/v1/owner/holdings/:id
export async function getOwnerHoldingById(id: string): Promise<OwnerHolding> {
  const res = await api.get<CoreResponse<OwnerHolding>>(`/owner/holdings/${id}`)
  return res.data.data
}

// GET /api/v1/owner/holdings?status=PUBLISHED&page=0&limit=10
export async function getOwnerHoldings(status?: string, page = 0, limit = 10): Promise<PageResponse<OwnerHolding>> {
  const params: Record<string, unknown> = { page, limit }
  if (status) params.status = status
  const res = await api.get<CoreResponse<PageResponse<OwnerHolding>>>('/owner/holdings', { params })
  return res.data.data
}

// POST /api/v1/owner/holdings
// Submit a new listing for admin review.
// payload uses `object` type here because the form data is built from HoldingFormData
// and transformed (e.g. splitting preferredAdTypes) before being sent.
export async function createHolding(payload: object): Promise<OwnerHolding> {
  const res = await api.post<CoreResponse<OwnerHolding>>('/owner/holdings', payload)
  return res.data.data
}

// PUT /api/v1/owner/holdings/:id
// Update an existing listing's details.
export async function updateHolding(id: string, payload: object): Promise<OwnerHolding> {
  const res = await api.put<CoreResponse<OwnerHolding>>(`/owner/holdings/${id}`, payload)
  return res.data.data
}

// PATCH /api/v1/owner/holdings/:id/status
export async function updateHoldingStatus(
  id: string,
  payload: { toStatus: string; bookedFrom?: string | null; bookedTo?: string | null; reason?: string },
): Promise<OwnerHolding> {
  const res = await api.patch<CoreResponse<OwnerHolding>>(`/owner/holdings/${id}/status`, payload)
  return res.data.data
}

// DELETE /api/v1/owner/holdings/:id
// Permanently delete a listing. Only allowed for DRAFT or ADMIN_REJECT holdings.
export async function deleteHolding(id: string): Promise<void> {
  await api.delete(`/owner/holdings/${id}`)
}

// ── Offers received ────────────────────────────────────────────────────────

// GET /api/v1/owner/offers?status=NEW&page=0&limit=10
export async function getOwnerOffers(status?: string, page = 0, limit = 10): Promise<PageResponse<OwnerOffer>> {
  const params: Record<string, unknown> = { page, limit }
  if (status) params.status = status
  const res = await api.get<CoreResponse<PageResponse<OwnerOffer>>>('/owner/offers', { params })
  return res.data.data
}

// GET /api/v1/owner/offers?holdingId=...&page=0&limit=20
// Fetch all offers for a specific holding (used in sub-view panel).
export async function getOwnerOffersByHolding(holdingId: string, page = 0, limit = 20): Promise<PageResponse<OwnerOffer>> {
  const res = await api.get<CoreResponse<PageResponse<OwnerOffer>>>('/owner/offers', {
    params: { holdingId, page, limit },
  })
  return res.data.data
}

// POST /api/v1/owner/offers/:offerId/reveal-contact
// Unlocks the customer's contact number.
// This automatically moves the offer status from NEW → CONTACTED on the backend.
export async function revealContact(offerId: string): Promise<OwnerOffer> {
  const res = await api.post<CoreResponse<OwnerOffer>>(`/owner/offers/${offerId}/reveal-contact`)
  return res.data.data
}

// PATCH /api/v1/owner/offers/:offerId/status  — backend uses @PatchMapping, not PUT
// Manually update offer status to NEGOTIATING, CLOSED, or DECLINED.
// statusNote is an optional message explaining the decision.
export async function updateOfferStatus(offerId: string, status: string, statusNote?: string): Promise<OwnerOffer> {
  const res = await api.patch<CoreResponse<OwnerOffer>>(`/owner/offers/${offerId}/status`, { status, statusNote })
  return res.data.data
}
