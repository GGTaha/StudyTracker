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

type DateRange = 'today' | 'week' | 'month' | 'all' | 'custom'

export function ArchivePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { sessions, subjects, tags, isLoading, initialize, deleteSession } = useTimerStore()
  
  // Filter states
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Dropdown states
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [showSubjectFilter, setShowSubjectFilter] = useState(false)
  const [showTagFilter, setShowTagFilter] = useState(false)

  // Initialize on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  // Handle URL params for day filter
  useEffect(() => {
    const dayParam = searchParams.get('day')
    if (dayParam) {
      setDateRange('custom')
      setCustomStartDate(dayParam)
      setCustomEndDate(dayParam)
    }
  }, [searchParams])

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      // Only include completed sessions
      if (!session.ended_at || !session.duration_seconds) return false
      
      const sessionDate = parseISO(session.started_at)
      const today = new Date()
      
      // Date range filter
      if (dateRange === 'today') {
        if (!isWithinInterval(sessionDate, { 
          start: startOfDay(today), 
          end: endOfDay(today) 
        })) return false
      } else if (dateRange === 'week') {
        if (!isWithinInterval(sessionDate, { 
          start: startOfDay(subDays(today, 7)), 
          end: endOfDay(today) 
        })) return false
      } else if (dateRange === 'month') {
        if (!isWithinInterval(sessionDate, { 
          start: startOfDay(subMonths(today, 1)), 
          end: endOfDay(today) 
        })) return false
      } else if (dateRange === 'custom' && customStartDate && customEndDate) {
        const start = startOfDay(parseISO(customStartDate))
        const end = endOfDay(parseISO(customEndDate))
        if (!isWithinInterval(sessionDate, { start, end })) return false
      }
      
      // Subject filter
      if (selectedSubjectId && session.subject_id !== selectedSubjectId) return false
      
      // Tag filter
      if (selectedTagId && (session as any).tag_id !== selectedTagId) return false
      
      // Search query (search in subject name)
      if (searchQuery) {
        const subjectName = session.subject?.name?.toLowerCase() || ''
        const tagName = session.tag?.name?.toLowerCase() || ''
        const query = searchQuery.toLowerCase()
        if (!subjectName.includes(query) && !tagName.includes(query)) return false
      }
      
      return true
    }).sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
  }, [sessions, dateRange, customStartDate, customEndDate, selectedSubjectId, selectedTagId, searchQuery])

  // Group sessions by date
  const groupedSessions = useMemo(() => {
    const groups: Record<string, StudySession[]> = {}
    
    filteredSessions.forEach(session => {
      const dateKey = format(parseISO(session.started_at), 'yyyy-MM-dd')
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(session)
    })
    
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [filteredSessions])

  // Calculate total time
  const totalTime = useMemo(() => {
    return filteredSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
  }, [filteredSessions])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  const formatTime = (isoString: string) => {
    return format(parseISO(isoString), 'HH:mm')
  }

  const formatDateLabel = (dateKey: string) => {
    const date = parseISO(dateKey)
    const today = startOfDay(new Date())
    const yesterday = subDays(today, 1)
    
    if (startOfDay(date).getTime() === today.getTime()) {
      return 'Today'
    } else if (startOfDay(date).getTime() === yesterday.getTime()) {
      return 'Yesterday'
    }
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
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Session Archive</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {filteredSessions.length} sessions • {formatDuration(totalTime)} total
          </p>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
            Clear filters
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowDateFilter(!showDateFilter)
                setShowSubjectFilter(false)
                setShowTagFilter(false)
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${
                dateRange !== 'all'
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Calendar className="w-4 h-4" />
              {dateRange === 'all' ? 'All time' : 
               dateRange === 'today' ? 'Today' :
               dateRange === 'week' ? 'This week' :
               dateRange === 'month' ? 'This month' : 'Custom'}
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showDateFilter && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg z-10 p-2">
                {(['all', 'today', 'week', 'month', 'custom'] as DateRange[]).map(range => (
                  <button
                    key={range}
                    onClick={() => {
                      setDateRange(range)
                      if (range !== 'custom') {
                        setShowDateFilter(false)
                        setSearchParams({})
                      }
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                      dateRange === range
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {range === 'all' ? 'All time' : 
                     range === 'today' ? 'Today' :
                     range === 'week' ? 'Last 7 days' :
                     range === 'month' ? 'Last 30 days' : 'Custom range'}
                  </button>
                ))}
                
                {dateRange === 'custom' && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    />
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    />
                    <button
                      onClick={() => setShowDateFilter(false)}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
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
              onClick={() => {
                setShowSubjectFilter(!showSubjectFilter)
                setShowDateFilter(false)
                setShowTagFilter(false)
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${
                selectedSubjectId
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              {selectedSubjectId 
                ? subjects.find(s => s.id === selectedSubjectId)?.name || 'Subject'
                : 'Subject'}
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showSubjectFilter && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg z-10 p-2 max-h-64 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedSubjectId(null)
                    setShowSubjectFilter(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    !selectedSubjectId
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  All subjects
                </button>
                {subjects.map(subject => (
                  <button
                    key={subject.id}
                    onClick={() => {
                      setSelectedSubjectId(subject.id)
                      setShowSubjectFilter(false)
                    }}
                    className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm ${
                      selectedSubjectId === subject.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: subject.color }}
                    />
                    {subject.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tag Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowTagFilter(!showTagFilter)
                setShowDateFilter(false)
                setShowSubjectFilter(false)
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${
                selectedTagId
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Tag className="w-4 h-4" />
              {selectedTagId 
                ? tags.find(t => t.id === selectedTagId)?.name || 'Tag'
                : 'Tag'}
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showTagFilter && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg z-10 p-2">
                <button
                  onClick={() => {
                    setSelectedTagId(null)
                    setShowTagFilter(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    !selectedTagId
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  All tags
                </button>
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      setSelectedTagId(tag.id)
                      setShowTagFilter(false)
                    }}
                    className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm ${
                      selectedTagId === tag.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-6">
        {groupedSessions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
            <Filter className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No sessions found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {hasActiveFilters 
                ? 'Try adjusting your filters to see more results.'
                : 'Start studying to see your sessions here.'}
            </p>
          </div>
        ) : (
          groupedSessions.map(([dateKey, daySessions]) => (
            <div key={dateKey} className="space-y-2">
              {/* Date Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {formatDateLabel(dateKey)}
                </h3>
                <span className="text-sm text-gray-400 dark:text-gray-500">
                  {formatDuration(daySessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0))}
                </span>
              </div>
              
              {/* Sessions for this date */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                {daySessions.map(session => (
                  <div
                    key={session.id}
                    className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750"
                  >
                    <div className="flex items-center gap-4">
                      {/* Subject color indicator */}
                      <div
                        className="w-1 h-12 rounded-full"
                        style={{ backgroundColor: session.subject?.color || '#9CA3AF' }}
                      />
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {session.subject?.name || 'No Subject'}
                          </span>
                          {session.tag && (
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: `${session.tag.color}20`,
                                color: session.tag.color 
                              }}
                            >
                              {session.tag.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {formatTime(session.started_at)} - {formatTime(session.ended_at!)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatDuration(session.duration_seconds || 0)}
                      </span>
                      <button
                        onClick={() => deleteSession(session.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
