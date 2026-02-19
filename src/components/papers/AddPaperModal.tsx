import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { usePapersStore } from '../../stores/papersStore'
import type { Subject } from '../../stores/timerStore'

interface AddPaperModalProps {
  isOpen: boolean
  onClose: () => void
  subjects: Subject[]
}

const SESSIONS = ['Feb/Mar', 'May/Jun', 'Oct/Nov']
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 20 }, (_, i) => CURRENT_YEAR - i)

export function AddPaperModal({ isOpen, onClose, subjects }: AddPaperModalProps) {
  const { addPaper } = usePapersStore()
  
  const [formData, setFormData] = useState({
    subject_id: '',
    name: '',
    year: '',
    session: '',
    variant: '',
    component: '',
    max_marks: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.subject_id || !formData.name) return

    setIsSubmitting(true)
    
    await addPaper({
      subject_id: formData.subject_id,
      name: formData.name,
      year: formData.year ? parseInt(formData.year) : undefined,
      session: formData.session || undefined,
      variant: formData.variant ? parseInt(formData.variant) : undefined,
      component: formData.component ? parseInt(formData.component) : undefined,
      max_marks: formData.max_marks ? parseInt(formData.max_marks) : undefined,
    })

    setIsSubmitting(false)
    setFormData({
      subject_id: '',
      name: '',
      year: '',
      session: '',
      variant: '',
      component: '',
      max_marks: '',
    })
    onClose()
  }

  // Auto-generate name based on selection
  const generateName = () => {
    const subject = subjects.find(s => s.id === formData.subject_id)
    if (!subject) return

    const parts = [subject.code || subject.name]
    if (formData.session) parts.push(formData.session)
    if (formData.year) parts.push(formData.year)
    if (formData.component) parts.push(`P${formData.component}`)
    if (formData.variant) parts.push(`V${formData.variant}`)
    
    setFormData(prev => ({ ...prev, name: parts.join(' ') }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg mx-4 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Paper</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject *
            </label>
            <select
              value={formData.subject_id}
              onChange={(e) => setFormData(prev => ({ ...prev, subject_id: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select subject</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} {subject.code && `(${subject.code})`}
                </option>
              ))}
            </select>
          </div>

          {/* Year and Session */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Year
              </label>
              <select
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select year</option>
                {YEARS.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Session
              </label>
              <select
                value={formData.session}
                onChange={(e) => setFormData(prev => ({ ...prev, session: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select session</option>
                {SESSIONS.map(session => (
                  <option key={session} value={session}>{session}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Component and Variant */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Component (Paper)
              </label>
              <select
                value={formData.component}
                onChange={(e) => setFormData(prev => ({ ...prev, component: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select</option>
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <option key={n} value={n}>Paper {n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Variant
              </label>
              <select
                value={formData.variant}
                onChange={(e) => setFormData(prev => ({ ...prev, variant: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select</option>
                {[1, 2, 3].map(n => (
                  <option key={n} value={n}>Variant {n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Max Marks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Maximum Marks
            </label>
            <input
              type="number"
              value={formData.max_marks}
              onChange={(e) => setFormData(prev => ({ ...prev, max_marks: e.target.value }))}
              placeholder="e.g., 75"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Paper Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Paper Name *
              </label>
              <button
                type="button"
                onClick={generateName}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Auto-generate
              </button>
            </div>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., 9709 May/Jun 2024 P1 V1"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
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
              disabled={isSubmitting || !formData.subject_id || !formData.name}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Paper
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
