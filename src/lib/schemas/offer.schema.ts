// offer.schema.ts — Zod validation rules for the "Submit Offer" form
//
// The offer form has a mix of required and optional fields.
// Zod's .optional() marks a field as not required, but if provided it still
// must pass the other rules (like .min(1) for numbers).

import { z } from 'zod'

export const offerSchema = z.object({
  // How much the customer is offering per month — must be at least ₹1
  offeredPrice: z.coerce.number().min(1, 'Offered price must be > 0'),

  // When they want to start — a date string like "2025-08-01" (ISO format from <input type="date">)
  // Optional because the customer may not have a specific start date in mind
  desiredStartDate: z.string().optional(),

  // How many days they want to rent for — optional, and can be empty string from the input
  // z.literal('') handles the case where the user clears the field (HTML inputs return '' not undefined)
  desiredDuration: z.coerce.number().min(1).optional().or(z.literal('')),

  // Free-text message to the owner — optional
  message: z.string().optional(),

  // 10-digit Indian mobile number — required so the owner can contact them
  // .regex() lets us define a custom pattern; ^ and $ anchor it to the full string
  contactNumber: z.string().regex(/^[0-9]{10}$/, 'Must be a 10-digit number'),
})

export type OfferFormData = z.infer<typeof offerSchema>
