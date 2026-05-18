import api from './axios'
import type { AdminDashboard, AdminHolding, AdminUser, PageResponse } from '@/types/index'
import { IS_MOCK, mockFetch } from '@/lib/mockMode'
import { fromSpringPage } from '@/lib/springPage'

export async function getAdminDashboard(): Promise<AdminDashboard> {
  if (IS_MOCK) return mockFetch<AdminDashboard>('admin-dashboard.json')
  const res = await api.get<AdminDashboard>('/admin/dashboard')
  return res.data
}

export async function getPendingHoldings(): Promise<PageResponse<AdminHolding>> {
  if (IS_MOCK) {
    const data = await mockFetch<PageResponse<AdminHolding>>('admin-holdings.json')
    return { ...data, items: data.items.filter((h) => h.status === 'PENDING') }
  }
  const res = await api.get('/admin/holdings', { params: { status: 'PENDING', limit: 50 } })
  return fromSpringPage<AdminHolding>(res.data)
}

export async function getAllAdminHoldings(
  params: { status?: string; page?: number; limit?: number } = {},
): Promise<PageResponse<AdminHolding>> {
  if (IS_MOCK) {
    const data = await mockFetch<PageResponse<AdminHolding>>('admin-holdings.json')
    const filtered = params.status ? { ...data, items: data.items.filter((h) => h.status === params.status) } : data
    return filtered
  }
  const res = await api.get('/admin/holdings', { params })
  return fromSpringPage<AdminHolding>(res.data)
}

export async function approveHolding(id: string): Promise<AdminHolding> {
  if (IS_MOCK) {
    const data = await mockFetch<PageResponse<AdminHolding>>('admin-holdings.json')
    return { ...(data.items.find((h) => h.id === id) ?? data.items[0]), status: 'ACTIVE' }
  }
  const res = await api.post<AdminHolding>(`/admin/holdings/${id}/approve`)
  return res.data
}

export async function rejectHolding(id: string, reason: string): Promise<AdminHolding> {
  if (IS_MOCK) {
    const data = await mockFetch<PageResponse<AdminHolding>>('admin-holdings.json')
    return { ...(data.items.find((h) => h.id === id) ?? data.items[0]), status: 'REJECTED', rejectionReason: reason }
  }
  const res = await api.post<AdminHolding>(`/admin/holdings/${id}/reject`, { reason })
  return res.data
}

export async function suspendHolding(id: string, reason: string): Promise<AdminHolding> {
  if (IS_MOCK) {
    const data = await mockFetch<PageResponse<AdminHolding>>('admin-holdings.json')
    return { ...(data.items.find((h) => h.id === id) ?? data.items[0]), status: 'SUSPENDED', rejectionReason: reason }
  }
  const res = await api.post<AdminHolding>(`/admin/holdings/${id}/suspend`, { reason })
  return res.data
}

export async function getAllUsers(
  params: { role?: string; page?: number; limit?: number } = {},
): Promise<PageResponse<AdminUser>> {
  if (IS_MOCK) {
    const data = await mockFetch<PageResponse<AdminUser>>('admin-users.json')
    const filtered = params.role ? { ...data, items: data.items.filter((u) => u.role === params.role) } : data
    return filtered
  }
  const res = await api.get('/admin/users', { params })
  return fromSpringPage<AdminUser>(res.data)
}
