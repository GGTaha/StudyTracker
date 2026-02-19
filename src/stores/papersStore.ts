import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './authStore'
import type { Subject } from './timerStore'

export type PaperStatus = 'unsolved' | 'in_progress' | 'solved'
export type PaperSession = 'Feb/Mar' | 'May/Jun' | 'Oct/Nov'

export interface Paper {
  id: string
  user_id: string
  subject_id: string
  name: string
  year: number | null
  session: string | null
  variant: number | null
  component: number | null
  max_marks: number | null
  created_at: string
  // Joined data
  subject?: Subject
  attempts?: PaperAttempt[]
  latest_attempt?: PaperAttempt
}

export interface PaperAttempt {
  id: string
  paper_id: string
  user_id: string
  status: PaperStatus
  marks_obtained: number | null
  time_taken_minutes: number | null
  notes: string | null
  attempted_at: string
  created_at: string
}

export interface PaperFilters {
  subjectId: string | null
  status: PaperStatus | 'all'
  year: number | null
  session: string | null
  searchQuery: string
  sortBy: 'name' | 'year' | 'date_added' | 'last_attempt' | 'percentage'
  sortOrder: 'asc' | 'desc'
}

interface PapersState {
  papers: Paper[]
  isLoading: boolean
  isInitialized: boolean
  filters: PaperFilters
  
  // Actions
  initialize: () => Promise<void>
  fetchPapers: () => Promise<void>
  addPaper: (paper: {
    subject_id: string
    name: string
    year?: number
    session?: string
    variant?: number
    component?: number
    max_marks?: number
  }) => Promise<Paper | null>
  updatePaper: (id: string, updates: Partial<Paper>) => Promise<void>
  deletePaper: (id: string) => Promise<void>
  
  // Attempts
  addAttempt: (attempt: {
    paper_id: string
    status: PaperStatus
    marks_obtained?: number
    time_taken_minutes?: number
    notes?: string
  }) => Promise<void>
  updateAttempt: (id: string, updates: Partial<PaperAttempt>) => Promise<void>
  deleteAttempt: (id: string) => Promise<void>
  
  // Filters
  setFilters: (filters: Partial<PaperFilters>) => void
  resetFilters: () => void
  
  // Computed
  getFilteredPapers: () => Paper[]
  getStats: () => {
    total: number
    solved: number
    inProgress: number
    unsolved: number
    averagePercentage: number
  }
  getYears: () => number[]
}

const DEFAULT_FILTERS: PaperFilters = {
  subjectId: null,
  status: 'all',
  year: null,
  session: null,
  searchQuery: '',
  sortBy: 'date_added',
  sortOrder: 'desc',
}

export const usePapersStore = create<PapersState>((set, get) => ({
  papers: [],
  isLoading: false,
  isInitialized: false,
  filters: DEFAULT_FILTERS,

  initialize: async () => {
    if (get().isInitialized || get().isLoading) return
    
    set({ isLoading: true })
    await get().fetchPapers()
    set({ isLoading: false, isInitialized: true })
  },

  fetchPapers: async () => {
    const user = useAuthStore.getState().user
    if (!user) return

    // Fetch papers with subject info
    const { data: papers, error: papersError } = await supabase
      .from('papers')
      .select(`
        *,
        subject:subjects(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (papersError) {
      console.error('Error fetching papers:', papersError)
      return
    }

    // Fetch all attempts for user's papers
    const paperIds = papers?.map(p => p.id) || []
    
    if (paperIds.length > 0) {
      const { data: attempts, error: attemptsError } = await supabase
        .from('paper_attempts')
        .select('*')
        .in('paper_id', paperIds)
        .order('attempted_at', { ascending: false })

      if (attemptsError) {
        console.error('Error fetching attempts:', attemptsError)
      }

      // Attach attempts to papers
      const papersWithAttempts = papers?.map(paper => {
        const paperAttempts = attempts?.filter(a => a.paper_id === paper.id) || []
        return {
          ...paper,
          attempts: paperAttempts,
          latest_attempt: paperAttempts[0] || null,
        }
      })

      set({ papers: papersWithAttempts || [] })
    } else {
      set({ papers: papers || [] })
    }
  },

  addPaper: async (paper) => {
    const user = useAuthStore.getState().user
    if (!user) return null

    const { data, error } = await supabase
      .from('papers')
      .insert({
        user_id: user.id,
        ...paper,
      })
      .select(`
        *,
        subject:subjects(*)
      `)
      .single()

    if (error) {
      console.error('Error adding paper:', error)
      return null
    }

    // Add to local state
    set(state => ({
      papers: [{ ...data, attempts: [], latest_attempt: null }, ...state.papers]
    }))

    return data
  },

  updatePaper: async (id, updates) => {
    const { error } = await supabase
      .from('papers')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('Error updating paper:', error)
      return
    }

    set(state => ({
      papers: state.papers.map(p => 
        p.id === id ? { ...p, ...updates } : p
      )
    }))
  },

  deletePaper: async (id) => {
    const { error } = await supabase
      .from('papers')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting paper:', error)
      return
    }

    set(state => ({
      papers: state.papers.filter(p => p.id !== id)
    }))
  },

  addAttempt: async (attempt) => {
    const user = useAuthStore.getState().user
    if (!user) return

    const { data, error } = await supabase
      .from('paper_attempts')
      .insert({
        user_id: user.id,
        ...attempt,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding attempt:', error)
      return
    }

    // Update local state
    set(state => ({
      papers: state.papers.map(p => {
        if (p.id === attempt.paper_id) {
          const newAttempts = [data, ...(p.attempts || [])]
          return {
            ...p,
            attempts: newAttempts,
            latest_attempt: data,
          }
        }
        return p
      })
    }))
  },

  updateAttempt: async (id, updates) => {
    const { error } = await supabase
      .from('paper_attempts')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('Error updating attempt:', error)
      return
    }

    set(state => ({
      papers: state.papers.map(p => ({
        ...p,
        attempts: p.attempts?.map(a => 
          a.id === id ? { ...a, ...updates } : a
        ),
        latest_attempt: p.latest_attempt?.id === id 
          ? { ...p.latest_attempt, ...updates }
          : p.latest_attempt
      }))
    }))
  },

  deleteAttempt: async (id) => {
    const { error } = await supabase
      .from('paper_attempts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting attempt:', error)
      return
    }

    set(state => ({
      papers: state.papers.map(p => {
        const newAttempts = p.attempts?.filter(a => a.id !== id) || []
        return {
          ...p,
          attempts: newAttempts,
          latest_attempt: newAttempts[0] || null,
        }
      })
    }))
  },

  setFilters: (filters) => {
    set(state => ({
      filters: { ...state.filters, ...filters }
    }))
  },

  resetFilters: () => {
    set({ filters: DEFAULT_FILTERS })
  },

  getFilteredPapers: () => {
    const { papers, filters } = get()
    
    let filtered = [...papers]

    // Subject filter
    if (filters.subjectId) {
      filtered = filtered.filter(p => p.subject_id === filters.subjectId)
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(p => {
        const status = p.latest_attempt?.status || 'unsolved'
        return status === filters.status
      })
    }

    // Year filter
    if (filters.year) {
      filtered = filtered.filter(p => p.year === filters.year)
    }

    // Session filter
    if (filters.session) {
      filtered = filtered.filter(p => p.session === filters.session)
    }

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.subject?.name.toLowerCase().includes(query)
      )
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'year':
          comparison = (a.year || 0) - (b.year || 0)
          break
        case 'date_added':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'last_attempt':
          const aTime = a.latest_attempt?.attempted_at ? new Date(a.latest_attempt.attempted_at).getTime() : 0
          const bTime = b.latest_attempt?.attempted_at ? new Date(b.latest_attempt.attempted_at).getTime() : 0
          comparison = aTime - bTime
          break
        case 'percentage':
          const aPerc = a.latest_attempt?.marks_obtained && a.max_marks 
            ? (a.latest_attempt.marks_obtained / a.max_marks) * 100 
            : -1
          const bPerc = b.latest_attempt?.marks_obtained && b.max_marks 
            ? (b.latest_attempt.marks_obtained / b.max_marks) * 100 
            : -1
          comparison = aPerc - bPerc
          break
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison
    })

    return filtered
  },

  getStats: () => {
    const { papers } = get()
    
    const total = papers.length
    const solved = papers.filter(p => p.latest_attempt?.status === 'solved').length
    const inProgress = papers.filter(p => p.latest_attempt?.status === 'in_progress').length
    const unsolved = total - solved - inProgress

    // Calculate average percentage for solved papers with marks
    const solvedWithMarks = papers.filter(p => 
      p.latest_attempt?.status === 'solved' && 
      p.latest_attempt?.marks_obtained != null && 
      p.max_marks
    )
    
    const averagePercentage = solvedWithMarks.length > 0
      ? solvedWithMarks.reduce((acc, p) => {
          const perc = (p.latest_attempt!.marks_obtained! / p.max_marks!) * 100
          return acc + perc
        }, 0) / solvedWithMarks.length
      : 0

    return { total, solved, inProgress, unsolved, averagePercentage }
  },

  getYears: () => {
    const { papers } = get()
    const years = new Set<number>()
    papers.forEach(p => {
      if (p.year) years.add(p.year)
    })
    return Array.from(years).sort((a, b) => b - a)
  },
}))
