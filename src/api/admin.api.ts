import api from './axios'
import type { CoreResponse } from '@/types/auth.types'
import type { AdminDashboard, AdminHolding, AdminUser, PageResponse } from '@/types/index'
import { IS_MOCK, mockFetch } from '@/lib/mockMode'

export async function getAdminDashboard(): Promise<AdminDashboard> {
  if (IS_MOCK) return mockFetch<AdminDashboard>('admin-dashboard.json')
  const res = await api.get<CoreResponse<AdminDashboard>>('/admin/dashboard')
  return res.data.data
}

export async function getPendingHoldings(): Promise<PageResponse<AdminHolding>> {
  if (IS_MOCK) {
    const data = await mockFetch<PageResponse<AdminHolding>>('admin-holdings.json')
    return { ...data, items: data.items.filter((h) => h.status === 'PENDING_REVIEW') }
  }
  const res = await api.get<CoreResponse<PageResponse<AdminHolding>>>('/admin/holdings', {
    params: { status: 'PENDING_REVIEW', limit: 50 },
  })
  return res.data.data
}

export async function getAllAdminHoldings(
  params: { status?: string; page?: number; limit?: number } = {},
): Promise<PageResponse<AdminHolding>> {
  if (IS_MOCK) {
    const data = await mockFetch<PageResponse<AdminHolding>>('admin-holdings.json')
    const filtered = params.status ? { ...data, items: data.items.filter((h) => h.status === params.status) } : data
    return filtered
  }
  const res = await api.get<CoreResponse<PageResponse<AdminHolding>>>('/admin/holdings', { params })
  return res.data.data
}

export async function updateAdminHoldingStatus(
  id: string,
  toStatus: string,
  reason?: string,
): Promise<AdminHolding> {
  if (IS_MOCK) {
    const data = await mockFetch<PageResponse<AdminHolding>>('admin-holdings.json')
    const holding = data.items.find((h) => h.id === id) ?? data.items[0]
    return { ...holding, status: toStatus as AdminHolding['status'], rejectionReason: reason ?? null }
  }
  const res = await api.patch<CoreResponse<AdminHolding>>(`/admin/holdings/${id}/status`, { toStatus, reason })
  return res.data.data
}

export async function getAllUsers(
  params: { role?: string; page?: number; limit?: number } = {},
): Promise<PageResponse<AdminUser>> {
  if (IS_MOCK) {
    const data = await mockFetch<PageResponse<AdminUser>>('admin-users.json')
    const filtered = params.role ? { ...data, items: data.items.filter((u) => u.role === params.role) } : data
    return filtered
  }
  const res = await api.get<CoreResponse<PageResponse<AdminUser>>>('/admin/users', { params })
  return res.data.data
}
