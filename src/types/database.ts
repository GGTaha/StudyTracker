export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          user_code: string
          privacy_activity: boolean
          privacy_weekly_time: boolean
          privacy_papers: boolean
          privacy_leaderboard: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          user_code?: string
          privacy_activity?: boolean
          privacy_weekly_time?: boolean
          privacy_papers?: boolean
          privacy_leaderboard?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          user_code?: string
          privacy_activity?: boolean
          privacy_weekly_time?: boolean
          privacy_papers?: boolean
          privacy_leaderboard?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          started_at: string
          ended_at: string | null
          duration_seconds: number | null
          subject_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          started_at: string
          ended_at?: string | null
          duration_seconds?: number | null
          subject_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          subject_id?: string | null
          created_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          user_id: string
          name: string
          code: string | null
          color: string
          exam_board: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          code?: string | null
          color?: string
          exam_board?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          code?: string | null
          color?: string
          exam_board?: string | null
          created_at?: string
        }
      }
      papers: {
        Row: {
          id: string
          user_id: string
          subject_id: string
          name: string
          year: number | null
          session: string | null
          variant: number | null
          component: number | null
          max_marks: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject_id: string
          name: string
          year?: number | null
          session?: string | null
          variant?: number | null
          component?: number | null
          max_marks?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject_id?: string
          name?: string
          year?: number | null
          session?: string | null
          variant?: number | null
          component?: number | null
          max_marks?: number | null
          created_at?: string
        }
      }
      paper_attempts: {
        Row: {
          id: string
          paper_id: string
          user_id: string
          status: 'unsolved' | 'in_progress' | 'solved'
          marks_obtained: number | null
          time_taken_minutes: number | null
          notes: string | null
          attempted_at: string
          created_at: string
        }
        Insert: {
          id?: string
          paper_id: string
          user_id: string
          status?: 'unsolved' | 'in_progress' | 'solved'
          marks_obtained?: number | null
          time_taken_minutes?: number | null
          notes?: string | null
          attempted_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          paper_id?: string
          user_id?: string
          status?: 'unsolved' | 'in_progress' | 'solved'
          marks_obtained?: number | null
          time_taken_minutes?: number | null
          notes?: string | null
          attempted_at?: string
          created_at?: string
        }
      }
      friendships: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type StudySession = Database['public']['Tables']['study_sessions']['Row']
export type Subject = Database['public']['Tables']['subjects']['Row']
export type Paper = Database['public']['Tables']['papers']['Row']
export type PaperAttempt = Database['public']['Tables']['paper_attempts']['Row']
export type Friendship = Database['public']['Tables']['friendships']['Row']
