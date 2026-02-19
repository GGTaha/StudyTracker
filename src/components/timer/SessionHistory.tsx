import { Clock, Trash2 } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import type { StudySession } from '../../stores/timerStore'

interface SessionHistoryProps {
  sessions: StudySession[]
  onDelete: (id: string) => void
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}

export function SessionHistory({ sessions, onDelete }: SessionHistoryProps) {
  // Filter only completed sessions
  const completedSessions = sessions.filter(s => s.ended_at !== null)

  if (completedSessions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Sessions
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">No sessions yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Start studying to see your sessions here
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Sessions
        </h3>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
        {completedSessions.slice(0, 20).map(session => (
          <div
            key={session.id}
            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {session.subject && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: session.subject.color }}
                    >
                      {session.subject.name}
                    </span>
                  )}
                  {session.tag && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: session.tag.color }}
                    >
                      {session.tag.name}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-sm">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatDuration(session.duration_seconds || 0)}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {format(new Date(session.started_at), 'MMM d, yyyy')} at {format(new Date(session.started_at), 'HH:mm')}
                  </span>
                  <span className="text-gray-400 hidden sm:inline">•</span>
                  <span className="text-gray-400 dark:text-gray-500 text-xs hidden sm:inline">
                    {formatDistanceToNow(new Date(session.started_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onDelete(session.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                title="Delete session"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
