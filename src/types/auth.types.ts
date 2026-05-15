// auth.types.ts — TypeScript type definitions for authentication
//
// TypeScript "types" and "interfaces" are compile-time contracts — they don't
// exist in the final JavaScript. They exist purely so your editor can catch
// mistakes before you even run the code.
// e.g. If you write user.nmae instead of user.name, TypeScript immediately flags it.

// The two roles a user can have in AddKaro
export type UserRole = 'customer' | 'owner'

// What we send to POST /api/v1/auth/register
// Must match the backend's RegisterRequest DTO exactly
export interface RegisterPayload {
  name: string
  email: string
  phone: string
  password: string
  role: UserRole
}

// What the backend returns after a successful register or login.
// The "token" is a JWT — a signed string the browser stores in localStorage
// and sends with every future API request to prove identity.
export interface AuthUser {
  userId: string
  name: string
  email: string
  role: string
  token: string
}

// The standard envelope every AddKaro API response is wrapped in.
// T is a "generic" — it means "whatever type the data field holds".
// For a register response: CoreResponse<AuthUser>
// For a list of holdings: CoreResponse<PageResponse<Holding>>
//
// The backend always sends:
// {
//   "code":    "USER_REGISTERED",
//   "message": "User registered successfully",
//   "data":    { userId, name, email, role, token }
// }
export interface CoreResponse<T> {
  code: string
  message: string
  data: T
  errors?: string[]                  // present only on validation failures
  errorsMap?: Record<string, string> // field-level errors: { "email": "already taken" }
}
