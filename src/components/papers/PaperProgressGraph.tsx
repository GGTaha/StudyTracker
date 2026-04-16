import { useState, useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { TrendingUp, ChevronDown, ZoomIn, ZoomOut } from 'lucide-react'
import { usePapersStore } from '../../stores/papersStoreNew'
import { GlassCard } from '../ui/GlassCard'

interface Props {
  configId: string
}

export function PaperProgressGraph({ configId }: Props) {
  const { getTableRows, getConfig } = usePapersStore()
  
  const config = getConfig(configId)
  const rows = getTableRows(configId)
  
  const paperConfigs = config?.papers || []
  const firstPaper = paperConfigs[0]?.paper

  // Smart Defaults - find the most logical initial metric based on actual populated data
  const [yAxisMode, setYAxisMode] = useState<string>(() => {
    let maxLogs = 0
    let bestPaper = firstPaper

    for (const pc of paperConfigs) {
      const logs = rows.filter(r => r.papers.get(pc.paper)?.marks != null).length
      if (logs > maxLogs) {
        maxLogs = logs
        bestPaper = pc.paper
      }
    }
    const totalLogs = rows.filter(r => r.total != null).length
    if (totalLogs > maxLogs && totalLogs >= 2) return 'combined_percent'
    return bestPaper ? `paper_${bestPaper}` : 'combined_percent'
  })

  const [xAxisMode, setXAxisMode] = useState<string>(() => {
    let maxLogs = 0
    let bestPaper = firstPaper
    for (const pc of paperConfigs) {
      const logs = rows.filter(r => r.papers.get(pc.paper)?.marks != null).length
      if (logs > maxLogs) {
        maxLogs = logs
        bestPaper = pc.paper
      }
    }
    const totalLogs = rows.filter(r => r.total != null).length
    if (totalLogs > maxLogs && totalLogs >= 2) return 'latest'
    return bestPaper ? `paper_${bestPaper}` : 'latest'
  })
  const [isZoomed, setIsZoomed] = useState(true)

  const chartData = useMemo(() => {
    if (!config || rows.length === 0) return []

    // Parse Session Name (e.g. "Summer 2026 V1" -> "Summer 2026")
    const getSessionName = (label: string) => label.replace(/ V\d+$/, '')

    let processedRows = [...rows]

    // 1. Filter rows that actually have data for the selected Y axis
    if (yAxisMode.startsWith('paper_')) {
      const p = yAxisMode.split('_')[1]
      processedRows = processedRows.filter(r => r.papers.get(p)?.marks != null)
    } else {
      processedRows = processedRows.filter(r => r.total != null) // Keep if ANY paper has data
    }

    // 2. Sort by X Axis mode
    processedRows.sort((a, b) => {
      if (xAxisMode === 'session_order') {
        if (a.year !== b.year) return a.year - b.year
        const orderValues: Record<string, number> = { 'Feb/Mar': 0, 'May/Jun': 1, 'Oct/Nov': 2 }
        if (a.session !== b.session) return (orderValues[a.session] || 0) - (orderValues[b.session] || 0)
        return a.variant - b.variant
      } else {
        // Date sorting
        let dateA: string | null = null
        let dateB: string | null = null

        if (xAxisMode === 'latest') {
          dateA = a.latestDate
          dateB = b.latestDate
        } else if (xAxisMode.startsWith('paper_')) {
          const p = xAxisMode.split('_')[1]
          dateA = a.paperDates.get(p) || a.latestDate // Fallback to latest date if not filled, to prevent backwards null-sorting
          dateB = b.paperDates.get(p) || b.latestDate
        }

        const orderValues: Record<string, number> = { 'Feb/Mar': 0, 'May/Jun': 1, 'Oct/Nov': 2 }

        if (!dateA && !dateB) {
            // pure fallback to chronological session order
            if (a.year !== b.year) return a.year - b.year
            if (a.session !== b.session) return (orderValues[a.session] || 0) - (orderValues[b.session] || 0)
            return a.variant - b.variant
        }
        if (!dateA) return -1 
        if (!dateB) return 1
        
        const timeDiff = new Date(dateA).getTime() - new Date(dateB).getTime()
        if (timeDiff !== 0) return timeDiff
        
        // Exact same timestamp tie-break: Use session order
        if (a.year !== b.year) return a.year - b.year
        if (a.session !== b.session) return (orderValues[a.session] || 0) - (orderValues[b.session] || 0)
        return a.variant - b.variant
      }
    })

    // 3. Map to Data Points
    return processedRows.map(row => {
      let value: number | null = null
      let label = ''

      if (yAxisMode === 'combined_percent') {
        let sumMarks = 0
        let sumMax = 0
        paperConfigs.forEach(pc => {
          const entry = row.papers.get(pc.paper)
          if (entry?.marks != null) {
            sumMarks += entry.marks
            sumMax += pc.max_marks
          }
        })
        value = sumMax > 0 ? Math.round((sumMarks / sumMax) * 100) : null
        label = 'Percentage'
      } else if (yAxisMode === 'combined_marks') {
        value = row.total
        label = 'Total Marks'
      } else {
        const p = yAxisMode.split('_')[1]
        value = row.papers.get(p)?.marks ?? null
        label = `Paper ${p}`
      }

      return {
        name: getSessionName(row.sessionLabel),
        fullLabel: row.sessionLabel,
        value,
        dataLabel: label,
      }
    })

  }, [config, rows, yAxisMode, xAxisMode])

  if (!config || rows.length === 0 || paperConfigs.length === 0) return null

  // Define domain max
  let domainMax: number | 'auto' = 'auto'
  if (yAxisMode === 'combined_percent') domainMax = 100
  else if (yAxisMode.startsWith('paper_')) {
    const p = yAxisMode.split('_')[1]
    const pc = paperConfigs.find(c => c.paper === p)
    if (pc) domainMax = pc.max_marks
  }

  let finalDomain: [number | 'auto', number | 'auto'] = [0, domainMax]

  if (isZoomed && chartData.length > 0) {
    const dataValues = chartData.map(d => d.value).filter(v => v !== null) as number[]
    if (dataValues.length > 0) {
      const dataMin = Math.min(...dataValues)
      const dataMax = Math.max(...dataValues)
      
      const valueRange = dataMax - dataMin
      const padding = Math.max(Math.ceil(valueRange * 0.2), yAxisMode === 'combined_percent' ? 5 : 3)
      
      const zoomedMin = Math.max(0, dataMin - padding)
      const zoomedMax = domainMax === 'auto' ? dataMax + padding : Math.min(domainMax as number, dataMax + padding)
      
      finalDomain = [zoomedMin, zoomedMax]
    }
  }

  return (
    <GlassCard className="!p-0 overflow-hidden">
      <div className="p-5 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center bg-white/[0.01] gap-4">
        <h3 className="text-[1.05rem] font-semibold text-slate-50 flex items-center gap-2">
          <TrendingUp size={18} className="text-sky-400" />
          Attempt Progress
        </h3>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom Toggle */}
          <button 
            onClick={() => setIsZoomed(!isZoomed)}
            className={`p-2 rounded-xl border transition-colors flex items-center justify-center ${
              isZoomed 
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20' 
                : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-white'
            }`}
            title={isZoomed ? "Zoom Out to Full Range" : "Zoom In to Data"}
          >
            {isZoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
          </button>

          {/* Y Axis Select */}
          <div className="flex items-center gap-2 bg-white/[0.03] hover:bg-white/[0.06] transition-colors border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-sky-500/50">
            <span className="text-[0.7rem] font-semibold text-slate-500 uppercase tracking-widest">Metric</span>
            <div className="relative">
              <select
                value={yAxisMode}
                onChange={(e) => setYAxisMode(e.target.value)}
                className="text-[0.8rem] bg-transparent border-0 text-slate-200 font-medium cursor-pointer p-0 pr-4 select-none appearance-none outline-none"
              >
                {paperConfigs.map(pc => (
                  <option key={pc.paper} value={`paper_${pc.paper}`} className="bg-slate-900 text-slate-200">Paper {pc.paper} Marks</option>
                ))}
                <option value="combined_percent" className="bg-slate-900 text-slate-200">Total Percentage (%)</option>
                <option value="combined_marks" className="bg-slate-900 text-slate-200">Total Marks</option>
              </select>
              <ChevronDown size={14} className="text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* X Axis Select */}
          <div className="flex items-center gap-2 bg-white/[0.03] hover:bg-white/[0.06] transition-colors border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-sky-500/50">
            <span className="text-[0.7rem] font-semibold text-slate-500 uppercase tracking-widest">Order</span>
            <div className="relative">
              <select
                value={xAxisMode}
                onChange={(e) => setXAxisMode(e.target.value)}
                className="text-[0.8rem] bg-transparent border-0 text-slate-200 font-medium cursor-pointer p-0 pr-4 select-none appearance-none outline-none"
              >
                {paperConfigs.map(pc => (
                  <option key={pc.paper} value={`paper_${pc.paper}`} className="bg-slate-900 text-slate-200">Time Added (Paper {pc.paper})</option>
                ))}
                <option value="latest" className="bg-slate-900 text-slate-200">Time Added (Latest)</option>
                <option value="session_order" className="bg-slate-900 text-slate-200">Session Order</option>
              </select>
              <ChevronDown size={14} className="text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 pt-8 pb-4 w-full h-[320px]">
        {chartData.length < 2 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-sm gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
              <TrendingUp size={20} className="text-slate-600" />
            </div>
            <span>Need at least 2 entries for <strong>this specific metric</strong> to chart progress.</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#ffffff0a" vertical={false} />
              <XAxis 
                dataKey="fullLabel" 
                stroke="#475569" 
                fontSize={11} 
                tickMargin={12}
                axisLine={false} 
                tickLine={false} 
                fontWeight={500}
                tickFormatter={(val) => val.replace(/ V\d+$/, '')}
              />
              <YAxis 
                stroke="#475569" 
                fontSize={11} 
                tickMargin={12} 
                axisLine={false} 
                tickLine={false}
                fontWeight={500}
                domain={finalDomain}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.7)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '14px',
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
                  padding: '12px 16px'
                }}
                itemStyle={{ color: '#bae6fd', fontWeight: 700, fontSize: '15px' }}
                labelStyle={{ color: '#94a3b8', marginBottom: '6px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                cursor={{ stroke: 'rgba(56, 189, 248, 0.15)', strokeWidth: 32 }}
                formatter={(value: any, name: any, props: any) => {
                   return [`${value}${yAxisMode === 'combined_percent' && value !== undefined ? '%' : ''}`, props.payload?.dataLabel || name]
                }}
                labelFormatter={(label, payload) => {
                  return payload && payload[0] ? payload[0].payload.fullLabel : label
                }}
              />
              <Line 
                type="linear" 
                dataKey="value" 
                stroke="#38bdf8" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#0f172a', stroke: '#38bdf8', strokeWidth: 2.5 }}
                activeDot={{ r: 6, fill: '#38bdf8', stroke: '#bae6fd', strokeWidth: 0, style: { filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.6))' } }}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </GlassCard>
  )
}
