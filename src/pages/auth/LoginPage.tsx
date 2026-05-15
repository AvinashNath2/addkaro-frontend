// LoginPage.tsx — sign-in form
//
// Flow:
//   User fills in email + password
//   → Zod validates (non-empty, valid email format)
//   → useMutation calls POST /api/v1/auth/login
//   → On success: saves user in Zustand store (which also writes JWT to localStorage)
//   → Redirects to the user's role-appropriate home page

import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { loginSchema, type LoginFormData } from '@/lib/schemas/login.schema'
import { loginUser } from '@/api/auth.api'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const navigate = useNavigate()
  // setAuth saves the user object to Zustand store and writes the token to localStorage
  const setAuth = useAuthStore((s) => s.setAuth)

  // Set up the form with Zod validation
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (user) => {
      setAuth(user) // save to store + localStorage

      // Each role has a different home page — route them to the right one
      const role = user.role.toUpperCase()
      if (role === 'OWNER') navigate('/owner/dashboard')
      else if (role === 'ADMIN') navigate('/admin')
      else navigate('/browse')
    },
  })

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Page header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AddKaro</h1>
          <p className="mt-2 text-gray-500">Sign in to your account</p>
        </div>

        {/* White card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* noValidate disables browser built-in validation — Zod handles it */}
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate className="space-y-4">

            {/* Email field */}
            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={cn('input-field', errors.email && 'input-error')}
                {...register('email')}
              />
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className={cn('input-field', errors.password && 'input-error')}
                {...register('password')}
              />
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>

            {/* API error — shown when the server returns an error (wrong password, etc.) */}
            {mutation.isError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {mutation.error.message}
              </div>
            )}

            <button type="submit" disabled={mutation.isPending} className="btn-primary mt-2">
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {mutation.isPending ? 'Signing in…' : 'Sign In'}
            </button>

          </form>
        </div>

        {/* Link to registration page */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
            Create one
          </Link>
        </p>

      </div>
    </div>
  )
}
