import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './authStore'

export type SessionType = 'May/Jun' | 'Feb/Mar' | 'Oct/Nov'

// Individual paper config within a subject
export interface PaperConfig {
  paper: string // '1', '2', '3', '4', '5', '6'
  max_marks: number
}

// Paper entry represents a single paper attempt
export interface PaperEntry {
  id: string
  user_id: string
  subject_id: string
  year: number
  session: SessionType
  paper_code: string // e.g., "12" for Paper 1 Variant 2
  marks: number | null
  max_marks: number
  created_at: string
}

// Subject config - which papers and their max marks
export interface SubjectPaperConfig {
  id: string
  user_id: string
  subject_id: string
  subject_name: string // Store subject name here for papers page
  papers: PaperConfig[] // Array of papers with their max marks (1-5 papers)
  created_at: string
}

// Row for table display
export interface SessionRow {
  year: number
  session: SessionType
  variant: number // 1, 2, 3 etc
  sessionLabel: string
  papers: Map<string, PaperEntry | null> // paper number -> entry
  paperDates: Map<string, string | null> // paper number -> created_at
  latestDate: string | null
  total: number | null
  percentage: number | null
  maxTotal: number
}

interface PapersState {
  entries: PaperEntry[]
  configs: SubjectPaperConfig[]
  selectedConfigId: string | null
  showPercentage: boolean
  isLoading: boolean
  isInitialized: boolean
  
  // Actions
  initialize: () => Promise<void>
  fetchEntries: () => Promise<void>
  fetchConfigs: () => Promise<void>
  
  // Entry CRUD
  addEntry: (entry: {
    subject_id: string
    year: number
    session: SessionType
    paper_code: string
    marks: number | null
    max_marks: number
  }) => Promise<PaperEntry | null>
  deleteEntry: (id: string) => Promise<void>
  
  // Config CRUD
  addSubjectConfig: (config: {
    subject_id: string
    subject_name: string
    papers: PaperConfig[]
  }) => Promise<SubjectPaperConfig | null>
  updateSubjectConfig: (id: string, papers: PaperConfig[]) => Promise<void>
  deleteSubjectConfig: (id: string) => Promise<void>
  getConfig: (configId: string) => SubjectPaperConfig | null
  
  // Selection & Settings
  setSelectedConfig: (id: string | null) => void
  toggleShowPercentage: () => void
  
  // Computed
  getEntriesForSubject: (subjectId: string) => PaperEntry[]
  getTableRows: (configId: string) => SessionRow[]
  getSubjectStats: (configId: string) => {
    totalEntries: number
    averagePercentage: number
    sessionsCount: number
  }
}

const getSessionLabel = (year: number, session: SessionType): string => {
  switch (session) {
    case 'May/Jun': return `Summer ${year}`
    case 'Feb/Mar': return `Spring ${year}`
    case 'Oct/Nov': return `Winter ${year}`
  }
}

const getSessionOrder = (session: SessionType): number => {
  switch (session) {
    case 'Feb/Mar': return 0
    case 'May/Jun': return 1
    case 'Oct/Nov': return 2
  }
}

export const usePapersStore = create<PapersState>((set, get) => ({
  entries: [],
  configs: [],
  selectedConfigId: null,
  showPercentage: true,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized || get().isLoading) return
    
    set({ isLoading: true })
    await Promise.all([
      get().fetchEntries(),
      get().fetchConfigs(),
    ])
    set({ isLoading: false, isInitialized: true })
  },

  fetchEntries: async () => {
    const user = useAuthStore.getState().user
    if (!user) return

    const { data, error } = await supabase
      .from('paper_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('year', { ascending: false })

    if (error) {
      console.log('Paper entries table not available:', error.message)
      return
    }

    set({ entries: data || [] })
  },

  fetchConfigs: async () => {
    const user = useAuthStore.getState().user
    if (!user) return

    const { data, error } = await supabase
      .from('subject_paper_configs')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      console.log('Paper configs table not available:', error.message)
      return
    }

    set({ configs: data || [] })
  },

  addEntry: async (entry) => {
    const user = useAuthStore.getState().user
    if (!user) return null

    const { data, error } = await supabase
      .from('paper_entries')
      .insert({
        user_id: user.id,
        ...entry,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding entry:', error)
      return null
    }

    set(state => ({
      entries: [data, ...state.entries]
    }))

    return data
  },

  deleteEntry: async (id) => {
    const { error } = await supabase
      .from('paper_entries')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting entry:', error)
      return
    }

    set(state => ({
      entries: state.entries.filter(e => e.id !== id)
    }))
  },

  addSubjectConfig: async (config) => {
    const user = useAuthStore.getState().user
    if (!user) return null

    console.log('Adding config:', JSON.stringify(config, null, 2))

    const { data, error } = await supabase
      .from('subject_paper_configs')
      .insert({
        user_id: user.id,
        subject_id: config.subject_id,
        subject_name: config.subject_name,
        papers: config.papers,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding config:', error.message, error.details, error.hint)
      return null
    }

    set(state => ({
      configs: [...state.configs, data],
      selectedConfigId: data.id,
    }))

    return data
  },

  updateSubjectConfig: async (id, papers) => {
    const { error } = await supabase
      .from('subject_paper_configs')
      .update({ papers })
      .eq('id', id)

    if (error) {
      console.error('Error updating config:', error)
      return
    }

    set(state => ({
      configs: state.configs.map(c => c.id === id ? { ...c, papers } : c)
    }))
  },

  deleteSubjectConfig: async (id) => {
    const config = get().configs.find(c => c.id === id)
    if (!config) return

    // Delete all entries for this subject first
    const { error: entriesError } = await supabase
      .from('paper_entries')
      .delete()
      .eq('subject_id', config.subject_id)

    if (entriesError) {
      console.error('Error deleting entries:', entriesError)
    }

    const { error } = await supabase
      .from('subject_paper_configs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting config:', error)
      return
    }

    set(state => ({
      configs: state.configs.filter(c => c.id !== id),
      entries: state.entries.filter(e => e.subject_id !== config.subject_id),
      selectedConfigId: state.selectedConfigId === id ? null : state.selectedConfigId,
    }))
  },

  getConfig: (configId) => {
    return get().configs.find(c => c.id === configId) || null
  },

  setSelectedConfig: (id) => {
    set({ selectedConfigId: id })
  },

  toggleShowPercentage: () => {
    set(state => ({ showPercentage: !state.showPercentage }))
  },

  getEntriesForSubject: (subjectId) => {
    return get().entries.filter(e => e.subject_id === subjectId)
  },

  getTableRows: (configId) => {
    const config = get().getConfig(configId)
    if (!config) return []

    const entries = get().getEntriesForSubject(config.subject_id)
    const paperConfigs = config.papers || []
    const maxTotal = paperConfigs.reduce((sum, p) => sum + p.max_marks, 0)

    // Extract variant from paper_code (e.g., "12" -> variant 2, "21" -> variant 1)
    const getVariant = (paperCode: string): number => {
      if (paperCode.length >= 2) {
        return parseInt(paperCode[1]) || 1
      }
      return 1
    }

    // Group entries by year+session+variant
    const groupedMap = new Map<string, { year: number; session: SessionType; variant: number; entries: PaperEntry[] }>()
    
    entries.forEach(entry => {
      const variant = getVariant(entry.paper_code)
      const key = `${entry.year}-${entry.session}-V${variant}`
      if (!groupedMap.has(key)) {
        groupedMap.set(key, { year: entry.year, session: entry.session, variant, entries: [] })
      }
      groupedMap.get(key)!.entries.push(entry)
    })

    // Convert to rows
    const rows: SessionRow[] = Array.from(groupedMap.values()).map(group => {
      const papersMap = new Map<string, PaperEntry | null>()
      const paperDates = new Map<string, string | null>()
      let latestDate: string | null = null
      
      // For each configured paper, find matching entry with same variant
      paperConfigs.forEach(pc => {
        const entry = group.entries.find(e => {
          const paperNum = e.paper_code[0]
          const variant = getVariant(e.paper_code)
          return paperNum === pc.paper && variant === group.variant
        }) || null
        papersMap.set(pc.paper, entry)
        paperDates.set(pc.paper, entry?.created_at || null)
        
        if (entry?.created_at) {
          if (!latestDate || new Date(entry.created_at) > new Date(latestDate)) {
            latestDate = entry.created_at
          }
        }
      })

      // Calculate total and percentage
      let total: number | null = null
      let filledCount = 0
      let sum = 0
      
      paperConfigs.forEach(pc => {
        const entry = papersMap.get(pc.paper)
        if (entry?.marks != null) {
          sum += entry.marks
          filledCount++
        }
      })

      if (filledCount > 0) {
        total = sum
      }

      const percentage = filledCount === paperConfigs.length && total != null
        ? Math.round((total / maxTotal) * 100)
        : null

      return {
        year: group.year,
        session: group.session,
        variant: group.variant,
        sessionLabel: `${getSessionLabel(group.year, group.session)} V${group.variant}`,
        papers: papersMap,
        paperDates,
        latestDate,
        total,
        percentage,
        maxTotal,
      }
    })

    // Sort by year desc, then session order, then variant
    rows.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      if (a.session !== b.session) return getSessionOrder(b.session) - getSessionOrder(a.session)
      return a.variant - b.variant
    })

    return rows
  },

  getSubjectStats: (configId) => {
    const rows = get().getTableRows(configId)
    const config = get().getConfig(configId)
    
    let totalEntries = 0
    rows.forEach(row => {
      config?.papers.forEach(pc => {
        if (row.papers.get(pc.paper)) totalEntries++
      })
    })
    
    const completedRows = rows.filter(r => r.percentage != null)
    const averagePercentage = completedRows.length > 0
      ? Math.round(completedRows.reduce((acc, r) => acc + r.percentage!, 0) / completedRows.length)
      : 0
    
    return { 
      totalEntries, 
      averagePercentage, 
      sessionsCount: rows.length 
    }
  },
}))
