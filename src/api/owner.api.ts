import api from './axios'
import type { CoreResponse } from '@/types/auth.types'
import type { OwnerDashboard, OwnerHolding, OwnerOffer, PageResponse } from '@/types/index'
import { IS_MOCK, mockFetch } from '@/lib/mockMode'

// ── Dashboard ──────────────────────────────────────────────────────────────

export async function getOwnerDashboard(): Promise<OwnerDashboard> {
  if (IS_MOCK) return mockFetch<OwnerDashboard>('owner-dashboard.json')
  const res = await api.get<CoreResponse<OwnerDashboard>>('/owner/dashboard')
  return res.data.data
}

// ── Holdings ───────────────────────────────────────────────────────────────

export async function getOwnerHoldingById(id: string): Promise<OwnerHolding> {
  if (IS_MOCK) {
    const data = await mockFetch<PageResponse<OwnerHolding>>('owner-holdings.json')
    return data.items.find((h) => h.id === id) ?? data.items[0]
  }
  const res = await api.get<CoreResponse<OwnerHolding>>(`/owner/holdings/${id}`)
  return res.data.data
}

export async function getOwnerHoldings(status?: string, page = 0, limit = 10): Promise<PageResponse<OwnerHolding>> {
  if (IS_MOCK) {
    const data = await mockFetch<PageResponse<OwnerHolding>>('owner-holdings.json')
    const filtered = status ? { ...data, items: data.items.filter((h) => h.status === status) } : data
    return filtered
  }
  const params: Record<string, unknown> = { page, limit }
  if (status) params.status = status
  const res = await api.get<CoreResponse<PageResponse<OwnerHolding>>>('/owner/holdings', { params })
  return res.data.data
}

export async function createHolding(payload: object): Promise<OwnerHolding> {
  if (IS_MOCK) {
    const data = await mockFetch<PageResponse<OwnerHolding>>('owner-holdings.json')
    return { ...data.items[0], id: 'new-' + Date.now(), status: 'PENDING_REVIEW', ...(payload as Partial<OwnerHolding>) }
  }
  const res = await api.post<CoreResponse<OwnerHolding>>('/owner/holdings', payload)
  return res.data.data
}

export async function updateHolding(id: string, payload: object): Promise<OwnerHolding> {
  if (IS_MOCK) {
    const data = await mockFetch<PageResponse<OwnerHolding>>('owner-holdings.json')
    return { ...(data.items.find((h) => h.id === id) ?? data.items[0]), ...(payload as Partial<OwnerHolding>) }
  }
  const res = await api.put<CoreResponse<OwnerHolding>>(`/owner/holdings/${id}`, payload)
  return res.data.data
}

export async function updateHoldingStatus(
  id: string,
  payload: { toStatus: string; bookedFrom?: string | null; bookedTo?: string | null; reason?: string },
): Promise<OwnerHolding> {
  if (IS_MOCK) {
    const data = await mockFetch<PageResponse<OwnerHolding>>('owner-holdings.json')
    const holding = data.items.find((h) => h.id === id) ?? data.items[0]
    return { ...holding, status: payload.toStatus as OwnerHolding['status'] }
  }
  const res = await api.patch<CoreResponse<OwnerHolding>>(`/owner/holdings/${id}/status`, payload)
  return res.data.data
}

export async function deleteHolding(id: string): Promise<void> {
  if (IS_MOCK) { console.log('MOCK: deleteHolding', id); return }
  await api.delete(`/owner/holdings/${id}`)
}

// ── Offers received ────────────────────────────────────────────────────────

export async function getOwnerOffers(status?: string, page = 0, limit = 10): Promise<PageResponse<OwnerOffer>> {
  if (IS_MOCK) {
    const data = await mockFetch<PageResponse<OwnerOffer>>('owner-offers.json')
    const filtered = status ? { ...data, items: data.items.filter((o) => o.status === status) } : data
    return filtered
  }
  const params: Record<string, unknown> = { page, limit }
  if (status) params.status = status
  const res = await api.get<CoreResponse<PageResponse<OwnerOffer>>>('/owner/offers', { params })
  return res.data.data
}

export async function getOwnerOffersByHolding(holdingId: string, page = 0, limit = 20): Promise<PageResponse<OwnerOffer>> {
  if (IS_MOCK) {
    const data = await mockFetch<PageResponse<OwnerOffer>>('owner-offers.json')
    const filtered = { ...data, items: data.items.filter((o) => o.holdingId === holdingId) }
    return filtered
  }
  const res = await api.get<CoreResponse<PageResponse<OwnerOffer>>>('/owner/offers', {
    params: { holdingId, page, limit },
  })
  return res.data.data
}

export async function revealContact(offerId: string): Promise<OwnerOffer> {
  if (IS_MOCK) {
    const data = await mockFetch<PageResponse<OwnerOffer>>('owner-offers.json')
    const offer = data.items.find((o) => o.offerId === offerId) ?? data.items[0]
    return { ...offer, contactNumber: '+91 98765 43210', status: 'CONTACTED' }
  }
  const res = await api.post<CoreResponse<OwnerOffer>>(`/owner/offers/${offerId}/reveal-contact`)
  return res.data.data
}

export async function updateOfferStatus(offerId: string, status: string, statusNote?: string): Promise<OwnerOffer> {
  if (IS_MOCK) {
    const data = await mockFetch<PageResponse<OwnerOffer>>('owner-offers.json')
    const offer = data.items.find((o) => o.offerId === offerId) ?? data.items[0]
    return { ...offer, status: status as OwnerOffer['status'], statusNote: statusNote ?? null }
  }
  const res = await api.patch<CoreResponse<OwnerOffer>>(`/owner/offers/${offerId}/status`, { status, statusNote })
  return res.data.data
}
