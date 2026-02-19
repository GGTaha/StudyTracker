import { Trash2 } from 'lucide-react'
import { usePapersStore } from '../../stores/papersStoreNew'

interface PapersTableProps {
  configId: string
  onAddEntry?: () => void
}

export function PapersTable({ configId, onAddEntry }: PapersTableProps) {
  const { getTableRows, getConfig, deleteEntry } = usePapersStore()
  
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

  const gridCols = `2fr ${paperConfigs.map(() => '1fr').join(' ')} 1fr 1fr`

  return (
    <div className="overflow-x-auto -mx-2 px-2">
      {/* Table Header */}
      <div
        className="grid px-5 py-2 text-[0.8rem] font-semibold tracking-wider text-slate-500 uppercase min-w-[500px]"
        style={{ gridTemplateColumns: gridCols }}
      >
        <div>Session</div>
        {paperConfigs.map(pc => (
          <div key={pc.paper} className="text-center">Paper {pc.paper}</div>
        ))}
        <div className="text-center">Total</div>
        <div className="text-right">Grade</div>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div
            key={`${row.year}-${row.session}-${row.variant}`}
            className="group grid items-center p-4 bg-white/[0.015] border border-white/[0.04] rounded-2xl hover:bg-white/[0.04] hover:border-white/10 transition-colors min-w-[500px]"
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
                <div key={pc.paper} className="text-center relative group/cell flex items-center justify-center">
                  {entry ? (
                    <div className="flex items-center justify-center gap-1">
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
          </div>
        ))}
      </div>
    </div>
  )
}
