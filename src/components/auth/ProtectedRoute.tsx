// ProtectedRoute.tsx — a route guard that blocks unauthenticated / wrong-role access
//
// How it works with React Router:
//   In App.tsx, protected routes are CHILDREN of <ProtectedRoute />.
//   When React Router tries to render a protected route, it renders
//   <ProtectedRoute> first. If the checks pass, ProtectedRoute renders
//   <Outlet /> which renders the actual child route. If not, it redirects.
//
// Two layers of protection:
//   1. Not logged in → redirect to /login
//   2. Wrong role → redirect to the user's own home page
//
// Example usage in App.tsx:
//   <Route element={<ProtectedRoute allowedRoles={['OWNER']} />}>
//     <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
//   </Route>

import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

interface Props {
  // If provided, only users with one of these roles can access.
  // If omitted, ANY authenticated user can access (just needs to be logged in).
  allowedRoles?: string[]
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  // Read the user from global state (null = not logged in)
  const user = useAuthStore((s) => s.user)

  // ── Check 1: must be logged in ────────────────────────────────────────────
  // <Navigate to="/login" replace /> immediately redirects.
  // "replace" means it replaces the history entry (no Back button loop).
  if (!user) return <Navigate to="/login" replace />

  // ── Check 2: must have the right role (if allowedRoles is specified) ───────
  if (allowedRoles && !allowedRoles.includes(user.role.toUpperCase())) {
    // They're logged in but this section isn't for their role.
    // Send them to their own home page instead of a blank 403.
    const home =
      user.role.toUpperCase() === 'OWNER' ? '/owner/dashboard'
      : user.role.toUpperCase() === 'ADMIN' ? '/admin'
      : '/browse'
    return <Navigate to={home} replace />
  }

  // ── All checks passed: render the child route ─────────────────────────────
  // <Outlet /> renders whatever child route matched — the actual page component.
  return <Outlet />
}
