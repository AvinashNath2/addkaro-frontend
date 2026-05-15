// holdings.api.ts — API functions for the PUBLIC holdings endpoints
//
// These endpoints don't require authentication — anyone (including guests) can
// browse and view holding details. The axios instance still sends the token if
// one is present, which is fine; the backend just ignores it for public routes.

import api from './axios'
import type { CoreResponse } from '@/types/auth.types'
import type { HoldingCard, HoldingDetail, NearbyHolding, PageResponse } from '@/types/index'

// Parameters accepted by the search/browse endpoint.
// All are optional — calling searchHoldings() with no args returns the first page of all published holdings.
export interface HoldingSearchParams {
  location?: string      // free text partial match on location
  type?: string          // 'URBAN' | 'LOCAL'
  minPrice?: number      // minimum rental cost filter
  maxPrice?: number      // maximum rental cost filter
  page?: number          // 0-indexed page number (backend default: 0)
  limit?: number         // page size (backend default: typically 10 or 12)
  sortBy?: string        // e.g. 'rentalCost' or 'createdAt'
  availableFrom?: string // ISO date — only show holdings available from this date
  availableTo?: string   // ISO date — only show holdings available to this date
}

// GET /api/v1/holdings?location=...&type=...&page=...
// Returns a paginated list of holding cards for the browse page.
//
// The backend returns: CoreResponse<PageResponse<HoldingCard>>
// We unwrap down to just PageResponse<HoldingCard> so callers get the pagination data.
export async function searchHoldings(params: HoldingSearchParams = {}): Promise<PageResponse<HoldingCard>> {
  const res = await api.get<CoreResponse<PageResponse<HoldingCard>>>('/holdings', { params })
  return res.data.data
}

// GET /api/v1/holdings/:id
// Returns the full detail of a single holding for the detail page.
export async function getHoldingDetail(id: string): Promise<HoldingDetail> {
  const res = await api.get<CoreResponse<HoldingDetail>>(`/holdings/${id}`)
  return res.data.data
}

// GET /api/v1/holdings/nearby?lat=...&lng=...&radius=15000&limit=20
// radiusKm is in kilometres — converted to metres before sending because the
// backend's `radius` param is in metres (filter: distanceKm * 1000 <= radiusMeters).
export async function nearbyHoldings(params: {
  lat: number
  lng: number
  radiusKm?: number
  type?: string
  limit?: number
}): Promise<NearbyHolding[]> {
  const { radiusKm = 15, ...rest } = params
  const res = await api.get<CoreResponse<NearbyHolding[]>>('/holdings/nearby', {
    params: { ...rest, radius: radiusKm * 1000, limit: rest.limit ?? 20 },
  })
  return res.data.data
}
