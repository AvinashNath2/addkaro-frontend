// CreateHoldingPage.tsx — form for owners to submit a new hoarding listing
//
// After submission the listing enters PENDING status and awaits admin approval.
// The owner is shown a brief success message then redirected to their listings page.
//
// The form is split into:
//   1. Base required fields (title, location, coordinates, dimensions, rental cost)
//   2. Optional section accordions (address, type specs, illumination, amenities,
//      audience, pricing, legal + location advantages)
//
// Owners can fill sections progressively — only base fields are required.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Loader2, ArrowLeft, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { createHolding } from '@/api/owner.api'
import { holdingSchema, type HoldingFormData } from '@/lib/schemas/holding.schema'
import { cn } from '@/lib/utils'

// ── Reusable accordion section wrapper ────────────────────────────────────────
function SectionAccordion({
  title,
  hint,
  children,
  defaultOpen = false,
}: {
  title: string
  hint?: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div>
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          {hint && <span className="ml-2 text-xs text-gray-400 font-normal">{hint}</span>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-5 py-5 space-y-4 bg-white">{children}</div>}
    </div>
  )
}

// Common location advantages to choose from
const LOCATION_ADVANTAGES = [
  'SIGNAL_JUNCTION', 'PEDESTRIAN_FOOTPATH_ZONE', 'HIGH_VEHICLE_TRAFFIC',
  'NATIONAL_HIGHWAY_FACING', 'STATE_HIGHWAY_FACING', 'NEAR_METRO_STATION',
  'NEAR_RAILWAY_STATION', 'NEAR_BUS_STAND', 'NEAR_AIRPORT',
  'FLYOVER_APPROACH', 'TOLL_BOOTH_AREA', 'NEAR_SHOPPING_MALL',
  'NEAR_SCHOOL_COLLEGE', 'NEAR_HOSPITAL', 'IN_MARKET_BAZAAR',
  'NEAR_IT_PARK', 'NEAR_INDUSTRIAL_AREA', 'NEAR_RESIDENTIAL_COLONY',
  'UPSCALE_NEIGHBOURHOOD', 'TOURIST_HERITAGE_AREA', 'MAIN_CITY_ROAD',
]

export default function CreateHoldingPage() {
  const navigate = useNavigate()
  const [selectedAdvantages, setSelectedAdvantages] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<HoldingFormData>({
    resolver: zodResolver(holdingSchema),
  })

  const toggleAdvantage = (adv: string) => {
    setSelectedAdvantages((prev) => {
      const next = prev.includes(adv) ? prev.filter((a) => a !== adv) : [...prev, adv]
      setValue('locationAdvantages', next)
      return next
    })
  }

  const mutation = useMutation({
    mutationFn: (data: HoldingFormData) => {
      const payload = {
        ...data,
        preferredAdTypes: data.preferredAdTypes
          ? data.preferredAdTypes.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        locationAdvantages: selectedAdvantages,
      }
      return createHolding(payload)
    },
    onSuccess: () => {
      setTimeout(() => navigate('/owner/holdings'), 1500)
    },
  })

  return (
    <div className="max-w-2xl">
      {/* Back nav */}
      <button
        onClick={() => navigate('/owner/holdings')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Listings
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Add New Listing</h2>
        <p className="text-sm text-gray-500 mt-1">
          Submit your hoarding for admin review. Only the base fields are required — you can fill the optional sections later.
        </p>
      </div>

      {mutation.isSuccess && (
        <div className="flex items-start gap-3 rounded-xl bg-green-50 border border-green-200 px-5 py-4 mb-6">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Submitted for review!</p>
            <p className="text-xs text-green-700 mt-0.5">Redirecting you to listings…</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate className="space-y-5">

        {/* ── Required base fields ─────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Required Details</h3>

          <div>
            <label className="label">Listing Title</label>
            <input type="text" placeholder="e.g. Prime Hoarding at MG Road Signal"
              className={cn('input-field', errors.title && 'input-error')} {...register('title')} />
            {errors.title && <p className="error-text">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label">Location / Address</label>
            <input type="text" placeholder="e.g. MG Road, Bengaluru, Karnataka 560001"
              className={cn('input-field', errors.location && 'input-error')} {...register('location')} />
            {errors.location && <p className="error-text">{errors.location.message}</p>}
          </div>

          <div>
            <label className="label">Location Type</label>
            <div className="flex gap-6">
              {(['URBAN', 'LOCAL'] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={type} className="accent-brand-600" {...register('locationType')} />
                  <span className="text-sm font-medium text-gray-700">{type}</span>
                  <span className="text-xs text-gray-400">{type === 'URBAN' ? '(Major city)' : '(Town / locality)'}</span>
                </label>
              ))}
            </div>
            {errors.locationType && <p className="error-text">{errors.locationType.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Latitude</label>
              <input type="number" step="any" placeholder="e.g. 12.9716"
                className={cn('input-field', errors.latitude && 'input-error')} {...register('latitude')} />
              {errors.latitude && <p className="error-text">{errors.latitude.message}</p>}
            </div>
            <div>
              <label className="label">Longitude</label>
              <input type="number" step="any" placeholder="e.g. 77.5946"
                className={cn('input-field', errors.longitude && 'input-error')} {...register('longitude')} />
              {errors.longitude && <p className="error-text">{errors.longitude.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Width (ft)</label>
              <input type="number" step="0.1" placeholder="e.g. 20"
                className={cn('input-field', errors.width && 'input-error')} {...register('width')} />
              {errors.width && <p className="error-text">{errors.width.message}</p>}
            </div>
            <div>
              <label className="label">Height (ft)</label>
              <input type="number" step="0.1" placeholder="e.g. 10"
                className={cn('input-field', errors.height && 'input-error')} {...register('height')} />
              {errors.height && <p className="error-text">{errors.height.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Monthly Rental Cost (₹)</label>
            <input type="number" placeholder="e.g. 25000"
              className={cn('input-field', errors.rentalCost && 'input-error')} {...register('rentalCost')} />
            {errors.rentalCost && <p className="error-text">{errors.rentalCost.message}</p>}
          </div>

          <div>
            <label className="label">Preferred Ad Types (optional)</label>
            <input type="text" placeholder="e.g. FMCG, Automobile, Real Estate"
              className="input-field" {...register('preferredAdTypes')} />
            <p className="mt-1 text-xs text-gray-400">Separate multiple types with commas</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Visibility Distance (m)</label>
              <input type="number" placeholder="e.g. 300"
                className="input-field" {...register('visibilityDistanceMetres')} />
            </div>
            <div>
              <label className="label">Traffic Lanes</label>
              <input type="number" placeholder="e.g. 4"
                className="input-field" {...register('trafficLaneCount')} />
            </div>
            <div>
              <label className="label">Distance from Highway (km)</label>
              <input type="number" step="0.1" placeholder="e.g. 1.5"
                className="input-field" {...register('distanceFromHighwayKm')} />
            </div>
          </div>
        </div>

        {/* ── Optional sections ─────────────────────────────────────────── */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">Optional Sections</p>

        {/* Address section */}
        <SectionAccordion title="Address Details" hint="Area, city, state, PIN, metro">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Street</label>
              <input type="text" placeholder="e.g. SV Road, Andheri West"
                className="input-field" {...register('address.street')} />
            </div>
            <div>
              <label className="label">Area *</label>
              <input type="text" placeholder="e.g. Andheri West"
                className={cn('input-field', errors.address?.area && 'input-error')}
                {...register('address.area')} />
              {errors.address?.area && <p className="error-text">{errors.address.area.message}</p>}
            </div>
            <div>
              <label className="label">City *</label>
              <input type="text" placeholder="e.g. Mumbai"
                className={cn('input-field', errors.address?.city && 'input-error')}
                {...register('address.city')} />
              {errors.address?.city && <p className="error-text">{errors.address.city.message}</p>}
            </div>
            <div>
              <label className="label">State *</label>
              <input type="text" placeholder="e.g. Maharashtra"
                className={cn('input-field', errors.address?.state && 'input-error')}
                {...register('address.state')} />
              {errors.address?.state && <p className="error-text">{errors.address.state.message}</p>}
            </div>
            <div>
              <label className="label">PIN Code *</label>
              <input type="text" maxLength={6} placeholder="6-digit PIN"
                className={cn('input-field', errors.address?.pinCode && 'input-error')}
                {...register('address.pinCode')} />
              {errors.address?.pinCode && <p className="error-text">{errors.address.pinCode.message}</p>}
            </div>
            <div>
              <label className="label">Landmark</label>
              <input type="text" placeholder="e.g. Near Juhu Beach"
                className="input-field" {...register('address.landmark')} />
            </div>
            <div>
              <label className="label">Nearest Metro</label>
              <input type="text" placeholder="e.g. Andheri Metro"
                className="input-field" {...register('address.nearestMetro')} />
            </div>
            <div>
              <label className="label">Nearest Railway</label>
              <input type="text" placeholder="e.g. Andheri Station"
                className="input-field" {...register('address.nearestRailway')} />
            </div>
            <div className="col-span-2">
              <label className="label">Google Maps URL</label>
              <input type="url" placeholder="https://maps.google.com/..."
                className={cn('input-field', errors.address?.googleMapsUrl && 'input-error')}
                {...register('address.googleMapsUrl')} />
              {errors.address?.googleMapsUrl && <p className="error-text">{errors.address.googleMapsUrl.message}</p>}
            </div>
          </div>
        </SectionAccordion>

        {/* Type & Specs */}
        <SectionAccordion title="Type & Specifications" hint="Holding type, technology, orientation">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Holding Type</label>
              <select className="input-field" {...register('typeSpecs.holdingType')}>
                <option value="">Select type…</option>
                <option value="BILLBOARD">Billboard</option>
                <option value="UNIPOLE">Unipole</option>
                <option value="GANTRY">Gantry</option>
                <option value="LED_SCREEN">LED Screen</option>
                <option value="WALL_PAINTING">Wall Painting</option>
                <option value="SKYWALK">Skywalk</option>
                <option value="BUS_SHELTER">Bus Shelter</option>
                <option value="SCROLLING">Scrolling</option>
                <option value="POLE_KIOSK">Pole Kiosk</option>
                <option value="AIRPORT">Airport</option>
              </select>
            </div>
            <div>
              <label className="label">Number of Faces</label>
              <select className="input-field" {...register('typeSpecs.numFaces')}>
                <option value="">Select…</option>
                <option value="SINGLE">Single</option>
                <option value="DOUBLE">Double</option>
                <option value="TRIPLE">Triple</option>
              </select>
            </div>
            <div>
              <label className="label">Display Technology</label>
              <select className="input-field" {...register('typeSpecs.displayTechnology')}>
                <option value="">Select…</option>
                <option value="FLEX_VINYL">Flex Vinyl</option>
                <option value="LED_DIGITAL">LED Digital</option>
                <option value="STATIC_METAL">Static Metal</option>
                <option value="GLASS">Glass</option>
                <option value="MESH_FLEX">Mesh Flex</option>
              </select>
            </div>
            <div>
              <label className="label">Printable Area (sqft)</label>
              <input type="number" placeholder="e.g. 500"
                className="input-field" {...register('typeSpecs.printableAreaSqft')} />
            </div>
            <div>
              <label className="label">Facing Direction</label>
              <select className="input-field" {...register('typeSpecs.facingDirection')}>
                <option value="">Select…</option>
                <option value="NORTH">North</option>
                <option value="SOUTH">South</option>
                <option value="EAST">East</option>
                <option value="WEST">West</option>
                <option value="NORTH_EAST">North-East</option>
                <option value="NORTH_WEST">North-West</option>
                <option value="SOUTH_EAST">South-East</option>
                <option value="SOUTH_WEST">South-West</option>
              </select>
            </div>
            <div>
              <label className="label">Mounting Height (ft)</label>
              <input type="number" placeholder="e.g. 30"
                className="input-field" {...register('typeSpecs.mountingHeightFt')} />
            </div>
            <div>
              <label className="label">Road Side</label>
              <select className="input-field" {...register('typeSpecs.roadSide')}>
                <option value="">Select…</option>
                <option value="LEFT">Left</option>
                <option value="RIGHT">Right</option>
                <option value="MEDIAN">Median</option>
              </select>
            </div>
            <div>
              <label className="label">Viewing Angle</label>
              <select className="input-field" {...register('typeSpecs.viewingAngle')}>
                <option value="">Select…</option>
                <option value="90_DEGREE">90°</option>
                <option value="180_DEGREE">180°</option>
                <option value="270_DEGREE">270°</option>
                <option value="360_DEGREE">360°</option>
              </select>
            </div>
          </div>
        </SectionAccordion>

        {/* Illumination */}
        <SectionAccordion title="Illumination" hint="Lighting type, hours, wattage">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex items-center gap-3">
              <input type="checkbox" id="isIlluminated" className="w-4 h-4 accent-brand-600"
                {...register('illumination.isIlluminated')} />
              <label htmlFor="isIlluminated" className="text-sm font-medium text-gray-700">This holding is illuminated</label>
            </div>
            <div>
              <label className="label">Illumination Type</label>
              <select className="input-field" {...register('illumination.illuminationType')}>
                <option value="">Select…</option>
                <option value="FRONT_LIT">Front Lit</option>
                <option value="BACK_LIT">Back Lit</option>
                <option value="LED_EDGE">LED Edge</option>
                <option value="FULL_LED">Full LED</option>
                <option value="NONE">None</option>
              </select>
            </div>
            <div>
              <label className="label">Illumination Hours</label>
              <select className="input-field" {...register('illumination.illuminationHours')}>
                <option value="">Select…</option>
                <option value="TWENTY_FOUR_SEVEN">24 / 7</option>
                <option value="DUSK_TO_DAWN">Dusk to Dawn</option>
                <option value="SIX_PM_TO_MIDNIGHT">6 PM – Midnight</option>
                <option value="DAYLIGHT_ONLY">Daylight Only</option>
              </select>
            </div>
            <div>
              <label className="label">Number of Spotlights</label>
              <input type="number" placeholder="e.g. 4"
                className="input-field" {...register('illumination.numSpotLights')} />
            </div>
            <div>
              <label className="label">Light Wattage (W)</label>
              <input type="number" placeholder="e.g. 200"
                className="input-field" {...register('illumination.lightWattage')} />
            </div>
          </div>
        </SectionAccordion>

        {/* Audience */}
        <SectionAccordion title="Audience & Traffic" hint="Footfall, vehicles, peak hours">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Est. Daily Vehicles</label>
              <input type="number" placeholder="e.g. 50000"
                className="input-field" {...register('audience.estimatedDailyVehicles')} />
            </div>
            <div>
              <label className="label">Est. Daily Footfall</label>
              <input type="number" placeholder="e.g. 30000"
                className="input-field" {...register('audience.estimatedDailyFootfall')} />
            </div>
            <div>
              <label className="label">Nearby Population</label>
              <select className="input-field" {...register('audience.nearbyPopulation')}>
                <option value="">Select…</option>
                <option value="HIGH_DENSITY">High Density</option>
                <option value="MEDIUM_DENSITY">Medium Density</option>
                <option value="LOW_DENSITY">Low Density</option>
              </select>
            </div>
            <div>
              <label className="label">Traffic Data Source</label>
              <select className="input-field" {...register('audience.trafficDataSource')}>
                <option value="">Select…</option>
                <option value="OWNER_ESTIMATE">Owner Estimated</option>
                <option value="MUNICIPAL">Municipal Data</option>
                <option value="TDR">TDR</option>
                <option value="SURVEY_AGENCY">Survey Agency</option>
              </select>
            </div>
          </div>
        </SectionAccordion>

        {/* Pricing */}
        <SectionAccordion title="Pricing Details" hint="Rates, deposit, cancellation policy">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quarterly Rate (₹)</label>
              <input type="number" className="input-field" {...register('pricing.quarterlyRate')} />
            </div>
            <div>
              <label className="label">Half-Yearly Rate (₹)</label>
              <input type="number" className="input-field" {...register('pricing.halfYearlyRate')} />
            </div>
            <div>
              <label className="label">Annual Rate (₹)</label>
              <input type="number" className="input-field" {...register('pricing.annualRate')} />
            </div>
            <div>
              <label className="label">Security Deposit (₹)</label>
              <input type="number" className="input-field" {...register('pricing.securityDeposit')} />
            </div>
            <div>
              <label className="label">Min. Booking Days</label>
              <input type="number" placeholder="e.g. 30"
                className="input-field" {...register('pricing.minimumBookingDays')} />
            </div>
            <div>
              <label className="label">Advance Payment (months)</label>
              <input type="number" placeholder="e.g. 1"
                className="input-field" {...register('pricing.advancePaymentMonths')} />
            </div>
            <div>
              <label className="label">Cancellation Policy</label>
              <select className="input-field" {...register('pricing.cancellationPolicy')}>
                <option value="">Select…</option>
                <option value="NO_REFUND">No Refund</option>
                <option value="15_DAYS_NOTICE">15 Days Notice</option>
                <option value="30_DAYS_NOTICE">30 Days Notice</option>
                <option value="60_DAYS_NOTICE">60 Days Notice</option>
              </select>
            </div>
            <div className="col-span-2 flex flex-wrap gap-4">
              {[
                { name: 'pricing.printingCostIncluded' as const, label: 'Printing cost included' },
                { name: 'pricing.installationCostIncluded' as const, label: 'Installation cost included' },
                { name: 'pricing.gstIncluded' as const, label: 'GST included' },
              ].map(({ name, label }) => (
                <label key={name} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-brand-600" {...register(name)} />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </SectionAccordion>

        {/* Amenities */}
        <SectionAccordion title="Amenities & Infrastructure" hint="Power, backup, parking, access">
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'amenities.electricityAvailable' as const, label: 'Electricity available' },
              { name: 'amenities.batteryBackup' as const, label: 'Battery backup' },
              { name: 'amenities.solarPanelInstalled' as const, label: 'Solar panel installed' },
              { name: 'amenities.upsAvailable' as const, label: 'UPS available' },
              { name: 'amenities.generatorAvailable' as const, label: 'Generator available' },
              { name: 'amenities.weatherproof' as const, label: 'Weatherproof' },
              { name: 'amenities.easyMaintenanceAccess' as const, label: 'Easy maintenance access' },
              { name: 'amenities.onSiteWatchman' as const, label: 'On-site watchman' },
              { name: 'amenities.nearbyParking' as const, label: 'Nearby parking' },
              { name: 'amenities.remoteContentMgmt' as const, label: 'Remote content management' },
              { name: 'amenities.internetAvailable' as const, label: 'Internet available' },
            ].map(({ name, label }) => (
              <label key={name} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-brand-600" {...register(name)} />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </SectionAccordion>

        {/* Legal */}
        <SectionAccordion title="Legal & Permits" hint="Permit status, TDR, NOC, previous clients">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Permit Status</label>
              <select className="input-field" {...register('legal.permitStatus')}>
                <option value="">Select…</option>
                <option value="YES">Yes / Valid</option>
                <option value="PENDING">Pending</option>
                <option value="NO">No / Not Valid</option>
              </select>
            </div>
            <div>
              <label className="label">Permit Number</label>
              <input type="text" className="input-field" {...register('legal.permitNumber')} />
            </div>
            <div>
              <label className="label">Permit Valid Till</label>
              <input type="date" className="input-field" {...register('legal.permitValidTill')} />
            </div>
            <div>
              <label className="label">Hoarding Age</label>
              <input type="text" placeholder="e.g. 2 years"
                className="input-field" {...register('legal.hoardingAge')} />
            </div>
            <div className="col-span-2 flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-brand-600" {...register('legal.tdrCertificate')} />
                <span className="text-sm text-gray-700">TDR Certificate</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-brand-600" {...register('legal.nocFromAuthority')} />
                <span className="text-sm text-gray-700">NOC from Authority</span>
              </label>
            </div>
            <div className="col-span-2">
              <label className="label">Owner Description</label>
              <textarea rows={3} placeholder="Describe your hoarding's key strengths…"
                className="input-field resize-none" {...register('legal.ownerDescription')} />
            </div>
          </div>
        </SectionAccordion>

        {/* Location Advantages */}
        <SectionAccordion title="Location Advantages" hint="Select all that apply">
          <div className="flex flex-wrap gap-2">
            {LOCATION_ADVANTAGES.map((adv) => {
              const selected = selectedAdvantages.includes(adv)
              return (
                <button
                  key={adv}
                  type="button"
                  onClick={() => toggleAdvantage(adv)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors',
                    selected
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400'
                  )}
                >
                  {adv.replace(/_/g, ' ')}
                </button>
              )
            })}
          </div>
        </SectionAccordion>

        {/* Submit */}
        {mutation.isError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {mutation.error.message}
          </div>
        )}

        <button type="submit" disabled={mutation.isPending || mutation.isSuccess} className="btn-primary">
          {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {mutation.isPending ? 'Submitting…' : 'Submit for Review'}
        </button>
      </form>
    </div>
  )
}
