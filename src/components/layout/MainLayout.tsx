import { Outlet, useLocation } from 'react-router-dom'
import { useRef, useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '../../stores/authStore'

const PAGE_CONFIG: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: '', subtitle: '' }, // Dashboard has its own greeting header
  '/timer':     { title: 'Study Session ⏱️', subtitle: 'Track your focus time and build consistency.' },
  '/papers':    { title: 'Paper Repository 📄', subtitle: 'Log past papers and track your scores.' },
  '/friends':   { title: 'Your Network 🤝', subtitle: 'Connect, compare, and study together.' },
  '/archive':   { title: 'Session Archive 📦', subtitle: 'Browse your completed study sessions.' },
  '/settings':  { title: 'Settings & Preferences ⚙️', subtitle: 'Manage your profile, account, and privacy.' },
}

export function MainLayout() {
  const location = useLocation()
  const { profile, signOut } = useAuthStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const pageCfg = PAGE_CONFIG[location.pathname] ?? { title: '', subtitle: '' }
  const showHeader = pageCfg.title !== ''

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-50 flex overflow-hidden relative font-sans selection:bg-sky-500/30">
      {/* Ambient Background Blobs */}
      <div className="fixed top-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-900 rounded-full mix-blend-multiply filter blur-[120px] opacity-30 z-0 animate-pulse pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-sky-900 rounded-full mix-blend-multiply filter blur-[120px] opacity-30 z-0 pointer-events-none"></div>
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-y-auto z-10 w-full">
        {showHeader && (
          <header className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[1.5rem] md:text-[2.25rem] font-semibold mb-1 md:mb-2 tracking-tight">{pageCfg.title}</h1>
              <p className="text-slate-400 text-sm md:text-[1.05rem]">{pageCfg.subtitle}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative" ref={dropdownRef}>
                <div
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] p-1.5 pr-4 rounded-full cursor-pointer hover:bg-white/[0.06] transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center font-bold text-[0.95rem] text-white">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.display_name || ''} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      (profile?.display_name || 'U').charAt(0)
                    )}
                  </div>
                  <span className="text-[0.95rem] font-medium hidden sm:block text-slate-200">
                    {profile?.display_name || 'User'} <span className="text-slate-500 text-xs font-mono ml-1">{profile?.user_code}</span>
                  </span>
                </div>
                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#18181b] rounded-xl shadow-lg border border-white/[0.06] py-1 z-50">
                    <div className="px-4 py-2 border-b border-white/[0.06]">
                      <p className="text-sm font-medium text-slate-200">{profile?.display_name}</p>
                      <p className="text-xs text-slate-500">{profile?.user_code}</p>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
        )}
        <Outlet />
      </main>
    </div>
  )
}
