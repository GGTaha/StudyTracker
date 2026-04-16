import { useState, useEffect, useMemo } from 'react'
import { ResponsiveContainer, LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Activity, ChevronDown, BarChart2, LineChart as LineChartIcon, Loader2 } from 'lucide-react'
import { useFriendsStore } from '../../stores/friendsStore'
import { usePapersStore } from '../../stores/papersStoreNew'
import type { SubjectPaperConfig, SessionType, PaperEntry } from '../../stores/papersStoreNew'
import { GlassCard } from '../ui/GlassCard'

export function FriendComparisonWidget() {
  const { friends, getFriendPaperConfigs, getFriendPaperEntries } = useFriendsStore()
  const { configs: myConfigs, entries: myEntries } = usePapersStore()

  const [selectedFriendId, setSelectedFriendId] = useState<string>('')
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>('')
  const [metricMode, setMetricMode] = useState<string>('combined_percent')
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')

  const [isLoading, setIsLoading] = useState(false)
  const [friendConfigs, setFriendConfigs] = useState<SubjectPaperConfig[]>([])
  const [friendEntries, setFriendEntries] = useState<PaperEntry[]>([])

  // Automatically select first friend if not set
  useEffect(() => {
    if (friends.length > 0 && !selectedFriendId) {
      setSelectedFriendId(friends[0].id)
    }
  }, [friends, selectedFriendId])

  // Fetch Friend Data on selection
  useEffect(() => {
    if (!selectedFriendId) return

    const fetchData = async () => {
      setIsLoading(true)
      const fetchedConfigs = await getFriendPaperConfigs(selectedFriendId)
      setFriendConfigs(fetchedConfigs)
      
      // Auto-select common subject if none selected or if previously selected is no longer valid
      const common = myConfigs.filter(mc => 
        fetchedConfigs.some(fc => fc.subject_name.toLowerCase() === mc.subject_name.toLowerCase())
      )
      
      if (common.length > 0) {
        if (!selectedSubjectName || !common.some(c => c.subject_name === selectedSubjectName)) {
          setSelectedSubjectName(common[0].subject_name)
        }
      } else {
        setSelectedSubjectName('')
      }
      setIsLoading(false)
    }
    
    fetchData()
  }, [selectedFriendId, getFriendPaperConfigs, myConfigs])

  // Fetch entries when both friend and subject are set
  useEffect(() => {
    if (!selectedFriendId || !selectedSubjectName) {
      setFriendEntries([])
      return
    }

    const fetchEntries = async () => {
      setIsLoading(true)
      const friendTargetConfig = friendConfigs.find(c => c.subject_name.toLowerCase() === selectedSubjectName.toLowerCase())
      if (friendTargetConfig) {
        const fetchedEntries = await getFriendPaperEntries(selectedFriendId, friendTargetConfig.subject_id)
        setFriendEntries(fetchedEntries)
      } else {
        setFriendEntries([])
      }
      setIsLoading(false)
    }

    fetchEntries()
  }, [selectedFriendId, selectedSubjectName, friendConfigs, getFriendPaperEntries])

  // Compute common subjects for dropdown
  const commonSubjects = useMemo(() => {
    return myConfigs.filter(mc => 
      friendConfigs.some(fc => fc.subject_name.toLowerCase() === mc.subject_name.toLowerCase())
    )
  }, [myConfigs, friendConfigs])

  const activeMyConfig = myConfigs.find(c => c.subject_name === selectedSubjectName)

  // Map chart data
  const chartData = useMemo(() => {
    if (!activeMyConfig) return []

    const mySubjectEntries = myEntries.filter(e => e.subject_id === activeMyConfig.subject_id)
    const paperConfigs = activeMyConfig.papers

    const getVariant = (paperCode: string): number => {
      if (paperCode.length >= 2) return parseInt(paperCode[1]) || 1
      return 1
    }

    const sessionsMap = new Map<string, { year: number; session: SessionType; variant: number }>()

    // Unify all existing sessions into Map
    const addSessions = (entries: PaperEntry[]) => {
      for (const entry of entries) {
        const variant = getVariant(entry.paper_code)
        const key = `${entry.year}-${entry.session}-V${variant}`
        if (!sessionsMap.has(key)) {
          sessionsMap.set(key, { year: entry.year, session: entry.session, variant })
        }
      }
    }
    addSessions(mySubjectEntries)
    addSessions(friendEntries)

    // Sort chronologically ascending
    const sessions = Array.from(sessionsMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      const order: Record<string, number> = { 'Feb/Mar': 0, 'May/Jun': 1, 'Oct/Nov': 2 }
      if (a.session !== b.session) return (order[a.session] || 0) - (order[b.session] || 0)
      return a.variant - b.variant
    })

    return sessions.map(({ year, session, variant }) => {
      const sessionName = (session === 'May/Jun' ? `Summer ${year}` : session === 'Feb/Mar' ? `Spring ${year}` : `Winter ${year}`)
      const fullLabel = `${sessionName} V${variant}`

      // Extract specific metric calculation
      let myValue: number | null = null
      let friendValue: number | null = null

      const getMetricValues = (entries: PaperEntry[]) => {
        const relevantEntries = entries.filter(e => 
            e.year === year && e.session === session && getVariant(e.paper_code) === variant
        )
        
        if (metricMode === 'combined_percent' || metricMode === 'combined_marks') {
          let sumMarks = 0
          let sumMax = 0
          let filledAny = false

          paperConfigs.forEach(pc => {
            const entry = relevantEntries.find(e => e.paper_code[0] === pc.paper)
            if (entry?.marks != null) {
              sumMarks += entry.marks
              sumMax += pc.max_marks
              filledAny = true
            }
          })

          if (filledAny) {
             return metricMode === 'combined_percent' && sumMax > 0 ? Math.round((sumMarks / sumMax) * 100) : sumMarks
          }
          return null
        } else if (metricMode.startsWith('paper_')) {
          const targetPaper = metricMode.split('_')[1]
          const entry = relevantEntries.find(e => e.paper_code[0] === targetPaper)
          return entry?.marks ?? null
        }
        return null
      }

      myValue = getMetricValues(mySubjectEntries)
      friendValue = getMetricValues(friendEntries)

      return {
        name: sessionName,
        fullLabel,
        myValue,
        friendValue
      }
    })
  }, [activeMyConfig, myEntries, friendEntries, metricMode])

  // Active friend info
  const activeFriend = friends.find(f => f.id === selectedFriendId)
  const friendName = activeFriend?.display_name || activeFriend?.username || 'Friend'

  // Determine bounds
  let domainMax: number | 'auto' = 'auto'
  if (metricMode === 'combined_percent') domainMax = 100
  if (metricMode.startsWith('paper_') && activeMyConfig) {
      const targetP = metricMode.split('_')[1]
      const conf = activeMyConfig.papers.find(p => p.paper === targetP)
      if (conf) domainMax = conf.max_marks
  }

  // Pre-calculate zoom domains for better layouting (mimics PaperProgressGraph defaults)
  let zoomedMin = 0
  let zoomedMax = domainMax
  
  if (chartData.length > 0) {
      const allVals = chartData.flatMap(d => [d.myValue, d.friendValue]).filter(v => v !== null) as number[]
      if (allVals.length > 0) {
          const dMin = Math.min(...allVals)
          const dMax = Math.max(...allVals)
          const range = dMax - dMin
          const pad = Math.max(Math.ceil(range * 0.2), metricMode === 'combined_percent' ? 5 : 3)
          zoomedMin = Math.max(0, dMin - pad)
          zoomedMax = domainMax === 'auto' ? dMax + pad : Math.min(domainMax as number, dMax + pad)
      }
  }

  // Common Tooltip configuration to DRY up chart render logic
  const tooltipContent = (
    <Tooltip 
      contentStyle={{ 
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '14px',
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
        padding: '12px 16px'
      }}
      labelStyle={{ color: '#94a3b8', marginBottom: '6px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
      cursor={{ fill: 'rgba(255, 255, 255, 0.05)', stroke: 'rgba(255, 255, 255, 0.05)', strokeWidth: 32 }}
      formatter={(value: any, name: any, props: any) => {
         const isPercent = metricMode === 'combined_percent' && value !== undefined
         return [`${value}${isPercent ? '%' : ''}`, props.dataKey === 'myValue' ? 'You' : friendName]
      }}
      labelFormatter={(label, payload) => {
        return payload && payload[0] ? payload[0].payload.fullLabel : label
      }}
    />
  )

  if (friends.length === 0) return null

  return (
    <GlassCard className="!p-0 overflow-hidden w-full animate-fade-slide relative">
      {isLoading && (
        <div className="absolute inset-0 bg-[#09090b]/40 backdrop-blur-sm z-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        </div>
      )}
      
      <div className="p-5 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center bg-white/[0.01] gap-4">
        <h3 className="text-[1.05rem] font-semibold text-slate-50 flex items-center gap-2">
          <Activity size={18} className="text-purple-400" />
          Progress Comparison
        </h3>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Friend Select */}
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-purple-500/50">
            <span className="text-[0.7rem] font-semibold text-slate-500 uppercase tracking-widest shrink-0">Friend</span>
            <div className="relative">
              <select
                value={selectedFriendId}
                onChange={(e) => setSelectedFriendId(e.target.value)}
                className="text-[0.8rem] bg-transparent border-0 text-slate-200 font-bold cursor-pointer p-0 pr-5 select-none appearance-none outline-none max-w-[120px] truncate"
              >
                {friends.map(f => <option key={f.id} value={f.id} className="bg-slate-900">{f.display_name || f.username}</option>)}
              </select>
              <ChevronDown size={14} className="text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Subject Select */}
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-sky-500/50">
            <span className="text-[0.7rem] font-semibold text-slate-500 uppercase tracking-widest shrink-0">Subject</span>
            <div className="relative">
              <select
                value={selectedSubjectName}
                onChange={(e) => {
                  setSelectedSubjectName(e.target.value)
                  // Reset metric if changing subjects so we don't accidentally ask for paper_4 on a subject that doesn't have it
                  setMetricMode('combined_percent') 
                }}
                className="text-[0.8rem] bg-transparent border-0 text-slate-200 font-bold cursor-pointer p-0 pr-5 select-none appearance-none outline-none max-w-[150px] truncate"
                disabled={commonSubjects.length === 0}
              >
                {commonSubjects.map(s => <option key={s.id} value={s.subject_name} className="bg-slate-900">{s.subject_name}</option>)}
                {commonSubjects.length === 0 && <option disabled>No Common Subjects</option>}
              </select>
              <ChevronDown size={14} className="text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Metric Select */}
          {activeMyConfig && (
              <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-sky-500/50 hidden md:flex">
                <span className="text-[0.7rem] font-semibold text-slate-500 uppercase tracking-widest shrink-0">Metric</span>
                <div className="relative">
                  <select
                    value={metricMode}
                    onChange={(e) => setMetricMode(e.target.value)}
                    className="text-[0.8rem] bg-transparent border-0 text-slate-200 font-medium cursor-pointer p-0 pr-4 select-none appearance-none outline-none max-w-[120px] truncate"
                  >
                    <option value="combined_percent" className="bg-slate-900">Total Percentage (%)</option>
                    <option value="combined_marks" className="bg-slate-900">Total Marks</option>
                    {activeMyConfig.papers.map(p => (
                      <option key={p.paper} value={`paper_${p.paper}`} className="bg-slate-900">Paper {p.paper}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
          )}

          {/* Chart Toggle */}
          <div className="ml-auto flex p-1 bg-white/[0.03] rounded-xl border border-white/5">
            <button
               onClick={() => setChartType('line')}
               className={`p-1.5 rounded-lg transition-all ${chartType === 'line' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
               <LineChartIcon size={16} />
            </button>
            <button
               onClick={() => setChartType('bar')}
               className={`p-1.5 rounded-lg transition-all ${chartType === 'bar' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
               <BarChart2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 pt-8 pb-4 w-full h-[400px]">
        {commonSubjects.length === 0 ? (
           <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-sm gap-3">
             <Activity size={32} className="text-slate-700 mb-2" />
             <span>You don't have any matching subjects with {friendName}.</span>
             <span className="text-xs">Add common subjects to compare progress!</span>
           </div>
        ) : chartData.length === 0 ? (
           <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-sm gap-3">
             <Activity size={32} className="text-slate-700 mb-2" />
             <span>No entries found for {selectedSubjectName}.</span>
           </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#ffffff0a" vertical={false} />
                <XAxis dataKey="fullLabel" stroke="#475569" fontSize={11} tickMargin={12} axisLine={false} tickLine={false} fontWeight={500} tickFormatter={(v) => v.replace(/ V\d+$/, '')} />
                <YAxis domain={[zoomedMin, zoomedMax]} stroke="#475569" fontSize={11} tickMargin={12} axisLine={false} tickLine={false} fontWeight={500} />
                {tooltipContent}
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 600, color: '#94a3b8' }} />
                <Line type="linear" name="You" dataKey="myValue" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, fill: '#0f172a', stroke: '#38bdf8', strokeWidth: 2.5 }} activeDot={{ r: 6, fill: '#38bdf8', stroke: '#bae6fd', strokeWidth: 0, style: { filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.6))' } }} />
                <Line type="linear" name={friendName} dataKey="friendValue" stroke="#c084fc" strokeWidth={3} dot={{ r: 4, fill: '#0f172a', stroke: '#c084fc', strokeWidth: 2.5 }} activeDot={{ r: 6, fill: '#c084fc', stroke: '#e9d5ff', strokeWidth: 0, style: { filter: 'drop-shadow(0 0 8px rgba(192, 132, 252, 0.6))' } }} connectNulls={true} />
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#ffffff0a" vertical={false} />
                <XAxis dataKey="fullLabel" stroke="#475569" fontSize={11} tickMargin={12} axisLine={false} tickLine={false} fontWeight={500} tickFormatter={(v) => v.replace(/ V\d+$/, '')} />
                <YAxis domain={[0, domainMax === 'auto' ? 'auto' : domainMax]} stroke="#475569" fontSize={11} tickMargin={12} axisLine={false} tickLine={false} fontWeight={500} />
                {tooltipContent}
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 600, color: '#94a3b8' }} />
                <Bar name="You" dataKey="myValue" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={45} />
                <Bar name={friendName} dataKey="friendValue" fill="#c084fc" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </GlassCard>
  )
}
