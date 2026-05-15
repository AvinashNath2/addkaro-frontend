// auth.schema.ts — form validation rules using Zod
//
// Zod lets you define validation rules as code and get TypeScript types for free.
// The schema is used by React Hook Form to validate the form BEFORE any API call.
// If validation fails, the user sees an error message instantly — no network round trip.

import { z } from 'zod'

// registerSchema defines what a valid registration form looks like.
// z.object() = the form has multiple fields, each with its own rules.
export const registerSchema = z.object({

  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')   // error shown if < 2 chars
    .max(100, 'Name must be at most 100 characters'),

  email: z
    .string()
    .min(1, 'Email is required')                    // catches empty string
    .email('Enter a valid email address'),           // must look like x@y.z

  phone: z
    .string()
    // regex: must be exactly 10 digits, no spaces or dashes
    .regex(/^[0-9]{10}$/, 'Phone must be a 10-digit number'),

  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),

  role: z.enum(['customer', 'owner'], {
    // Custom error message if somehow neither option is selected
    errorMap: () => ({ message: 'Please select a role' }),
  }),
})

// z.infer<> extracts the TypeScript type from the schema automatically.
// So RegisterFormData is: { name: string, email: string, phone: string, password: string, role: "customer" | "owner" }
// We use this type in useForm<RegisterFormData> so the form is fully type-safe.
export type RegisterFormData = z.infer<typeof registerSchema>
