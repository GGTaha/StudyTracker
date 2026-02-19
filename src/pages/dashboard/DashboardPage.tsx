import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useTimerStore } from '../../stores/timerStore'
import { Timer, FileText, Users, TrendingUp, Clock, Target, Play } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { formatDistanceToNow } from 'date-fns'

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

function formatDurationShort(seconds: number): string {
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

export function DashboardPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { 
    sessions, 
    isRunning,
    initialize, 
    getTodayTotal, 
    getWeeklyData 
  } = useTimerStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  const todayTotal = getTodayTotal()
  const weeklyData = getWeeklyData()
  const weekTotal = weeklyData.reduce((acc, d) => acc + d.seconds, 0)
  const completedSessions = sessions.filter(s => s.ended_at !== null)

  const stats = [
    {
      title: 'Study Time Today',
      value: formatDuration(todayTotal),
      icon: Clock,
      color: 'bg-blue-500',
    },
    {
      title: 'Weekly Study Time',
      value: formatDuration(weekTotal),
      icon: Timer,
      color: 'bg-green-500',
    },
    {
      title: 'Papers Solved',
      value: '0',
      icon: FileText,
      color: 'bg-purple-500',
    },
    {
      title: 'Friends',
      value: '0',
      icon: Users,
      color: 'bg-orange-500',
    },
  ]

  // Format weekly data for chart
  const chartData = weeklyData.map(d => ({
    day: d.day,
    hours: Math.round((d.seconds / 3600) * 100) / 100,
    seconds: d.seconds,
  }))

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">
          Welcome back, {profile?.display_name || 'Student'}! 👋
        </h1>
        <p className="text-blue-100 mt-1">
          {isRunning 
            ? "You're currently studying. Keep up the great work!"
            : "Ready to continue your study journey? Let's make today productive."
          }
        </p>
        <div className="flex gap-4 mt-4">
          <button 
            onClick={() => navigate('/timer')}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Play className="w-4 h-4" fill="currentColor" />
                View Timer
              </>
            ) : (
              <>
                <Timer className="w-4 h-4" />
                Start Studying
              </>
            )}
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-400 transition-colors flex items-center gap-2">
            <Target className="w-4 h-4" />
            Set Goals
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} p-2.5 rounded-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/timer')}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Timer className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">
                  {isRunning ? 'View Active Session' : 'Start Timer'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isRunning ? 'Continue your study session' : 'Begin a study session'}
                </p>
              </div>
            </button>
            <button 
              onClick={() => navigate('/papers')}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Log Paper</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Record a paper attempt</p>
              </div>
            </button>
            <button 
              onClick={() => navigate('/friends')}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Add Friend</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Invite a study buddy</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          {completedSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400">No recent activity</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Start studying to see your activity here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedSessions.slice(0, 5).map(session => (
                <div key={session.id} className="flex items-center gap-3 p-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: session.subject?.color || '#9CA3AF' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {session.subject?.name || 'Study session'}
                      {session.tag && (
                        <span className="ml-2 text-xs text-gray-500">({session.tag.name})</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDurationShort(session.duration_seconds || 0)} • {formatDistanceToNow(new Date(session.started_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Study Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Weekly Study Overview
        </h2>
        {weekTotal === 0 ? (
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                Study data will appear here once you start logging sessions
              </p>
            </div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(value) => `${value}h`}
                />
                <Tooltip 
                  formatter={(_value, _name, props) => [
                    formatDurationShort((props as any).payload.seconds),
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
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
