// holding.schema.ts — Zod validation rules for Create / Edit Holding forms
//
// The form is split into sections matching the backend's child tables.
// All sections are optional — owners can fill them progressively.
// z.coerce.number() converts HTML input strings to numbers automatically.

import { z } from 'zod'

// ── Address section ────────────────────────────────────────────────────────
const addressSchema = z.object({
  street          : z.string().optional(),
  area            : z.string().min(1, 'Area is required'),
  city            : z.string().min(1, 'City is required'),
  state           : z.string().min(1, 'State is required'),
  pinCode         : z.string().length(6, 'PIN code must be 6 digits').regex(/^\d+$/, 'PIN code must be numeric'),
  landmark        : z.string().optional(),
  locationSubtype : z.string().optional(),
  nearestMetro    : z.string().optional(),
  nearestRailway  : z.string().optional(),
  googleMapsUrl   : z.string().url('Enter a valid URL').optional().or(z.literal('')),
}).optional()

// ── Type specs section ─────────────────────────────────────────────────────
const typeSpecsSchema = z.object({
  holdingType       : z.string().optional(),
  numFaces          : z.string().optional(),
  displayTechnology : z.string().optional(),
  printableAreaSqft : z.coerce.number().positive().optional(),
  facingDirection   : z.string().optional(),
  mountingHeightFt  : z.coerce.number().positive().optional(),
  roadSide          : z.string().optional(),
  dimensionUnit     : z.string().optional(),
  viewingAngle      : z.string().optional(),
}).optional()

// ── Illumination section ───────────────────────────────────────────────────
const illuminationSchema = z.object({
  isIlluminated     : z.boolean().optional(),
  illuminationType  : z.string().optional(),
  illuminationHours : z.string().optional(),
  numSpotLights     : z.coerce.number().int().nonnegative().optional(),
  lightWattage      : z.coerce.number().int().nonnegative().optional(),
}).optional()

// ── Amenities section ──────────────────────────────────────────────────────
const amenitiesSchema = z.object({
  electricityAvailable  : z.boolean().optional(),
  powerSupplyType       : z.string().optional(),
  batteryBackup         : z.boolean().optional(),
  batteryBackupHours    : z.coerce.number().int().nonnegative().optional(),
  solarPanelInstalled   : z.boolean().optional(),
  solarWattage          : z.coerce.number().int().nonnegative().optional(),
  upsAvailable          : z.boolean().optional(),
  generatorAvailable    : z.boolean().optional(),
  weatherproof          : z.boolean().optional(),
  easyMaintenanceAccess : z.boolean().optional(),
  onSiteWatchman        : z.boolean().optional(),
  nearbyParking         : z.boolean().optional(),
  remoteContentMgmt     : z.boolean().optional(),
  internetAvailable     : z.boolean().optional(),
  contentLoopSeconds    : z.coerce.number().int().nonnegative().optional(),
}).optional()

// ── Audience section ───────────────────────────────────────────────────────
const audienceSchema = z.object({
  estimatedDailyVehicles  : z.coerce.number().int().nonnegative().optional(),
  estimatedDailyFootfall  : z.coerce.number().int().nonnegative().optional(),
  audienceTypes           : z.array(z.string()).optional(),
  peakHours               : z.array(z.string()).optional(),
  nearbyPopulation        : z.string().optional(),
  trafficDataSource       : z.string().optional(),
}).optional()

// ── Pricing section ────────────────────────────────────────────────────────
const pricingSchema = z.object({
  quarterlyRate            : z.coerce.number().positive().optional(),
  halfYearlyRate           : z.coerce.number().positive().optional(),
  annualRate               : z.coerce.number().positive().optional(),
  minimumBookingDays       : z.coerce.number().int().positive().optional(),
  securityDeposit          : z.coerce.number().nonnegative().optional(),
  printingCostIncluded     : z.boolean().optional(),
  installationCostIncluded : z.boolean().optional(),
  gstIncluded              : z.boolean().optional(),
  advancePaymentMonths     : z.coerce.number().int().nonnegative().optional(),
  paymentModes             : z.array(z.string()).optional(),
  cancellationPolicy       : z.string().optional(),
}).optional()

// ── Legal section ──────────────────────────────────────────────────────────
const legalSchema = z.object({
  ownerDescription : z.string().optional(),
  sellingPoints    : z.array(z.string()).optional(),
  hoardingAge      : z.string().optional(),
  previousClients  : z.array(z.string()).optional(),
  permitStatus     : z.string().optional(),
  permitNumber     : z.string().optional(),
  permitValidTill  : z.string().optional(),
  tdrCertificate   : z.boolean().optional(),
  nocFromAuthority : z.boolean().optional(),
}).optional()

// ── Root holding schema ────────────────────────────────────────────────────
export const holdingSchema = z.object({
  // Base required fields
  title        : z.string().min(1, 'Title is required').max(200),
  location     : z.string().optional(),
  locationType : z.enum(['URBAN', 'LOCAL'], { errorMap: () => ({ message: 'Select URBAN or LOCAL' }) }),
  latitude     : z.coerce.number().min(-90).max(90, 'Invalid latitude'),
  longitude    : z.coerce.number().min(-180).max(180, 'Invalid longitude'),
  width        : z.coerce.number().min(0.1, 'Width must be > 0'),
  height       : z.coerce.number().min(0.1, 'Height must be > 0'),
  preferredAdTypes : z.string().optional(),  // comma-separated, split before submit
  rentalCost   : z.coerce.number().min(1, 'Rental cost must be > 0'),

  // Scalar extras
  visibilityDistanceMetres : z.coerce.number().int().nonnegative().optional(),
  trafficLaneCount         : z.coerce.number().int().nonnegative().optional(),
  distanceFromHighwayKm    : z.coerce.number().nonnegative().optional(),

  // Optional sections
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
