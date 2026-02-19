import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useTimerStore } from '../../stores/timerStore'
import { useFriendsStore } from '../../stores/friendsStore'
import { usePapersStore } from '../../stores/papersStoreNew'
import {
  Clock, Calendar, FileText, Users, TrendingUp,
  Play, Pause, Plus, ChevronRight, UserPlus,
  Search, Bell
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { GlassCard } from '../../components/ui/GlassCard'
import { StatCard } from '../../components/ui/StatCard'
import { Pill } from '../../components/ui/Pill'

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

function formatTimer(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// --- Section Header ---
function SectionHeader({ title, icon: Icon, linkText, onLinkClick }: { title: string; icon: React.ElementType; linkText: string; onLinkClick?: () => void }) {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-[1.25rem] font-semibold flex items-center gap-2 text-slate-50">
        <Icon size={20} className="text-slate-400" />
        {title}
      </h2>
      <button onClick={onLinkClick} className="text-slate-400 text-sm flex items-center gap-1 hover:text-sky-400 transition-colors">
        {linkText} <ChevronRight size={16} />
      </button>
    </div>
  )
}

// --- Timer & Activity Section ---
function TimerAndActivitySection() {
  const navigate = useNavigate()
  const {
    isRunning, isPaused, elapsedSeconds,
    sessions, stopTimer, pauseTimer, resumeTimer, getWeeklyData
  } = useTimerStore()
  const [timeSpan, setTimeSpan] = useState('1W')

  const weeklyData = getWeeklyData()
  const maxSeconds = Math.max(...weeklyData.map(d => d.seconds), 1)

  // Recent completed sessions with subjects for the pills
  const completedSessions = sessions.filter(s => s.ended_at !== null)

  // Aggregate time by subject for the pills
  const subjectTotals = new Map<string, { name: string; color: string; seconds: number }>()
  const todaySessions = completedSessions.filter(s => {
    const sessionDate = new Date(s.started_at).toDateString()
    return sessionDate === new Date().toDateString()
  })
  todaySessions.forEach(s => {
    const name = s.subject?.name || 'General'
    const color = s.subject?.color || '#38bdf8'
    const existing = subjectTotals.get(name)
    if (existing) {
      existing.seconds += s.duration_seconds || 0
    } else {
      subjectTotals.set(name, { name, color, seconds: s.duration_seconds || 0 })
    }
  })

  return (
    <GlassCard>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Compact Timer */}
        <div className="flex items-center gap-4 bg-black/20 px-5 py-2.5 rounded-full border border-white/5">
          <span className={`font-mono text-2xl font-semibold tracking-tight w-[120px] ${isPaused ? 'animate-pulse text-amber-400' : ''}`}>
            {formatTimer(elapsedSeconds)}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (isPaused) {
                  resumeTimer()
                } else if (isRunning) {
                  pauseTimer()
                } else {
                  navigate('/timer?autostart=1')
                }
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-semibold transition-all duration-300 ${
                !isRunning && !isPaused
                  ? 'bg-sky-400 text-slate-900 hover:bg-sky-300 hover:scale-105 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isRunning && !isPaused ? <Pause size={16} /> : <Play size={16} />}
              {!isRunning && !isPaused ? 'Start Timer' : isRunning && !isPaused ? 'Pause' : 'Resume'}
            </button>

            {(isRunning || isPaused) && (
              <button
                onClick={() => {
                  stopTimer()
                }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full font-semibold transition-all duration-300 bg-green-500/15 text-green-400 hover:bg-green-500/25 border border-green-500/20"
              >
                Log Session
              </button>
            )}
          </div>
        </div>

        {/* Time Span Toggles */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
          {['1W', '1M', 'All'].map(span => (
            <button
              key={span}
              onClick={() => setTimeSpan(span)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                timeSpan === span ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {span}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[140px] flex items-end gap-3 pt-2 pb-4 border-b border-white/5">
        {weeklyData.map((d, i) => (
          <div
            key={d.day}
            className={`flex-1 rounded-t-md transition-all duration-500 relative group ${
              i === weeklyData.length - 1 && d.seconds > 0 ? 'bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.3)]' : 'bg-white/10 hover:bg-sky-400'
            }`}
            style={{ height: d.seconds > 0 ? `${Math.max((d.seconds / maxSeconds) * 100, 8)}%` : '5%' }}
          >
            {/* Tooltip on hover */}
            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-xs py-1 px-2 rounded pointer-events-none transition-opacity whitespace-nowrap">
              {formatDuration(d.seconds)}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Subject Pills */}
      <div className="flex gap-3 flex-wrap">
        {Array.from(subjectTotals.values()).slice(0, 4).map(sub => (
          <div key={sub.name} className="bg-white/[0.03] border border-white/5 px-3 py-1.5 rounded-lg text-sm text-slate-300 flex items-center gap-2">
            <Clock size={14} style={{ color: sub.color }} />
            {formatDuration(sub.seconds)} • {sub.name}
          </div>
        ))}
        {subjectTotals.size === 0 && (
          <div className="text-slate-500 text-sm">No sessions today yet</div>
        )}
      </div>
    </GlassCard>
  )
}

// --- Past Papers Section ---
function PastPapersSection() {
  const navigate = useNavigate()
  const { entries, configs, initialize: initPapers } = usePapersStore()

  useEffect(() => {
    initPapers()
  }, [initPapers])

  // Get recent entries sorted by created_at desc
  const recentEntries = [...entries]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)

  // Get config for an entry to find subject name and max marks
  const getConfigForEntry = (entry: typeof entries[0]) => {
    return configs.find(c => c.subject_id === entry.subject_id)
  }

  const getSessionLabel = (session: string) => {
    switch (session) {
      case 'May/Jun': return 'M/J'
      case 'Feb/Mar': return 'F/M'
      case 'Oct/Nov': return 'O/N'
      default: return session
    }
  }

  const getPaperNumber = (paperCode: string) => paperCode.charAt(0)

  return (
    <GlassCard>
      <SectionHeader title="Past Papers" icon={FileText} linkText="View full log" onLinkClick={() => navigate('/papers')} />

      {/* Quick Action Button */}
      <button
        onClick={() => navigate('/papers')}
        className="flex items-center gap-4 bg-gradient-to-r from-purple-500/10 to-white/[0.02] p-5 rounded-2xl border border-purple-500/20 hover:border-purple-500/50 hover:-translate-y-1 transition-all duration-300 text-left group"
      >
        <div className="bg-purple-500/20 text-purple-400 p-3 rounded-xl group-hover:scale-110 transition-transform">
          <Plus size={24} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-50 mb-1">Log a New Paper</h3>
          <p className="text-xs text-slate-400">Record marks, time, and save your progress.</p>
        </div>
      </button>

      {/* Recent Summary List */}
      <div className="flex flex-col gap-2 mt-2">
        {recentEntries.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-4">No papers logged yet</div>
        ) : (
          recentEntries.map(entry => {
            const config = getConfigForEntry(entry)
            const subjectName = config?.subject_name || 'Unknown'
            const paperNum = getPaperNumber(entry.paper_code)

            return (
              <div key={entry.id} className="flex justify-between items-center p-4 bg-white/[0.015] border border-white/[0.03] rounded-xl hover:bg-white/[0.04] transition-colors">
                <div>
                  <h4 className="font-medium text-[0.95rem] text-slate-200">
                    {subjectName} P{paperNum} ({entry.paper_code}/{entry.year.toString().slice(-2)}/{getSessionLabel(entry.session)})
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex gap-2">
                  {entry.marks !== null && (
                    <Pill variant="green">{entry.marks}/{entry.max_marks}</Pill>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </GlassCard>
  )
}

// --- Friends Activity Section ---
function FriendsActivitySection() {
  const navigate = useNavigate()
  const { friends, activities, studyingStatus, fetchStudyingStatus } = useFriendsStore()

  useEffect(() => {
    fetchStudyingStatus()
  }, [fetchStudyingStatus])

  // Colors for friend avatars
  const avatarColors = ['bg-red-500', 'bg-blue-500', 'bg-amber-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500']

  return (
    <GlassCard>
      <div className="flex justify-between items-center">
        <h2 className="text-[1.1rem] font-semibold flex items-center gap-2 text-slate-50">
          <Users size={20} className="text-slate-400" />
          Friends Activity
        </h2>
        <button
          onClick={() => navigate('/friends')}
          className="flex items-center gap-1.5 text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] border border-white/5 px-3 py-1.5 rounded-full transition-colors text-slate-200"
        >
          <UserPlus size={14} /> Add Friend
        </button>
      </div>

      {/* Online Status Row */}
      <div className="flex gap-3 overflow-x-auto pb-3 border-b border-white/5 mt-2">
        {friends.length === 0 ? (
          <div className="text-slate-500 text-sm py-2">No friends yet</div>
        ) : (
          friends.slice(0, 6).map((friend, i) => {
            const isStudying = studyingStatus.find(s => s.user_id === friend.id)?.is_studying
            return (
              <div key={friend.id} className="relative cursor-pointer hover:-translate-y-1 transition-transform">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${avatarColors[i % avatarColors.length]}`}>
                  {friend.avatar_url ? (
                    <img src={friend.avatar_url} alt={friend.display_name || ''} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    (friend.display_name || friend.username || '?').charAt(0).toUpperCase()
                  )}
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#09090b] ${isStudying ? 'bg-green-400' : 'bg-slate-600'}`}></div>
              </div>
            )
          })
        )}
      </div>

      {/* Live Feed */}
      <div className="flex flex-col gap-4 mt-2">
        {activities.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-4">No recent friend activity</div>
        ) : (
          activities.slice(0, 4).map((item, i) => (
            <div key={item.id} className="flex gap-3 items-start">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                {(item.display_name || item.username || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-slate-300 leading-snug">
                  <strong className="text-slate-50 font-medium">{item.display_name || item.username}</strong>{' '}
                  {item.subject_name
                    ? `studied ${item.subject_name} for ${formatDuration(item.duration_seconds)}.`
                    : `studied for ${formatDuration(item.duration_seconds)}.`
                  }
                </p>
                <span className="text-[0.7rem] text-slate-500 mt-1 block">
                  {formatDistanceToNow(new Date(item.started_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  )
}

// --- Leaderboard Section ---
function LeaderboardSection() {
  const { weeklyLeaderboard } = useFriendsStore()

  const avatarColors = ['bg-red-500', 'bg-sky-500', 'bg-blue-500', 'bg-amber-500', 'bg-green-500', 'bg-purple-500']

  return (
    <GlassCard>
      <SectionHeader title="Weekly Leaderboard" icon={TrendingUp} linkText="Full list" onLinkClick={() => {}} />
      <div className="text-xs text-slate-400 -mt-2 mb-1">By time logged</div>

      <div className="flex flex-col gap-2">
        {weeklyLeaderboard.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-4">No leaderboard data yet</div>
        ) : (
          weeklyLeaderboard.slice(0, 5).map((user, i) => (
            <div key={user.user_id} className={`flex items-center gap-3 p-2.5 rounded-xl ${user.is_current_user ? 'bg-sky-500/10 border border-sky-500/20' : 'bg-white/[0.02]'}`}>
              <span className={`w-5 text-center font-bold text-sm ${user.rank === 1 ? 'text-amber-400' : 'text-slate-500'}`}>
                {user.rank}
              </span>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[0.7rem] font-semibold text-white ${avatarColors[i % avatarColors.length]}`}>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.display_name || ''} className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  (user.display_name || user.username || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 flex justify-between items-center">
                <span className="text-sm font-medium text-slate-200">{user.is_current_user ? 'You' : (user.display_name || user.username)}</span>
                <span className="text-xs font-semibold text-sky-400">{formatDuration(user.total_seconds)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  )
}

// --- Main Dashboard Page ---
export function DashboardPage() {
  const { profile, signOut } = useAuthStore()
  const {
    initialize,
    getTodayTotal,
    getWeeklyData
  } = useTimerStore()
  const { friends, initialize: initFriends } = useFriendsStore()
  const { entries, initialize: initPapers } = usePapersStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initialize()
    initFriends()
    initPapers()
  }, [initialize, initFriends, initPapers])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const todayTotal = getTodayTotal()
  const weeklyData = getWeeklyData()
  const weekTotal = weeklyData.reduce((acc, d) => acc + d.seconds, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Inline Header */}
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-[2.25rem] font-semibold mb-2 tracking-tight">Welcome back, {profile?.display_name || 'Student'}! 👋</h1>
          <p className="text-slate-400 text-[1.05rem]">Ready to continue your study journey? Let's make today productive.</p>
        </div>

        {/* Top Nav: Search, Notifications, Profile */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-white/[0.03] border border-white/[0.06] rounded-full px-5 py-3">
            <Search size={20} className="text-slate-400 mr-3" />
            <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-[0.95rem] text-slate-200 placeholder:text-slate-500 w-40 focus:w-56 transition-all" />
          </div>
          <button className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-full text-slate-400 hover:text-white transition-colors relative">
            <Bell size={22} />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#09090b]"></span>
          </button>
          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] p-1.5 pr-4 rounded-full cursor-pointer hover:bg-white/[0.06] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-[0.95rem] text-white">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.display_name || ''} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  (profile?.display_name || 'U').charAt(0)
                )}
              </div>
              <span className="text-[0.95rem] font-medium hidden sm:block text-slate-200">
                {profile?.display_name || 'User'} <span className="text-slate-500 text-xs">{profile?.user_code}</span>
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

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Study Time Today" value={formatDuration(todayTotal)} icon={Clock} colorClass="text-blue-400" bgClass="bg-blue-400/10" />
        <StatCard title="Weekly Study Time" value={formatDuration(weekTotal)} icon={Calendar} colorClass="text-green-400" bgClass="bg-green-400/10" />
        <StatCard title="Papers Solved" value={String(entries.length)} icon={FileText} colorClass="text-purple-400" bgClass="bg-purple-400/10" />
        <StatCard title="Friends" value={String(friends.length)} icon={Users} colorClass="text-orange-400" bgClass="bg-orange-400/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
        {/* LEFT COLUMN: Your Work */}
        <div className="flex flex-col gap-6">
          <TimerAndActivitySection />
          <PastPapersSection />
        </div>

        {/* RIGHT COLUMN: Social & Motivation */}
        <div className="flex flex-col gap-6">
          <FriendsActivitySection />
          <LeaderboardSection />
        </div>
      </div>
    </div>
  )
}
