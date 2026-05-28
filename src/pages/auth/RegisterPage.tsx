// RegisterPage.tsx — the user registration form page
//
// Libraries used here:
//   useState        → React built-in, stores a single piece of component state
//   useNavigate     → React Router, programmatically redirects the user to another page
//   useForm         → React Hook Form, manages form fields, dirty state, submission
//   zodResolver     → glue between React Hook Form and Zod validation
//   useMutation     → TanStack Query, manages an API call that changes data (POST/PUT/DELETE)
//   Loader2, CheckCircle2 → icons from lucide-react

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { registerSchema, type RegisterFormData } from '@/lib/schemas/auth.schema'
import { registerUser } from '@/api/auth.api'
import { cn } from '@/lib/utils'

export default function RegisterPage() {
  // useNavigate gives us a function to redirect the user programmatically.
  // e.g. navigate('/login') is like clicking a link — no page reload.
  const navigate = useNavigate()

  // "registered" is a boolean flag.
  // When true, we swap the form out for the success screen.
  // useState(false) = starts as false, setRegistered(true) flips it.
  const [registered, setRegistered] = useState(false)

  // useForm sets up the whole form:
  //   - register()      → connects an <input> to the form state
  //   - handleSubmit()  → wraps our onSubmit, runs Zod validation first
  //   - watch()         → reads a field's current value (used for the role toggle)
  //   - setValue()      → programmatically sets a field value (role buttons do this)
  //   - formState.errors → Zod error messages for each field
  //
  // zodResolver(registerSchema) means RHF runs our Zod rules before calling onSubmit.
  // If any field fails, onSubmit is NOT called and errors are populated instead.
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'customer' }, // start with "Customer" tab selected
  })

  // Watch the "role" field in real time so we can highlight the active tab button.
  // Every time the user clicks Customer or Owner, "role" updates and the component re-renders.
  const role = watch('role')

  // useMutation manages a single API call that CHANGES data (as opposed to useQuery for GET).
  // States it tracks automatically:
  //   mutation.isPending  → true while the POST is in-flight
  //   mutation.isError    → true if the request failed
  //   mutation.error      → the Error object (its .message was set by the axios interceptor)
  //
  // onSuccess: called if the API returns 2xx — we flip "registered" to show the success screen.
  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => setRegistered(true),
  })

  // Called by handleSubmit ONLY if Zod validation passes.
  // mutation.mutate() fires the API call.
  const onSubmit = (data: RegisterFormData) => mutation.mutate(data)

  // Role label map — Customer and Hoarding Owner
  const roleLabels: Record<string, string> = {
    customer: 'Customer',
    owner: 'Hoarding Owner',
  }

  // ── Success screen ────────────────────────────────────────────────────────
  // Show this instead of the form once the account is created.
  if (registered) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          {/* Green circle with a checkmark icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h2>
          <p className="text-gray-500 mb-6">Your account is ready. You can now log in.</p>
          {/* navigate('/login') sends the user to the login page */}
          <button onClick={() => navigate('/login')} className="btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Page header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AddKaro</h1>
          <p className="mt-2 text-gray-500">Create your account to get started</p>
        </div>

        {/* Card wrapping the form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

          {/* ── Role toggle (Customer / Hoarding Owner) ── */}
          {/* This is NOT a standard radio input — it's two styled buttons.
              Clicking one calls setValue('role', r) which updates the hidden
              form field that Zod validates. The active button gets a yellow
              background + bold text; the inactive one stays grey. */}
          <div className="mb-6">
            <label className="label">I am a</label>
            <div className="flex rounded-xl border border-gray-200 bg-gray-100 p-1 gap-1">
              {(['customer', 'owner'] as const).map((r) => (
                <button
                  key={r}
                  type="button"   // prevents accidental form submission on click
                  onClick={() => setValue('role', r, { shouldValidate: true })}
                  className={cn(
                    'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-150',
                    role === r
                      ? 'bg-white shadow-sm font-semibold text-gray-900'   // active tab
                      : 'text-gray-500 hover:text-gray-700',               // inactive tab
                  )}
                >
                  {roleLabels[r]}
                </button>
              ))}
            </div>
            {errors.role && <p className="error-text">{errors.role.message}</p>}
          </div>

          {/* noValidate disables the browser's built-in validation popups —
              we want Zod to handle all validation, not the browser */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

            {/* Full Name field */}
            {/* {...register('name')} spreads onChange, onBlur, ref onto the <input>
                so React Hook Form can track its value and trigger validation */}
            <div>
              <label htmlFor="name" className="label">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="Avinash Nath"
                autoComplete="name"
                className={cn('input-field', errors.name && 'input-error')}
                {...register('name')}
              />
              {/* Show the Zod error message if validation failed for this field */}
              {errors.name && <p className="error-text">{errors.name.message}</p>}
            </div>

            {/* Email field */}
            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className={cn('input-field', errors.email && 'input-error')}
                {...register('email')}
              />
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>

            {/* Phone field — maxLength=10 prevents typing more than 10 digits in the UI */}
            <div>
              <label htmlFor="phone" className="label">Phone Number</label>
              <input
                id="phone"
                type="tel"
                placeholder="9876543210"
                autoComplete="tel"
                maxLength={10}
                className={cn('input-field', errors.phone && 'input-error')}
                {...register('phone')}
              />
              {errors.phone && <p className="error-text">{errors.phone.message}</p>}
            </div>

            {/* Password field — type="password" masks the input */}
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                autoComplete="new-password"
                className={cn('input-field', errors.password && 'input-error')}
                {...register('password')}
              />
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>

            {/* API error box — only shown if the POST /auth/register call failed.
                e.g. "Email already registered" — a server-side error Zod can't catch.
                mutation.error.message was set by our axios response interceptor. */}
            {mutation.isError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {mutation.error.message}
              </div>
            )}

            {/* Submit button
                - disabled while the API call is in flight (prevents double-submit)
                - shows a spinning icon + different label text while pending */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary mt-2"
            >
              {/* Loader2 is a circular spinner icon. animate-spin rotates it. */}
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {mutation.isPending ? 'Creating account…' : 'Create Account'}
            </button>

          </form>
        </div>

        {/* Footer — link to login page for users who already have an account */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          {/* <Link> is React Router's <a> tag — navigates without a page reload */}
          <Link to="/login" className="font-medium text-gray-900 hover:opacity-80">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  )
}
