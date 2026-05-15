// App.tsx — the complete route map of the AddKaro frontend
//
// React Router's <Routes> looks at the current URL and renders the first matching <Route>.
// We use nested routes to apply layouts and access guards:
//
//   <ProtectedRoute />      — checks the user is logged in (redirects to /login if not)
//   <AppLayout />           — renders the sidebar + main area shell
//   <ProtectedRoute allowedRoles={[...]} /> — further restricts to specific roles
//
// Route nesting:
//   / ─┬─ /login              (public)
//      ├─ /register           (public)
//      └─ <ProtectedRoute>    (must be logged in)
//           └─ <AppLayout>    (renders sidebar)
//                ├─ /browse
//                ├─ /holdings/:id
//                ├─ <ProtectedRoute CUSTOMER>
//                │    ├─ /my-offers
//                │    └─ /wishlist
//                ├─ <ProtectedRoute OWNER>
//                │    ├─ /owner/dashboard
//                │    ├─ /owner/holdings
//                │    └─ /owner/holdings/new
//                └─ <ProtectedRoute ADMIN>
//                     ├─ /admin
//                     ├─ /admin/holdings
//                     └─ /admin/users

import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'

// ── Landing page ───────────────────────────────────────────────────────────
import LandingPage from '@/pages/landing/LandingPage'

// ── Public auth pages (no sidebar, direct URL access) ─────────────────────
import RegisterPage from '@/pages/auth/RegisterPage'
import LoginPage from '@/pages/auth/LoginPage'

// ── Browse pages (accessible to all authenticated users) ──────────────────
import BrowsePage from '@/pages/browse/BrowsePage'
import HoldingDetailPage from '@/pages/browse/HoldingDetailPage'

// ── Customer pages ─────────────────────────────────────────────────────────
import MyOffersPage from '@/pages/customer/MyOffersPage'
import WishlistPage from '@/pages/customer/WishlistPage'
import ChatPage from '@/pages/chat/ChatPage'

// ── Settings page (all authenticated roles) ────────────────────────────────
import UserSettingsPage from '@/pages/settings/UserSettingsPage'

// ── Owner pages ────────────────────────────────────────────────────────────
import OwnerDashboardPage from '@/pages/owner/OwnerDashboardPage'
import OwnerHoldingsPage from '@/pages/owner/OwnerHoldingsPage'
import CreateHoldingPage from '@/pages/owner/CreateHoldingPage'
import EditHoldingPage from '@/pages/owner/EditHoldingPage'

// ── Admin pages ────────────────────────────────────────────────────────────
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminHoldingsPage from '@/pages/admin/AdminHoldingsPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'

export default function App() {
  return (
    <Routes>
      {/* ── Public routes — no authentication required ─────────────────── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* ── Authenticated routes ────────────────────────────────────────── */}
      {/* Outer ProtectedRoute: just checks the user is logged in */}
      <Route element={<ProtectedRoute />}>
        {/* AppLayout wraps all authenticated pages — adds sidebar */}
        <Route element={<AppLayout />}>

          {/* Browse: any logged-in user can view listings and detail pages */}
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/holdings/:id" element={<HoldingDetailPage />} />

          {/* Chat: accessible to the customer + owner of an offer */}
          <Route path="/chat/:offerId" element={<ChatPage />} />

          {/* Settings: any authenticated user */}
          <Route path="/settings" element={<UserSettingsPage />} />

          {/* Customer-only routes */}
          <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
            <Route path="/my-offers" element={<MyOffersPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
          </Route>

          {/* Owner-only routes */}
          <Route element={<ProtectedRoute allowedRoles={['OWNER']} />}>
            <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
            {/* IMPORTANT: /owner/holdings/new must come BEFORE /owner/holdings
                so React Router doesn't try to match "new" as an :id parameter */}
            <Route path="/owner/holdings/new" element={<CreateHoldingPage />} />
            <Route path="/owner/holdings/:id/edit" element={<EditHoldingPage />} />
            <Route path="/owner/holdings" element={<OwnerHoldingsPage />} />
          </Route>

          {/* Admin-only routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/holdings" element={<AdminHoldingsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>

        </Route>
      </Route>

      {/* Catch-all: unknown paths go to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
