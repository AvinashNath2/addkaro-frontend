import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Search, X, Mail, Phone, Calendar, Shield, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { getAllUsers } from '@/api/admin.api'
import type { AdminUser } from '@/types/index'
import EmptyState from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/formatters'

const ROLE_TABS = [
  { label: 'All Users', value: '' },
  { label: 'Customers', value: 'CUSTOMER' },
  { label: 'Owners', value: 'OWNER' },
  { label: 'Admins', value: 'ADMIN' },
]

const ROLE_BADGE_STYLES: Record<string, string> = {
  CUSTOMER: 'bg-blue-50 text-blue-700 border border-blue-200',
  OWNER: 'bg-purple-50 text-purple-700 border border-purple-200',
  ADMIN: 'bg-red-50 text-red-700 border border-red-200',
}

type SortKey = 'name' | 'email' | 'phone' | 'role' | 'createdAt'
type SortDir = 'asc' | 'desc'

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey | null; sortDir: SortDir }) {
  if (sortKey !== col) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300 ml-1 inline" />
  return sortDir === 'asc'
    ? <ChevronUp className="w-3.5 h-3.5 text-brand-500 ml-1 inline" />
    : <ChevronDown className="w-3.5 h-3.5 text-brand-500 ml-1 inline" />
}

export default function AdminUsersPage() {
  const [activeRole, setActiveRole] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-users', activeRole, currentPage],
    queryFn: () => getAllUsers({ role: activeRole || undefined, page: currentPage, limit: 15 }),
  })

  const handleRoleChange = (role: string) => {
    setActiveRole(role)
    setCurrentPage(0)
    setSearch('')
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filteredItems = useMemo(() => {
    let items = data?.items ?? []

    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q),
      )
    }

    if (sortKey) {
      items = [...items].sort((a, b) => {
        const av = a[sortKey] ?? ''
        const bv = b[sortKey] ?? ''
        const cmp = String(av).localeCompare(String(bv), 'en', { sensitivity: 'base', numeric: sortKey === 'createdAt' })
        return sortDir === 'asc' ? cmp : -cmp
      })
    }

    return items
  }, [data, search, sortKey, sortDir])

  const colHdr = (label: string, key: SortKey) => (
    <th
      className="text-left px-6 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700 whitespace-nowrap"
      onClick={() => handleSort(key)}
    >
      {label}
      <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
    </th>
  )

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Users</h2>
        <p className="text-sm text-gray-500 mt-1">All registered users on the AddKaro platform</p>
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleRoleChange(tab.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeRole === tab.value
                ? 'border-b-2 border-brand-500 text-brand-500'
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
          placeholder="Search by name, email or phone…"
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {colHdr('Name', 'name')}
                  {colHdr('Email', 'email')}
                  {colHdr('Phone', 'phone')}
                  {colHdr('Role', 'role')}
                  {colHdr('Joined', 'createdAt')}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                    title="Click to view user details"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-brand-500/20 text-gray-900 flex items-center justify-center text-xs font-bold shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 text-gray-500">{user.phone}</td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          ROLE_BADGE_STYLES[user.role.toUpperCase()] ?? 'bg-gray-100 text-gray-600',
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
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {data.page + 1} of {data.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={!data.hasNext}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100">
                <div className="w-14 h-14 rounded-full bg-brand-500/20 flex items-center justify-center text-2xl font-bold text-gray-900 shrink-0">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">{selectedUser.name}</p>
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1',
                      ROLE_BADGE_STYLES[selectedUser.role.toUpperCase()] ?? 'bg-gray-100 text-gray-600',
                    )}
                  >
                    {selectedUser.role}
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3 text-gray-500">
                  <Mail className="w-4 h-4 shrink-0 text-gray-400" />
                  <span>{selectedUser.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-500">
                  <Phone className="w-4 h-4 shrink-0 text-gray-400" />
                  <span>{selectedUser.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-500">
                  <Calendar className="w-4 h-4 shrink-0 text-gray-400" />
                  <span>Joined {formatDate(selectedUser.createdAt)}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-500">
                  <Shield className="w-4 h-4 shrink-0 text-gray-400" />
                  <span className="font-mono text-xs">{selectedUser.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
