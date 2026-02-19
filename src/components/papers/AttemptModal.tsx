import { useState } from 'react'
import { X, Save } from 'lucide-react'
import { usePapersStore } from '../../stores/papersStore'
import type { Paper, PaperStatus } from '../../stores/papersStore'

interface AttemptModalProps {
  isOpen: boolean
  onClose: () => void
  paper: Paper | null
  mode: 'add' | 'edit'
  attemptId?: string
}

export function AttemptModal({ isOpen, onClose, paper, mode, attemptId }: AttemptModalProps) {
  const { addAttempt, updateAttempt } = usePapersStore()
  
  const existingAttempt = attemptId 
    ? paper?.attempts?.find(a => a.id === attemptId) 
    : null

  const [formData, setFormData] = useState({
    status: existingAttempt?.status || 'solved' as PaperStatus,
    marks_obtained: existingAttempt?.marks_obtained?.toString() || '',
    time_taken_minutes: existingAttempt?.time_taken_minutes?.toString() || '',
    notes: existingAttempt?.notes || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paper) return

    setIsSubmitting(true)

    const attemptData = {
      status: formData.status,
      marks_obtained: formData.marks_obtained ? parseInt(formData.marks_obtained) : undefined,
      time_taken_minutes: formData.time_taken_minutes ? parseInt(formData.time_taken_minutes) : undefined,
      notes: formData.notes || undefined,
    }

    if (mode === 'edit' && attemptId) {
      await updateAttempt(attemptId, attemptData)
    } else {
      await addAttempt({
        paper_id: paper.id,
        ...attemptData,
      })
    }

    setIsSubmitting(false)
    onClose()
  }

  if (!isOpen || !paper) return null

  const percentage = formData.marks_obtained && paper.max_marks
    ? Math.round((parseInt(formData.marks_obtained) / paper.max_marks) * 100)
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg mx-4 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {mode === 'edit' ? 'Edit Attempt' : 'Log Attempt'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{paper.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['unsolved', 'in_progress', 'solved'] as PaperStatus[]).map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, status }))}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    formData.status === status
                      ? status === 'solved'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-2 ring-green-500'
                        : status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 ring-2 ring-yellow-500'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 ring-2 ring-gray-500'
                      : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {status === 'unsolved' ? 'Unsolved' : status === 'in_progress' ? 'In Progress' : 'Solved'}
                </button>
              ))}
            </div>
          </div>

          {/* Marks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Marks Obtained {paper.max_marks && `(out of ${paper.max_marks})`}
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.marks_obtained}
                onChange={(e) => setFormData(prev => ({ ...prev, marks_obtained: e.target.value }))}
                placeholder="Enter marks"
                max={paper.max_marks || undefined}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {percentage !== null && (
                <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium ${
                  percentage >= 80 ? 'text-green-600' :
                  percentage >= 60 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {percentage}%
                </div>
              )}
            </div>
          </div>

          {/* Time Taken */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time Taken (minutes)
            </label>
            <input
              type="number"
              value={formData.time_taken_minutes}
              onChange={(e) => setFormData(prev => ({ ...prev, time_taken_minutes: e.target.value }))}
              placeholder="e.g., 90"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any notes about this attempt..."
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {mode === 'edit' ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
