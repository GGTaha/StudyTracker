import { useEffect, useState } from 'react'
import { Plus, Loader2, FileText } from 'lucide-react'
import { usePapersStore } from '../../stores/papersStore'
import { useTimerStore } from '../../stores/timerStore'
import { 
  AddPaperModal, 
  AttemptModal, 
  PaperCard, 
  PaperFiltersBar, 
  PaperStats 
} from '../../components/papers'
import type { Paper } from '../../stores/papersStore'

export function PapersPage() {
  const { 
    isLoading, 
    filters, 
    initialize, 
    setFilters, 
    resetFilters, 
    getFilteredPapers, 
    getStats, 
    getYears,
    deletePaper,
    deleteAttempt,
  } = usePapersStore()
  
  const { subjects, initialize: initTimer, isInitialized: timerInitialized } = useTimerStore()
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAttemptModal, setShowAttemptModal] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)
  const [attemptMode, setAttemptMode] = useState<'add' | 'edit'>('add')
  const [editAttemptId, setEditAttemptId] = useState<string | undefined>()

  // Initialize stores
  useEffect(() => {
    initialize()
    if (!timerInitialized) {
      initTimer()
    }
  }, [initialize, initTimer, timerInitialized])

  const filteredPapers = getFilteredPapers()
  const stats = getStats()
  const years = getYears()

  const handleAddAttempt = (paper: Paper) => {
    setSelectedPaper(paper)
    setAttemptMode('add')
    setEditAttemptId(undefined)
    setShowAttemptModal(true)
  }

  const handleEditAttempt = (paper: Paper, attemptId: string) => {
    setSelectedPaper(paper)
    setAttemptMode('edit')
    setEditAttemptId(attemptId)
    setShowAttemptModal(true)
  }

  const handleDeletePaper = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this paper and all its attempts?')) {
      await deletePaper(id)
    }
  }

  const handleDeleteAttempt = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this attempt?')) {
      await deleteAttempt(id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Past Papers</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Track and organize your past paper practice
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Paper
        </button>
      </div>

      {/* Stats */}
      <PaperStats {...stats} />

      {/* Filters */}
      <PaperFiltersBar
        filters={filters}
        subjects={subjects}
        years={years}
        onFilterChange={setFilters}
        onReset={resetFilters}
      />

      {/* Papers Grid */}
      {filteredPapers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No papers found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {stats.total === 0 
              ? "Get started by adding your first past paper."
              : "Try adjusting your filters to see more papers."}
          </p>
          {stats.total === 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Paper
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPapers.map(paper => (
            <PaperCard
              key={paper.id}
              paper={paper}
              onAddAttempt={handleAddAttempt}
              onEditAttempt={handleEditAttempt}
              onDeletePaper={handleDeletePaper}
              onDeleteAttempt={handleDeleteAttempt}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AddPaperModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        subjects={subjects}
      />

      <AttemptModal
        isOpen={showAttemptModal}
        onClose={() => {
          setShowAttemptModal(false)
          setSelectedPaper(null)
        }}
        paper={selectedPaper}
        mode={attemptMode}
        attemptId={editAttemptId}
      />
    </div>
  )
}
