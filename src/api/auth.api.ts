// auth.api.ts — functions that call the authentication API endpoints
//
// Each function here maps to one backend endpoint.
// Components never call axios directly — they call these functions.
// This keeps network logic in one place and makes components easier to read.

import api from './axios'
import type { RegisterPayload, AuthUser, CoreResponse } from '@/types/auth.types'

// POST /api/v1/auth/register
// Sends the registration form data and returns the created user + JWT token.
//
// Return type: Promise<AuthUser>
//   - Promise means the result arrives asynchronously (the network takes time)
//   - We unwrap the CoreResponse envelope here so callers get AuthUser directly,
//     not the full { code, message, data: AuthUser } wrapper
export async function registerUser(payload: RegisterPayload): Promise<AuthUser> {
  const res = await api.post<CoreResponse<AuthUser>>('/auth/register', payload)
  return res.data.data  // res.data = CoreResponse, res.data.data = the AuthUser inside
}

// POST /api/v1/auth/login
// Sends email + password and returns the user + JWT token on success.
// Same unwrapping pattern as registerUser.
export async function loginUser(payload: { email: string; password: string }): Promise<AuthUser> {
  const res = await api.post<CoreResponse<AuthUser>>('/auth/login', payload)
  return res.data.data
}
