import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './authStore'
import type { PaperEntry, SubjectPaperConfig, SessionType } from './papersStoreNew'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  user_code: string
  privacy_activity: boolean
  privacy_weekly_time: boolean
  privacy_papers: boolean
  privacy_leaderboard: boolean
}

export interface Friend extends Profile {
  friendship_id: string
  friendship_status: 'pending' | 'accepted' | 'rejected'
  is_requester: boolean // true if current user sent the request
}

export interface FriendRequest {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  profile: Profile // The other person's profile
  is_incoming: boolean // true if someone else sent to current user
}

export interface FriendActivity {
  id: string
  user_id: string
  subject_name: string | null
  subject_color: string | null
  started_at: string
  ended_at: string
  duration_seconds: number
  display_name: string | null
  username: string
  avatar_url: string | null
}

export interface LeaderboardEntry {
  user_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  total_seconds: number
  rank: number
  is_current_user: boolean
}

export interface FriendStudyingStatus {
  user_id: string
  is_studying: boolean
  subject_name: string | null
  subject_color: string | null
  started_at: string | null
}

export interface FriendPaperEntry extends PaperEntry {
  friend_name: string
  friend_username: string
}

interface FriendsState {
  friends: Friend[]
  pendingRequests: FriendRequest[]
  activities: FriendActivity[]
  weeklyLeaderboard: LeaderboardEntry[]
  allTimeLeaderboard: LeaderboardEntry[]
  studyingStatus: FriendStudyingStatus[]
  isLoading: boolean
  isInitialized: boolean
  
  // Actions
  initialize: () => Promise<void>
  fetchFriends: () => Promise<void>
  fetchPendingRequests: () => Promise<void>
  fetchActivities: () => Promise<void>
  fetchLeaderboard: (period: 'weekly' | 'all-time') => Promise<void>
  fetchStudyingStatus: () => Promise<void>
  
  // Friend management
  searchUsers: (query: string) => Promise<Profile[]>
  sendFriendRequest: (userId: string) => Promise<{ error?: string }>
  acceptFriendRequest: (requestId: string) => Promise<void>
  rejectFriendRequest: (requestId: string) => Promise<void>
  removeFriend: (friendshipId: string) => Promise<void>
  
  // Friend papers
  getFriendPaperConfigs: (friendId: string) => Promise<SubjectPaperConfig[]>
  getFriendPaperEntries: (friendId: string, subjectId: string) => Promise<PaperEntry[]>
  comparePaperProgress: (friendId: string, year: number, session: SessionType) => Promise<{
    myEntries: PaperEntry[]
    friendEntries: PaperEntry[]
  }>
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
  friends: [],
  pendingRequests: [],
  activities: [],
  weeklyLeaderboard: [],
  allTimeLeaderboard: [],
  studyingStatus: [],
  isLoading: false,
  isInitialized: false,
  
  initialize: async () => {
    const { isInitialized } = get()
    if (isInitialized) return
    
    set({ isLoading: true })
    // First fetch friends, then activities (which depends on friends)
    await get().fetchFriends()
    await get().fetchPendingRequests()
    await get().fetchActivities()
    await get().fetchLeaderboard('weekly')
    set({ isLoading: false, isInitialized: true })
  },
  
  fetchFriends: async () => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return
    
    // Get all accepted friendships
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('id, user_id, friend_id, status')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted')
    
    if (error || !friendships) {
      console.error('Error fetching friendships:', error)
      return
    }
    
    // Get friend profiles
    const friendIds = friendships.map(f => 
      f.user_id === userId ? f.friend_id : f.user_id
    )
    
    if (friendIds.length === 0) {
      set({ friends: [] })
      return
    }
    
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', friendIds)
    
    if (profileError || !profiles) {
      console.error('Error fetching friend profiles:', profileError)
      return
    }
    
    const friends: Friend[] = profiles.map(profile => {
      const friendship = friendships.find(f => 
        f.user_id === profile.id || f.friend_id === profile.id
      )!
      return {
        ...profile,
        privacy_activity: profile.privacy_activity ?? true,
        privacy_weekly_time: profile.privacy_weekly_time ?? true,
        privacy_papers: profile.privacy_papers ?? true,
        privacy_leaderboard: profile.privacy_leaderboard ?? true,
        friendship_id: friendship.id,
        friendship_status: friendship.status as 'accepted',
        is_requester: friendship.user_id === userId,
      }
    })
    
    set({ friends })
  },
  
  fetchPendingRequests: async () => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return
    
    // Get pending friendships where user is involved
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'pending')
    
    if (error || !friendships) {
      console.error('Error fetching pending requests:', error)
      return
    }
    
    // Get profiles for both incoming and outgoing requests
    const otherUserIds = friendships.map(f => 
      f.user_id === userId ? f.friend_id : f.user_id
    )
    
    if (otherUserIds.length === 0) {
      set({ pendingRequests: [] })
      return
    }
    
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', otherUserIds)
    
    if (profileError || !profiles) {
      console.error('Error fetching request profiles:', profileError)
      return
    }
    
    const requests: FriendRequest[] = friendships.map(friendship => {
      const isIncoming = friendship.friend_id === userId
      const otherUserId = isIncoming ? friendship.user_id : friendship.friend_id
      const profile = profiles.find(p => p.id === otherUserId)!
      
      return {
        id: friendship.id,
        user_id: friendship.user_id,
        friend_id: friendship.friend_id,
        status: friendship.status as 'pending',
        created_at: friendship.created_at,
        profile: {
          ...profile,
          privacy_activity: profile.privacy_activity ?? true,
          privacy_weekly_time: profile.privacy_weekly_time ?? true,
          privacy_papers: profile.privacy_papers ?? true,
          privacy_leaderboard: profile.privacy_leaderboard ?? true,
        },
        is_incoming: isIncoming,
      }
    })
    
    set({ pendingRequests: requests })
  },
  
  fetchActivities: async () => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return
    
    const { friends } = get()
    
    // If no friends yet, try fetching them first
    if (friends.length === 0) {
      await get().fetchFriends()
    }
    
    const currentFriends = get().friends
    const friendIds = currentFriends
      .filter(f => f.privacy_activity)
      .map(f => f.id)
    
    if (friendIds.length === 0) {
      set({ activities: [] })
      return
    }
    
    // Get recent sessions from friends (last 7 days for more data)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const { data, error } = await supabase
      .from('study_sessions')
      .select(`
        id,
        user_id,
        started_at,
        ended_at,
        duration_seconds,
        subjects (name, color)
      `)
      .in('user_id', friendIds)
      .gte('started_at', weekAgo.toISOString())
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false })
      .limit(50)
    
    if (error) {
      console.error('Error fetching activities:', error)
      return
    }
    
    const activities: FriendActivity[] = (data || []).map(session => {
      const friend = currentFriends.find(f => f.id === session.user_id)
      const subject = session.subjects as unknown as { name: string; color: string } | null
      
      return {
        id: session.id,
        user_id: session.user_id,
        subject_name: subject?.name || null,
        subject_color: subject?.color || null,
        started_at: session.started_at,
        ended_at: session.ended_at!,
        duration_seconds: session.duration_seconds || 0,
        display_name: friend?.display_name || null,
        username: friend?.username || 'Unknown',
        avatar_url: friend?.avatar_url || null,
      }
    })
    
    set({ activities })
  },
  
  fetchLeaderboard: async (period: 'weekly' | 'all-time') => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return
    
    const { friends } = get()
    
    // Include self and friends who allow leaderboard visibility
    const userIds = [
      userId,
      ...friends.filter(f => f.privacy_leaderboard).map(f => f.id)
    ]
    
    let startDate: Date | null = null
    if (period === 'weekly') {
      startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)
      startDate.setHours(0, 0, 0, 0)
    }
    
    // Query study sessions for each user
    let query = supabase
      .from('study_sessions')
      .select('user_id, duration_seconds')
      .in('user_id', userIds)
      .not('duration_seconds', 'is', null)
    
    if (startDate) {
      query = query.gte('started_at', startDate.toISOString())
    }
    
    const { data: sessions, error } = await query
    
    if (error) {
      console.error('Error fetching leaderboard:', error)
      return
    }
    
    // Aggregate by user
    const totals = new Map<string, number>()
    for (const session of sessions || []) {
      const current = totals.get(session.user_id) || 0
      totals.set(session.user_id, current + (session.duration_seconds || 0))
    }
    
    // Get current user's profile
    const { profile: currentProfile } = useAuthStore.getState()
    
    // Build leaderboard
    const entries: LeaderboardEntry[] = []
    
    // Add current user
    entries.push({
      user_id: userId,
      username: currentProfile?.username || 'You',
      display_name: currentProfile?.display_name || null,
      avatar_url: currentProfile?.avatar_url || null,
      total_seconds: totals.get(userId) || 0,
      rank: 0,
      is_current_user: true,
    })
    
    // Add friends
    for (const friend of friends.filter(f => f.privacy_leaderboard)) {
      entries.push({
        user_id: friend.id,
        username: friend.username,
        display_name: friend.display_name,
        avatar_url: friend.avatar_url,
        total_seconds: totals.get(friend.id) || 0,
        rank: 0,
        is_current_user: false,
      })
    }
    
    // Sort by total time and assign ranks
    entries.sort((a, b) => b.total_seconds - a.total_seconds)
    entries.forEach((entry, idx) => {
      entry.rank = idx + 1
    })
    
    if (period === 'weekly') {
      set({ weeklyLeaderboard: entries })
    } else {
      set({ allTimeLeaderboard: entries })
    }
  },
  
  fetchStudyingStatus: async () => {
    const { friends } = get()
    
    // Get friends who allow activity visibility
    const friendIds = friends.filter(f => f.privacy_activity).map(f => f.id)
    
    if (friendIds.length === 0) {
      set({ studyingStatus: [] })
      return
    }
    
    // Find active sessions (ended_at is null)
    const { data: activeSessions, error } = await supabase
      .from('study_sessions')
      .select(`
        id,
        user_id,
        started_at,
        subject_id,
        subjects (
          name,
          color
        )
      `)
      .in('user_id', friendIds)
      .is('ended_at', null)
    
    if (error) {
      console.error('Error fetching studying status:', error)
      return
    }
    
    const statusMap = new Map<string, FriendStudyingStatus>()
    
    // Initialize all friends as not studying
    for (const friendId of friendIds) {
      statusMap.set(friendId, {
        user_id: friendId,
        is_studying: false,
        subject_name: null,
        subject_color: null,
        started_at: null,
      })
    }
    
    // Update with active sessions
    for (const session of activeSessions || []) {
      const subjectsData = session.subjects as unknown
      // subjects could be an array or single object depending on relation
      const subjects = Array.isArray(subjectsData) 
        ? subjectsData[0] as { name: string; color: string } | undefined
        : subjectsData as { name: string; color: string } | null
      statusMap.set(session.user_id, {
        user_id: session.user_id,
        is_studying: true,
        subject_name: subjects?.name || null,
        subject_color: subjects?.color || null,
        started_at: session.started_at,
      })
    }
    
    set({ studyingStatus: Array.from(statusMap.values()) })
  },
  
  searchUsers: async (query: string) => {
    const userId = useAuthStore.getState().user?.id
    if (!userId || !query.trim()) return []
    
    const searchTerm = query.trim().toLowerCase()
    
    // Search by username or user_code
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', userId) // Exclude self
      .or(`username.ilike.%${searchTerm}%,user_code.ilike.%${searchTerm}%`)
      .limit(10)
    
    if (error) {
      console.error('Error searching users:', error)
      return []
    }
    
    return (data || []).map(p => ({
      ...p,
      privacy_activity: p.privacy_activity ?? true,
      privacy_weekly_time: p.privacy_weekly_time ?? true,
      privacy_papers: p.privacy_papers ?? true,
      privacy_leaderboard: p.privacy_leaderboard ?? true,
    }))
  },
  
  sendFriendRequest: async (friendId: string) => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return { error: 'Not logged in' }
    
    // Check if friendship already exists
    const { data: existing } = await supabase
      .from('friendships')
      .select('id, status')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
      .single()
    
    if (existing) {
      if (existing.status === 'accepted') {
        return { error: 'Already friends' }
      } else if (existing.status === 'pending') {
        return { error: 'Request already pending' }
      }
    }
    
    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: 'pending',
      })
    
    if (error) {
      console.error('Error sending friend request:', error)
      return { error: 'Failed to send request' }
    }
    
    await get().fetchPendingRequests()
    return {}
  },
  
  acceptFriendRequest: async (requestId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', requestId)
    
    if (error) {
      console.error('Error accepting request:', error)
      return
    }
    
    await Promise.all([
      get().fetchFriends(),
      get().fetchPendingRequests(),
    ])
  },
  
  rejectFriendRequest: async (requestId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', requestId)
    
    if (error) {
      console.error('Error rejecting request:', error)
      return
    }
    
    await get().fetchPendingRequests()
  },
  
  removeFriend: async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)
    
    if (error) {
      console.error('Error removing friend:', error)
      return
    }
    
    await get().fetchFriends()
  },
  
  getFriendPaperConfigs: async (friendId: string) => {
    const { data, error } = await supabase
      .from('subject_paper_configs')
      .select('*')
      .eq('user_id', friendId)
    
    if (error) {
      console.error('Error fetching friend configs:', error)
      return []
    }
    
    // Parse the papers JSONB field
    return (data || []).map(config => ({
      ...config,
      papers: typeof config.papers === 'string' ? JSON.parse(config.papers) : config.papers
    }))
  },
  
  getFriendPaperEntries: async (friendId: string, subjectId: string) => {
    const { data, error } = await supabase
      .from('paper_entries')
      .select('*')
      .eq('user_id', friendId)
      .eq('subject_id', subjectId)
      .order('year', { ascending: false })
      .order('session', { ascending: false })
    
    if (error) {
      console.error('Error fetching friend entries:', error)
      return []
    }
    
    return data || []
  },
  
  comparePaperProgress: async (friendId: string, year: number, session: SessionType) => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return { myEntries: [], friendEntries: [] }
    
    // Get my entries
    const { data: myData, error: myError } = await supabase
      .from('paper_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
      .eq('session', session)
    
    // Get friend entries
    const { data: friendData, error: friendError } = await supabase
      .from('paper_entries')
      .select('*')
      .eq('user_id', friendId)
      .eq('year', year)
      .eq('session', session)
    
    if (myError || friendError) {
      console.error('Error comparing papers:', myError || friendError)
      return { myEntries: [], friendEntries: [] }
    }
    
    return {
      myEntries: myData || [],
      friendEntries: friendData || [],
    }
  },
}))
