import { useState } from 'react'
import { X, ChevronDown, Calculator } from 'lucide-react'
import { usePapersStore } from '../../stores/papersStoreNew'
import { useTimerStore } from '../../stores/timerStore'
import type { SubjectPaperConfig, SessionType } from '../../stores/papersStoreNew'

interface AddEntryModalProps {
  isOpen: boolean
  onClose: () => void
  config: SubjectPaperConfig
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 20 }, (_, i) => CURRENT_YEAR - i)

const SESSIONS: { value: SessionType; label: string }[] = [
  { value: 'May/Jun', label: 'Summer' },
  { value: 'Oct/Nov', label: 'Winter' },
  { value: 'Feb/Mar', label: 'Spring' },
]

export function AddEntryModal({ isOpen, onClose, config }: AddEntryModalProps) {
  const { addEntry } = usePapersStore()
  const { subjects } = useTimerStore()
  
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

  const subjectDetails = subjects.find(s => s.id === config.subject_id)
  const subjectCode = subjectDetails?.code

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
    setFormData(prev => ({
      ...prev,
      variant: '1',
      marks: '',
    }))
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#09090b]/80 backdrop-blur-md transition-opacity">
      <div className="w-full max-w-md bg-[#09090b] border border-white/10 rounded-[24px] shadow-2xl overflow-hidden flex flex-col animate-fade-slide">
        
        <div className="flex justify-between items-center p-6 pb-5">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Log Paper Attempt</h3>
            <p className="text-sm font-medium text-sky-400 mt-0.5">
              {config.subject_name}{subjectCode ? ` ${subjectCode}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"><X size={16} /></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 pb-6 flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Year */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-400 ml-1">Exam Year</label>
                <div className="relative">
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3.5 text-[0.95rem] text-slate-200 outline-none focus:border-sky-500/50 appearance-none font-medium transition-colors"
                  >
                    {YEARS.map(year => (
                      <option key={year} value={year} className="bg-[#09090b]">{year}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Variant */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-400 ml-1">Variant</label>
                <div className="flex p-1 bg-white/[0.03] rounded-xl border border-white/5 h-[50px]">
                  {['1', '2', '3'].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, variant: v }))}
                      className={`flex-1 text-sm font-semibold rounded-lg transition-all ${
                        formData.variant === v
                          ? 'bg-white/10 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      V{v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Session */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-400 ml-1">Season</label>
              <div className="flex p-1 bg-white/[0.03] rounded-xl border border-white/5">
                {SESSIONS.map(session => (
                  <button
                    key={session.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, session: session.value }))}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                      formData.session === session.value
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    {session.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Paper Selection — only show when multiple papers */}
            {paperConfigs.length > 1 && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-400 ml-1">Paper</label>
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${paperConfigs.length}, 1fr)` }}>
                  {paperConfigs.map(pc => (
                    <button
                      key={pc.paper}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, selectedPaper: pc.paper }))}
                      className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                        formData.selectedPaper === pc.paper
                          ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                          : 'bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:bg-white/[0.06]'
                      }`}
                    >
                      Paper {pc.paper}
                      <span className="block text-xs font-normal opacity-60">/{pc.max_marks}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Marks */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-400 ml-1">Score Obtained</label>
              <div className="relative group">
                <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" size={18} />
                <input
                  type="number"
                  value={formData.marks}
                  onChange={(e) => setFormData(prev => ({ ...prev, marks: e.target.value }))}
                  placeholder="0"
                  max={maxMarks}
                  min={0}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-20 py-3.5 text-[0.95rem] font-semibold text-white outline-none focus:border-sky-500/50 transition-colors placeholder:text-slate-600"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">/ {maxMarks} marks</span>
              </div>
            </div>
          </div>

          <div className="p-6 pt-0 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl font-semibold text-[0.9rem] bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3.5 rounded-xl font-semibold text-[0.9rem] bg-sky-500 text-[#09090b] hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
