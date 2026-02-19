import { useState } from 'react'
import { 
  MoreVertical, 
  Trash2, 
  Edit, 
  Plus, 
  Clock, 
  CheckCircle,
  Circle,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react'
import { format } from 'date-fns'
import type { Paper, PaperAttempt } from '../../stores/papersStore'

interface PaperCardProps {
  paper: Paper
  onAddAttempt: (paper: Paper) => void
  onEditAttempt: (paper: Paper, attemptId: string) => void
  onDeletePaper: (id: string) => void
  onDeleteAttempt: (id: string) => void
}

export function PaperCard({ paper, onAddAttempt, onEditAttempt, onDeletePaper, onDeleteAttempt }: PaperCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showAttempts, setShowAttempts] = useState(false)
  
  const status = paper.latest_attempt?.status || 'unsolved'
  const hasAttempts = paper.attempts && paper.attempts.length > 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'solved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'in_progress': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'solved': return <CheckCircle className="w-4 h-4" />
      case 'in_progress': return <Loader2 className="w-4 h-4" />
      default: return <Circle className="w-4 h-4" />
    }
  }

  const percentage = paper.latest_attempt?.marks_obtained != null && paper.max_marks
    ? Math.round((paper.latest_attempt.marks_obtained / paper.max_marks) * 100)
    : null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {paper.subject && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: paper.subject.color }}
                >
                  {paper.subject.name}
                </span>
              )}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                {getStatusIcon(status)}
                {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {paper.name}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
              {paper.year && <span>{paper.year}</span>}
              {paper.session && <span>{paper.session}</span>}
              {paper.component && <span>P{paper.component}</span>}
              {paper.variant && <span>V{paper.variant}</span>}
            </div>
          </div>

          {/* Score & Menu */}
          <div className="flex items-center gap-2">
            {percentage !== null && (
              <div className={`text-right ${
                percentage >= 80 ? 'text-green-600 dark:text-green-400' :
                percentage >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                <div className="text-2xl font-bold">{percentage}%</div>
                <div className="text-xs">
                  {paper.latest_attempt?.marks_obtained}/{paper.max_marks}
                </div>
              </div>
            )}
            
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>
              
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg z-20 py-1">
                    <button
                      onClick={() => {
                        onAddAttempt(paper)
                        setShowMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Plus className="w-4 h-4" />
                      Log Attempt
                    </button>
                    <button
                      onClick={() => {
                        onDeletePaper(paper.id)
                        setShowMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Paper
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {paper.latest_attempt && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
            {paper.latest_attempt.time_taken_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {paper.latest_attempt.time_taken_minutes} min
              </div>
            )}
            <div className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              {paper.attempts?.length || 0} attempt{(paper.attempts?.length || 0) !== 1 ? 's' : ''}
            </div>
            <div className="text-xs">
              Last: {format(new Date(paper.latest_attempt.attempted_at), 'MMM d, yyyy')}
            </div>
          </div>
        )}

        {/* Log Attempt Button for unsolved */}
        {!hasAttempts && (
          <button
            onClick={() => onAddAttempt(paper)}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Log First Attempt
          </button>
        )}
      </div>

      {/* Attempts Accordion */}
      {hasAttempts && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setShowAttempts(!showAttempts)}
            className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <span>View all attempts ({paper.attempts?.length})</span>
            {showAttempts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showAttempts && (
            <div className="px-4 pb-4 space-y-2">
              {paper.attempts?.map((attempt, index) => (
                <AttemptRow 
                  key={attempt.id} 
                  attempt={attempt} 
                  maxMarks={paper.max_marks}
                  isLatest={index === 0}
                  onEdit={() => onEditAttempt(paper, attempt.id)}
                  onDelete={() => onDeleteAttempt(attempt.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface AttemptRowProps {
  attempt: PaperAttempt
  maxMarks: number | null
  isLatest: boolean
  onEdit: () => void
  onDelete: () => void
}

function AttemptRow({ attempt, maxMarks, isLatest, onEdit, onDelete }: AttemptRowProps) {
  const percentage = attempt.marks_obtained != null && maxMarks
    ? Math.round((attempt.marks_obtained / maxMarks) * 100)
    : null

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${
      isLatest ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-900'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${
          attempt.status === 'solved' ? 'bg-green-500' :
          attempt.status === 'in_progress' ? 'bg-yellow-500' :
          'bg-gray-400'
        }`} />
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {format(new Date(attempt.attempted_at), 'MMM d, yyyy')}
            {isLatest && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Latest)</span>}
          </div>
          {attempt.notes && (
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
              {attempt.notes}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {percentage !== null && (
          <span className={`text-sm font-semibold ${
            percentage >= 80 ? 'text-green-600' :
            percentage >= 60 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {percentage}%
          </span>
        )}
        {attempt.time_taken_minutes && (
          <span className="text-xs text-gray-500">{attempt.time_taken_minutes}m</span>
        )}
        <button
          onClick={onEdit}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <Edit className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 text-gray-400 hover:text-red-500"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
