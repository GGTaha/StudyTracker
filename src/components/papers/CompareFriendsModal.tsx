import { useState, useEffect } from 'react'
import { X, Users, Loader2, ChevronRight, UsersRound } from 'lucide-react'
import { useFriendsStore } from '../../stores/friendsStore'
import type { Friend } from '../../stores/friendsStore'
import { usePapersStore } from '../../stores/papersStoreNew'
import type { SubjectPaperConfig, SessionType, PaperEntry } from '../../stores/papersStoreNew'

interface CompareFriendsModalProps {
  isOpen: boolean
  onClose: () => void
  config: SubjectPaperConfig
  friends: Friend[]
  initialView?: 'friends' | 'all'
}

interface FriendComparison {
  friend: Friend
  hasMatchingSubject: boolean
  configs: SubjectPaperConfig[]
  entries: PaperEntry[]
}

export function CompareFriendsModal({ isOpen, onClose, config, friends, initialView = 'friends' }: CompareFriendsModalProps) {
  const { getFriendPaperConfigs, getFriendPaperEntries } = useFriendsStore()
  const { entries: myEntries } = usePapersStore()
  
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null)
  const [friendComparisons, setFriendComparisons] = useState<FriendComparison[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [view, setView] = useState<'friends' | 'comparison' | 'all'>(initialView)
  const [friendEntries, setFriendEntries] = useState<PaperEntry[]>([])
  const [allFriendsEntries, setAllFriendsEntries] = useState<Map<string, PaperEntry[]>>(new Map())
  const [hasLoadedAll, setHasLoadedAll] = useState(false)
  
  useEffect(() => {
    if (isOpen) {
      setView(initialView)
      setHasLoadedAll(false)
      loadFriendComparisons()
    }
  }, [isOpen, config.id, initialView])
  
  const loadFriendComparisons = async () => {
    setIsLoading(true)
    const comparisons: FriendComparison[] = []
    
    for (const friend of friends) {
      const configs = await getFriendPaperConfigs(friend.id)
      const matchingConfig = configs.find(c => 
        c.subject_name.toLowerCase() === config.subject_name.toLowerCase()
      )
      
      comparisons.push({
        friend,
        hasMatchingSubject: !!matchingConfig,
        configs,
        entries: [],
      })
    }
    
    setFriendComparisons(comparisons)
    
    // If initialView is 'all', automatically load all friends' entries
    if (initialView === 'all' && !hasLoadedAll) {
      const entriesMap = new Map<string, PaperEntry[]>()
      
      for (const comparison of comparisons) {
        if (!comparison.hasMatchingSubject) continue
        
        const matchingConfig = comparison.configs.find(c => 
          c.subject_name.toLowerCase() === config.subject_name.toLowerCase()
        )
        
        if (matchingConfig) {
          const entries = await getFriendPaperEntries(comparison.friend.id, matchingConfig.subject_id)
          entriesMap.set(comparison.friend.id, entries)
        }
      }
      
      setAllFriendsEntries(entriesMap)
      setHasLoadedAll(true)
    }
    
    setIsLoading(false)
  }
  
  const selectFriend = async (friendId: string) => {
    const comparison = friendComparisons.find(c => c.friend.id === friendId)
    if (!comparison) return
    
    setSelectedFriendId(friendId)
    setIsLoading(true)
    
    // Find their matching config
    const matchingConfig = comparison.configs.find(c => 
      c.subject_name.toLowerCase() === config.subject_name.toLowerCase()
    )
    
    if (matchingConfig) {
      const entries = await getFriendPaperEntries(friendId, matchingConfig.subject_id)
      setFriendEntries(entries)
    } else {
      setFriendEntries([])
    }
    
    setView('comparison')
    setIsLoading(false)
  }
  
  const selectAllFriends = async () => {
    setIsLoading(true)
    const entriesMap = new Map<string, PaperEntry[]>()
    
    // Get entries for all friends with matching subjects
    for (const comparison of friendComparisons) {
      if (!comparison.hasMatchingSubject) continue
      
      const matchingConfig = comparison.configs.find(c => 
        c.subject_name.toLowerCase() === config.subject_name.toLowerCase()
      )
      
      if (matchingConfig) {
        const entries = await getFriendPaperEntries(comparison.friend.id, matchingConfig.subject_id)
        entriesMap.set(comparison.friend.id, entries)
      }
    }
    
    setAllFriendsEntries(entriesMap)
    setView('all')
    setIsLoading(false)
  }
  
  const selectedFriend = friends.find(f => f.id === selectedFriendId)
  const mySubjectEntries = myEntries.filter(e => e.subject_id === config.subject_id)
  const comparableFriends = friendComparisons.filter(c => c.hasMatchingSubject)
  
  // Build comparison rows
  const getComparisonRows = () => {
    const sessionsMap = new Map<string, { year: number; session: SessionType; variant: number }>()
    
    // Extract variant from paper_code (e.g., "12" -> variant 2)
    const getVariant = (paperCode: string): number => {
      if (paperCode.length >= 2) {
        return parseInt(paperCode[1]) || 1
      }
      return 1
    }
    
    // Collect all sessions from my entries (including variants)
    for (const entry of mySubjectEntries) {
      const variant = getVariant(entry.paper_code)
      const key = `${entry.year}-${entry.session}-V${variant}`
      if (!sessionsMap.has(key)) {
        sessionsMap.set(key, { year: entry.year, session: entry.session, variant })
      }
    }
    
    // Collect all sessions from friend entries (including variants)
    for (const entry of friendEntries) {
      const variant = getVariant(entry.paper_code)
      const key = `${entry.year}-${entry.session}-V${variant}`
      if (!sessionsMap.has(key)) {
        sessionsMap.set(key, { year: entry.year, session: entry.session, variant })
      }
    }
    
    // Sort sessions (newest first, then by variant)
    const sessions = Array.from(sessionsMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      const order: Record<SessionType, number> = { 'Oct/Nov': 0, 'May/Jun': 1, 'Feb/Mar': 2 }
      if (a.session !== b.session) return order[a.session] - order[b.session]
      return a.variant - b.variant
    })
    
    return sessions.map(({ year, session, variant }) => {
      const sessionLabel = (session === 'May/Jun' ? `Summer ${year}` 
        : session === 'Feb/Mar' ? `Spring ${year}` 
        : `Winter ${year}`) + ` V${variant}`
      
      const myPapers = new Map<string, { marks: number | null; maxMarks: number }>()
      const friendPapers = new Map<string, { marks: number | null; maxMarks: number }>()
      
      for (const entry of mySubjectEntries) {
        const entryVariant = getVariant(entry.paper_code)
        if (entry.year === year && entry.session === session && entryVariant === variant) {
          const paperNum = entry.paper_code[0] // Get paper number (first digit)
          myPapers.set(paperNum, { marks: entry.marks, maxMarks: entry.max_marks })
        }
      }
      
      for (const entry of friendEntries) {
        const entryVariant = getVariant(entry.paper_code)
        if (entry.year === year && entry.session === session && entryVariant === variant) {
          const paperNum = entry.paper_code[0] // Get paper number (first digit)
          friendPapers.set(paperNum, { marks: entry.marks, maxMarks: entry.max_marks })
        }
      }
      
      return { year, session, variant, sessionLabel, myPapers, friendPapers }
    })
  }
  
  // Build comparison rows for all friends
  const getAllFriendsComparisonRows = () => {
    const sessionsMap = new Map<string, { year: number; session: SessionType; variant: number }>()
    
    const getVariant = (paperCode: string): number => {
      if (paperCode.length >= 2) {
        return parseInt(paperCode[1]) || 1
      }
      return 1
    }
    
    // Collect all sessions from my entries
    for (const entry of mySubjectEntries) {
      const variant = getVariant(entry.paper_code)
      const key = `${entry.year}-${entry.session}-V${variant}`
      if (!sessionsMap.has(key)) {
        sessionsMap.set(key, { year: entry.year, session: entry.session, variant })
      }
    }
    
    // Collect all sessions from all friends' entries
    for (const [, entries] of allFriendsEntries) {
      for (const entry of entries) {
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
      const order: Record<SessionType, number> = { 'Oct/Nov': 0, 'May/Jun': 1, 'Feb/Mar': 2 }
      if (a.session !== b.session) return order[a.session] - order[b.session]
      return a.variant - b.variant
    })
    
    return sessions.map(({ year, session, variant }) => {
      const sessionLabel = (session === 'May/Jun' ? `Summer ${year}` 
        : session === 'Feb/Mar' ? `Spring ${year}` 
        : `Winter ${year}`) + ` V${variant}`
      
      // My papers for this session
      const myPapers = new Map<string, { marks: number | null; maxMarks: number }>()
      for (const entry of mySubjectEntries) {
        const entryVariant = getVariant(entry.paper_code)
        if (entry.year === year && entry.session === session && entryVariant === variant) {
          const paperNum = entry.paper_code[0]
          myPapers.set(paperNum, { marks: entry.marks, maxMarks: entry.max_marks })
        }
      }
      
      // All friends' papers for this session
      const allFriendsPapers = new Map<string, Map<string, { marks: number | null; maxMarks: number }>>()
      for (const [friendId, entries] of allFriendsEntries) {
        const friendPapers = new Map<string, { marks: number | null; maxMarks: number }>()
        for (const entry of entries) {
          const entryVariant = getVariant(entry.paper_code)
          if (entry.year === year && entry.session === session && entryVariant === variant) {
            const paperNum = entry.paper_code[0]
            friendPapers.set(paperNum, { marks: entry.marks, maxMarks: entry.max_marks })
          }
        }
        allFriendsPapers.set(friendId, friendPapers)
      }
      
      return { year, session, variant, sessionLabel, myPapers, allFriendsPapers }
    })
  }
  
  const comparisonRows = view === 'comparison' ? getComparisonRows() : []
  const allFriendsRows = view === 'all' ? getAllFriendsComparisonRows() : []
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              Compare with Friends
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {config.subject_name}
            </p>
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
          ) : view === 'friends' ? (
            // Friend Selection
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select a friend to compare {config.subject_name} marks with:
              </p>
              
              {friendComparisons.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No friends with visible papers
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Compare All Button */}
                  {comparableFriends.length > 1 && (
                    <button
                      onClick={selectAllFriends}
                      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 hover:from-purple-500/20 hover:to-blue-500/20 dark:hover:from-purple-500/30 dark:hover:to-blue-500/30 border border-purple-200 dark:border-purple-800 rounded-lg transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <UsersRound className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Compare with All Friends
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {comparableFriends.length} friends have {config.subject_name}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-purple-500" />
                    </button>
                  )}
                  
                  {/* Individual Friend Buttons */}
                  <div className="grid gap-2">
                    {friendComparisons.map(({ friend, hasMatchingSubject }) => (
                    <button
                      key={friend.id}
                      onClick={() => selectFriend(friend.id)}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                    >
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
                          <p className="font-medium text-gray-900 dark:text-white">
                            {friend.display_name || friend.username}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{friend.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasMatchingSubject ? (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                            Has {config.subject_name}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-xs rounded-full">
                            No matching subject
                          </span>
                        )}
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </button>
                  ))}
                  </div>
                </div>
              )}
            </div>
          ) : view === 'all' ? (
            // All Friends Comparison View
            <div className="space-y-4">
              <button
                onClick={() => setView('friends')}
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                ← Back to friend list
              </button>
              
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <UsersRound className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Comparing with {comparableFriends.length} Friends
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {config.subject_name}
                  </p>
                </div>
              </div>
              
              {allFriendsRows.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No entries to compare yet
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 sticky left-0 bg-gray-50 dark:bg-gray-700">
                          Session
                        </th>
                        {config.papers.map(paper => (
                          <th 
                            key={`you-${paper.paper}`}
                            className="px-3 py-3 text-center text-sm font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap"
                          >
                            <div>P{paper.paper}</div>
                            <div className="text-xs font-normal text-gray-500">You</div>
                          </th>
                        ))}
                        {comparableFriends.map(({ friend }) => (
                          config.papers.map(paper => (
                            <th 
                              key={`${friend.id}-${paper.paper}`}
                              className="px-3 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
                            >
                              <div>P{paper.paper}</div>
                              <div className="text-xs font-normal text-gray-500 truncate max-w-[80px]" title={friend.display_name || friend.username}>
                                {(friend.display_name || friend.username).slice(0, 8)}
                              </div>
                            </th>
                          ))
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {allFriendsRows.map(row => {
                        // Calculate best marks for each paper to highlight winner
                        const bestMarks = new Map<string, number>()
                        config.papers.forEach(paper => {
                          const myData = row.myPapers.get(paper.paper)
                          let best = myData?.marks ?? -1
                          
                          for (const [, friendPapers] of row.allFriendsPapers) {
                            const friendData = friendPapers.get(paper.paper)
                            if (friendData?.marks != null && friendData.marks > best) {
                              best = friendData.marks
                            }
                          }
                          if (best >= 0) bestMarks.set(paper.paper, best)
                        })
                        
                        return (
                          <tr key={`${row.year}-${row.session}-V${row.variant}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap sticky left-0 bg-white dark:bg-gray-800">
                              {row.sessionLabel}
                            </td>
                            {/* My scores */}
                            {config.papers.map(paper => {
                              const myData = row.myPapers.get(paper.paper)
                              const myMarks = myData?.marks ?? null
                              const best = bestMarks.get(paper.paper)
                              const isWinner = myMarks !== null && best !== undefined && myMarks === best
                              
                              return (
                                <td 
                                  key={`my-${paper.paper}`}
                                  className="px-3 py-3 text-center"
                                >
                                  {myData ? (
                                    <span className={`
                                      text-sm font-medium
                                      ${isWinner ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}
                                    `}>
                                      {myMarks ?? '-'}
                                      <span className="text-gray-400 font-normal text-xs">/{myData.maxMarks}</span>
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              )
                            })}
                            {/* Friends' scores */}
                            {comparableFriends.map(({ friend }) => {
                              const friendPapers = row.allFriendsPapers.get(friend.id) || new Map()
                              return config.papers.map(paper => {
                                const friendData = friendPapers.get(paper.paper)
                                const friendMarks = friendData?.marks ?? null
                                const best = bestMarks.get(paper.paper)
                                const isWinner = friendMarks !== null && best !== undefined && friendMarks === best
                                
                                return (
                                  <td 
                                    key={`${friend.id}-${paper.paper}`}
                                    className="px-3 py-3 text-center"
                                  >
                                    {friendData ? (
                                      <span className={`
                                        text-sm font-medium
                                        ${isWinner ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}
                                      `}>
                                        {friendMarks ?? '-'}
                                        <span className="text-gray-400 font-normal text-xs">/{friendData.maxMarks}</span>
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                )
                              })
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span>Highest score</span>
                </div>
              </div>
            </div>
          ) : (
            // Comparison View
            <div className="space-y-4">
              <button
                onClick={() => setView('friends')}
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                ← Back to friend list
              </button>
              
              {selectedFriend && (
                <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    {selectedFriend.avatar_url ? (
                      <img 
                        src={selectedFriend.avatar_url} 
                        alt="" 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <Users className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Comparing with {selectedFriend.display_name || selectedFriend.username}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {config.subject_name}
                    </p>
                  </div>
                </div>
              )}
              
              {comparisonRows.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No entries to compare yet
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
                        {config.papers.map(paper => (
                          <th 
                            key={paper.paper}
                            className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300"
                            colSpan={2}
                          >
                            Paper {paper.paper}
                            <div className="flex justify-center gap-4 text-xs font-normal mt-1">
                              <span className="text-blue-500">You</span>
                              <span className="text-purple-500">{selectedFriend?.display_name || selectedFriend?.username}</span>
                            </div>
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
                          {config.papers.map(paper => {
                            const myData = row.myPapers.get(paper.paper)
                            const friendData = row.friendPapers.get(paper.paper)
                            const myMarks = myData?.marks ?? null
                            const friendMarks = friendData?.marks ?? null
                            
                            return (
                              <>
                                <td 
                                  key={`my-${paper.paper}`}
                                  className="px-2 py-3 text-center"
                                >
                                  {myData ? (
                                    <span className={`
                                      text-sm font-medium
                                      ${myMarks !== null && friendMarks !== null
                                        ? myMarks > friendMarks
                                          ? 'text-green-600 dark:text-green-400'
                                          : myMarks < friendMarks
                                            ? 'text-red-600 dark:text-red-400'
                                            : 'text-gray-900 dark:text-white'
                                        : 'text-gray-900 dark:text-white'
                                      }
                                    `}>
                                      {myMarks ?? '-'}
                                      <span className="text-gray-400 font-normal text-xs">/{myData.maxMarks}</span>
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td 
                                  key={`friend-${paper.paper}`}
                                  className="px-2 py-3 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                                >
                                  {friendData ? (
                                    <span className={`
                                      text-sm font-medium
                                      ${friendMarks !== null && myMarks !== null
                                        ? friendMarks > myMarks
                                          ? 'text-green-600 dark:text-green-400'
                                          : friendMarks < myMarks
                                            ? 'text-red-600 dark:text-red-400'
                                            : 'text-gray-900 dark:text-white'
                                        : 'text-gray-900 dark:text-white'
                                      }
                                    `}>
                                      {friendMarks ?? '-'}
                                      <span className="text-gray-400 font-normal text-xs">/{friendData.maxMarks}</span>
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              </>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span>Higher score</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span>Lower score</span>
                </div>
              </div>
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
