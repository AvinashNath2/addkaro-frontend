// login.schema.ts — Zod validation rules for the login form
//
// Zod is a "schema validation" library. You define the shape and rules of
// your data, and Zod checks whether incoming data matches those rules.
//
// We use Zod here with React Hook Form's zodResolver so validation runs
// automatically before the form's onSubmit handler is called.
// If any field fails, RHF populates formState.errors and onSubmit is NOT called.

import { z } from 'zod'

export const loginSchema = z.object({
  // z.string() = must be a string
  // .min(1, ...) = must have at least 1 character (not empty)
  // .email(...) = must match email format (has @, has domain, etc.)
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),

  // Password just needs to be non-empty — we don't apply complexity rules here
  // because the server enforces those, and we don't want to block users
  // who registered before rules changed.
  password: z.string().min(1, 'Password is required'),
})

// z.infer<typeof loginSchema> extracts the TypeScript type from the Zod schema.
// This means LoginFormData is automatically { email: string; password: string }
// and stays in sync if we ever add more fields to the schema.
export type LoginFormData = z.infer<typeof loginSchema>
