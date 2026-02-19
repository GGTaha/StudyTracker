import { useState, useEffect } from 'react'
import { X, Save, Trash2, ChevronDown } from 'lucide-react'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (papers.length === 0) return

    setIsSubmitting(true)
    await updateSubjectConfig(config.id, papers)
    setIsSubmitting(false)
    onClose()
  }

  if (!isOpen) return null

  const getAvailablePapers = (currentPaper: string) => {
    const usedPapers = papers.map(p => p.paper).filter(p => p !== currentPaper)
    return PAPER_OPTIONS.filter(p => !usedPapers.includes(p))
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#09090b]/80 backdrop-blur-md transition-opacity">
      <div className="w-full max-w-lg bg-[#09090b] border border-white/10 rounded-[24px] shadow-2xl overflow-hidden flex flex-col animate-fade-slide max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/[0.02]">
          <div>
            <h3 className="text-lg font-semibold text-white tracking-tight">Edit Papers</h3>
            <p className="text-xs font-medium text-slate-400 mt-1">{config.subject_name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto">
          <div className="p-6 flex flex-col gap-6">
          {/* Papers Configuration */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-end ml-1 mb-1">
              <label className="text-xs font-medium text-slate-400">
                Papers ({papers.length}/5)
              </label>
              {papers.length < 5 && (
                <button
                  type="button"
                  onClick={addPaper}
                  className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1"
                >
                  + Add Paper
                </button>
              )}
            </div>
            
            {papers.map((paper, index) => (
              <div 
                key={index}
                className="flex items-center gap-3"
              >
                <div className="relative flex-1">
                  <select
                    value={paper.paper}
                    onChange={(e) => updatePaper(index, 'paper', e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-sm font-medium text-slate-200 outline-none focus:border-sky-500/50 appearance-none cursor-pointer"
                  >
                    {getAvailablePapers(paper.paper).map(p => (
                      <option key={p} value={p} className="bg-[#09090b]">Paper {p}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
                
                <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 focus-within:border-sky-500/50 transition-colors w-28">
                  <span className="text-xs text-slate-500 font-medium">Max:</span>
                  <input
                    type="number"
                    value={paper.max_marks}
                    onChange={(e) => updatePaper(index, 'max_marks', parseInt(e.target.value) || 0)}
                    min={1}
                    max={200}
                    className="w-full bg-transparent text-sm font-semibold text-white outline-none text-right"
                  />
                </div>
                
                {papers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePaper(index)}
                    className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            
            <p className="text-[10px] text-slate-500 font-medium ml-1 mt-1">
              Note: Removing a paper won't delete existing entries for that paper.
            </p>
          </div>
          </div>

          {/* Actions */}
          <div className="p-6 pt-0 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || papers.length === 0}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-sky-500 text-[#09090b] hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
