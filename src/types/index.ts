// index.ts — central export for all shared TypeScript types
//
// TypeScript types are compile-time only — they disappear in the final JavaScript.
// Keeping them all in one file means you always know where to look when you
// need to understand what shape a piece of data has.

// Re-export everything from auth.types.ts so you can import from '@/types' instead
// of having to know the exact sub-file. e.g. import type { AuthUser } from '@/types'
export * from './auth.types'

// ── Pagination ─────────────────────────────────────────────────────────────
// The backend wraps every paginated list in this envelope.
// T is a "generic type parameter" — it means "a list of whatever T is".
// PageResponse<HoldingCard> means { items: HoldingCard[], page: number, ... }
export interface PageResponse<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

// ── Holding types ──────────────────────────────────────────────────────────
// These enums match the Java backend enums exactly (case-sensitive).

// Unified holding status: full lifecycle from creation to delist
export type HoldingStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ADMIN_REJECT'
  | 'PUBLISHED'
  | 'BOOKED'
  | 'OWNER_PAUSE'
  | 'DELISTED_BY_ADMIN'

// Urban = major city, Local = smaller town/area
export type HoldingLocationType = 'URBAN' | 'LOCAL'

// Minimal card shape — returned in the public search/browse API
// Only fields needed to render a card in the grid
export interface HoldingCard {
  id: string
  title: string
  location: string
  locationType: HoldingLocationType
  width: number
  height: number
  rentalCost: number
  status: HoldingStatus
  ownerVerified: boolean
  photos: string[]
}

// Full detail — returned when viewing a single holding's page
export interface HoldingDetail {
  id: string
  title: string
  location: string
  locationType: HoldingLocationType
  coordinates: { latitude: number; longitude: number }
  width: number
  height: number
  preferredAdTypes: string[]
  rentalCost: number
  status: HoldingStatus
  ownerVerified: boolean
  ownerId: string
  photos: string[]
  createdAt: string
  bookedFrom: string | null
  bookedTo: string | null
}

// Shape returned by owner's own holdings list — includes admin status + document URLs
export interface OwnerHolding {
  id: string
  title: string
  location: string
  locationType: HoldingLocationType
  latitude: number
  longitude: number
  width: number
  height: number
  preferredAdTypes: string[]
  rentalCost: number
  status: HoldingStatus
  ownerVerified: boolean
  rejectionReason: string | null
  bookedFrom: string | null
  bookedTo: string | null
  photos: string[]
  documents: string[]
  offersCount: number
  createdAt: string
  updatedAt: string
}

// Shape returned in admin holding management — includes owner identity info
export interface AdminHolding {
  id: string
  title: string
  location: string
  locationType: HoldingLocationType
  latitude: number
  longitude: number
  width: number
  height: number
  rentalCost: number
  status: HoldingStatus
  ownerVerified: boolean
  rejectionReason: string | null
  preferredAdTypes: string[]
  photos: string[]
  ownerId: string
  ownerName: string
  ownerEmail: string
  offersCount: number
  createdAt: string
  updatedAt: string
}

// ── Offer types ────────────────────────────────────────────────────────────
// Lifecycle: NEW → CONTACTED → NEGOTIATING → CLOSED or DECLINED
export type OfferStatus = 'NEW' | 'CONTACTED' | 'NEGOTIATING' | 'CLOSED' | 'DECLINED'

// What a customer sees when they view their own offers
export interface CustomerOffer {
  offerId: string
  holdingId: string
  holdingTitle: string
  holdingLocation: string
  offeredPrice: number
  desiredStartDate: string | null
  desiredDuration: number | null
  message: string | null
  contactNumber: string | null
  status: OfferStatus
  createdAt: string
}

// What an owner sees for offers on their holdings — includes customer identity
export interface OwnerOffer {
  offerId: string
  holdingId: string
  holdingTitle: string
  customerId: string
  customerName: string
  contactNumber: string | null
  offeredPrice: number
  desiredStartDate: string | null
  desiredDuration: number | null
  message: string | null
  status: OfferStatus
  statusNote: string | null
  createdAt: string
}

// What the customer submits when making an offer
export interface OfferRequest {
  offeredPrice: number
  desiredStartDate?: string
  desiredDuration?: number
  message?: string
  contactNumber: string
}

// ── Wishlist ───────────────────────────────────────────────────────────────
// A saved holding in the customer's wishlist — includes a snapshot of holding details
// so the card can render without fetching each holding separately
export interface WishlistItem {
  wishlistItemId: string
  savedAt: string
  holdingId: string
  holdingTitle: string
  location: string
  locationType: HoldingLocationType
  width: number
  height: number
  rentalCost: number
  status: HoldingStatus
  ownerVerified: boolean
  thumbnail: string | null
}

// ── Owner dashboard ────────────────────────────────────────────────────────
// Summary counts for the owner's dashboard page
export interface OwnerDashboard {
  totalHoldings: number
  activeHoldings: number
  pendingHoldings: number
  rejectedHoldings: number
  totalOffersReceived: number
  newOffers: number
  activeNegotiations: number
}

// ── Admin ──────────────────────────────────────────────────────────────────
// Summary counts for the admin dashboard page
export interface AdminDashboard {
  totalUsers: number
  totalCustomers: number
  totalOwners: number
  totalHoldings: number
  pendingApprovals: number
  activeHoldings: number
  suspendedHoldings: number
  totalOffers: number
}

// Nearby search result — returned by GET /holdings/nearby
export interface NearbyHolding {
  id: string
  title: string
  location: string
  latitude: number
  longitude: number
  distanceKm: number
  locationType: HoldingLocationType
  width: number
  height: number
  rentalCost: number
  ownerVerified: boolean
  thumbnail: string | null
}

// User record as seen by an admin
export interface AdminUser {
  userId: string
  name: string
  email: string
  phone: string
  role: string
  createdAt: string
}

// ── Chat ───────────────────────────────────────────────────────────────────
export interface ChatMessage {
  messageId: string
  offerId: string
  senderId: string
  senderRole: string
  message: string
  sentAt: string
  readAt: string | null
}
