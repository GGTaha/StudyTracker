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
  { to: '/timer', icon: Timer, label: 'Study Timer' },
  { to: '/archive', icon: Archive, label: 'Archive' },
  { to: '/papers', icon: FileText, label: 'Past Papers' },
  { to: '/friends', icon: Users, label: 'Friends' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-full md:w-[300px] md:border-r border-white/5 bg-[#09090b]/50 backdrop-blur-xl shrink-0 z-20 flex flex-row md:flex-col p-5 md:p-8 gap-5 md:gap-9 border-b md:border-b-0">
      <div className="text-[1.7rem] font-bold tracking-tight flex items-center gap-3 text-white">
        <div className="w-3.5 h-3.5 bg-sky-400 rounded-full shadow-[0_0_12px_rgba(56,189,248,1)]"></div>
        Tracker.
      </div>
      <nav className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-visible w-full pb-2 md:pb-0 hide-scrollbar">
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
  )
}
