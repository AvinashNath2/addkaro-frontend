// holding.schema.ts — Zod validation rules for the "Create Holding" form
//
// z.coerce.number() is used for numeric fields because HTML <input type="number">
// returns a string value from the DOM. z.coerce.number() converts "42.5" → 42.5
// automatically, so you don't need to manually call parseFloat() everywhere.

import { z } from 'zod'

export const holdingSchema = z.object({
  // Title: non-empty, max 200 chars (matches backend DTO constraint)
  title: z.string().min(1, 'Title is required').max(200),

  // Location: a free-text address string, must be provided
  location: z.string().min(1, 'Location is required'),

  // locationType must be exactly one of these two values.
  // z.enum() creates a union type and validates against the allowed set.
  // errorMap lets us customize the error message shown to users.
  locationType: z.enum(['URBAN', 'LOCAL'], {
    errorMap: () => ({ message: 'Select URBAN or LOCAL' }),
  }),

  // Coordinates — valid ranges enforced
  latitude: z.coerce.number().min(-90).max(90, 'Invalid latitude'),
  longitude: z.coerce.number().min(-180).max(180, 'Invalid longitude'),

  // Physical dimensions in feet — must be positive
  width: z.coerce.number().min(0.1, 'Width must be > 0'),
  height: z.coerce.number().min(0.1, 'Height must be > 0'),

  // Comma-separated ad types e.g. "Banner,Digital,Flex"
  // Optional because not all owners fill this in
  preferredAdTypes: z.string().optional(),

  // Monthly rental cost in rupees — must be at least ₹1
  rentalCost: z.coerce.number().min(1, 'Rental cost must be > 0'),
})

// Infer the TypeScript type automatically from the Zod schema
export type HoldingFormData = z.infer<typeof holdingSchema>
