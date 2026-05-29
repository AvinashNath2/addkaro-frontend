import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, Building2, Shield } from 'lucide-react'
import Sidebar from './Sidebar'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useAuthStore((s) => s.user)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f4f6fb' }}>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-30 md:relative md:inset-auto md:z-auto',
          'transition-all duration-300 ease-in-out overflow-hidden shrink-0',
          sidebarOpen
            ? 'w-64 translate-x-0'
            : 'w-0 -translate-x-full',
        )}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto flex flex-col">

        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 h-16 shrink-0 border-b border-gray-100/80"
          style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)' }}
        >
          {/* Left */}
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only; desktop sidebar is always visible */}
          <button
              onClick={() => setSidebarOpen((s) => !s)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            {user?.role?.toUpperCase() === 'OWNER' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/80">
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-bold text-amber-700 tracking-wide">Owner Portal</span>
              </div>
            )}
            {user?.role?.toUpperCase() === 'ADMIN' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200/80">
                <Shield className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs font-bold text-red-700 tracking-wide">Admin Portal</span>
              </div>
            )}
          </div>

          {/* Right: user info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-[13px] font-bold text-gray-800 leading-tight">{user?.name}</p>
              <p className="text-[11px] text-gray-400 leading-none mt-0.5">{user?.email}</p>
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-extrabold shrink-0"
              style={{ background: '#C9F31D', color: '#111111' }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 p-6 md:p-8 page-enter">
          <Outlet />
        </div>

      </main>
    </div>
  )
}
