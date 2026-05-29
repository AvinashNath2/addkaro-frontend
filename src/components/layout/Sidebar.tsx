import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2, Heart, FileText, Users, LogOut, MapPin, Settings, X } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'

const Y = '#C9F31D'

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
      className="w-64 h-full flex flex-col select-none overflow-y-auto"
      style={{ background: '#0d0d0d', borderRight: '1px solid #1e1e1e', scrollbarWidth: 'none' }}
    >
      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-5 flex items-center justify-between" style={{ borderBottom: '1px solid #1e1e1e' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: Y }}
          >
            <Building2 className="w-[18px] h-[18px]" style={{ color: '#111' }} />
          </div>
          <div>
            <p className="text-[15px] font-extrabold text-white tracking-tight leading-none">AddKaro</p>
            <p className="text-[10px] font-semibold capitalize mt-0.5 leading-none tracking-wider" style={{ color: '#444' }}>
              {user?.role?.toLowerCase()} portal
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#444' }}
            onMouseOver={e => (e.currentTarget.style.color = '#888')}
            onMouseOut={e => (e.currentTarget.style.color = '#444')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] px-3 mb-3" style={{ color: '#333' }}>
          Navigation
        </p>
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={!!end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold group',
                'transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
                isActive
                  ? 'border border-transparent'
                  : 'text-[#555] hover:text-white hover:translate-x-0.5 border border-transparent',
              )
            }
            style={({ isActive }) => isActive
              ? { background: 'rgba(201,243,29,0.1)', borderColor: 'rgba(201,243,29,0.15)', color: Y }
              : undefined
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150',
                    !isActive && 'group-hover:bg-[#1a1a1a]',
                  )}
                  style={isActive
                    ? { background: 'rgba(201,243,29,0.18)', color: Y }
                    : { background: '#1a1a1a' }
                  }
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
      <div className="p-3" style={{ borderTop: '1px solid #1e1e1e' }}>
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl mb-1" style={{ background: '#1a1a1a' }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-extrabold shrink-0"
            style={{ background: Y, color: '#111' }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-white truncate leading-tight">{user?.name}</p>
            <p className="text-[10px] truncate leading-none mt-0.5" style={{ color: '#444' }}>{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-[13px] font-medium transition-colors"
          style={{ color: '#555' }}
          onMouseOver={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#aaa' }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555' }}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
