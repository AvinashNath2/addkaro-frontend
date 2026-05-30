import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Loader2, ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { createHolding } from '@/api/owner.api'
import { holdingSchema, type HoldingFormData } from '@/lib/schemas/holding.schema'
import { cn } from '@/lib/utils'

function SectionAccordion({
  title, hint, children, defaultOpen = false,
}: { title: string; hint?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div>
          <span className="text-sm font-semibold text-gray-900">{title}</span>
          {hint && <span className="ml-2 text-xs text-gray-500 font-normal">{hint}</span>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-5 py-5 space-y-4 bg-white">{children}</div>}
    </div>
  )
}

const LOCATION_ADVANTAGES = [
  'SIGNAL_JUNCTION', 'PEDESTRIAN_FOOTPATH_ZONE', 'HIGH_VEHICLE_TRAFFIC',
  'NATIONAL_HIGHWAY_FACING', 'STATE_HIGHWAY_FACING', 'NEAR_METRO_STATION',
  'NEAR_RAILWAY_STATION', 'NEAR_BUS_STAND', 'NEAR_AIRPORT',
  'FLYOVER_APPROACH', 'TOLL_BOOTH_AREA', 'NEAR_SHOPPING_MALL',
  'NEAR_SCHOOL_COLLEGE', 'NEAR_HOSPITAL', 'IN_MARKET_BAZAAR',
  'NEAR_IT_PARK', 'NEAR_INDUSTRIAL_AREA', 'NEAR_RESIDENTIAL_COLONY',
  'UPSCALE_NEIGHBOURHOOD', 'TOURIST_HERITAGE_AREA', 'MAIN_CITY_ROAD',
]

type AdvertiserEntry = { brandName: string; description: string }

export default function CreateHoldingPage() {
  const navigate = useNavigate()
  const [selectedAdvantages, setSelectedAdvantages] = useState<string[]>([])
  const [advertisers, setAdvertisers] = useState<AdvertiserEntry[]>([])

  const { register, handleSubmit, getValues, setValue, formState: { errors } } = useForm<HoldingFormData>({
    resolver: zodResolver(holdingSchema),
  })

  const toggleAdvantage = (adv: string) => {
    setSelectedAdvantages((prev) => {
      const next = prev.includes(adv) ? prev.filter((a) => a !== adv) : [...prev, adv]
      setValue('locationAdvantages', next)
      return next
    })
  }

  const addAdvertiser = () => setAdvertisers((prev) => [...prev, { brandName: '', description: '' }])
  const removeAdvertiser = (i: number) => setAdvertisers((prev) => prev.filter((_, idx) => idx !== i))
  const updateAdvertiser = (i: number, field: keyof AdvertiserEntry, value: string) => {
    setAdvertisers((prev) => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a))
  }

  const buildPayload = (data: Partial<HoldingFormData>, draft: boolean) => ({
    ...data,
    locationAdvantages: selectedAdvantages,
    previousAdvertisers: advertisers.filter((a) => a.brandName.trim()),
    draft,
  })

  const mutation = useMutation({
    mutationFn: (data: HoldingFormData) => createHolding(buildPayload(data, false)),
    onSuccess: () => { setTimeout(() => navigate('/owner/holdings'), 1500) },
  })

  const draftMutation = useMutation({
    mutationFn: () => {
      const data = getValues()
      return createHolding(buildPayload(data, true))
    },
    onSuccess: () => { setTimeout(() => navigate('/owner/holdings?status=DRAFT'), 1500) },
  })

  const isPending = mutation.isPending || draftMutation.isPending
  const isSuccess = mutation.isSuccess || draftMutation.isSuccess

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate('/owner/holdings')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Listings
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Add New Listing</h2>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the details and submit for admin review, or save as a draft to continue later.
        </p>
      </div>

      {mutation.isSuccess && (
        <div className="flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4 mb-6">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-700">Submitted for review!</p>
            <p className="text-xs text-emerald-600 mt-0.5">Redirecting you to listings…</p>
          </div>
        </div>
      )}

      {draftMutation.isSuccess && (
        <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-200 px-5 py-4 mb-6">
          <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-700">Draft saved!</p>
            <p className="text-xs text-blue-600 mt-0.5">Redirecting to your drafts…</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate className="space-y-5">

        {/* ── Required base fields ──────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Required Details</h3>

          <div>
            <label className="label">Listing Title</label>
            <input type="text" placeholder="e.g. Prime Hoarding at MG Road Signal"
              className={cn('input-field', errors.title && 'input-error')} {...register('title')} />
            {errors.title && <p className="error-text">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label">Location / Address</label>
            <input type="text" placeholder="e.g. MG Road, Bengaluru, Karnataka 560001"
              className="input-field" {...register('location')} />
          </div>

          <div>
            <label className="label">Location Type</label>
            <div className="flex gap-6">
              {(['URBAN', 'LOCAL'] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={type} className="accent-brand-600" {...register('locationType')} />
                  <span className="text-sm font-medium text-gray-700">{type}</span>
                  <span className="text-xs text-gray-500">{type === 'URBAN' ? '(Major city)' : '(Town / locality)'}</span>
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
        </div>

        {/* ── Optional sections ─────────────────────────────────────────── */}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mt-2">Optional Sections</p>

        {/* Address */}
        <SectionAccordion title="Address Details" hint="Area, city, state, PIN">
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
              <input type="text" placeholder="e.g. Bangalore"
                className={cn('input-field', errors.address?.city && 'input-error')}
                {...register('address.city')} />
              {errors.address?.city && <p className="error-text">{errors.address.city.message}</p>}
            </div>
            <div>
              <label className="label">State *</label>
              <input type="text" placeholder="e.g. Karnataka"
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
            <div className="col-span-2">
              <label className="label">Landmark</label>
              <input type="text" placeholder="e.g. Near MG Road Metro Station"
                className="input-field" {...register('address.landmark')} />
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
          </div>
        </SectionAccordion>

        {/* Illumination */}
        <SectionAccordion title="Illumination" hint="Lighting type and hours">
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
          </div>
        </SectionAccordion>

        {/* Audience */}
        <SectionAccordion title="Audience & Traffic" hint="Vehicle / footfall ranges and data source">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Daily Vehicle Range</label>
              <select className="input-field" {...register('audience.dailyVehiclesRange')}>
                <option value="">Select…</option>
                <option value="UNDER_10K">Under 10,000</option>
                <option value="10K_50K">10,000 – 50,000</option>
                <option value="50K_100K">50,000 – 1,00,000</option>
                <option value="ABOVE_100K">Above 1,00,000</option>
              </select>
            </div>
            <div>
              <label className="label">Daily Footfall Range</label>
              <select className="input-field" {...register('audience.dailyFootfallRange')}>
                <option value="">Select…</option>
                <option value="UNDER_5K">Under 5,000</option>
                <option value="5K_20K">5,000 – 20,000</option>
                <option value="20K_50K">20,000 – 50,000</option>
                <option value="ABOVE_50K">Above 50,000</option>
              </select>
            </div>
            <div className="col-span-2">
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
        <SectionAccordion title="Pricing Details" hint="Discounts, deposit, installation">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Min. Booking (months)</label>
              <input type="number" placeholder="e.g. 3"
                className="input-field" {...register('pricing.minimumBookingMonths')} />
            </div>
            <div>
              <label className="label">Quarterly Discount (%)</label>
              <input type="number" step="0.5" placeholder="e.g. 5"
                className="input-field" {...register('pricing.quarterlyDiscountPct')} />
            </div>
            <div>
              <label className="label">Half-Yearly Discount (%)</label>
              <input type="number" step="0.5" placeholder="e.g. 10"
                className="input-field" {...register('pricing.halfYearlyDiscountPct')} />
            </div>
            <div>
              <label className="label">Yearly Discount (%)</label>
              <input type="number" step="0.5" placeholder="e.g. 15"
                className="input-field" {...register('pricing.yearlyDiscountPct')} />
            </div>
            <div>
              <label className="label">Security Deposit Range</label>
              <input type="text" placeholder="e.g. ₹50,000 – ₹1,00,000"
                className="input-field" {...register('pricing.securityDepositRange')} />
            </div>
            <div>
              <label className="label">Installation Cost Range</label>
              <input type="text" placeholder="e.g. ₹10,000 – ₹25,000"
                className="input-field" {...register('pricing.installationCostRange')} />
            </div>
            <div>
              <label className="label">One-time Setup Cost (₹)</label>
              <input type="number" placeholder="e.g. 15000"
                className="input-field" {...register('pricing.setupCost')} />
            </div>
            <div>
              <label className="label">GST / Tax (%)</label>
              <input type="number" step="0.5" placeholder="Default: 18"
                className="input-field" {...register('pricing.taxPct')} />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-brand-600"
                  {...register('pricing.securityDepositRequired')} />
                <span className="text-sm text-gray-700">Security deposit required</span>
              </label>
            </div>
          </div>
        </SectionAccordion>

        {/* Amenities */}
        <SectionAccordion title="Amenities & Infrastructure" hint="Power, access, security">
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'amenities.electricityAvailable' as const, label: 'Electricity available' },
              { name: 'amenities.ladderAccess' as const, label: 'Ladder access' },
              { name: 'amenities.onSiteWatchman' as const, label: 'On-site watchman' },
              { name: 'amenities.nearbyParking' as const, label: 'Nearby parking' },
              { name: 'amenities.cctvInstalled' as const, label: 'CCTV installed' },
              { name: 'amenities.waterAvailable' as const, label: 'Water available' },
            ].map(({ name, label }) => (
              <label key={name} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-brand-600" {...register(name)} />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
            <div className="col-span-2">
              <label className="label">Power Supply Type</label>
              <select className="input-field" {...register('amenities.powerSupplyType')}>
                <option value="">Select…</option>
                <option value="EB">EB (Grid)</option>
                <option value="GENERATOR">Generator</option>
                <option value="SOLAR">Solar</option>
                <option value="EB_AND_GENERATOR">EB + Generator</option>
              </select>
            </div>
          </div>
        </SectionAccordion>

        {/* Legal */}
        <SectionAccordion title="Legal & Permits" hint="Permit status and NOC">
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
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-brand-600" {...register('legal.nocFromAuthority')} />
                <span className="text-sm text-gray-700">NOC from Authority</span>
              </label>
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
                      ? 'bg-[#1a3560] text-[#111] border-[#1a3560]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#1a3560]'
                  )}
                >
                  {adv.replace(/_/g, ' ')}
                </button>
              )
            })}
          </div>
        </SectionAccordion>

        {/* Previous Advertisers */}
        <SectionAccordion title="Previous Advertisers" hint="Brands that advertised here before">
          <div className="space-y-3">
            {advertisers.map((adv, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    placeholder="Brand name *"
                    value={adv.brandName}
                    onChange={(e) => updateAdvertiser(i, 'brandName', e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Short description (optional)"
                    value={adv.description}
                    onChange={(e) => updateAdvertiser(i, 'description', e.target.value)}
                    className="input-field"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeAdvertiser(i)}
                  className="mt-1 p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addAdvertiser}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add advertiser
            </button>
          </div>
        </SectionAccordion>

        {(mutation.isError || draftMutation.isError) && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {(mutation.error ?? draftMutation.error)?.message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => draftMutation.mutate()}
            disabled={isPending || isSuccess}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {draftMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Save as Draft
          </button>
          <button type="submit" disabled={isPending || isSuccess} className="btn-primary flex-1">
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {mutation.isPending ? 'Submitting…' : 'Submit for Review'}
          </button>
        </div>
      </form>
    </div>
  )
}
