import api from './axios'
import type { HoldingCard, HoldingDetail, NearbyHolding, PageResponse } from '@/types/index'
import { IS_MOCK, mockFetch } from '@/lib/mockMode'

export interface HoldingSearchParams {
  location?: string
  type?: string
  availability?: string
  minPrice?: number
  maxPrice?: number
  minWidth?: number
  minHeight?: number
  page?: number
  limit?: number
  sortBy?: string
  city?: string
  state?: string
  holdingType?: string
  isIlluminated?: boolean
  locationAdvantages?: string[]
}

export async function searchHoldings(params: HoldingSearchParams = {}): Promise<PageResponse<HoldingCard>> {
  if (IS_MOCK) return mockFetch<PageResponse<HoldingCard>>('holdings.json')
  const res = await api.get('/holdings', { params })
  return res.data as PageResponse<HoldingCard>
}

export async function getHoldingDetail(id: string): Promise<HoldingDetail> {
  if (IS_MOCK) {
    const data = await mockFetch<PageResponse<HoldingCard>>('holdings.json')
    const card = data.items.find((h) => h.id === id) ?? data.items[0]
    const detail = await mockFetch<HoldingDetail>('holding-detail.json')
    return { ...detail, id: card.id, title: card.title, location: card.location, rentalCost: card.rentalCost, photos: card.photos }
  }
  const res = await api.get<HoldingDetail>(`/holdings/${id}`)
  return res.data
}

export async function nearbyHoldings(params: {
  lat: number
  lng: number
  radiusKm?: number
  type?: string
  limit?: number
}): Promise<NearbyHolding[]> {
  if (IS_MOCK) {
    const data = await mockFetch<PageResponse<HoldingCard>>('holdings.json')
    return data.items.slice(0, 6).map((h, i) => ({
      id: h.id,
      title: h.title,
      location: h.location,
      latitude: 12.97 + i * 0.01,
      longitude: 77.59 + i * 0.01,
      distanceKm: Math.round((0.5 + i * 0.8) * 10) / 10,
      locationType: h.locationType,
      width: h.width,
      height: h.height,
      rentalCost: h.rentalCost,
      ownerVerified: h.ownerVerified,
      thumbnail: h.photos[0] ?? null,
    }))
  }
  const { radiusKm = 15, ...rest } = params
  const res = await api.get('/holdings/nearby', {
    params: { ...rest, radius: radiusKm * 1000, limit: rest.limit ?? 20 },
  })
  return res.data as NearbyHolding[]
}
