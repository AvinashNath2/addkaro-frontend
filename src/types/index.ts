// index.ts — central export for all shared TypeScript types
export * from './auth.types'

// ── Pagination ─────────────────────────────────────────────────────────────
export interface PageResponse<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

// ── Holding enums ──────────────────────────────────────────────────────────
export type HoldingStatus = 'DRAFT' | 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED' | 'DELETED'
export type HoldingLocationType = 'URBAN' | 'LOCAL'
export type HoldingAvailability = 'AVAILABLE' | 'BOOKED' | 'PARTIAL'

export type HoldingType =
  | 'BILLBOARD' | 'UNIPOLE' | 'GANTRY' | 'SKYWALK' | 'BUS_SHELTER'
  | 'WALL_PAINTING' | 'LED_SCREEN' | 'SCROLLING' | 'POLE_KIOSK' | 'AIRPORT'

export type LocationAdvantage =
  | 'NATIONAL_HIGHWAY_FACING' | 'STATE_HIGHWAY_FACING' | 'MAIN_CITY_ROAD'
  | 'SIGNAL_JUNCTION' | 'FLYOVER_APPROACH' | 'TOLL_BOOTH_AREA'
  | 'NEAR_METRO_STATION' | 'NEAR_RAILWAY_STATION' | 'NEAR_BUS_STAND'
  | 'NEAR_AIRPORT' | 'HIGH_VEHICLE_TRAFFIC' | 'PEDESTRIAN_FOOTPATH_ZONE'
  | 'NEAR_SHOPPING_MALL' | 'IN_MARKET_BAZAAR' | 'NEAR_SUPERMARKET'
  | 'NEAR_HOSPITAL' | 'NEAR_BANK_FINANCIAL' | 'NEAR_IT_PARK'
  | 'NEAR_INDUSTRIAL_AREA' | 'NEAR_GOVERNMENT_OFFICE' | 'NEAR_COURT'
  | 'NEAR_CINEMA' | 'NEAR_HOTEL' | 'NEAR_STADIUM'
  | 'NEAR_SCHOOL_COLLEGE' | 'NEAR_UNIVERSITY' | 'NEAR_RESIDENTIAL_COLONY'
  | 'NEAR_APARTMENT_COMPLEX' | 'NEAR_TEMPLE' | 'NEAR_PARK'
  | 'NEAR_POST_OFFICE' | 'NEAR_POLICE_STATION' | 'NEAR_MUNICIPALITY'
  | 'TOURIST_HERITAGE_AREA' | 'UPSCALE_NEIGHBOURHOOD' | 'FAMILY_RESIDENTIAL_ZONE'

// ── Section data shapes (mirrors V18 backend schema) ──────────────────────
export interface AddressData {
  street: string | null
  area: string | null
  city: string | null
  state: string | null
  pinCode: string | null
  landmark: string | null
}

export interface TypeSpecsData {
  holdingType: HoldingType | null
  numFaces: string | null
  displayTechnology: string | null
  printableAreaSqft: number | null
  facingDirection: string | null
  mountingHeightFt: number | null
}

export interface IlluminationData {
  isIlluminated: boolean | null
  illuminationType: string | null
  illuminationHours: string | null
}

export interface AmenitiesData {
  electricityAvailable: boolean | null
  powerSupplyType: string | null
  ladderAccess: boolean | null
  onSiteWatchman: boolean | null
  nearbyParking: boolean | null
  cctvInstalled: boolean | null
  waterAvailable: boolean | null
}

export interface AudienceData {
  dailyVehiclesRange: string | null
  dailyFootfallRange: string | null
  trafficDataSource: string | null
}

export interface PricingData {
  monthlyRate: number | null
  minimumBookingMonths: number | null
  quarterlyDiscountPct: number | null
  halfYearlyDiscountPct: number | null
  yearlyDiscountPct: number | null
  securityDepositRequired: boolean | null
  securityDepositRange: string | null
  installationCostRange: string | null
  setupCost: number | null
  taxPct: number | null
}

export interface LegalData {
  permitStatus: string | null
  permitNumber: string | null
  permitValidTill: string | null
  nocFromAuthority: boolean | null
}

// ── HoldingCard — public browse grid ──────────────────────────────────────
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
  holdingType: HoldingType | null
  city: string | null
  area: string | null
  isIlluminated: boolean | null
  minimumBookingMonths: number | null
  topAdvantages: string[]
}

// ── HoldingDetail — full public detail page ───────────────────────────────
export interface HoldingDetail {
  id: string
  title: string
  location: string
  locationType: HoldingLocationType
  coordinates: { latitude: number; longitude: number }
  width: number
  height: number
  rentalCost: number
  availability: HoldingAvailability
  status: HoldingStatus
  ownerVerified: boolean
  ownerId: string
  ownerType: string | null
  photos: string[]
  createdAt: string
  address: AddressData | null
  typeSpecs: TypeSpecsData | null
  illumination: IlluminationData | null
  amenities: AmenitiesData | null
  audience: AudienceData | null
  pricing: PricingData | null
  legal: LegalData | null
  locationAdvantages: string[]
  previousAdvertisers: PreviousAdvertiser[]
}

// ── PreviousAdvertiser ────────────────────────────────────────────────────
export interface PreviousAdvertiser {
  id: string
  brandName: string
  description: string | null
  displayOrder: number
}

// ── OwnerHolding — owner's own listing view ───────────────────────────────
export interface OwnerHolding {
  id: string
  title: string
  location: string | null
  locationType: HoldingLocationType | null
  latitude: number | null
  longitude: number | null
  width: number | null
  height: number | null
  rentalCost: number | null
  availability: HoldingAvailability
  status: HoldingStatus
  ownerVerified: boolean
  ownerType: string | null
  rejectionReason: string | null
  photos: string[]
  documents: string[]
  offersCount: number
  createdAt: string
  updatedAt: string
  address: AddressData | null
  typeSpecs: TypeSpecsData | null
  illumination: IlluminationData | null
  amenities: AmenitiesData | null
  audience: AudienceData | null
  pricing: PricingData | null
  legal: LegalData | null
  locationAdvantages: string[]
  previousAdvertisers: PreviousAdvertiser[]
}

// ── AdminHolding ───────────────────────────────────────────────────────────
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
  photos: string[]
  ownerId: string
  ownerName: string
  ownerEmail: string
  offersCount: number
  createdAt: string
  updatedAt: string
}

// ── Offer types ────────────────────────────────────────────────────────────
export type OfferStatus = 'NEW' | 'CONTACTED' | 'NEGOTIATING' | 'CLOSED' | 'DECLINED' | 'WITHDRAWN'

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

export interface OfferRequest {
  offeredPrice: number
  desiredStartDate?: string
  desiredDuration?: number
  message?: string
  contactNumber: string
}

// ── Wishlist ───────────────────────────────────────────────────────────────
export interface WishlistItem {
  id: string
  savedAt: string
  holdingId: string
  title: string
  location: string
  locationType: HoldingLocationType | null
  width: number | null
  height: number | null
  rentalCost: number | null
  status: HoldingStatus
  ownerVerified: boolean
  thumbnail: string | null
  latitude: number | null
  longitude: number | null
  minimumBookingMonths: number | null
  setupCost: number | null
  taxPct: number | null
  securityDepositRequired: boolean | null
  securityDepositRange: string | null
}

// ── Dashboards ─────────────────────────────────────────────────────────────
export interface OwnerDashboard {
  totalHoldings: number
  activeHoldings: number
  pendingHoldings: number
  rejectedHoldings: number
  suspendedHoldings: number
  totalOffersReceived: number
  newOffers: number
  contactedOffers: number
  activeNegotiations: number
  closedOffers: number
  declinedOffers: number
}

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

// ── Nearby search ──────────────────────────────────────────────────────────
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

// ── Admin user ─────────────────────────────────────────────────────────────
export interface AdminUser {
  id: string
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
