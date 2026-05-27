import api from './axios'
import type { RegisterPayload, AuthUser } from '@/types/auth.types'
import { IS_MOCK } from '@/lib/mockMode'

export async function registerUser(payload: RegisterPayload): Promise<AuthUser> {
  if (IS_MOCK) {
    return {
      userId: 'demo-user',
      name: payload.name,
      email: payload.email,
      role: payload.role.toUpperCase(),
      token: 'mock-token-demo',
    }
  }
  const res = await api.post<AuthUser>('/auth/register', payload)
  return res.data
}

export async function loginUser(payload: { email: string; password: string }): Promise<AuthUser> {
  if (IS_MOCK) {
    return {
      userId: 'demo-customer',
      name: 'Demo Customer',
      email: payload.email,
      role: 'CUSTOMER',
      token: 'mock-token-demo',
    }
  }
  const res = await api.post<AuthUser>('/auth/login', payload)
  return res.data
}
