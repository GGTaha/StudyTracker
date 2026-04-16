import { Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { useState } from 'react'
import { usePapersStore } from '../../stores/papersStoreNew'

interface PapersTableProps {
  configId: string
  onAddEntry?: () => void
}

export function PapersTable({ configId, onAddEntry }: PapersTableProps) {
  const { getTableRows, getConfig, deleteEntry } = usePapersStore()
  
  const [sortConfig, setSortConfig] = useState<{ field: string, direction: 'asc' | 'desc' } | null>(null)
  const [dateViewMode, setDateViewMode] = useState<string>('latest')
  
  const config = getConfig(configId)
  const rows = getTableRows(configId)

  if (!config) return null

  const paperConfigs = config.papers || []

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this entry?')) {
      await deleteEntry(id)
    }
  }

  const getPercentageColor = (percentage: number | null) => {
    if (percentage === null) return 'text-slate-600'
    if (percentage >= 80) return 'text-emerald-400'
    if (percentage >= 60) return 'text-sky-400'
    if (percentage >= 40) return 'text-amber-400'
    return 'text-rose-400'
  }

  const getScorePillStyle = (marks: number, maxMarks: number) => {
    const pct = (marks / maxMarks) * 100
    if (pct >= 80) return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    if (pct >= 60) return 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
    if (pct >= 40) return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    return 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
  }

  // Parse sessionLabel "Summer 2026 V1" → "Summer 2026"
  const getSessionName = (label: string) => {
    return label.replace(/ V\d+$/, '')
  }

  if (rows.length === 0) {
    return (
      <div className="text-slate-500 text-sm text-center py-8">
        No entries yet. Add your first paper entry to get started.
      </div>
    )
  }

  const handleSort = (field: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.field === field && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ field, direction })
  }

  const SortIcon = ({ field, align = 'center' }: { field: string, align?: 'left' | 'center' | 'right' }) => {
    if (sortConfig?.field !== field) return <div className="w-3 h-3" />
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className={`w-3 h-3 ${align === 'right' ? 'mr-0' : ''}`} /> 
      : <ArrowDown className={`w-3 h-3 ${align === 'right' ? 'mr-0' : ''}`} />
  }

  const sortedRows = [...rows].sort((a, b) => {
    if (!sortConfig) return 0
    const dir = sortConfig.direction === 'asc' ? 1 : -1
    
    if (sortConfig.field === 'session') {
      return dir * a.sessionLabel.localeCompare(b.sessionLabel)
    }
    if (sortConfig.field === 'total') {
      return dir * ((a.total || 0) - (b.total || 0))
    }
    if (sortConfig.field === 'grade') {
      return dir * ((a.percentage || 0) - (b.percentage || 0))
    }
    if (sortConfig.field.startsWith('paper_')) {
      const p = sortConfig.field.split('_')[1]
      const valA = a.papers.get(p)?.marks || 0
      const valB = b.papers.get(p)?.marks || 0
      return dir * (valA - valB)
    }
    if (sortConfig.field === 'date') {
      let dateA: string | null = null
      let dateB: string | null = null
      
      if (dateViewMode === 'latest') {
        dateA = a.latestDate
        dateB = b.latestDate
      } else {
        dateA = a.paperDates.get(dateViewMode) || null
        dateB = b.paperDates.get(dateViewMode) || null
      }
      
      if (!dateA && !dateB) return 0
      if (!dateA) return 1 // push missing dates to bottom
      if (!dateB) return -1
      return dir * (new Date(dateA).getTime() - new Date(dateB).getTime())
    }
    
    return 0
  })

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-GB', { 
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
    }).format(date)
  }

  const gridCols = `2fr ${paperConfigs.map(() => '1fr').join(' ')} 1fr 1fr 1.5fr`

  return (
    <div className="overflow-x-auto -mx-2 px-2">
      {/* Table Header */}
      <div
        className="grid px-5 py-2 text-[0.8rem] font-semibold tracking-wider text-slate-500 uppercase min-w-[700px] gap-2 items-center"
        style={{ gridTemplateColumns: gridCols }}
      >
        <div className="flex items-center gap-1 cursor-pointer hover:text-slate-300 transition-colors w-fit select-none" onClick={() => handleSort('session')}>
          Session <SortIcon field="session" align="left" />
        </div>
        {paperConfigs.map(pc => (
          <div key={pc.paper} className="flex items-center justify-center gap-1 cursor-pointer hover:text-slate-300 transition-colors select-none" onClick={() => handleSort(`paper_${pc.paper}`)}>
            <SortIcon field={`paper_${pc.paper}`} /> Paper {pc.paper}
          </div>
        ))}
        <div className="flex items-center justify-center gap-1 cursor-pointer hover:text-slate-300 transition-colors select-none" onClick={() => handleSort('total')}>
          Total <SortIcon field="total" />
        </div>
        <div className="flex items-center justify-end gap-1 cursor-pointer hover:text-slate-300 transition-colors select-none" onClick={() => handleSort('grade')}>
          <SortIcon field="grade" align="right" /> Grade 
        </div>
        <div className="flex flex-col items-end justify-center w-full min-w-0 pr-1 gap-0.5">
          <div className="flex items-center justify-end gap-1 cursor-pointer hover:text-slate-300 transition-colors select-none w-full" onClick={() => handleSort('date')}>
            <SortIcon field="date" align="right" /> Date Added
          </div>
          <select 
            value={dateViewMode}
            onChange={(e) => setDateViewMode(e.target.value)}
            title="Select which paper's date to view and sort by"
            className="text-[0.65rem] lowercase bg-transparent border-0 text-sky-400 font-medium cursor-pointer p-0 select-none appearance-none hover:text-sky-300 transition-colors focus:ring-0 outline-none max-w-full text-right"
          >
             <option value="latest" className="bg-slate-900 text-slate-300">latest</option>
             {paperConfigs.map(pc => (
               <option key={pc.paper} value={pc.paper} className="bg-slate-900 text-slate-300">
                 paper {pc.paper}
               </option>
             ))}
          </select>
        </div>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-2">
        {sortedRows.map((row) => {
          let displayedDate: string | null | undefined = null
          if (dateViewMode === 'latest') {
            displayedDate = row.latestDate
          } else {
            displayedDate = row.paperDates.get(dateViewMode)
          }

          return (
            <div
              key={`${row.year}-${row.session}-${row.variant}`}
              className="group grid items-center p-4 bg-white/[0.015] border border-white/[0.04] rounded-2xl hover:bg-white/[0.04] hover:border-white/10 transition-colors min-w-[700px] gap-2"
              style={{ gridTemplateColumns: gridCols }}
            >
              {/* Session */}
              <div className="flex flex-col gap-0.5">
                <h4 className="font-semibold text-slate-200 text-[0.95rem]">{getSessionName(row.sessionLabel)}</h4>
                <span className="text-[0.8rem] font-medium text-slate-500">Variant {row.variant}</span>
              </div>

              {/* Paper columns */}
              {paperConfigs.map(pc => {
                const entry = row.papers.get(pc.paper)
                return (
                  <div key={pc.paper} className="text-center relative group/cell flex items-center justify-center h-full">
                    {entry ? (
                      <div className="flex items-center justify-center gap-1" title={`Added: ${formatDate(entry.created_at)}`}>
                        <span className={`px-2.5 py-1 rounded-md text-[0.8rem] font-bold tracking-wider ${getScorePillStyle(entry.marks ?? 0, pc.max_marks)}`}>
                          {entry.marks ?? '—'}
                          <span className="opacity-50 ml-0.5 font-normal">/{pc.max_marks}</span>
                        </span>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="absolute -top-1 -right-1 p-1 bg-rose-500/20 rounded-full opacity-0 group-hover/cell:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3 text-rose-400" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={onAddEntry}
                        className="text-xs font-medium text-slate-500 hover:text-sky-400 transition-colors"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                )
              })}

              {/* Total */}
              <div className="text-center">
                {row.total != null ? (
                  <div>
                    <span className="text-[0.95rem] font-semibold text-slate-200">{row.total}</span>
                    <span className="text-[0.8rem] text-slate-500 ml-1">/{row.maxTotal}</span>
                  </div>
                ) : (
                  <span className="text-slate-600 font-medium">—</span>
                )}
              </div>

              {/* Grade */}
              <div className="text-right">
                {row.percentage != null ? (
                  <span className={`text-[0.95rem] font-bold ${getPercentageColor(row.percentage)}`}>
                    {row.percentage}%
                  </span>
                ) : (
                  <span className="text-slate-600 font-medium">—</span>
                )}
              </div>

              {/* Date Added */}
              <div className="text-right pr-1 flex flex-col justify-center h-full">
                <span className="text-[0.75rem] font-medium text-slate-400 whitespace-nowrap">
                  {formatDate(displayedDate)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
