import { useAuthStore } from '../../stores/authStore'
import { useTimerStore } from '../../stores/timerStore'
import { Bell, Search, LogOut, Timer } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function Navbar() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuthStore()
  const { isRunning, elapsedSeconds } = useTimerStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Format time for display
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="w-full flex justify-end items-center py-4 px-6 md:px-8 border-b border-white/[0.02] bg-transparent">
      <div className="flex items-center gap-4">
        {/* Active Timer Indicator */}
        {isRunning && (
          <button
            onClick={() => navigate('/timer')}
            className="flex items-center gap-2 px-3 py-1.5 bg-sky-500/15 text-sky-400 border border-sky-500/20 rounded-full hover:bg-sky-500/25 transition-colors"
          >
            <span className="w-2 h-2 bg-sky-400 rounded-full animate-pulse" />
            <Timer className="w-4 h-4" />
            <span className="font-mono font-medium text-sm">
              {formatTime(elapsedSeconds)}
            </span>
          </button>
        )}

        {/* Search */}
        <div className="hidden md:flex items-center bg-white/[0.03] border border-white/10 rounded-full px-4 py-2">
          <Search size={16} className="text-slate-400 mr-2" />
          <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm text-slate-200 placeholder:text-slate-500 w-32 focus:w-48 transition-all" />
        </div>

        {/* Notifications */}
        <button className="p-2 bg-white/[0.03] border border-white/10 rounded-full text-slate-400 hover:text-white transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#09090b]"></span>
        </button>

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 bg-white/[0.03] border border-white/10 p-1.5 pr-4 rounded-full cursor-pointer hover:bg-white/[0.06] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || ''}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                profile?.display_name?.charAt(0) || 'U'
              )}
            </div>
            <span className="text-sm font-medium hidden sm:block text-slate-200">
              {profile?.display_name || 'User'} <span className="text-slate-500 text-xs">{profile?.user_code}</span>
            </span>
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#18181b] rounded-xl shadow-lg border border-white/10 py-1 z-50">
              <div className="px-4 py-2 border-b border-white/10">
                <p className="text-sm font-medium text-slate-200">
                  {profile?.display_name}
                </p>
                <p className="text-xs text-slate-500">
                  {profile?.user_code}
                </p>
              </div>
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
