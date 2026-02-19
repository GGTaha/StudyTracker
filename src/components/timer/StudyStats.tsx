import { useState } from 'react'
import { Clock, TrendingUp, Flame, ChevronDown, History } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface StudyStatsProps {
  todayTotal: number
  weeklyData: { day: string; seconds: number; date?: string }[]
  subjectBreakdown: { name: string; seconds: number; color: string }[]
  onDayClick?: (day: string) => void
  allTimeTotal?: number
  getDataForRange?: (days: number) => { day: string; seconds: number; date?: string }[]
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

function formatDurationLong(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours} hr ${minutes} min`
  } else if (minutes > 0) {
    return `${minutes} min ${secs} sec`
  }
  return `${secs} seconds`
}

export function StudyStats({ todayTotal, weeklyData, subjectBreakdown, onDayClick, allTimeTotal = 0, getDataForRange }: StudyStatsProps) {
  const [selectedRange, setSelectedRange] = useState<7 | 14 | 30>(7)
  const [showRangeDropdown, setShowRangeDropdown] = useState(false)
  
  // Get data for selected range or use weekly data as default
  const displayData = getDataForRange ? getDataForRange(selectedRange) : weeklyData
  const rangeTotal = displayData.reduce((acc, d) => acc + d.seconds, 0)
  
  // Calculate streak (consecutive days with study time)
  let streak = 0
  for (let i = weeklyData.length - 1; i >= 0; i--) {
    if (weeklyData[i].seconds > 0) {
      streak++
    } else if (i < weeklyData.length - 1) {
      // Allow today to be 0 if it's early
      break
    }
  }

  // Format display data for chart (convert to hours)
  const chartData = displayData.map(d => ({
    day: d.day,
    hours: Math.round((d.seconds / 3600) * 100) / 100,
    seconds: d.seconds,
    date: d.date,
  }))

  const handleBarClick = (data: any) => {
    if (onDayClick && data?.date) {
      onDayClick(data.date)
    }
  }

  const rangeLabels: Record<number, string> = {
    7: 'Last 7 days',
    14: 'Last 14 days',
    30: 'Last 30 days',
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Today</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatDuration(todayTotal)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{rangeLabels[selectedRange]}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatDuration(rangeTotal)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Streak</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {streak} days
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <History className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">All Time</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatDuration(allTimeTotal)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart with Date Range */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Activity Overview
            </h4>
            <div className="relative">
              <button
                onClick={() => setShowRangeDropdown(!showRangeDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {rangeLabels[selectedRange]}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showRangeDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg z-10 py-1 min-w-[120px]">
                  {([7, 14, 30] as const).map(range => (
                    <button
                      key={range}
                      onClick={() => {
                        setSelectedRange(range)
                        setShowRangeDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs ${
                        selectedRange === range 
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {rangeLabels[range]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: selectedRange > 7 ? 10 : 12 }}
                  interval={selectedRange > 14 ? 2 : 0}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(value) => `${value}h`}
                />
                <Tooltip 
                  formatter={(_value, _name, props) => [
                    formatDurationLong((props as any).payload.seconds),
                    'Study Time'
                  ]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar 
                  dataKey="hours" 
                  fill="#3B82F6" 
                  radius={[4, 4, 0, 0]}
                  cursor={onDayClick ? 'pointer' : 'default'}
                  onClick={(_data, _index, event) => {
                    const payload = (event as any)?.payload
                    if (payload) handleBarClick(payload)
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Breakdown Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Subject Breakdown
          </h4>
          {subjectBreakdown.length > 0 ? (
            <div className="h-48 flex items-center">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subjectBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="seconds"
                      nameKey="name"
                    >
                      {subjectBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [formatDurationLong(value as number), 'Study Time']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-2">
                {subjectBreakdown.slice(0, 5).map(subject => (
                  <div key={subject.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: subject.color }}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">
                      {subject.name}
                    </span>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {formatDuration(subject.seconds)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              No data yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
