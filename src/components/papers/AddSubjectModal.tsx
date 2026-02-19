import { useState } from 'react'
import { X, Trash2, ChevronDown } from 'lucide-react'
import { usePapersStore } from '../../stores/papersStoreNew'
import { useTimerStore } from '../../stores/timerStore'
import type { PaperConfig } from '../../stores/papersStoreNew'

interface AddSubjectModalProps {
  isOpen: boolean
  onClose: () => void
}

const PAPER_OPTIONS = ['1', '2', '3', '4', '5', '6']

export function AddSubjectModal({ isOpen, onClose }: AddSubjectModalProps) {
  const { addSubjectConfig } = usePapersStore()
  const { subjects, addSubject: addTimerSubject } = useTimerStore()
  
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [newSubjectName, setNewSubjectName] = useState('')
  const [showNewSubject, setShowNewSubject] = useState(false)
  const [papers, setPapers] = useState<PaperConfig[]>([
    { paper: '1', max_marks: 75 }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) return
    await addTimerSubject(newSubjectName.trim())
    setNewSubjectName('')
    setShowNewSubject(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSubjectId || papers.length === 0) return
    
    const subject = subjects.find(s => s.id === selectedSubjectId)
    if (!subject) return

    setIsSubmitting(true)
    
    await addSubjectConfig({
      subject_id: selectedSubjectId,
      subject_name: subject.name,
      papers,
    })

    setIsSubmitting(false)
    setSelectedSubjectId('')
    setPapers([{ paper: '1', max_marks: 75 }])
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
            <h3 className="text-lg font-semibold text-white tracking-tight">Configure Subject</h3>
            <p className="text-xs font-medium text-slate-400 mt-1">Set up paper layout and max marks</p>
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
          {/* Subject Selection */}
          <div>
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-medium text-slate-400">Subject</label>
              {!showNewSubject && (
                <button
                  type="button"
                  onClick={() => setShowNewSubject(true)}
                  className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                >
                  + Create new
                </button>
              )}
            </div>
            {showNewSubject ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="New subject name"
                  className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-sky-500/50 placeholder:text-slate-600 font-medium transition-colors"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreateSubject}
                  className="px-4 py-3 bg-sky-500 text-[#09090b] font-semibold rounded-xl hover:bg-sky-400 transition-colors text-sm"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewSubject(false)}
                  className="px-3 py-3 text-slate-500 hover:bg-white/5 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-sky-500/50 appearance-none font-medium transition-colors"
                >
                  <option value="" className="bg-[#09090b]">Select a subject</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id} className="bg-[#09090b]">
                      {subject.name} {subject.code ? `(${subject.code})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            )}
          </div>

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
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-sm font-medium text-slate-200 outline-none focus:border-sky-500/50 appearance-none cursor-pointer transition-colors"
                  >
                    {getAvailablePapers(paper.paper).map(p => (
                      <option key={p} value={p} className="bg-[#09090b]">Paper {p}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
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
              Minimum 1 paper, maximum 5 papers per subject.
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
              disabled={isSubmitting || !selectedSubjectId || papers.length === 0}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-sky-500 text-[#09090b] hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
