import { useState, useEffect } from 'react'
import { X, Users, Loader2, ChevronLeft } from 'lucide-react'
import { useFriendsStore } from '../../stores/friendsStore'
import type { Friend } from '../../stores/friendsStore'
import { usePapersStore } from '../../stores/papersStoreNew'
import type { SubjectPaperConfig, SessionType, PaperEntry } from '../../stores/papersStoreNew'

interface CompareFriendsModalProps {
  isOpen: boolean
  onClose: () => void
  config: SubjectPaperConfig
  friends: Friend[]
}

interface FriendComparison {
  friend: Friend
  hasMatchingSubject: boolean
  configs: SubjectPaperConfig[]
  entries: PaperEntry[]
}

const AVATAR_COLORS = [
  'bg-purple-500',
  'bg-rose-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function CompareFriendsModal({ isOpen, onClose, config, friends }: CompareFriendsModalProps) {
  const { getFriendPaperConfigs, getFriendPaperEntries } = useFriendsStore()
  const { entries: myEntries } = usePapersStore()
  
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null)
  const [friendComparisons, setFriendComparisons] = useState<FriendComparison[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [view, setView] = useState<'friends' | 'comparison'>('friends')
  const [friendEntries, setFriendEntries] = useState<PaperEntry[]>([])
  
  useEffect(() => {
    if (isOpen) {
      setView('friends')
      loadFriendComparisons()
    }
  }, [isOpen, config.id])
  
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
    setIsLoading(false)
  }
  
  const selectFriend = async (friendId: string) => {
    const comparison = friendComparisons.find(c => c.friend.id === friendId)
    if (!comparison) return
    
    setSelectedFriendId(friendId)
    setIsLoading(true)
    
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
  
  const selectedFriend = friends.find(f => f.id === selectedFriendId)
  const mySubjectEntries = myEntries.filter(e => e.subject_id === config.subject_id)
  
  // Build comparison rows
  const getComparisonRows = () => {
    const sessionsMap = new Map<string, { year: number; session: SessionType; variant: number }>()
    
    const getVariant = (paperCode: string): number => {
      if (paperCode.length >= 2) {
        return parseInt(paperCode[1]) || 1
      }
      return 1
    }
    
    for (const entry of mySubjectEntries) {
      const variant = getVariant(entry.paper_code)
      const key = `${entry.year}-${entry.session}-V${variant}`
      if (!sessionsMap.has(key)) {
        sessionsMap.set(key, { year: entry.year, session: entry.session, variant })
      }
    }
    
    for (const entry of friendEntries) {
      const variant = getVariant(entry.paper_code)
      const key = `${entry.year}-${entry.session}-V${variant}`
      if (!sessionsMap.has(key)) {
        sessionsMap.set(key, { year: entry.year, session: entry.session, variant })
      }
    }
    
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
          const paperNum = entry.paper_code[0]
          myPapers.set(paperNum, { marks: entry.marks, maxMarks: entry.max_marks })
        }
      }
      
      for (const entry of friendEntries) {
        const entryVariant = getVariant(entry.paper_code)
        if (entry.year === year && entry.session === session && entryVariant === variant) {
          const paperNum = entry.paper_code[0]
          friendPapers.set(paperNum, { marks: entry.marks, maxMarks: entry.max_marks })
        }
      }
      
      return { year, session, variant, sessionLabel, myPapers, friendPapers }
    })
  }
  
  const comparisonRows = view === 'comparison' ? getComparisonRows() : []
  
  if (!isOpen) return null

  const friendName = selectedFriend?.display_name || selectedFriend?.username || ''
  const friendNameUpper = friendName.toUpperCase()

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#09090b]/80 backdrop-blur-md transition-opacity">
      <div className="w-full max-w-3xl bg-[#09090b] border border-white/10 rounded-[24px] shadow-2xl overflow-hidden flex flex-col animate-fade-slide max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Users className="w-5 h-5 text-purple-400" />
              Compare with Friends
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {config.subject_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : view === 'friends' ? (
            /* ── Friend Selection ── */
            <div className="space-y-4">
              {friendComparisons.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500">No friends with visible papers</p>
                </div>
              ) : (
                <>
                  <p className="text-[0.7rem] font-semibold text-slate-500 uppercase tracking-[0.15em]">
                    Individual Friends
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {friendComparisons.map(({ friend, hasMatchingSubject }) => {
                      const name = friend.display_name || friend.username
                      const initial = name.charAt(0).toUpperCase()
                      const color = getAvatarColor(name)
                      
                      return (
                        <button
                          key={friend.id}
                          onClick={() => hasMatchingSubject && selectFriend(friend.id)}
                          disabled={!hasMatchingSubject}
                          className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-colors ${
                            hasMatchingSubject 
                              ? 'bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/15 cursor-pointer' 
                              : 'bg-white/[0.02] border border-white/5 opacity-40 cursor-not-allowed'
                          }`}
                        >
                          <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center shrink-0`}>
                            {friend.avatar_url ? (
                              <img 
                                src={friend.avatar_url} 
                                alt="" 
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-bold text-white">{initial}</span>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-white truncate">{name}</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* ── Comparison View ── */
            <div className="space-y-5">
              <button
                onClick={() => setView('friends')}
                className="flex items-center gap-1 text-sm font-medium text-sky-400 hover:text-sky-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to friend list
              </button>
              
              {selectedFriend && (
                <div className="flex items-center gap-3.5 p-4 bg-gradient-to-r from-purple-500/15 to-purple-500/5 border border-purple-500/20 rounded-xl">
                  <div className={`w-12 h-12 ${getAvatarColor(friendName)} rounded-xl flex items-center justify-center shrink-0`}>
                    {selectedFriend.avatar_url ? (
                      <img 
                        src={selectedFriend.avatar_url} 
                        alt="" 
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="text-base font-bold text-white">
                        {friendName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">
                      Comparing with {friendName}
                    </p>
                    <p className="text-sm text-purple-300/70">
                      {config.subject_name}
                    </p>
                  </div>
                </div>
              )}
              
              {comparisonRows.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500">No entries to compare yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Session
                        </th>
                        {config.papers.map(paper => (
                          <th 
                            key={paper.paper}
                            className="px-2 py-3 text-center"
                            colSpan={2}
                          >
                            <div className="text-sm font-bold text-white">
                              Paper {paper.paper} <span className="text-slate-500 font-normal text-xs">/{paper.max_marks}</span>
                            </div>
                            <div className="flex justify-center gap-6 text-[0.7rem] font-semibold uppercase tracking-wider mt-1">
                              <span className="text-cyan-400">You</span>
                              <span className="text-purple-400">{friendNameUpper}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonRows.map((row, rowIdx) => (
                        <tr 
                          key={`${row.year}-${row.session}-V${row.variant}`} 
                          className={`border-b border-white/5 ${rowIdx % 2 === 0 ? 'bg-white/[0.01]' : ''}`}
                        >
                          <td className="px-4 py-3.5 text-sm font-medium text-slate-300 whitespace-nowrap">
                            {row.sessionLabel}
                          </td>
                          {config.papers.map(paper => {
                            const myData = row.myPapers.get(paper.paper)
                            const friendData = row.friendPapers.get(paper.paper)
                            const myMarks = myData?.marks ?? null
                            const friendMarks = friendData?.marks ?? null
                            
                            const getMyColor = () => {
                              if (myMarks === null) return 'text-white'
                              if (friendMarks === null) return 'text-white'
                              if (myMarks > friendMarks) return 'text-emerald-400'
                              if (myMarks < friendMarks) return 'text-rose-400'
                              return 'text-white'
                            }
                            
                            const getFriendColor = () => {
                              if (friendMarks === null) return 'text-white'
                              if (myMarks === null) return 'text-white'
                              if (friendMarks > myMarks) return 'text-emerald-400'
                              if (friendMarks < myMarks) return 'text-rose-400'
                              return 'text-white'
                            }
                            
                            return (
                              <td 
                                key={`my-${paper.paper}`}
                                className="px-1 py-3.5 text-center"
                                colSpan={2}
                              >
                                <div className="flex justify-center gap-6">
                                  {/* My score */}
                                  <span className="min-w-[50px]">
                                    {myData ? (
                                      <span className={`text-sm font-bold ${getMyColor()}`}>
                                        {myMarks ?? '—'}
                                        <span className="text-slate-600 font-normal text-xs">/{myData.maxMarks}</span>
                                      </span>
                                    ) : (
                                      <span className="text-slate-600">—</span>
                                    )}
                                  </span>
                                  {/* Friend score */}
                                  <span className="min-w-[50px]">
                                    {friendData ? (
                                      <span className={`text-sm font-bold ${getFriendColor()}`}>
                                        {friendMarks ?? '—'}
                                        <span className="text-slate-600 font-normal text-xs">/{friendData.maxMarks}</span>
                                      </span>
                                    ) : (
                                      <span className="text-slate-600">—</span>
                                    )}
                                  </span>
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {comparisonRows.length > 0 && (
                <div className="flex items-center gap-5 text-xs text-slate-500 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                    <span>Higher score</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                    <span>Lower score</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
