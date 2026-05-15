// admin.api.ts — API functions for authenticated ADMIN operations
//
// Admins can update holding statuses (approve, reject, delist, re-enable).
// All status transitions go through PATCH /admin/holdings/:id/status.

import api from './axios'
import type { CoreResponse } from '@/types/auth.types'
import type { AdminDashboard, AdminHolding, AdminUser, PageResponse } from '@/types/index'

// GET /api/v1/admin/dashboard
export async function getAdminDashboard(): Promise<AdminDashboard> {
  const res = await api.get<CoreResponse<AdminDashboard>>('/admin/dashboard')
  return res.data.data
}

// GET /api/v1/admin/holdings?status=PENDING_REVIEW&page=0
// Used for the "Pending Approvals" section
export async function getPendingHoldings(): Promise<PageResponse<AdminHolding>> {
  const res = await api.get<CoreResponse<PageResponse<AdminHolding>>>('/admin/holdings', {
    params: { status: 'PENDING_REVIEW', limit: 50 },
  })
  return res.data.data
}

// GET /api/v1/admin/holdings?status=PUBLISHED&page=0&limit=15
export async function getAllAdminHoldings(
  params: { status?: string; page?: number; limit?: number } = {},
): Promise<PageResponse<AdminHolding>> {
  const res = await api.get<CoreResponse<PageResponse<AdminHolding>>>('/admin/holdings', { params })
  return res.data.data
}

// PATCH /api/v1/admin/holdings/:id/status  body: { toStatus, reason? }
// Single unified status transition endpoint for all admin actions:
//   PENDING_REVIEW → PUBLISHED  (approve)
//   PENDING_REVIEW → ADMIN_REJECT  (reject, reason required)
//   PUBLISHED → DELISTED_BY_ADMIN  (delist, reason required)
//   DELISTED_BY_ADMIN → PUBLISHED  (re-enable)
export async function updateAdminHoldingStatus(
  id: string,
  toStatus: string,
  reason?: string,
): Promise<AdminHolding> {
  const res = await api.patch<CoreResponse<AdminHolding>>(`/admin/holdings/${id}/status`, { toStatus, reason })
  return res.data.data
}

// GET /api/v1/admin/users?role=OWNER&page=0&limit=15
export async function getAllUsers(
  params: { role?: string; page?: number; limit?: number } = {},
): Promise<PageResponse<AdminUser>> {
  const res = await api.get<CoreResponse<PageResponse<AdminUser>>>('/admin/users', { params })
  return res.data.data
}
