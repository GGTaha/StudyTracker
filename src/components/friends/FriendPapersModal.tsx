import { useState, useEffect } from 'react'
import { useFriendsStore } from '../../stores/friendsStore'
import type { Friend } from '../../stores/friendsStore'
import { usePapersStore } from '../../stores/papersStoreNew'
import type { SubjectPaperConfig, SessionType } from '../../stores/papersStoreNew'
import { X, FileText, ChevronDown, Users, Loader2 } from 'lucide-react'

interface FriendPapersModalProps {
  friend: Friend
  onClose: () => void
}

export function FriendPapersModal({ friend, onClose }: FriendPapersModalProps) {
  const { getFriendPaperConfigs, getFriendPaperEntries } = useFriendsStore()
  const { configs: myConfigs, entries: myEntries } = usePapersStore()
  
  const [friendConfigs, setFriendConfigs] = useState<SubjectPaperConfig[]>([])
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null)
  const [friendEntries, setFriendEntries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<'subjects' | 'entries'>('subjects')
  
  useEffect(() => {
    loadFriendConfigs()
  }, [friend.id])
  
  const loadFriendConfigs = async () => {
    setIsLoading(true)
    const configs = await getFriendPaperConfigs(friend.id)
    setFriendConfigs(configs)
    setIsLoading(false)
  }
  
  const loadFriendEntries = async (config: SubjectPaperConfig) => {
    setIsLoading(true)
    setSelectedConfigId(config.id)
    const entries = await getFriendPaperEntries(friend.id, config.subject_id)
    setFriendEntries(entries)
    setView('entries')
    setIsLoading(false)
  }
  
  const selectedConfig = friendConfigs.find(c => c.id === selectedConfigId)
  
  // Get my matching config (same subject name)
  const myMatchingConfig = myConfigs.find(c => 
    c.subject_name.toLowerCase() === selectedConfig?.subject_name.toLowerCase()
  )
  
  // Build comparison table
  const getComparisonRows = (): { 
    year: number
    session: SessionType
    variant: number
    sessionLabel: string
    friendPapers: Map<string, { marks: number | null; maxMarks: number }>
    myPapers: Map<string, { marks: number | null; maxMarks: number }>
  }[] => {
    if (!selectedConfig) return []
    
    // Extract variant from paper_code (e.g., "12" -> variant 2)
    const getVariant = (paperCode: string): number => {
      if (paperCode.length >= 2) {
        return parseInt(paperCode[1]) || 1
      }
      return 1
    }
    
    // Get all unique year/session/variant combinations
    const sessionsMap = new Map<string, { year: number; session: SessionType; variant: number }>()
    
    for (const entry of friendEntries) {
      const variant = getVariant(entry.paper_code)
      const key = `${entry.year}-${entry.session}-V${variant}`
      if (!sessionsMap.has(key)) {
        sessionsMap.set(key, { year: entry.year, session: entry.session, variant })
      }
    }
    
    // Also add my entries if I have a matching config
    if (myMatchingConfig) {
      const mySubjectEntries = myEntries.filter(e => e.subject_id === myMatchingConfig.subject_id)
      for (const entry of mySubjectEntries) {
        const variant = getVariant(entry.paper_code)
        const key = `${entry.year}-${entry.session}-V${variant}`
        if (!sessionsMap.has(key)) {
          sessionsMap.set(key, { year: entry.year, session: entry.session, variant })
        }
      }
    }
    
    // Sort sessions
    const sessions = Array.from(sessionsMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      const order = { 'Oct/Nov': 0, 'May/Jun': 1, 'Feb/Mar': 2 }
      if (a.session !== b.session) return order[a.session] - order[b.session]
      return a.variant - b.variant
    })
    
    return sessions.map(({ year, session, variant }) => {
      const sessionLabel = (session === 'May/Jun' ? `Summer ${year}` 
        : session === 'Feb/Mar' ? `Spring ${year}` 
        : `Winter ${year}`) + ` V${variant}`
      
      const friendPapers = new Map<string, { marks: number | null; maxMarks: number }>()
      const myPapers = new Map<string, { marks: number | null; maxMarks: number }>()
      
      // Friend entries - extract paper number from paper_code
      for (const entry of friendEntries) {
        const entryVariant = getVariant(entry.paper_code)
        if (entry.year === year && entry.session === session && entryVariant === variant) {
          const paperNum = entry.paper_code[0] // First digit is paper number
          friendPapers.set(paperNum, { marks: entry.marks, maxMarks: entry.max_marks })
        }
      }
      
      // My entries - extract paper number from paper_code
      if (myMatchingConfig) {
        const mySubjectEntries = myEntries.filter(e => 
          e.subject_id === myMatchingConfig.subject_id && 
          e.year === year && 
          e.session === session
        )
        for (const entry of mySubjectEntries) {
          const entryVariant = getVariant(entry.paper_code)
          if (entryVariant === variant) {
            const paperNum = entry.paper_code[0] // First digit is paper number
            myPapers.set(paperNum, { marks: entry.marks, maxMarks: entry.max_marks })
          }
        }
      }
      
      return { year, session, variant, sessionLabel, friendPapers, myPapers }
    })
  }
  
  const comparisonRows = view === 'entries' ? getComparisonRows() : []
  const papers = selectedConfig?.papers || []

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              {friend.avatar_url ? (
                <img 
                  src={friend.avatar_url} 
                  alt="" 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <Users className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {friend.display_name || friend.username}'s Papers
              </h2>
              {view === 'entries' && selectedConfig && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedConfig.subject_name}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : view === 'subjects' ? (
            // Subject List
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select a subject to view {friend.display_name || friend.username}'s progress
              </p>
              
              {friendConfigs.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No paper records yet
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {friendConfigs.map(config => {
                    const hasMatch = myConfigs.some(c => 
                      c.subject_name.toLowerCase() === config.subject_name.toLowerCase()
                    )
                    
                    return (
                      <button
                        key={config.id}
                        onClick={() => loadFriendEntries(config)}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {config.subject_name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {config.papers.length} paper{config.papers.length !== 1 ? 's' : ''} configured
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasMatch && (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                              Can Compare
                            </span>
                          )}
                          <ChevronDown className="w-5 h-5 text-gray-400 -rotate-90" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            // Comparison Table
            <div className="space-y-4">
              <button
                onClick={() => setView('subjects')}
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                ← Back to subjects
              </button>
              
              {comparisonRows.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No entries recorded yet
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                          Session
                        </th>
                        {papers.map(paper => (
                          <th 
                            key={paper.paper}
                            className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300"
                            colSpan={myMatchingConfig ? 2 : 1}
                          >
                            Paper {paper.paper}
                            {myMatchingConfig && (
                              <div className="flex justify-center gap-2 text-xs font-normal mt-1">
                                <span className="text-blue-500">You</span>
                                <span className="text-purple-500">{friend.display_name || friend.username}</span>
                              </div>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {comparisonRows.map(row => (
                        <tr key={`${row.year}-${row.session}-V${row.variant}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                            {row.sessionLabel}
                          </td>
                          {papers.map(paper => {
                            const friendData = row.friendPapers.get(paper.paper)
                            const myData = row.myPapers.get(paper.paper)
                            
                            if (myMatchingConfig) {
                              const friendMarks = friendData?.marks ?? null
                              const myMarks = myData?.marks ?? null
                              
                              return (
                                <>
                                  <td 
                                    key={`my-${paper.paper}`}
                                    className="px-2 py-3 text-center"
                                  >
                                    {myData ? (
                                      <span className={`
                                        text-sm font-medium
                                        ${myMarks !== null 
                                          ? friendMarks !== null && myMarks > friendMarks
                                            ? 'text-green-600 dark:text-green-400'
                                            : friendMarks !== null && myMarks < friendMarks
                                              ? 'text-red-600 dark:text-red-400'
                                              : 'text-gray-900 dark:text-white'
                                          : 'text-gray-400'
                                        }
                                      `}>
                                        {myData.marks ?? '-'}
                                        <span className="text-gray-400 font-normal">/{myData.maxMarks}</span>
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td 
                                    key={`friend-${paper.paper}`}
                                    className="px-2 py-3 text-center border-r border-gray-200 dark:border-gray-700"
                                  >
                                    {friendData ? (
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {friendData.marks ?? '-'}
                                        <span className="text-gray-400 font-normal">/{friendData.maxMarks}</span>
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                </>
                              )
                            }
                            
                            return (
                              <td 
                                key={paper.paper}
                                className="px-4 py-3 text-center"
                              >
                                {friendData ? (
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {friendData.marks ?? '-'}
                                    <span className="text-gray-400 font-normal">/{friendData.maxMarks}</span>
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {myMatchingConfig && (
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-4">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span>You scored higher</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span>Friend scored higher</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
