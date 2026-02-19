import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTimerStore } from '../../stores/timerStore'
import type { StudySession } from '../../stores/timerStore'
import { format, parseISO, startOfDay, endOfDay, isWithinInterval, subDays, subMonths } from 'date-fns'
import { 
  Calendar, 
  Clock, 
  Filter, 
  X, 
  ChevronDown, 
  Search,
  Trash2,
  BookOpen,
  Tag,
  Loader2
} from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'

type DateRange = 'today' | 'week' | 'month' | 'all' | 'custom'

export function ArchivePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { sessions, subjects, tags, isLoading, initialize, deleteSession } = useTimerStore()
  
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [showSubjectFilter, setShowSubjectFilter] = useState(false)
  const [showTagFilter, setShowTagFilter] = useState(false)

  useEffect(() => { initialize() }, [initialize])

  useEffect(() => {
    const dayParam = searchParams.get('day')
    if (dayParam) {
      setDateRange('custom')
      setCustomStartDate(dayParam)
      setCustomEndDate(dayParam)
    }
  }, [searchParams])

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      if (!session.ended_at || !session.duration_seconds) return false
      const sessionDate = parseISO(session.started_at)
      const today = new Date()
      if (dateRange === 'today') {
        if (!isWithinInterval(sessionDate, { start: startOfDay(today), end: endOfDay(today) })) return false
      } else if (dateRange === 'week') {
        if (!isWithinInterval(sessionDate, { start: startOfDay(subDays(today, 7)), end: endOfDay(today) })) return false
      } else if (dateRange === 'month') {
        if (!isWithinInterval(sessionDate, { start: startOfDay(subMonths(today, 1)), end: endOfDay(today) })) return false
      } else if (dateRange === 'custom' && customStartDate && customEndDate) {
        const start = startOfDay(parseISO(customStartDate))
        const end = endOfDay(parseISO(customEndDate))
        if (!isWithinInterval(sessionDate, { start, end })) return false
      }
      if (selectedSubjectId && session.subject_id !== selectedSubjectId) return false
      if (selectedTagId && (session as any).tag_id !== selectedTagId) return false
      if (searchQuery) {
        const subjectName = session.subject?.name?.toLowerCase() || ''
        const tagName = session.tag?.name?.toLowerCase() || ''
        const query = searchQuery.toLowerCase()
        if (!subjectName.includes(query) && !tagName.includes(query)) return false
      }
      return true
    }).sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
  }, [sessions, dateRange, customStartDate, customEndDate, selectedSubjectId, selectedTagId, searchQuery])

  const groupedSessions = useMemo(() => {
    const groups: Record<string, StudySession[]> = {}
    filteredSessions.forEach(session => {
      const dateKey = format(parseISO(session.started_at), 'yyyy-MM-dd')
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(session)
    })
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [filteredSessions])

  const totalTime = useMemo(() => {
    return filteredSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
  }, [filteredSessions])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  const formatTime = (isoString: string) => format(parseISO(isoString), 'HH:mm')

  const formatDateLabel = (dateKey: string) => {
    const date = parseISO(dateKey)
    const today = startOfDay(new Date())
    const yesterday = subDays(today, 1)
    if (startOfDay(date).getTime() === today.getTime()) return 'Today'
    if (startOfDay(date).getTime() === yesterday.getTime()) return 'Yesterday'
    return format(date, 'EEEE, MMMM d, yyyy')
  }

  const clearFilters = () => {
    setDateRange('all')
    setCustomStartDate('')
    setCustomEndDate('')
    setSelectedSubjectId(null)
    setSelectedTagId(null)
    setSearchQuery('')
    setSearchParams({})
  }

  const hasActiveFilters = dateRange !== 'all' || selectedSubjectId || selectedTagId || searchQuery

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-10 animate-fade-slide">
      {/* Summary Bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-400">
          <span className="text-slate-100 font-bold">{filteredSessions.length}</span> sessions
          {' • '}
          <span className="text-slate-100 font-bold">{formatDuration(totalTime)}</span> total
        </p>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {/* Filters Card */}
      <GlassCard className="!p-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-all"
            />
          </div>

          {/* Date Filter */}
          <div className="relative">
            <button
              onClick={() => { setShowDateFilter(!showDateFilter); setShowSubjectFilter(false); setShowTagFilter(false) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                dateRange !== 'all'
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                  : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06]'
              }`}
            >
              <Calendar className="w-4 h-4" />
              {dateRange === 'all' ? 'All time' : dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'This week' : dateRange === 'month' ? 'This month' : 'Custom'}
              <ChevronDown className="w-4 h-4" />
            </button>
            {showDateFilter && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-[#0f0f13] border border-white/10 rounded-2xl shadow-2xl z-10 p-2 backdrop-blur-xl">
                {(['all', 'today', 'week', 'month', 'custom'] as DateRange[]).map(range => (
                  <button
                    key={range}
                    onClick={() => { setDateRange(range); if (range !== 'custom') { setShowDateFilter(false); setSearchParams({}) } }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      dateRange === range ? 'bg-sky-500/10 text-sky-400' : 'hover:bg-white/[0.05] text-slate-300'
                    }`}
                  >
                    {range === 'all' ? 'All time' : range === 'today' ? 'Today' : range === 'week' ? 'Last 7 days' : range === 'month' ? 'Last 30 days' : 'Custom range'}
                  </button>
                ))}
                {dateRange === 'custom' && (
                  <div className="mt-2 pt-2 border-t border-white/5 space-y-2">
                    <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500/50" />
                    <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500/50" />
                    <button onClick={() => setShowDateFilter(false)}
                      className="w-full px-3 py-2 bg-sky-500 text-[#09090b] font-semibold rounded-xl text-sm hover:bg-sky-400 transition-colors">
                      Apply
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Subject Filter */}
          <div className="relative">
            <button
              onClick={() => { setShowSubjectFilter(!showSubjectFilter); setShowDateFilter(false); setShowTagFilter(false) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                selectedSubjectId
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                  : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              {selectedSubjectId ? subjects.find(s => s.id === selectedSubjectId)?.name || 'Subject' : 'Subject'}
              <ChevronDown className="w-4 h-4" />
            </button>
            {showSubjectFilter && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-[#0f0f13] border border-white/10 rounded-2xl shadow-2xl z-10 p-2 max-h-64 overflow-y-auto backdrop-blur-xl">
                <button onClick={() => { setSelectedSubjectId(null); setShowSubjectFilter(false) }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    !selectedSubjectId ? 'bg-sky-500/10 text-sky-400' : 'hover:bg-white/[0.05] text-slate-300'
                  }`}>
                  All subjects
                </button>
                {subjects.map(subject => (
                  <button key={subject.id}
                    onClick={() => { setSelectedSubjectId(subject.id); setShowSubjectFilter(false) }}
                    className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      selectedSubjectId === subject.id ? 'bg-sky-500/10 text-sky-400' : 'hover:bg-white/[0.05] text-slate-300'
                    }`}>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
                    {subject.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tag Filter */}
          <div className="relative">
            <button
              onClick={() => { setShowTagFilter(!showTagFilter); setShowDateFilter(false); setShowSubjectFilter(false) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                selectedTagId
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                  : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06]'
              }`}
            >
              <Tag className="w-4 h-4" />
              {selectedTagId ? tags.find(t => t.id === selectedTagId)?.name || 'Tag' : 'Tag'}
              <ChevronDown className="w-4 h-4" />
            </button>
            {showTagFilter && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-[#0f0f13] border border-white/10 rounded-2xl shadow-2xl z-10 p-2 backdrop-blur-xl">
                <button onClick={() => { setSelectedTagId(null); setShowTagFilter(false) }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    !selectedTagId ? 'bg-sky-500/10 text-sky-400' : 'hover:bg-white/[0.05] text-slate-300'
                  }`}>
                  All tags
                </button>
                {tags.map(tag => (
                  <button key={tag.id}
                    onClick={() => { setSelectedTagId(tag.id); setShowTagFilter(false) }}
                    className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      selectedTagId === tag.id ? 'bg-sky-500/10 text-sky-400' : 'hover:bg-white/[0.05] text-slate-300'
                    }`}>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Sessions List */}
      <div className="space-y-6">
        {groupedSessions.length === 0 ? (
          <GlassCard className="!py-16 text-center">
            <Filter className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-200 mb-2">No sessions found</h3>
            <p className="text-slate-500 text-sm">
              {hasActiveFilters ? 'Try adjusting your filters to see more results.' : 'Start studying to see your sessions here.'}
            </p>
          </GlassCard>
        ) : (
          groupedSessions.map(([dateKey, daySessions]) => (
            <div key={dateKey} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold text-slate-400">{formatDateLabel(dateKey)}</h3>
                <span className="text-sm font-bold text-slate-500">
                  {formatDuration(daySessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0))}
                </span>
              </div>
              <GlassCard className="!p-0 overflow-hidden divide-y divide-white/[0.04]">
                {daySessions.map(session => (
                  <div key={session.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-1 h-12 rounded-full" style={{ backgroundColor: session.subject?.color || '#4B5563' }} />
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-100">{session.subject?.name || 'No Subject'}</span>
                          {session.tag && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ backgroundColor: `${session.tag.color}15`, color: session.tag.color }}>
                              {session.tag.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatTime(session.started_at)} – {formatTime(session.ended_at!)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-base font-bold text-slate-200">{formatDuration(session.duration_seconds || 0)}</span>
                      <button onClick={() => deleteSession(session.id)}
                        className="p-2 text-slate-600 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </GlassCard>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
