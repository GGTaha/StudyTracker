import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './authStore'

export interface Subject {
  id: string
  user_id: string
  name: string
  code: string | null
  color: string
  exam_board: string | null
  created_at: string
}

export interface SessionTag {
  id: string
  user_id: string | null
  name: string
  color: string
  is_default: boolean
  created_at: string
}

export interface StudySession {
  id: string
  user_id: string
  subject_id: string | null
  tag_id: string | null
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  created_at: string
  // Joined data
  subject?: Subject
  tag?: SessionTag
}

interface TimerState {
  // Timer state
  isRunning: boolean
  isPaused: boolean
  elapsedSeconds: number
  activeSession: StudySession | null
  
  // Data
  subjects: Subject[]
  tags: SessionTag[]
  sessions: StudySession[]
  
  // Selected values
  selectedSubjectId: string | null
  selectedTagId: string | null
  
  // Loading states
  isLoading: boolean
  isInitialized: boolean
  
  // Actions
  initialize: () => Promise<void>
  startTimer: () => Promise<void>
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => Promise<void>
  syncTimer: () => void  // Sync timer with actual start time
  tick: () => void
  
  // Data actions
  fetchSubjects: () => Promise<void>
  fetchTags: () => Promise<void>
  fetchSessions: () => Promise<void>
  addSubject: (name: string, code?: string, color?: string) => Promise<void>
  deleteSubject: (id: string) => Promise<void>
  addTag: (name: string, color?: string) => Promise<void>
  deleteSession: (id: string) => Promise<void>
  
  // Selection
  setSelectedSubject: (id: string | null) => void
  setSelectedTag: (id: string | null) => void
  
  // Stats
  getTodayTotal: () => number
  getWeeklyData: () => { day: string; seconds: number; date: string }[]
  getDataForDateRange: (days: number) => { day: string; seconds: number; date: string }[]
  getSubjectBreakdown: () => { name: string; seconds: number; color: string }[]
  getAllTimeTotal: () => number
}

// Default A-Level CIE Subjects
const DEFAULT_SUBJECTS = [
  { name: 'Further Mathematics', code: '9231', color: '#8B5CF6' },
  { name: 'Mathematics', code: '9709', color: '#3B82F6' },
  { name: 'Physics', code: '9702', color: '#EF4444' },
  { name: 'Computer Science', code: '9618', color: '#10B981' },
  { name: 'Business', code: '9609', color: '#F59E0B' },
  { name: 'Chemistry', code: '9701', color: '#EC4899' },
]

export const useTimerStore = create<TimerState>((set, get) => ({
  isRunning: false,
  isPaused: false,
  elapsedSeconds: 0,
  activeSession: null,
  
  subjects: [],
  tags: [],
  sessions: [],
  
  selectedSubjectId: null,
  selectedTagId: null,
  
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    // Prevent multiple initializations
    if (get().isInitialized || get().isLoading) return
    
    set({ isLoading: true })
    
    // Fetch tags first (needed for session tag lookups)
    await get().fetchTags()
    
    // Then fetch subjects and sessions
    await Promise.all([
      get().fetchSubjects(),
      get().fetchSessions(),
    ])
    
    // Check for active session (not ended)
    const { sessions } = get()
    const activeSession = sessions.find(s => s.ended_at === null)
    if (activeSession) {
      const startTime = new Date(activeSession.started_at).getTime()
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      set({ 
        activeSession, 
        isRunning: true, 
        elapsedSeconds: elapsed,
        selectedSubjectId: activeSession.subject_id,
        selectedTagId: (activeSession as any).tag_id || null,
      })
    }
    
    set({ isLoading: false, isInitialized: true })
  },

  startTimer: async () => {
    const user = useAuthStore.getState().user
    if (!user) return
    
    const { selectedSubjectId, selectedTagId, tags } = get()
    
    // Build insert object - only include tag_id if tags exist
    const insertData: any = {
      user_id: user.id,
      subject_id: selectedSubjectId,
      started_at: new Date().toISOString(),
    }
    
    // Only add tag_id if we have tags (table exists)
    if (tags.length > 0 && selectedTagId) {
      insertData.tag_id = selectedTagId
    }
    
    const { data, error } = await supabase
      .from('study_sessions')
      .insert(insertData)
      .select(`
        *,
        subject:subjects(*)
      `)
      .single()
    
    if (error) {
      console.error('Error starting session:', error)
      return
    }
    
    // Add tag info manually if available
    const sessionWithTag = {
      ...data,
      tag: tags.find(t => t.id === selectedTagId) || null
    }
    
    set({ 
      activeSession: sessionWithTag, 
      isRunning: true, 
      isPaused: false,
      elapsedSeconds: 0 
    })
  },

  pauseTimer: () => {
    set({ isPaused: true })
  },

  resumeTimer: () => {
    set({ isPaused: false })
  },

  stopTimer: async () => {
    const { activeSession, elapsedSeconds } = get()
    if (!activeSession) return
    
    const { error } = await supabase
      .from('study_sessions')
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: elapsedSeconds,
      })
      .eq('id', activeSession.id)
    
    if (error) {
      console.error('Error stopping session:', error)
      return
    }
    
    set({ 
      activeSession: null, 
      isRunning: false, 
      isPaused: false,
      elapsedSeconds: 0 
    })
    
    // Refresh sessions
    await get().fetchSessions()
  },

  // Sync timer with actual start time (called when tab regains focus)
  syncTimer: () => {
    const { activeSession, isRunning, isPaused } = get()
    if (!activeSession || !isRunning || isPaused) return
    
    const startTime = new Date(activeSession.started_at).getTime()
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    set({ elapsedSeconds: elapsed })
  },

  tick: () => {
    const { isRunning, isPaused } = get()
    if (isRunning && !isPaused) {
      set(state => ({ elapsedSeconds: state.elapsedSeconds + 1 }))
    }
  },

  fetchSubjects: async () => {
    const user = useAuthStore.getState().user
    if (!user) return
    
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
    
    if (error) {
      console.error('Error fetching subjects:', error)
      return
    }
    
    // If no subjects, create defaults
    if (data.length === 0) {
      const defaultSubjects = DEFAULT_SUBJECTS.map(s => ({
        user_id: user.id,
        name: s.name,
        code: s.code,
        color: s.color,
        exam_board: 'CIE',
      }))
      
      const { data: newSubjects, error: insertError } = await supabase
        .from('subjects')
        .insert(defaultSubjects)
        .select()
      
      if (!insertError && newSubjects) {
        set({ subjects: newSubjects })
        return
      }
    }
    
    set({ subjects: data })
  },

  fetchTags: async () => {
    const user = useAuthStore.getState().user
    if (!user) return
    
    // Fetch both default (user_id is null) and user-created tags
    const { data, error } = await supabase
      .from('session_tags')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order('is_default', { ascending: false })
      .order('name')
    
    if (error) {
      // Table might not exist yet - use default tags in memory
      console.log('Tags table not available, using defaults')
      const defaultTags: SessionTag[] = [
        { id: 'default-1', user_id: null, name: 'Past Papers', color: '#EF4444', is_default: true, created_at: new Date().toISOString() },
        { id: 'default-2', user_id: null, name: 'Practice', color: '#F59E0B', is_default: true, created_at: new Date().toISOString() },
        { id: 'default-3', user_id: null, name: 'General', color: '#6B7280', is_default: true, created_at: new Date().toISOString() },
      ]
      set({ tags: defaultTags })
      return
    }
    
    set({ tags: data || [] })
  },

  fetchSessions: async () => {
    const user = useAuthStore.getState().user
    if (!user) return
    
    const { tags } = get()
    
    // Fetch sessions with just subject join (tags might not exist)
    // Fetch more sessions for historical data
    const { data, error } = await supabase
      .from('study_sessions')
      .select(`
        *,
        subject:subjects(*)
      `)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(500)
    
    if (error) {
      console.error('Error fetching sessions:', error)
      return
    }
    
    // Manually attach tag info from local tags state (tag_id column might not exist yet)
    const sessionsWithTags = (data || []).map(session => ({
      ...session,
      tag: (session as any).tag_id ? tags.find(t => t.id === (session as any).tag_id) || null : null
    }))
    
    set({ sessions: sessionsWithTags })
  },

  addSubject: async (name, code, color = '#3B82F6') => {
    const user = useAuthStore.getState().user
    if (!user) return
    
    const { error } = await supabase
      .from('subjects')
      .insert({
        user_id: user.id,
        name,
        code: code || null,
        color,
        exam_board: 'CIE',
      })
    
    if (error) {
      console.error('Error adding subject:', error)
      return
    }
    
    await get().fetchSubjects()
  },

  deleteSubject: async (id) => {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting subject:', error)
      return
    }
    
    await get().fetchSubjects()
  },

  addTag: async (name, color = '#6B7280') => {
    const user = useAuthStore.getState().user
    if (!user) return
    
    // Try to add to DB, fall back to local-only if table doesn't exist
    const { data, error } = await supabase
      .from('session_tags')
      .insert({
        user_id: user.id,
        name,
        color,
        is_default: false,
      })
      .select()
      .single()
    
    if (error) {
      // Table might not exist - add locally
      console.log('Could not save tag to DB, adding locally')
      const newTag: SessionTag = {
        id: `local-${Date.now()}`,
        user_id: user.id,
        name,
        color,
        is_default: false,
        created_at: new Date().toISOString(),
      }
      set(state => ({ tags: [...state.tags, newTag] }))
      return
    }
    
    if (data) {
      set(state => ({ tags: [...state.tags, data] }))
    }
  },

  deleteSession: async (id) => {
    const { error } = await supabase
      .from('study_sessions')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting session:', error)
      return
    }
    
    await get().fetchSessions()
  },

  setSelectedSubject: (id) => {
    set({ selectedSubjectId: id })
  },

  setSelectedTag: (id) => {
    set({ selectedTagId: id })
  },

  getTodayTotal: () => {
    const { sessions } = get()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return sessions
      .filter(s => {
        const sessionDate = new Date(s.started_at)
        sessionDate.setHours(0, 0, 0, 0)
        return sessionDate.getTime() === today.getTime() && s.duration_seconds
      })
      .reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
  },

  getWeeklyData: () => {
    const { sessions } = get()
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const today = new Date()
    const weekData: { day: string; seconds: number; date: string }[] = []
    
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const daySeconds = sessions
        .filter(s => {
          const sessionDate = new Date(s.started_at)
          sessionDate.setHours(0, 0, 0, 0)
          return sessionDate.getTime() === date.getTime() && s.duration_seconds
        })
        .reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
      
      weekData.push({
        day: days[date.getDay()],
        seconds: daySeconds,
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format
      })
    }
    
    return weekData
  },

  getSubjectBreakdown: () => {
    const { sessions } = get()
    const breakdown: Record<string, { seconds: number; color: string }> = {}
    
    // Initialize with "No Subject"
    breakdown['No Subject'] = { seconds: 0, color: '#9CA3AF' }
    
    sessions.forEach(s => {
      if (!s.duration_seconds) return
      
      if (s.subject_id && s.subject) {
        if (!breakdown[s.subject.name]) {
          breakdown[s.subject.name] = { seconds: 0, color: s.subject.color }
        }
        breakdown[s.subject.name].seconds += s.duration_seconds
      } else {
        breakdown['No Subject'].seconds += s.duration_seconds
      }
    })
    
    return Object.entries(breakdown)
      .filter(([_, data]) => data.seconds > 0)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.seconds - a.seconds)
  },

  getDataForDateRange: (numDays: number) => {
    const { sessions } = get()
    const today = new Date()
    const data: { day: string; seconds: number; date: string }[] = []
    
    // Get data for the specified number of days
    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const daySeconds = sessions
        .filter(s => {
          const sessionDate = new Date(s.started_at)
          sessionDate.setHours(0, 0, 0, 0)
          return sessionDate.getTime() === date.getTime() && s.duration_seconds
        })
        .reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
      
      // Format date label based on range
      let dayLabel: string
      if (numDays <= 7) {
        dayLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
      } else if (numDays <= 30) {
        dayLabel = `${date.getMonth() + 1}/${date.getDate()}`
      } else {
        dayLabel = `${date.getMonth() + 1}/${date.getDate()}`
      }
      
      data.push({
        day: dayLabel,
        seconds: daySeconds,
        date: date.toISOString().split('T')[0],
      })
    }
    
    return data
  },

  getAllTimeTotal: () => {
    const { sessions } = get()
    return sessions
      .filter(s => s.duration_seconds)
      .reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
  },
}))
