// AdminUsersPage.tsx — user management for admins
//
// Features:
//   - Role filter tabs (All / Customer / Owner / Admin)
//   - Search bar — filters by name or email within the current page
//   - Pagination — server-side, 15 users per page
//   - Click any row to open a detail modal with full user info

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Search, X, Mail, Phone, Calendar, Shield } from 'lucide-react'
import { getAllUsers } from '@/api/admin.api'
import type { AdminUser } from '@/types/index'
import EmptyState from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'

const ROLE_TABS = [
  { label: 'All Users', value: '' },
  { label: 'Customers', value: 'CUSTOMER' },
  { label: 'Owners', value: 'OWNER' },
  { label: 'Admins', value: 'ADMIN' },
]

const ROLE_BADGE_STYLES: Record<string, string> = {
  CUSTOMER: 'bg-blue-100 text-blue-800',
  OWNER: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-red-100 text-red-800',
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function AdminUsersPage() {
  const [activeRole, setActiveRole] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-users', activeRole, currentPage],
    queryFn: () => getAllUsers({ role: activeRole || undefined, page: currentPage, limit: 15 }),
  })

  const handleRoleChange = (role: string) => {
    setActiveRole(role)
    setCurrentPage(0)
    setSearch('')
  }

  // Client-side search: filter the current page's items by name or email
  const filteredItems = data?.items.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  ) ?? []

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Users</h2>
        <p className="text-sm text-gray-500 mt-1">
          All registered users on the AddKaro platform
        </p>
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleRoleChange(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeRole === tab.value
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          Failed to load users. Please try again.
        </div>
      )}

      {data && !isLoading && (
        <p className="text-sm text-gray-500 mb-4">
          {search
            ? `${filteredItems.length} result${filteredItems.length !== 1 ? 's' : ''} for "${search}"`
            : `${data.totalElements} user${data.totalElements !== 1 ? 's' : ''} found`}
        </p>
      )}

      {filteredItems.length === 0 && !isLoading && data && (
        <EmptyState
          message={
            search
              ? `No users match "${search}".`
              : activeRole
              ? `No ${activeRole.toLowerCase()} users found.`
              : 'No users registered yet.'
          }
        />
      )}

      {filteredItems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Phone</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Role</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((user) => (
                  <tr
                    key={user.userId}
                    onClick={() => setSelectedUser(user)}
                    className="hover:bg-brand-50 cursor-pointer transition-colors"
                    title="Click to view user details"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar circle with first letter */}
                        <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-gray-600">{user.phone}</td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          ROLE_BADGE_STYLES[user.role.toUpperCase()] ?? 'bg-gray-100 text-gray-700',
                        )}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && !search && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={!data.hasPrevious}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {data.page + 1} of {data.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={!data.hasNext}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* ── User Detail Modal ────────────────────────────────────────────── */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Avatar + name + role */}
              <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100">
                <div className="w-14 h-14 rounded-full bg-brand-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">{selectedUser.name}</p>
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1',
                      ROLE_BADGE_STYLES[selectedUser.role.toUpperCase()] ?? 'bg-gray-100 text-gray-700',
                    )}
                  >
                    {selectedUser.role}
                  </span>
                </div>
              </div>

              {/* Detail rows */}
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail className="w-4 h-4 shrink-0 text-gray-400" />
                  <span>{selectedUser.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Phone className="w-4 h-4 shrink-0 text-gray-400" />
                  <span>{selectedUser.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="w-4 h-4 shrink-0 text-gray-400" />
                  <span>Joined {formatDate(selectedUser.createdAt)}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Shield className="w-4 h-4 shrink-0" />
                  <span className="font-mono text-xs">{selectedUser.userId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
