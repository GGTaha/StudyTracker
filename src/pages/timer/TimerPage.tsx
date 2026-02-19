import { useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTimerStore } from '../../stores/timerStore'
import { GlassCard } from '../../components/ui/GlassCard'
import { StatCard } from '../../components/ui/StatCard'
import { Pill } from '../../components/ui/Pill'
import { CustomDropdown } from '../../components/ui/CustomDropdown'
import type { DropdownOption } from '../../components/ui/CustomDropdown'
import {
  Clock, TrendingUp, Play, Pause, FileText, Trash2,
  History, BarChart, CircleDot, Tag, Loader2
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${secs}s`
  return `${secs}s`
}

function formatTimer(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function getTagVariant(tagName: string): 'rose' | 'green' | 'indigo' | 'blue' {
  if (tagName === 'Past Paper') return 'rose'
  if (tagName === 'Revision') return 'green'
  if (tagName === 'Homework') return 'indigo'
  return 'blue'
}

export function TimerPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    isRunning,
    isPaused,
    elapsedSeconds,
    subjects,
    tags,
    sessions,
    selectedSubjectId,
    selectedTagId,
    isLoading,
    initialize,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    setSelectedSubject,
    setSelectedTag,
    deleteSession,
    getTodayTotal,
    getWeeklyData,
  } = useTimerStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  // Auto-start timer if navigated with ?autostart=1
  useEffect(() => {
    if (searchParams.get('autostart') === '1' && !isRunning && !isPaused && !isLoading) {
      startTimer()
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, isRunning, isPaused, isLoading, startTimer, setSearchParams])

  // Update document title when timer is running
  useEffect(() => {
    if (isRunning) {
      document.title = `${formatTimer(elapsedSeconds)} - StudyTracker`
    } else {
      document.title = 'StudyTracker'
    }
    return () => { document.title = 'StudyTracker' }
  }, [isRunning, elapsedSeconds])

  const handleDayClick = useCallback((day: string) => {
    navigate(`/archive?day=${day}`)
  }, [navigate])

  const subjectOptions: DropdownOption[] = subjects.map(s => ({
    value: s.id,
    label: `${s.name}${s.code ? ` (${s.code})` : ''}`
  }))

  const tagOptions: DropdownOption[] = tags.map(t => ({
    value: t.id,
    label: t.name
  }))

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId)

  const weeklyData = getWeeklyData()
  const todayTotal = getTodayTotal()
  const weekTotal = weeklyData.reduce((a, d) => a + d.seconds, 0)
  const maxSeconds = Math.max(...weeklyData.map(d => d.seconds), 1)

  // Recent completed sessions
  const completedSessions = sessions
    .filter(s => s.ended_at !== null)
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())

  const timerStatus: 'idle' | 'running' | 'paused' = !isRunning && !isPaused ? 'idle' : isRunning && !isPaused ? 'running' : 'paused'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      
      {/* Timer Hero */}
      <div className={`relative flex flex-col items-center justify-center py-16 px-6 rounded-[32px] border border-white/[0.04] transition-colors duration-500 ${
        timerStatus === 'paused' ? 'bg-gradient-to-b from-amber-500/[0.03] to-transparent' : 'bg-gradient-to-b from-sky-500/[0.03] to-transparent'
      }`}>
        {timerStatus !== 'idle' && (
          <div className={`absolute inset-0 rounded-[32px] pointer-events-none transition-all duration-500 ${
            timerStatus === 'running' 
              ? 'bg-sky-500/[0.02] animate-pulse shadow-[inset_0_0_100px_rgba(56,189,248,0.05)]' 
              : 'bg-amber-500/[0.03] shadow-[inset_0_0_100px_rgba(245,158,11,0.08)]'
          }`}></div>
        )}
        
        {/* Subject & Tag Pickers */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 z-30 relative w-full max-w-lg">
          <CustomDropdown 
            value={selectedSubjectId} 
            onChange={(val) => setSelectedSubject(val)} 
            options={subjectOptions} 
            icon={CircleDot} 
            iconColorClass={selectedSubject?.color ? undefined : 'text-sky-400'}
            placeholder="Select Subject" 
          />
          <CustomDropdown 
            value={selectedTagId} 
            onChange={(val) => setSelectedTag(val)} 
            options={tagOptions} 
            icon={Tag} 
            placeholder="Select tag..." 
          />
        </div>

        {/* Big Timer Display */}
        <div className="font-mono text-[6rem] md:text-[8rem] font-bold tracking-tighter text-slate-50 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] leading-none mb-10 z-10">
          {formatTimer(elapsedSeconds)}
        </div>
        
        {/* Controls */}
        <div className="flex gap-4 z-10">
          <button 
            onClick={() => {
              if (timerStatus === 'running') pauseTimer()
              else if (timerStatus === 'paused') resumeTimer()
              else startTimer()
            }} 
            className={`flex items-center gap-2.5 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
              timerStatus === 'running' 
                ? 'bg-white/5 text-white hover:bg-white/10 border border-white/10' 
                : timerStatus === 'paused' 
                  ? 'bg-amber-500 text-[#09090b] hover:bg-amber-400 shadow-[0_5px_20px_rgba(245,158,11,0.2)]' 
                  : 'bg-sky-500 text-[#09090b] hover:bg-sky-400 shadow-[0_5px_20px_rgba(56,189,248,0.2)]'
            }`}
          >
            {timerStatus === 'running' ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            {timerStatus === 'idle' ? 'Start Focus' : timerStatus === 'running' ? 'Pause' : 'Resume'}
          </button>
          {timerStatus !== 'idle' && (
            <button 
              onClick={() => stopTimer()} 
              className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
            >
              Log & Save
            </button>
          )}
        </div>
      </div>

      {/* Timer Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.5fr] gap-6">
        
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <StatCard title="Time Today" value={formatDuration(todayTotal)} icon={Clock} colorClass="text-blue-400" bgClass="bg-blue-500/10" />
            <StatCard title="Last 7 Days" value={formatDuration(weekTotal)} icon={TrendingUp} colorClass="text-emerald-400" bgClass="bg-emerald-500/10" />
          </div>
          
          <GlassCard className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-[1.05rem] font-semibold text-slate-50 flex items-center gap-2">
                <BarChart size={18} className="text-slate-400" />
                Activity
              </h3>
            </div>
            <div className="flex items-end gap-3 h-[180px] mt-4 pt-4 border-t border-white/[0.02]">
              <div className="flex flex-col justify-between h-full text-[11px] font-medium text-slate-500 pr-2 pb-6">
                <span>{(maxSeconds / 3600).toFixed(1)}h</span>
                <span>{(maxSeconds / 7200).toFixed(1)}h</span>
                <span>0h</span>
              </div>
              {weeklyData.map((day, i) => {
                const isToday = i === weeklyData.length - 1
                const heightPct = maxSeconds > 0 ? Math.max((day.seconds / maxSeconds) * 100, 2) : 2
                return (
                  <div key={day.day} className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer" onClick={() => handleDayClick(day.day)}>
                    <div 
                      className={`w-full max-w-[40px] rounded-t-xl transition-all duration-500 relative ${
                        isToday 
                          ? 'bg-gradient-to-t from-sky-600 to-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.2)] border-t border-sky-300/50' 
                          : 'bg-white/[0.04] group-hover:bg-white/[0.1] border-t border-white/[0.02]'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-[10px] py-1 px-2 rounded pointer-events-none transition-opacity font-medium whitespace-nowrap">
                        {formatDuration(day.seconds)}
                      </div>
                    </div>
                    <span className={`text-xs font-medium mt-3 transition-colors ${isToday ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                      {day.day}
                    </span>
                  </div>
                )
              })}
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Sessions — capped to match left column height */}
        <div className="flex flex-col overflow-hidden max-h-[420px]">
          <GlassCard className="!p-0 overflow-hidden flex flex-col flex-1">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01] shrink-0 z-10">
              <h3 className="text-[1.05rem] font-semibold text-slate-50 flex items-center gap-2">
                <History size={18} className="text-slate-400" />
                Recent Sessions
              </h3>
              <span className="text-xs font-medium text-slate-400 bg-white/5 px-3 py-1 rounded-full">Today</span>
            </div>
            <div 
              className="flex flex-col p-6 pt-4 pb-12 gap-3 overflow-y-auto flex-1 hide-scrollbar relative"
              style={{ maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }}
            >
              {completedSessions.length === 0 ? (
                <div className="text-slate-500 text-sm text-center py-8">No sessions yet. Start a study session!</div>
              ) : (
                completedSessions.map((session) => (
                  <div key={session.id} className="group flex justify-between items-center p-4 bg-white/[0.015] border border-white/[0.04] rounded-2xl hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5" style={{ color: session.subject?.color || '#38bdf8' }}>
                        <FileText size={18} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-slate-200 text-[0.95rem]">{session.subject?.name || 'General'}</h4>
                          <Pill variant="blue">{formatDuration(session.duration_seconds || 0)}</Pill>
                          {session.tag && (
                            <Pill variant={getTagVariant(session.tag.name)}>{session.tag.name}</Pill>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[0.8rem] text-slate-500 font-medium">
                          <span>{format(new Date(session.started_at), 'MMM d \'at\' HH:mm')}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                          <span>{formatDistanceToNow(new Date(session.started_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteSession(session.id)} 
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-2.5 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
