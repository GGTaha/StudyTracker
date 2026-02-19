import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { usePapersStore } from '../../stores/papersStoreNew'
import type { SubjectPaperConfig, SessionType } from '../../stores/papersStoreNew'

interface AddEntryModalProps {
  isOpen: boolean
  onClose: () => void
  config: SubjectPaperConfig
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 20 }, (_, i) => CURRENT_YEAR - i)

const SESSIONS: { value: SessionType; label: string }[] = [
  { value: 'May/Jun', label: 'May/June' },
  { value: 'Feb/Mar', label: 'Feb/March' },
  { value: 'Oct/Nov', label: 'Oct/Nov' },
]

export function AddEntryModal({ isOpen, onClose, config }: AddEntryModalProps) {
  const { addEntry } = usePapersStore()
  
  const paperConfigs = config.papers || []
  const firstPaper = paperConfigs[0]

  const [formData, setFormData] = useState({
    year: CURRENT_YEAR.toString(),
    session: 'May/Jun' as SessionType,
    selectedPaper: firstPaper?.paper || '1',
    variant: '1',
    marks: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedPaperConfig = paperConfigs.find(p => p.paper === formData.selectedPaper)
  const maxMarks = selectedPaperConfig?.max_marks || 75
  const paperCode = `${formData.selectedPaper}${formData.variant}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    
    await addEntry({
      subject_id: config.subject_id,
      year: parseInt(formData.year),
      session: formData.session,
      paper_code: paperCode,
      marks: formData.marks ? parseInt(formData.marks) : null,
      max_marks: maxMarks,
    })

    setIsSubmitting(false)
    
    // Reset form but keep year and session for quick entry
    setFormData(prev => ({
      ...prev,
      variant: '1',
      marks: '',
    }))
    
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md mx-4 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Paper Entry</h2>
            <p className="text-sm text-gray-500 mt-1">{config.subject_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Year
            </label>
            <select
              value={formData.year}
              onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {YEARS.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Session */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Session
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SESSIONS.map(session => (
                <button
                  key={session.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, session: session.value }))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.session === session.value
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-2 ring-blue-500'
                      : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {session.label}
                </button>
              ))}
            </div>
          </div>

          {/* Paper Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Paper
            </label>
            <div className="flex flex-wrap gap-2">
              {paperConfigs.map(pc => (
                <button
                  key={pc.paper}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, selectedPaper: pc.paper }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.selectedPaper === pc.paper
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-2 ring-blue-500'
                      : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Paper {pc.paper}
                  <span className="block text-xs font-normal opacity-75">/{pc.max_marks}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Variant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Variant
            </label>
            <div className="flex gap-2">
              {['1', '2', '3'].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, variant: v }))}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.variant === v
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 ring-2 ring-purple-500'
                      : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  V{v}
                </button>
              ))}
            </div>
          </div>

          {/* Marks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Marks (out of {maxMarks})
            </label>
            <input
              type="number"
              value={formData.marks}
              onChange={(e) => setFormData(prev => ({ ...prev, marks: e.target.value }))}
              placeholder="Enter marks"
              max={maxMarks}
              min={0}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {formData.marks && (
              <div className="mt-1 text-sm text-gray-500">
                {Math.round((parseInt(formData.marks) / maxMarks) * 100)}%
              </div>
            )}
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
              <Plus className="w-4 h-4" />
              Add Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
