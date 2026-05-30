import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Loader2, User, Building2, ShieldCheck } from 'lucide-react'
import { loginSchema, type LoginFormData } from '@/lib/schemas/login.schema'
import { loginUser } from '@/api/auth.api'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'
import { IS_MOCK } from '@/lib/mockMode'
import type { AuthUser } from '@/types/auth.types'

const DEMO_USERS: AuthUser[] = [
  { userId: 'demo-customer', name: 'Priya Sharma (Customer)', email: 'priya@demo.in', role: 'CUSTOMER', token: 'mock-token' },
  { userId: 'demo-owner', name: 'Vikram Malhotra (Owner)', email: 'vikram@demo.in', role: 'OWNER', token: 'mock-token' },
  { userId: 'demo-admin', name: 'Admin User', email: 'admin@demo.in', role: 'ADMIN', token: 'mock-token' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (user) => {
      setAuth(user)
      const role = user.role.toUpperCase()
      if (role === 'OWNER') navigate('/owner/dashboard')
      else if (role === 'ADMIN') navigate('/admin')
      else navigate('/browse')
    },
  })

  const loginAs = (user: AuthUser) => {
    setAuth(user)
    const role = user.role.toUpperCase()
    if (role === 'OWNER') navigate('/owner/dashboard')
    else if (role === 'ADMIN') navigate('/admin')
    else navigate('/browse')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AddKaro</h1>
          <p className="mt-2 text-gray-500">Sign in to your account</p>
        </div>

        {IS_MOCK && (
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-[#1a3560]" style={{ color: '#6b7f00' }}>Demo Mode — choose a role</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => loginAs(DEMO_USERS[0])}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2 py-3 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <User className="w-5 h-5 text-gray-400" />
                Customer
              </button>
              <button
                onClick={() => loginAs(DEMO_USERS[1])}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2 py-3 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <Building2 className="w-5 h-5 text-emerald-500" />
                Owner
              </button>
              <button
                onClick={() => loginAs(DEMO_USERS[2])}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2 py-3 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <ShieldCheck className="w-5 h-5 text-purple-500" />
                Admin
              </button>
            </div>
            <p className="text-[10px] mt-3 text-center text-gray-400">No password needed in demo mode</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate className="space-y-4">

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

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-gray-900 hover:opacity-80">
            Create one
          </Link>
        </p>

      </div>
    </div>
  )
}
