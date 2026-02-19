import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Timer, 
  FileText, 
  Users, 
  Settings,
  Archive
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/timer', icon: Timer, label: 'Timer' },
  { to: '/archive', icon: Archive, label: 'Archive' },
  { to: '/papers', icon: FileText, label: 'Papers' },
  { to: '/friends', icon: Users, label: 'Friends' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex md:w-[300px] md:border-r border-white/5 bg-[#09090b]/50 backdrop-blur-xl shrink-0 z-20 flex-col p-8 gap-9">
        <div className="text-[1.7rem] font-bold tracking-tight flex items-center gap-3 text-white">
          <div className="w-3.5 h-3.5 bg-sky-400 rounded-full shadow-[0_0_12px_rgba(56,189,248,1)]"></div>
          Tracker.
        </div>
        <nav className="flex flex-col gap-2.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-4 px-5 py-3.5 rounded-xl text-[1rem] font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <item.icon className="w-[24px] h-[24px] flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#09090b]/90 backdrop-blur-xl border-t border-white/[0.06] px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 py-2.5 px-2 min-w-[3.5rem] transition-colors ${
                  isActive ? 'text-sky-400' : 'text-slate-500'
                }`}
              >
                <item.icon className="w-[22px] h-[22px]" />
                <span className="text-[0.65rem] font-medium leading-none">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </>
  )
}
