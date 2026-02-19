import { useEffect, useState } from 'react'
import { useFriendsStore } from '../../stores/friendsStore'
import type { Friend, FriendRequest } from '../../stores/friendsStore'
import { 
  Users, UserPlus, Trophy, Activity, Clock, 
  Check, X, UserMinus, ChevronRight, Loader2, FileText, RefreshCw, Radio
} from 'lucide-react'
import { AddFriendModal } from '../../components/friends/AddFriendModal'
import { FriendPapersModal } from '../../components/friends/FriendPapersModal'

type Tab = 'friends' | 'activity' | 'leaderboard'
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
    initialize,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    fetchLeaderboard,
    fetchActivities,
    fetchStudyingStatus,
  } = useFriendsStore()
  
  const [activeTab, setActiveTab] = useState<Tab>('friends')
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>('weekly')
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [showFriendPapers, setShowFriendPapers] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  useEffect(() => {
    initialize()
  }, [initialize])
  
  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard(leaderboardPeriod)
    } else if (activeTab === 'activity') {
      fetchActivities()
    } else if (activeTab === 'friends') {
      fetchStudyingStatus()
    }
  }, [activeTab, leaderboardPeriod, fetchLeaderboard, fetchActivities, fetchStudyingStatus])
  
  const handleRefreshActivity = async () => {
    setIsRefreshing(true)
    await fetchActivities()
    setIsRefreshing(false)
  }
  
  const tabs = [
    { id: 'friends' as Tab, label: 'Friends', icon: Users },
    { id: 'activity' as Tab, label: 'Activity', icon: Activity },
    { id: 'leaderboard' as Tab, label: 'Leaderboard', icon: Trophy },
  ]
  
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }
  
  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }
  
  const incomingRequests = pendingRequests.filter(r => r.is_incoming)
  const outgoingRequests = pendingRequests.filter(r => !r.is_incoming)
  
  const leaderboard = leaderboardPeriod === 'weekly' ? weeklyLeaderboard : allTimeLeaderboard
  
  const handleViewPapers = (friend: Friend) => {
    setSelectedFriend(friend)
    setShowFriendPapers(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Friends
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Connect with friends and track progress together
          </p>
        </div>
        <button
          onClick={() => setShowAddFriend(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Add Friend
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px
                ${isActive 
                  ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' 
                  : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
              {tab.id === 'friends' && incomingRequests.length > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {incomingRequests.length}
                </span>
              )}
            </button>
          )
        })}
      </div>
      
      {/* Tab Content */}
      {activeTab === 'friends' && (
        <div className="space-y-6">
          {/* Incoming Requests */}
          {incomingRequests.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-500" />
                Friend Requests ({incomingRequests.length})
              </h3>
              <div className="space-y-2">
                {incomingRequests.map(request => (
                  <FriendRequestCard 
                    key={request.id} 
                    request={request}
                    onAccept={() => acceptFriendRequest(request.id)}
                    onReject={() => rejectFriendRequest(request.id)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Outgoing Requests */}
          {outgoingRequests.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                Pending Requests ({outgoingRequests.length})
              </h3>
              <div className="space-y-2">
                {outgoingRequests.map(request => (
                  <div 
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        {request.profile.avatar_url ? (
                          <img 
                            src={request.profile.avatar_url} 
                            alt="" 
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <Users className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {request.profile.display_name || request.profile.username}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          @{request.profile.username}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-yellow-600 dark:text-yellow-400">
                      Pending...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Friends List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" />
              Your Friends ({friends.length})
            </h3>
            
            {friends.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No friends yet. Add some friends to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map(friend => {
                  const status = studyingStatus.find(s => s.user_id === friend.id)
                  return (
                    <FriendCard 
                      key={friend.id} 
                      friend={friend}
                      onRemove={() => removeFriend(friend.friendship_id)}
                      onViewPapers={() => handleViewPapers(friend)}
                      studyingInfo={status}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h3>
            <button
              onClick={handleRefreshActivity}
              disabled={isRefreshing}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Refresh activity"
            >
              <RefreshCw className={`w-5 h-5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No recent activity from friends
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Activity from the last 7 days will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map(activity => (
                <div 
                  key={activity.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    {activity.avatar_url ? (
                      <img 
                        src={activity.avatar_url} 
                        alt="" 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <Users className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {activity.display_name || activity.username}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        studied for {formatDuration(activity.duration_seconds)}
                      </span>
                    </div>
                    {activity.subject_name && (
                      <div className="flex items-center gap-2 mt-1">
                        <span 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: activity.subject_color || '#6B7280' }}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {activity.subject_name}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatTimeAgo(activity.ended_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          {/* Period Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setLeaderboardPeriod('weekly')}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors
                ${leaderboardPeriod === 'weekly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
            >
              This Week
            </button>
            <button
              onClick={() => setLeaderboardPeriod('all-time')}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors
                ${leaderboardPeriod === 'all-time'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
            >
              All Time
            </button>
          </div>
          
          {/* Leaderboard */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {leaderboard.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No data yet. Start studying to appear on the leaderboard!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {leaderboard.map((entry) => (
                  <div 
                    key={entry.user_id}
                    className={`
                      flex items-center gap-4 p-4
                      ${entry.is_current_user ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                    `}
                  >
                    {/* Rank */}
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                      ${entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' : ''}
                      ${entry.rank === 2 ? 'bg-gray-300 text-gray-700' : ''}
                      ${entry.rank === 3 ? 'bg-amber-600 text-amber-100' : ''}
                      ${entry.rank > 3 ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' : ''}
                    `}>
                      {entry.rank}
                    </div>
                    
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      {entry.avatar_url ? (
                        <img 
                          src={entry.avatar_url} 
                          alt="" 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <Users className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    
                    {/* Name */}
                    <div className="flex-1">
                      <p className={`font-medium ${entry.is_current_user ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                        {entry.display_name || entry.username}
                        {entry.is_current_user && ' (You)'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        @{entry.username}
                      </p>
                    </div>
                    
                    {/* Time */}
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatDuration(entry.total_seconds)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        total time
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Modals */}
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

// Friend Request Card Component
function FriendRequestCard({ 
  request, 
  onAccept, 
  onReject 
}: { 
  request: FriendRequest
  onAccept: () => void
  onReject: () => void 
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
          {request.profile.avatar_url ? (
            <img 
              src={request.profile.avatar_url} 
              alt="" 
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <Users className="w-5 h-5 text-gray-500" />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            {request.profile.display_name || request.profile.username}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            @{request.profile.username}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onAccept}
          className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
        >
          <Check className="w-5 h-5" />
        </button>
        <button
          onClick={onReject}
          className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

// Friend Card Component
function FriendCard({ 
  friend, 
  onRemove,
  onViewPapers,
  studyingInfo
}: { 
  friend: Friend
  onRemove: () => void
  onViewPapers: () => void
  studyingInfo?: { is_studying: boolean; subject_name: string | null; subject_color: string | null; started_at: string | null }
}) {
  const [showMenu, setShowMenu] = useState(false)
  
  const formatStudyingTime = (startedAt: string): string => {
    const started = new Date(startedAt)
    const now = new Date()
    const diffMs = now.getTime() - started.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'just started'
    if (diffMins < 60) return `for ${diffMins}m`
    const diffHours = Math.floor(diffMins / 60)
    return `for ${diffHours}h ${diffMins % 60}m`
  }
  
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="relative">
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
          {studyingInfo?.is_studying && (
            <div 
              className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-gray-700 flex items-center justify-center"
              style={{ backgroundColor: studyingInfo.subject_color || '#22c55e' }}
              title={`Studying ${studyingInfo.subject_name || 'Unknown'}`}
            >
              <Radio className="w-2.5 h-2.5 text-white animate-pulse" />
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 dark:text-white">
              {friend.display_name || friend.username}
            </p>
            {studyingInfo?.is_studying && (
              <span 
                className="px-2 py-0.5 text-xs font-medium rounded-full text-white"
                style={{ backgroundColor: studyingInfo.subject_color || '#22c55e' }}
              >
                Studying {studyingInfo.subject_name || ''} {studyingInfo.started_at && formatStudyingTime(studyingInfo.started_at)}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            @{friend.username} • {friend.user_code}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {friend.privacy_papers && (
          <button
            onClick={onViewPapers}
            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
            title="View Papers"
          >
            <FileText className="w-5 h-5" />
          </button>
        )}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <ChevronRight className={`w-5 h-5 transition-transform ${showMenu ? 'rotate-90' : ''}`} />
          </button>
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <button
                  onClick={() => {
                    setShowMenu(false)
                    onRemove()
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <UserMinus className="w-4 h-4" />
                  Remove Friend
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
