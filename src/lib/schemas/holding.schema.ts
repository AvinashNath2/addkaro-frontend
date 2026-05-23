import { z } from 'zod'

// ── Address section ────────────────────────────────────────────────────────
const addressSchema = z.object({
  street   : z.string().optional(),
  area     : z.string().min(1, 'Area is required'),
  city     : z.string().min(1, 'City is required'),
  state    : z.string().min(1, 'State is required'),
  pinCode  : z.string().length(6, 'PIN code must be 6 digits').regex(/^\d+$/, 'PIN code must be numeric'),
  landmark : z.string().optional(),
}).optional()

// ── Type specs section ─────────────────────────────────────────────────────
const typeSpecsSchema = z.object({
  holdingType       : z.string().optional(),
  numFaces          : z.string().optional(),
  displayTechnology : z.string().optional(),
  printableAreaSqft : z.coerce.number().positive().optional(),
  facingDirection   : z.string().optional(),
  mountingHeightFt  : z.coerce.number().positive().optional(),
}).optional()

// ── Illumination section ───────────────────────────────────────────────────
const illuminationSchema = z.object({
  isIlluminated    : z.boolean().optional(),
  illuminationType : z.string().optional(),
  illuminationHours: z.string().optional(),
}).optional()

// ── Amenities section ──────────────────────────────────────────────────────
const amenitiesSchema = z.object({
  electricityAvailable : z.boolean().optional(),
  powerSupplyType      : z.string().optional(),
  ladderAccess         : z.boolean().optional(),
  onSiteWatchman       : z.boolean().optional(),
  nearbyParking        : z.boolean().optional(),
  cctvInstalled        : z.boolean().optional(),
  waterAvailable       : z.boolean().optional(),
}).optional()

// ── Audience section ───────────────────────────────────────────────────────
const audienceSchema = z.object({
  dailyVehiclesRange  : z.string().optional(),
  dailyFootfallRange  : z.string().optional(),
  trafficDataSource   : z.string().optional(),
}).optional()

// ── Pricing section ────────────────────────────────────────────────────────
const pricingSchema = z.object({
  minimumBookingMonths    : z.coerce.number().int().positive().optional(),
  quarterlyDiscountPct    : z.coerce.number().min(0).max(100).optional(),
  halfYearlyDiscountPct   : z.coerce.number().min(0).max(100).optional(),
  yearlyDiscountPct       : z.coerce.number().min(0).max(100).optional(),
  securityDepositRequired : z.boolean().optional(),
  securityDepositRange    : z.string().optional(),
  installationCostRange   : z.string().optional(),
}).optional()

// ── Legal section ──────────────────────────────────────────────────────────
const legalSchema = z.object({
  permitStatus    : z.string().optional(),
  permitNumber    : z.string().optional(),
  permitValidTill : z.string().optional(),
  nocFromAuthority: z.boolean().optional(),
}).optional()

// ── Root holding schema ────────────────────────────────────────────────────
export const holdingSchema = z.object({
  title        : z.string().min(1, 'Title is required').max(200),
  location     : z.string().optional(),
  locationType : z.enum(['URBAN', 'LOCAL'], { errorMap: () => ({ message: 'Select URBAN or LOCAL' }) }),
  latitude     : z.coerce.number().min(-90).max(90, 'Invalid latitude'),
  longitude    : z.coerce.number().min(-180).max(180, 'Invalid longitude'),
  width        : z.coerce.number().min(0.1, 'Width must be > 0'),
  height       : z.coerce.number().min(0.1, 'Height must be > 0'),
  rentalCost   : z.coerce.number().min(1, 'Rental cost must be > 0'),
  ownerType    : z.string().optional(),

  address            : addressSchema,
  typeSpecs          : typeSpecsSchema,
  illumination       : illuminationSchema,
  amenities          : amenitiesSchema,
  audience           : audienceSchema,
  pricing            : pricingSchema,
  legal              : legalSchema,
  locationAdvantages : z.array(z.string()).optional(),
})

export type HoldingFormData = z.infer<typeof holdingSchema>
