// axios.ts — the single configured HTTP client used for all API calls
//
// Axios is an HTTP library (like fetch, but with more features).
// We create ONE configured instance here and import it everywhere else.
// This means auth headers and error handling are set up in one place,
// not repeated in every API function.

import axios from 'axios'
import type { CoreResponse } from '@/types/auth.types'

// Create an axios instance with shared defaults.
// All API functions import this "api" object, not raw axios.
const api = axios.create({
  // baseURL is prepended to every request path automatically.
  // So api.post('/auth/register') actually calls /api/v1/auth/register.
  // Vite's proxy then forwards that to http://localhost:8082/api/v1/auth/register.
  baseURL: '/api/v1',

  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request Interceptor ──────────────────────────────────────────────────────
// An interceptor is a function that runs on EVERY request before it's sent.
// This one attaches both auth values the backend needs:
//
//   Authorization: Bearer <token>   — standard JWT header (for future JWT enforcement)
//   X-User-Id: <userId>             — the backend currently reads identity from this header
//                                     because full JWT parsing is not yet implemented
//
// Both values are written to localStorage by auth.store.ts on login/register.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const userId = localStorage.getItem('userId')
  if (userId) {
    config.headers['X-User-Id'] = userId
  }

  return config  // must return config, or the request won't proceed
})

// ── Response Interceptor ─────────────────────────────────────────────────────
// This runs on EVERY response. The second argument handles errors (4xx, 5xx).
//
// Why we need this:
//   Our backend always wraps errors in CoreResponse: { code, message, data }
//   But axios throws a generic error with status code only.
//   This interceptor extracts the backend's human-readable "message" field
//   so in components we can just write: mutation.error.message
//   instead of: mutation.error.response?.data?.message ?? 'Something went wrong'
api.interceptors.response.use(
  // Success (2xx): pass the response through unchanged
  (response) => response,

  // Error (4xx, 5xx): extract the backend's message and throw a clean Error
  (error) => {
    const apiError = error.response?.data as CoreResponse<unknown> | undefined
    const message = apiError?.message ?? error.message ?? 'Something went wrong'
    return Promise.reject(new Error(message))
  },
)

export default api
