import { useState, useEffect } from 'react'
import { X, Save, Plus, Trash2 } from 'lucide-react'
import { usePapersStore } from '../../stores/papersStoreNew'
import type { SubjectPaperConfig, PaperConfig } from '../../stores/papersStoreNew'

interface EditConfigModalProps {
  isOpen: boolean
  onClose: () => void
  config: SubjectPaperConfig
}

const PAPER_OPTIONS = ['1', '2', '3', '4', '5', '6']

export function EditConfigModal({ isOpen, onClose, config }: EditConfigModalProps) {
  const { updateSubjectConfig } = usePapersStore()
  
  const [papers, setPapers] = useState<PaperConfig[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load config when modal opens
  useEffect(() => {
    if (isOpen && config) {
      setPapers([...config.papers])
    }
  }, [isOpen, config])

  const addPaper = () => {
    if (papers.length >= 5) return
    const usedPapers = papers.map(p => p.paper)
    const nextPaper = PAPER_OPTIONS.find(p => !usedPapers.includes(p))
    if (nextPaper) {
      setPapers([...papers, { paper: nextPaper, max_marks: 75 }])
    }
  }

  const removePaper = (index: number) => {
    if (papers.length <= 1) return
    setPapers(papers.filter((_, i) => i !== index))
  }

  const updatePaper = (index: number, field: 'paper' | 'max_marks', value: string | number) => {
    setPapers(papers.map((p, i) => 
      i === index ? { ...p, [field]: value } : p
    ))
  }

  const getAvailablePapers = (currentPaper: string) => {
    const usedPapers = papers.map(p => p.paper).filter(p => p !== currentPaper)
    return PAPER_OPTIONS.filter(p => !usedPapers.includes(p))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (papers.length === 0) return

    setIsSubmitting(true)
    await updateSubjectConfig(config.id, papers)
    setIsSubmitting(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg mx-4 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Papers</h2>
            <p className="text-sm text-gray-500 mt-1">{config.subject_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Papers Configuration */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Papers ({papers.length}/5)
              </label>
              {papers.length < 5 && (
                <button
                  type="button"
                  onClick={addPaper}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Paper
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              {papers.map((paper, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl"
                >
                  <select
                    value={paper.paper}
                    onChange={(e) => updatePaper(index, 'paper', e.target.value)}
                    className="w-28 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  >
                    {getAvailablePapers(paper.paper).map(p => (
                      <option key={p} value={p}>Paper {p}</option>
                    ))}
                  </select>
                  
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm text-gray-500">Max:</span>
                    <input
                      type="number"
                      value={paper.max_marks}
                      onChange={(e) => updatePaper(index, 'max_marks', parseInt(e.target.value) || 0)}
                      min={1}
                      max={200}
                      className="w-20 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-center"
                    />
                    <span className="text-sm text-gray-500">marks</span>
                  </div>
                  
                  {papers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePaper(index)}
                      className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Note: Removing a paper won't delete existing entries for that paper.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || papers.length === 0}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
