import { z } from 'zod'

const getTomorrow = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(0, 0, 0, 0)
  return d
}

export function makeOfferSchema(minBookingDays = 1) {
  const minDays = Math.max(1, minBookingDays)
  return z.object({
    offeredPrice: z.coerce.number().min(1, 'Offered price must be > 0'),

    desiredStartDate: z.string()
      .refine(
        (v) => !v || new Date(v) >= getTomorrow(),
        'Start date must be after today'
      )
      .optional(),

    desiredDuration: z.coerce
      .number({ required_error: 'Duration is required', invalid_type_error: 'Duration is required' })
      .min(minDays, `Minimum ${minDays} days required`)
      .refine(
        (v) => minDays <= 1 || v % minDays === 0,
        `Must be a multiple of ${minDays} days`
      ),

    message: z.string().optional(),

    contactNumber: z.string().regex(/^[0-9]{10}$/, 'Must be a 10-digit number'),
  })
}

export const offerSchema = makeOfferSchema()

export type OfferFormData = {
  offeredPrice: number
  desiredStartDate?: string
  desiredDuration: number
  message?: string
  contactNumber: string
}
