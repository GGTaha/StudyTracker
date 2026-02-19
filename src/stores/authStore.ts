import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '../types/database'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  isInitialized: boolean
  pendingUsername: string | null
  
  // Actions
  initialize: () => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  fetchProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>
}

// Generate a unique user code like #STU-4829
const generateUserCode = () => {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `#STU-${num}`
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isInitialized: false,
  pendingUsername: null,

  initialize: async () => {
    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        set({ user: session.user, session })
        await get().fetchProfile()
      }
      
      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ user: session?.user ?? null, session })
        
        if (session?.user) {
          await get().fetchProfile()
        } else {
          set({ profile: null })
        }
      })
    } finally {
      set({ isLoading: false, isInitialized: true })
    }
  },

  signUp: async (email, password, username) => {
    set({ isLoading: true })
    
    try {
      // Check if username is taken (use maybeSingle to avoid error on no rows)
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .maybeSingle()
      
      if (existingUser) {
        return { error: 'Username is already taken' }
      }
      
      // Store username for profile creation after auth
      set({ pendingUsername: username })
      
      // Sign up the user with metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.toLowerCase(),
            display_name: username,
          }
        }
      })
      
      if (error) return { error: error.message }
      if (!data.user) return { error: 'Failed to create account' }
      
      // Try to create profile (may fail if email confirmation required)
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        username: username.toLowerCase(),
        display_name: username,
        user_code: generateUserCode(),
      })
      
      if (profileError) {
        // Profile creation failed - will retry on first sign in
        console.log('Profile will be created on first sign in:', profileError.message)
      }
      
      return { error: null }
    } finally {
      set({ isLoading: false })
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true })
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) return { error: error.message }
      return { error: null }
    } finally {
      set({ isLoading: false })
    }
  },

  signOut: async () => {
    set({ isLoading: true })
    await supabase.auth.signOut()
    set({ user: null, session: null, profile: null, isLoading: false })
  },

  fetchProfile: async () => {
    const { user, pendingUsername } = get()
    if (!user) return
    
    // Try to fetch existing profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    
    if (data) {
      set({ profile: data, pendingUsername: null })
      return
    }
    
    // Profile doesn't exist - create it
    if (error || !data) {
      console.log('Creating profile for user...')
      
      // Get username from pending state or user metadata
      const username = pendingUsername || 
        user.user_metadata?.username || 
        `user_${user.id.substring(0, 8)}`
      const displayName = pendingUsername || 
        user.user_metadata?.display_name || 
        user.user_metadata?.username ||
        'User'
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: username.toLowerCase(),
          display_name: displayName,
          user_code: generateUserCode(),
        })
        .select()
        .single()
      
      if (createError) {
        console.error('Error creating profile:', createError)
        return
      }
      
      set({ profile: newProfile, pendingUsername: null })
    }
  },

  updateProfile: async (updates) => {
    const { user } = get()
    if (!user) return { error: 'Not authenticated' }
    
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    
    if (error) return { error: error.message }
    
    await get().fetchProfile()
    return { error: null }
  },
}))
