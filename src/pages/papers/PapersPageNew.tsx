import { useEffect, useState } from 'react'
import { Plus, Settings, Loader2, BookOpen, Users, Layers, Check } from 'lucide-react'
import { usePapersStore } from '../../stores/papersStoreNew'
import { useTimerStore } from '../../stores/timerStore'
import { useFriendsStore } from '../../stores/friendsStore'
import { GlassCard } from '../../components/ui/GlassCard'
import { PapersTable } from '../../components/papers/PapersTable'
import { AddEntryModal } from '../../components/papers/AddEntryModal'
import { AddSubjectModal } from '../../components/papers/AddSubjectModal'
import { EditConfigModal } from '../../components/papers/EditConfigModal'
import { CompareFriendsModal } from '../../components/papers/CompareFriendsModal'
import { PaperProgressGraph } from '../../components/papers/PaperProgressGraph'

export function PapersPage() {
  const { 
    isLoading, 
    initialize, 
    configs,
    selectedConfigId, 
    setSelectedConfig,
    getSubjectStats,
  } = usePapersStore()
  
  const { subjects, initialize: initTimer, isInitialized: timerInitialized } = useTimerStore()
  const { friends, initialize: initFriends, isInitialized: friendsInitialized } = useFriendsStore()
  
  const [showAddEntry, setShowAddEntry] = useState(false)
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [showEditConfig, setShowEditConfig] = useState(false)
  const [showCompareFriends, setShowCompareFriends] = useState(false)

  useEffect(() => {
    initialize()
    if (!timerInitialized) initTimer()
    if (!friendsInitialized) initFriends()
  }, [initialize, initTimer, timerInitialized, initFriends, friendsInitialized])

  // Auto-select first subject if none selected
  useEffect(() => {
    if (!selectedConfigId && configs.length > 0) {
      setSelectedConfig(configs[0].id)
    }
  }, [configs, selectedConfigId, setSelectedConfig])

  const selectedConfig = configs.find(c => c.id === selectedConfigId)
  const stats = selectedConfigId ? getSubjectStats(selectedConfigId) : null
  const friendsWithPapers = friends.filter(f => f.privacy_papers)

  // Get subject details (code, exam_board) from timer store
  const subjectDetails = selectedConfig 
    ? subjects.find(s => s.id === selectedConfig.subject_id) 
    : null
  const subjectCode = subjectDetails?.code
  const examBoard = subjectDetails?.exam_board

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-10 animate-fade-slide">
      
      {/* 1. Subject Navigation */}
      <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar pb-1">
        {configs.map(config => (
          <button
            key={config.id}
            onClick={() => setSelectedConfig(config.id)}
            className={`px-5 py-2.5 rounded-xl text-[0.9rem] font-semibold transition-all whitespace-nowrap border ${
              selectedConfigId === config.id
                ? 'bg-sky-500/15 text-sky-400 border-sky-500/20'
                : 'bg-white/[0.02] text-slate-400 border-white/5 hover:bg-white/[0.05] hover:text-slate-200'
            }`}
          >
            {config.subject_name}
          </button>
        ))}
        <button
          onClick={() => setShowAddSubject(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.9rem] font-medium border border-dashed border-white/20 text-slate-400 hover:text-white hover:border-white/40 hover:bg-white/[0.02] transition-colors whitespace-nowrap"
        >
          <Plus size={16} /> Add Subject
        </button>
      </div>

      {/* Selected Subject Content */}
      {selectedConfig ? (
        <div className="flex flex-col gap-6">
          {/* 2. Main Hero Card */}
          <GlassCard className="!p-5 md:!p-8 bg-gradient-to-br from-sky-500/[0.02] to-transparent">
            <div className="flex flex-col gap-5 md:gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-inner">
                  <BookOpen size={26} />
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-[1.25rem] md:text-[1.75rem] font-bold text-white tracking-tight">
                    {selectedConfig.subject_name}
                    {subjectCode && <span className="text-slate-400 font-semibold"> ({subjectCode})</span>}
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                    {stats && stats.totalEntries > 0 && (
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <Check size={14} /> {stats.totalEntries} Papers Logged
                      </span>
                    )}
                    {examBoard && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                        <span>{examBoard}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {stats && stats.averagePercentage > 0 && (
                  <div className="text-right px-5 border-r border-white/10">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Avg Score</p>
                    <p className="text-[1.25rem] md:text-[1.75rem] font-bold text-emerald-400 tracking-tight">{stats.averagePercentage.toFixed(1)}%</p>
                  </div>
                )}
                
                {friendsWithPapers.length > 0 && (
                  <button
                    onClick={() => setShowCompareFriends(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 transition-colors font-semibold text-[0.9rem]"
                  >
                    <Users size={16} /> Compare
                  </button>
                )}
                <button
                  onClick={() => setShowAddEntry(true)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-500 text-[#09090b] hover:bg-sky-400 transition-colors font-semibold text-[0.9rem] shadow-[0_0_15px_rgba(56,189,248,0.15)]"
                >
                  <Plus size={18} strokeWidth={2.5} /> Log Paper
                </button>
                <button
                  onClick={() => setShowEditConfig(true)}
                  className="p-2.5 rounded-xl bg-white/[0.02] text-slate-400 hover:text-white border border-transparent hover:border-white/10 transition-colors"
                  title="Edit papers config"
                >
                  <Settings size={18} />
                </button>
              </div>
            </div>
          </GlassCard>

          {/* 3. Entry Logs List */}
          <GlassCard className="!p-0 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <h3 className="text-[1.05rem] font-semibold text-slate-50 flex items-center gap-2">
                <Layers size={18} className="text-slate-400" />
                Attempt Log
              </h3>
            </div>
            <div className="flex flex-col p-6 pt-2 gap-3">
              <PapersTable 
                configId={selectedConfigId!} 
                onAddEntry={() => setShowAddEntry(true)}
              />
            </div>
          </GlassCard>

          {/* 4. Progress Graph */}
          <PaperProgressGraph key={selectedConfigId} configId={selectedConfigId!} />
        </div>
      ) : (
        /* Empty State */
        <GlassCard className="text-center !py-16">
          <div className="mx-auto w-16 h-16 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center justify-center mb-5">
            <BookOpen size={28} className="text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-50 mb-2">No subjects yet</h3>
          <p className="text-slate-500 text-sm mb-8 max-w-md mx-auto">
            Add a subject to start tracking your past paper attempts. Configure which papers you take and their max marks.
          </p>
          <button
            onClick={() => setShowAddSubject(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 text-[#09090b] rounded-xl font-semibold hover:bg-sky-400 shadow-[0_5px_20px_rgba(56,189,248,0.2)] transition-all duration-300"
          >
            <Plus size={18} />
            Add Your First Subject
          </button>
        </GlassCard>
      )}

      {/* Modals */}
      <AddSubjectModal 
        isOpen={showAddSubject} 
        onClose={() => setShowAddSubject(false)} 
      />
      {selectedConfig && (
        <>
          <AddEntryModal
            isOpen={showAddEntry}
            onClose={() => setShowAddEntry(false)}
            config={selectedConfig}
          />
          <EditConfigModal
            isOpen={showEditConfig}
            onClose={() => setShowEditConfig(false)}
            config={selectedConfig}
          />
          <CompareFriendsModal
            isOpen={showCompareFriends}
            onClose={() => setShowCompareFriends(false)}
            config={selectedConfig}
            friends={friendsWithPapers}
          />
        </>
      )}
    </div>
  )
}
