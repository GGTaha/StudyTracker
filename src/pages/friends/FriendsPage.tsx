import { useEffect, useState } from 'react'
import { useFriendsStore } from '../../stores/friendsStore'
import type { Friend, FriendRequest } from '../../stores/friendsStore'
import { GlassCard } from '../../components/ui/GlassCard'
import { 
  Users, UserPlus, Award, Activity, Bell,
  Check, X, ChevronRight, Loader2, Sparkles
} from 'lucide-react'
import { AddFriendModal } from '../../components/friends/AddFriendModal'
import { FriendPapersModal } from '../../components/friends/FriendPapersModal'
import { FriendComparisonWidget } from '../../components/friends/FriendComparisonWidget'

// ── Avatar color palette ──
const AVATAR_COLORS = [
  'bg-purple-500',
  'bg-rose-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-blue-500',
  'bg-orange-500',
]
function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

type LeaderboardPeriod = 'weekly' | 'all-time'

export function FriendsPage() {
  const {
    friends,
    pendingRequests,
    activities,
    weeklyLeaderboard,
    allTimeLeaderboard,
    studyingStatus,
    isLoading,
    isInitialized,
    initialize,
    acceptFriendRequest,
    rejectFriendRequest,
    fetchStudyingStatus,
  } = useFriendsStore()

  const [showAddFriend, setShowAddFriend] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [showFriendPapers, setShowFriendPapers] = useState(false)
  const [showRequestsModal, setShowRequestsModal] = useState(false)
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>('weekly')

  useEffect(() => {
    initialize()
  }, [initialize])

  // Always refresh studying status when the page is visited (not gated by isInitialized)
  useEffect(() => {
    if (isInitialized) {
      fetchStudyingStatus()
    }
  }, [isInitialized, fetchStudyingStatus])

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`
    return `${minutes}m`
  }

  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} mins ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hours ago`
    return `${Math.floor(diffHours / 24)} days ago`
  }

  const formatStudyingTime = (startedAt: string): string => {
    const started = new Date(startedAt)
    const now = new Date()
    const diffMs = now.getTime() - started.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'just started'
    if (diffMins < 60) return `${diffMins}m`
    const diffHours = Math.floor(diffMins / 60)
    return `${diffHours}h ${String(diffMins % 60).padStart(2, '0')}m`
  }

  const incomingRequests = pendingRequests.filter(r => r.is_incoming)
  const outgoingRequests = pendingRequests.filter(r => !r.is_incoming)
  const leaderboard = leaderboardPeriod === 'weekly' ? weeklyLeaderboard : allTimeLeaderboard

  // Sort friends: studying first, then online, then offline
  const statusPriority: Record<string, number> = { studying: 1, online: 2, offline: 3 }
  const sortedFriends = [...friends].sort((a, b) => {
    const aStudying = studyingStatus.find(s => s.user_id === a.id)
    const bStudying = studyingStatus.find(s => s.user_id === b.id)
    const aStatus = aStudying?.is_studying ? 'studying' : 'offline' // We only know studying vs not
    const bStatus = bStudying?.is_studying ? 'studying' : 'offline'
    return (statusPriority[aStatus] ?? 3) - (statusPriority[bStatus] ?? 3)
  })

  const handleViewProfile = (friend: Friend) => {
    setSelectedFriend(friend)
    setShowFriendPapers(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-10 animate-fade-slide">
      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-5">
        
        {/* ── LEFT COLUMN ── */}
        <div className="flex flex-col gap-5">

          {/* Friend Requests Bar — always visible */}
          <button
            onClick={() => setShowRequestsModal(true)}
            className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl hover:bg-white/[0.04] hover:border-white/10 transition-all text-left w-full group shrink-0 shadow-lg"
          >
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl shadow-inner group-hover:scale-105 transition-transform">
                  <Bell size={20} />
                  {incomingRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#09090b] animate-pulse" />
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-bold text-slate-100">Friend Requests</span>
                  <span className="text-xs text-slate-400 font-medium">
                    <span className={incomingRequests.length > 0 ? 'text-amber-400' : ''}>
                      {incomingRequests.length} New
                    </span>
                    {' • '}
                    {outgoingRequests.length} Pending
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 group-hover:text-slate-300 transition-colors">
                Manage <ChevronRight size={16} />
              </div>
          </button>

          {/* Your Roster Card */}
          <GlassCard className="flex-1 !p-0 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-slate-50 flex items-center gap-2">
                  <Users size={18} className="text-slate-400" />
                  Your Roster
                </h3>
                <span className="bg-white/5 text-slate-400 px-2 py-0.5 rounded-md text-xs font-bold">
                  {friends.length} Friends
                </span>
              </div>
              <button
                onClick={() => setShowAddFriend(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 text-[#09090b] hover:bg-sky-400 transition-colors font-semibold text-sm shadow-[0_0_15px_rgba(56,189,248,0.15)]"
              >
                <UserPlus size={16} /> Add Friend
              </button>
            </div>

            <div className="flex flex-col p-4 gap-2">
              {sortedFriends.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500">No friends yet. Add some friends to get started!</p>
                </div>
              ) : (
                sortedFriends.map(friend => {
                  const studying = studyingStatus.find(s => s.user_id === friend.id)
                  const isStudying = studying?.is_studying ?? false
                  const name = friend.display_name || friend.username
                  const initial = name.charAt(0).toUpperCase()
                  const color = getAvatarColor(name)

                  return (
                    <div
                      key={friend.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/[0.015] border border-white/[0.04] rounded-2xl hover:bg-white/[0.03] hover:border-white/10 transition-colors gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center text-white font-bold text-lg shadow-inner ${color} ${!isStudying ? 'opacity-70' : ''}`}>
                            {friend.avatar_url ? (
                              <img src={friend.avatar_url} alt="" className="w-12 h-12 rounded-[1rem] object-cover" />
                            ) : (
                              initial
                            )}
                          </div>
                          {isStudying && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-[3px] border-[#09090b] animate-pulse" />
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-semibold text-base ${!isStudying ? 'text-slate-300' : 'text-slate-100'}`}>
                              {name}
                            </h4>
                            <span className="text-xs font-mono text-slate-500">
                              #{friend.user_code}
                            </span>
                          </div>
                          {isStudying ? (
                            <span className="text-xs font-medium text-emerald-400">
                              {studying?.subject_name ? (
                                <>
                                  Studying {studying.subject_name}
                                  {studying.subject_code && (
                                    <span className="opacity-70"> ({studying.subject_code})</span>
                                  )}
                                </>
                              ) : (
                                'Studying'
                              )}
                              {studying?.started_at && (
                                <span className="opacity-60 ml-1">({formatStudyingTime(studying.started_at)})</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-slate-500">Offline</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:gap-6 ml-16 sm:ml-0 border-t border-white/5 sm:border-0 pt-3 sm:pt-0">
                        {(() => {
                          const allTimeEntry = allTimeLeaderboard.find(e => e.user_id === friend.id)
                          if (allTimeEntry && allTimeEntry.total_seconds > 0) {
                            return (
                              <div className="flex flex-col items-end mr-2">
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">All Time</span>
                                <span className="text-sm font-bold text-slate-200">{formatDuration(allTimeEntry.total_seconds)}</span>
                              </div>
                            )
                          }
                          return null
                        })()}
                        <button
                          onClick={() => handleViewProfile(friend)}
                          className="flex items-center gap-1.5 text-sm font-medium text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-4 py-2 rounded-xl transition-colors ml-auto sm:ml-0"
                        >
                          View Profile <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </GlassCard>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="flex flex-col gap-5">

          {/* Leaderboard */}
          <GlassCard className="!p-0 overflow-hidden">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <h3 className="font-semibold text-slate-50 flex items-center gap-2">
                <Award size={18} className="text-amber-400" />
                Leaderboard
              </h3>
              <div className="flex p-1 bg-white/[0.03] rounded-lg border border-white/5">
                <button
                  onClick={() => setLeaderboardPeriod('weekly')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    leaderboardPeriod === 'weekly'
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setLeaderboardPeriod('all-time')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    leaderboardPeriod === 'all-time'
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Time
                </button>
              </div>
            </div>
            <div className="flex flex-col p-4 gap-2">
              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No data yet</p>
                </div>
              ) : (
                leaderboard.map((entry, idx) => {
                  const name = entry.display_name || entry.username
                  const initial = name.charAt(0).toUpperCase()
                  const color = getAvatarColor(name)

                  return (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                        entry.is_current_user
                          ? 'bg-sky-500/10 border border-sky-500/20'
                          : 'bg-white/[0.015] border border-transparent hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className={`w-6 text-center font-bold text-sm ${
                        idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-700' : 'text-slate-500'
                      }`}>
                        {entry.rank}
                      </div>
                      <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center text-xs font-bold text-white shadow-inner ${color}`}>
                        {entry.avatar_url ? (
                          <img src={entry.avatar_url} alt="" className="w-8 h-8 rounded-[10px] object-cover" />
                        ) : (
                          initial
                        )}
                      </div>
                      <div className="flex-1 flex justify-between items-center">
                        <span className="text-sm font-semibold text-slate-200">
                          {entry.is_current_user ? 'You' : name}
                        </span>
                        <span className={`text-sm font-bold ${entry.is_current_user ? 'text-sky-400' : 'text-slate-300'}`}>
                          {formatDuration(entry.total_seconds)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </GlassCard>

          {/* Live Pulse */}
          <GlassCard className="!p-0 overflow-hidden">
            <div className="p-5 border-b border-white/5 bg-white/[0.01]">
              <h3 className="font-semibold text-slate-50 flex items-center gap-2">
                <Sparkles size={18} className="text-purple-400" />
                Live Pulse
              </h3>
            </div>
            <div className="flex flex-col p-4 gap-3">
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No recent activity</p>
                </div>
              ) : (
                activities.slice(0, 5).map(activity => {
                  const name = activity.display_name || activity.username
                  const initial = name.charAt(0).toUpperCase()
                  const color = getAvatarColor(name)

                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner shrink-0 ${color}`}>
                        {activity.avatar_url ? (
                          <img src={activity.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          initial
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-sm text-slate-300 leading-snug">
                          <span className="font-bold text-white">{name}</span>
                          {' '}studied{' '}
                          {activity.subject_name && (
                            <span className="text-slate-200 font-medium">{activity.subject_name}</span>
                          )}
                          {' '}for {formatDuration(activity.duration_seconds)}.
                        </p>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                          {formatTimeAgo(activity.ended_at)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ── Comparison Widget ── */}
      <FriendComparisonWidget />

      {/* ── Requests Modal ── */}
      {showRequestsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#09090b]/80 backdrop-blur-md transition-opacity">
          <div className="w-full max-w-lg bg-[#09090b] border border-white/10 rounded-[24px] shadow-2xl overflow-hidden flex flex-col animate-fade-slide max-h-[90vh]">
            <div className="flex justify-between items-center p-6">
              <h3 className="text-xl font-bold text-white">Manage Requests</h3>
              <button
                onClick={() => setShowRequestsModal(false)}
                className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto px-6 pb-6 space-y-6">
              {/* Incoming */}
              {incomingRequests.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[0.7rem] font-semibold text-slate-500 uppercase tracking-[0.15em]">
                    Incoming ({incomingRequests.length})
                  </p>
                  {incomingRequests.map(request => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      type="incoming"
                      onAccept={() => acceptFriendRequest(request.id)}
                      onReject={() => rejectFriendRequest(request.id)}
                    />
                  ))}
                </div>
              )}

              {/* Outgoing */}
              {outgoingRequests.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[0.7rem] font-semibold text-slate-500 uppercase tracking-[0.15em]">
                    Pending ({outgoingRequests.length})
                  </p>
                  {outgoingRequests.map(request => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      type="outgoing"
                    />
                  ))}
                </div>
              )}

              {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
                <div className="text-center py-12">
                  <Bell className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No pending requests</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showAddFriend && (
        <AddFriendModal onClose={() => setShowAddFriend(false)} />
      )}

      {showFriendPapers && selectedFriend && (
        <FriendPapersModal
          friend={selectedFriend}
          onClose={() => {
            setShowFriendPapers(false)
            setSelectedFriend(null)
          }}
        />
      )}
    </div>
  )
}

// ── Request Card ──
function RequestCard({
  request,
  type,
  onAccept,
  onReject,
}: {
  request: FriendRequest
  type: 'incoming' | 'outgoing'
  onAccept?: () => void
  onReject?: () => void
}) {
  const name = request.profile.display_name || request.profile.username
  const initial = name.charAt(0).toUpperCase()
  const color = getAvatarColor(name)

  return (
    <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-inner ${color}`}>
          {request.profile.avatar_url ? (
            <img src={request.profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="text-xs text-slate-500">@{request.profile.username}</p>
        </div>
      </div>
      {type === 'incoming' ? (
        <div className="flex items-center gap-2">
          <button
            onClick={onAccept}
            className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={onReject}
            className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <span className="text-xs font-semibold text-amber-400/70">Pending...</span>
      )}
    </div>
  )
}
