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
    <div className="flex h-screen overflow-hidden" style={{ background: '#f7f7f5' }}>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden backdrop-enter"
          style={{ backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-30 md:relative md:inset-auto md:z-auto',
          'transition-all duration-[350ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] overflow-hidden shrink-0',
          sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full',
        )}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto flex flex-col">

        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 h-14 shrink-0"
          style={{
            background: 'rgba(247,247,245,0.9)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(0,0,0,0.07)',
          }}
        >
          {/* Left */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen((s) => !s)}
              className="p-2 hover:bg-black/5 transition-colors text-gray-400 hover:text-gray-700"
              style={{ borderRadius: 4 }}
            >
              <Menu className="w-5 h-5" />
            </button>

            {user?.role?.toUpperCase() === 'OWNER' && (
              <div className="flex items-center gap-1.5 px-3 py-1 text-amber-700"
                style={{ background: '#fffbeb', border: '1px solid rgba(217,119,6,0.2)', borderRadius: 2 }}>
                <Building2 className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em]">Owner Portal</span>
              </div>
            )}
            {user?.role?.toUpperCase() === 'ADMIN' && (
              <div className="flex items-center gap-1.5 px-3 py-1 text-red-700"
                style={{ background: '#fff1f2', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 2 }}>
                <Shield className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em]">Admin Portal</span>
              </div>
            )}
          </div>

          {/* Right: user info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-[13px] font-semibold text-gray-800 leading-tight tracking-tight">{user?.name}</p>
              <p className="text-[11px] text-gray-400 leading-none mt-0.5 tracking-wide">{user?.email}</p>
            </div>
            <div
              className="w-8 h-8 flex items-center justify-center text-[12px] font-extrabold shrink-0"
              style={{ background: '#C9F31D', color: '#111111', borderRadius: 0 }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 p-6 md:p-10 page-enter">
          <Outlet />
        </div>

      </main>
    </div>
  )
}
