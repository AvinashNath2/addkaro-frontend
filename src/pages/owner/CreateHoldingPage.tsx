// CreateHoldingPage.tsx — form for owners to submit a new hoarding listing
//
// After submission the listing enters PENDING status and awaits admin approval.
// The owner is shown a brief success message then redirected to their listings page.
//
// All validation is handled by Zod via holdingSchema before the form submits.
// z.coerce.number() on numeric fields means the string values from <input> are
// automatically converted to numbers before Zod validates them.

import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { createHolding } from '@/api/owner.api'
import { holdingSchema, type HoldingFormData } from '@/lib/schemas/holding.schema'
import { cn } from '@/lib/utils'

export default function CreateHoldingPage() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HoldingFormData>({
    resolver: zodResolver(holdingSchema),
  })

  const mutation = useMutation({
    mutationFn: (data: HoldingFormData) => {
      // Transform the form data into the shape the backend expects.
      // preferredAdTypes is a comma-separated string in the form — split into an array.
      const payload = {
        ...data,
        preferredAdTypes: data.preferredAdTypes
          ? data.preferredAdTypes
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      }
      return createHolding(payload)
    },
    onSuccess: () => {
      // Brief delay before redirect so the user sees the success message
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
          Submit your hoarding for admin review. It will appear on the marketplace once approved.
        </p>
      </div>

      {/* Success state — shown after successful submission */}
      {mutation.isSuccess && (
        <div className="flex items-start gap-3 rounded-xl bg-green-50 border border-green-200 px-5 py-4 mb-6">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Submitted for review!</p>
            <p className="text-xs text-green-700 mt-0.5">
              Your listing is being reviewed by an admin. Redirecting you to listings…
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d))}
          noValidate
          className="space-y-5"
        >
          {/* Title */}
          <div>
            <label className="label">Listing Title</label>
            <input
              type="text"
              placeholder="e.g. Prime Hoarding at MG Road Signal"
              className={cn('input-field', errors.title && 'input-error')}
              {...register('title')}
            />
            {errors.title && <p className="error-text">{errors.title.message}</p>}
          </div>

          {/* Location */}
          <div>
            <label className="label">Location / Address</label>
            <input
              type="text"
              placeholder="e.g. MG Road, Bengaluru, Karnataka 560001"
              className={cn('input-field', errors.location && 'input-error')}
              {...register('location')}
            />
            {errors.location && <p className="error-text">{errors.location.message}</p>}
          </div>

          {/* Location type — radio buttons styled as a toggle */}
          <div>
            <label className="label">Location Type</label>
            <div className="flex gap-4">
              {(['URBAN', 'LOCAL'] as const).map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    value={type}
                    className="accent-brand-600"
                    {...register('locationType')}
                  />
                  <span className="text-sm font-medium text-gray-700">{type}</span>
                  <span className="text-xs text-gray-400">
                    {type === 'URBAN' ? '(Major city / metro area)' : '(Smaller town / locality)'}
                  </span>
                </label>
              ))}
            </div>
            {errors.locationType && (
              <p className="error-text">{errors.locationType.message}</p>
            )}
          </div>

          {/* Coordinates row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Latitude</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 12.9716"
                className={cn('input-field', errors.latitude && 'input-error')}
                {...register('latitude')}
              />
              {errors.latitude && <p className="error-text">{errors.latitude.message}</p>}
            </div>
            <div>
              <label className="label">Longitude</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 77.5946"
                className={cn('input-field', errors.longitude && 'input-error')}
                {...register('longitude')}
              />
              {errors.longitude && <p className="error-text">{errors.longitude.message}</p>}
            </div>
          </div>

          {/* Dimensions row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Width (in feet)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 20"
                className={cn('input-field', errors.width && 'input-error')}
                {...register('width')}
              />
              {errors.width && <p className="error-text">{errors.width.message}</p>}
            </div>
            <div>
              <label className="label">Height (in feet)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 10"
                className={cn('input-field', errors.height && 'input-error')}
                {...register('height')}
              />
              {errors.height && <p className="error-text">{errors.height.message}</p>}
            </div>
          </div>

          {/* Preferred ad types */}
          <div>
            <label className="label">Preferred Ad Types (optional)</label>
            <input
              type="text"
              placeholder="e.g. Banner, Digital, Flex, Wall Painting"
              className="input-field"
              {...register('preferredAdTypes')}
            />
            <p className="mt-1 text-xs text-gray-400">Separate multiple types with commas</p>
          </div>

          {/* Rental cost */}
          <div>
            <label className="label">Monthly Rental Cost (₹)</label>
            <input
              type="number"
              placeholder="e.g. 25000"
              className={cn('input-field', errors.rentalCost && 'input-error')}
              {...register('rentalCost')}
            />
            {errors.rentalCost && <p className="error-text">{errors.rentalCost.message}</p>}
          </div>

          {/* API error */}
          {mutation.isError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {mutation.error.message}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={mutation.isPending || mutation.isSuccess}
            className="btn-primary"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {mutation.isPending ? 'Submitting…' : 'Submit for Review'}
          </button>
        </form>
      </div>
    </div>
  )
}
