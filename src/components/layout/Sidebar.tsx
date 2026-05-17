import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2, Heart, FileText, Users, LogOut, MapPin, Settings, X } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  type NavItem = { to: string; icon: typeof MapPin; label: string; end?: boolean }

  const customerLinks: NavItem[] = [
    { to: '/browse',    icon: MapPin,          label: 'Browse' },
    { to: '/my-offers', icon: FileText,         label: 'My Offers' },
    { to: '/wishlist',  icon: Heart,            label: 'Wishlist' },
    { to: '/settings',  icon: Settings,         label: 'Preferences' },
  ]

  const ownerLinks: NavItem[] = [
    { to: '/owner/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/owner/holdings',  icon: Building2,        label: 'My Listings' },
    { to: '/settings',        icon: Settings,         label: 'Preferences' },
  ]

  const adminLinks: NavItem[] = [
    { to: '/admin',          end: true, icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/holdings',            icon: Building2,        label: 'Holdings' },
    { to: '/admin/users',               icon: Users,            label: 'Users' },
  ]

  const role  = user?.role?.toUpperCase()
  const links = role === 'ADMIN' ? adminLinks : role === 'OWNER' ? ownerLinks : customerLinks

  return (
    <aside
      className="w-64 h-full min-h-screen flex flex-col text-white select-none"
      style={{ background: 'linear-gradient(180deg, #0c1120 0%, #0f172a 100%)' }}
    >
      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              boxShadow: '0 4px 14px rgba(79,70,229,0.45)',
            }}
          >
            <Building2 className="w-[18px] h-[18px] text-white" />
          </div>
          <div>
            <p className="text-[15px] font-extrabold text-white tracking-tight leading-none">AddKaro</p>
            <p className="text-[10px] text-slate-500 font-semibold capitalize mt-0.5 leading-none tracking-wider">
              {user?.role?.toLowerCase()} portal
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.18em] px-3 mb-3">
          Navigation
        </p>
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={!!end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 group',
                isActive
                  ? 'bg-brand-600/15 text-white border border-brand-500/20'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent',
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150',
                    isActive
                      ? 'shadow-md'
                      : 'bg-white/[0.04] group-hover:bg-white/[0.08]',
                  )}
                  style={isActive ? {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    boxShadow: '0 3px 8px rgba(79,70,229,0.45)',
                  } : undefined}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User & Logout ─────────────────────────────────────────────────── */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white/[0.04] mb-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-extrabold shrink-0 ring-2 ring-brand-500/25"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-slate-200 truncate leading-tight">{user?.name}</p>
            <p className="text-[10px] text-slate-600 truncate leading-none mt-0.5">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-white/5 hover:text-slate-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
