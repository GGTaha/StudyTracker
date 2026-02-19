import { useEffect, useState } from 'react'
import { Plus, Trash2, Settings, Loader2, FileText, Percent, Users, UsersRound } from 'lucide-react'
import { usePapersStore } from '../../stores/papersStoreNew'
import { useTimerStore } from '../../stores/timerStore'
import { useFriendsStore } from '../../stores/friendsStore'
import { PapersTable } from '../../components/papers/PapersTable'
import { AddEntryModal } from '../../components/papers/AddEntryModal'
import { AddSubjectModal } from '../../components/papers/AddSubjectModal'
import { EditConfigModal } from '../../components/papers/EditConfigModal'
import { CompareFriendsModal } from '../../components/papers/CompareFriendsModal'

export function PapersPage() {
  const { 
    isLoading, 
    initialize, 
    configs,
    selectedConfigId, 
    setSelectedConfig,
    deleteSubjectConfig,
    showPercentage,
    toggleShowPercentage,
    getSubjectStats,
  } = usePapersStore()
  
  const { initialize: initTimer, isInitialized: timerInitialized } = useTimerStore()
  const { friends, initialize: initFriends, isInitialized: friendsInitialized } = useFriendsStore()
  
  const [showAddEntry, setShowAddEntry] = useState(false)
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [showEditConfig, setShowEditConfig] = useState(false)
  const [showCompareFriends, setShowCompareFriends] = useState(false)
  const [compareInitialView, setCompareInitialView] = useState<'friends' | 'all'>('friends')

  // Initialize stores
  useEffect(() => {
    initialize()
    if (!timerInitialized) {
      initTimer()
    }
    if (!friendsInitialized) {
      initFriends()
    }
  }, [initialize, initTimer, timerInitialized, initFriends, friendsInitialized])

  const selectedConfig = configs.find(c => c.id === selectedConfigId)
  const stats = selectedConfigId ? getSubjectStats(selectedConfigId) : null
  
  // Friends who have papers visible
  const friendsWithPapers = friends.filter(f => f.privacy_papers)

  const handleDeleteSubject = async () => {
    if (!selectedConfigId) return
    if (!window.confirm('Delete this subject and all its entries?')) return
    await deleteSubjectConfig(selectedConfigId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Past Papers</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track your past paper attempts</p>
        </div>
        
        {/* Percentage Toggle */}
        <button
          onClick={toggleShowPercentage}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            showPercentage
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span className="text-sm font-medium">Show %</span>
        </button>
      </div>

      {/* Subject Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {configs.map(config => (
          <button
            key={config.id}
            onClick={() => setSelectedConfig(config.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedConfigId === config.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {config.subject_name}
          </button>
        ))}
        
        {/* Add Subject Button */}
        <button
          onClick={() => setShowAddSubject(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border-2 border-dashed border-gray-300 dark:border-gray-600"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      {/* Selected Subject Content */}
      {selectedConfig ? (
        <div className="space-y-4">
          {/* Subject Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedConfig.subject_name}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span>{selectedConfig.papers.length} paper{selectedConfig.papers.length !== 1 ? 's' : ''}</span>
                    {stats && (
                      <>
                        <span>•</span>
                        <span>{stats.totalEntries} entries</span>
                        <span>•</span>
                        <span>{stats.sessionsCount} sessions</span>
                        {stats.averagePercentage > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                              {stats.averagePercentage}% avg
                            </span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {friendsWithPapers.length > 1 && (
                  <button
                    onClick={() => {
                      setCompareInitialView('all')
                      setShowCompareFriends(true)
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-colors"
                    title="Compare with all friends"
                  >
                    <UsersRound className="w-4 h-4" />
                    <span className="text-sm font-medium">Compare All</span>
                  </button>
                )}
                {friendsWithPapers.length > 0 && (
                  <button
                    onClick={() => {
                      setCompareInitialView('friends')
                      setShowCompareFriends(true)
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    title="Compare with friends"
                  >
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">Compare</span>
                  </button>
                )}
                <button
                  onClick={() => setShowEditConfig(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Edit papers config"
                >
                  <Settings className="w-5 h-5 text-gray-500" />
                </button>
                <button
                  onClick={handleDeleteSubject}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title="Delete subject"
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                </button>
                <button
                  onClick={() => setShowAddEntry(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Entry
                </button>
              </div>
            </div>
          </div>

          {/* Papers Table */}
          <PapersTable 
            configId={selectedConfigId!} 
            showPercentage={showPercentage}
          />
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border border-gray-200 dark:border-gray-700 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No subjects yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Add a subject to start tracking your past paper attempts. Configure which papers you take and their max marks.
          </p>
          <button
            onClick={() => setShowAddSubject(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Subject
          </button>
        </div>
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
            initialView={compareInitialView}
          />
        </>
      )}
    </div>
  )
}
