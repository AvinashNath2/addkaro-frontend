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
// Backend values: PENDING, ACTIVE, REJECTED, SUSPENDED
// Extended UI workflow values (frontend-only until backend supports them):
export type HoldingStatus =
  | 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED'
  | 'DRAFT' | 'PENDING_REVIEW' | 'ADMIN_REJECT' | 'PUBLISHED'
  | 'BOOKED' | 'OWNER_PAUSE' | 'DELISTED_BY_ADMIN'
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

// ── Section data shapes (mirrors backend inner records) ────────────────────
export interface AddressData {
  street: string | null
  area: string | null
  city: string | null
  state: string | null
  pinCode: string | null
  landmark: string | null
  locationSubtype: string | null
  nearestMetro: string | null
  nearestRailway: string | null
  googleMapsUrl: string | null
}

export interface TypeSpecsData {
  holdingType: HoldingType | null
  numFaces: string | null
  displayTechnology: string | null
  printableAreaSqft: number | null
  facingDirection: string | null
  mountingHeightFt: number | null
  roadSide: string | null
  dimensionUnit: string | null
  viewingAngle: string | null
}

export interface IlluminationData {
  isIlluminated: boolean | null
  illuminationType: string | null
  illuminationHours: string | null
  numSpotLights: number | null
  lightWattage: number | null
}

export interface AmenitiesData {
  electricityAvailable: boolean | null
  powerSupplyType: string | null
  batteryBackup: boolean | null
  batteryBackupHours: number | null
  solarPanelInstalled: boolean | null
  solarWattage: number | null
  upsAvailable: boolean | null
  generatorAvailable: boolean | null
  weatherproof: boolean | null
  easyMaintenanceAccess: boolean | null
  onSiteWatchman: boolean | null
  nearbyParking: boolean | null
  remoteContentMgmt: boolean | null
  internetAvailable: boolean | null
  contentLoopSeconds: number | null
}

export interface AudienceData {
  estimatedDailyVehicles: number | null
  estimatedDailyFootfall: number | null
  audienceTypes: string[]
  peakHours: string[]
  nearbyPopulation: string | null
  trafficDataSource: string | null
}

export interface PricingData {
  monthlyRate: number | null
  quarterlyRate: number | null
  halfYearlyRate: number | null
  annualRate: number | null
  minimumBookingDays: number | null
  securityDeposit: number | null
  printingCostIncluded: boolean | null
  installationCostIncluded: boolean | null
  gstIncluded: boolean | null
  advancePaymentMonths: number | null
  paymentModes: string[]
  cancellationPolicy: string | null
}

export interface LegalData {
  ownerDescription: string | null
  sellingPoints: string[]
  hoardingAge: string | null
  previousClients: string[]
  permitStatus: string | null
  permitNumber: string | null
  permitValidTill: string | null
  tdrCertificate: boolean | null
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
  minimumBookingDays: number | null
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
  preferredAdTypes: string[]
  rentalCost: number
  availability: HoldingAvailability
  status: HoldingStatus
  ownerVerified: boolean
  ownerId: string
  photos: string[]
  createdAt: string
  visibilityDistanceMetres: number | null
  trafficLaneCount: number | null
  distanceFromHighwayKm: number | null
  address: AddressData | null
  typeSpecs: TypeSpecsData | null
  illumination: IlluminationData | null
  amenities: AmenitiesData | null
  audience: AudienceData | null
  pricing: PricingData | null
  legal: LegalData | null
  locationAdvantages: string[]
}

// ── OwnerHolding — owner's own listing view ───────────────────────────────
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
  availability: HoldingAvailability
  status: HoldingStatus
  ownerVerified: boolean
  rejectionReason: string | null
  photos: string[]
  documents: string[]
  offersCount: number
  createdAt: string
  updatedAt: string
  visibilityDistanceMetres: number | null
  trafficLaneCount: number | null
  distanceFromHighwayKm: number | null
  address: AddressData | null
  typeSpecs: TypeSpecsData | null
  illumination: IlluminationData | null
  amenities: AmenitiesData | null
  audience: AudienceData | null
  pricing: PricingData | null
  legal: LegalData | null
  locationAdvantages: string[]
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
export type OfferStatus = 'NEW' | 'CONTACTED' | 'NEGOTIATING' | 'CLOSED' | 'DECLINED'

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

// ── Dashboards ─────────────────────────────────────────────────────────────
export interface OwnerDashboard {
  totalHoldings: number
  activeHoldings: number
  pendingHoldings: number
  rejectedHoldings: number
  totalOffersReceived: number
  newOffers: number
  activeNegotiations: number
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
