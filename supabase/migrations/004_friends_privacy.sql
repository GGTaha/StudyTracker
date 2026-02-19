-- Friends & Privacy Migration
-- Run this in Supabase SQL Editor

-- Add privacy settings to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS privacy_activity BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS privacy_weekly_time BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS privacy_papers BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS privacy_leaderboard BOOLEAN DEFAULT true;

-- Create index for searching profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON profiles(LOWER(username));

-- Function to get friend's study time for a date range
CREATE OR REPLACE FUNCTION get_friend_study_time(
  friend_user_id UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
) RETURNS INTEGER AS $$
DECLARE
  total_seconds INTEGER;
BEGIN
  SELECT COALESCE(SUM(duration_seconds), 0) INTO total_seconds
  FROM study_sessions
  WHERE user_id = friend_user_id
    AND started_at >= start_date
    AND started_at < end_date
    AND duration_seconds IS NOT NULL;
  
  RETURN total_seconds;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if two users are friends
CREATE OR REPLACE FUNCTION are_friends(user1 UUID, user2 UUID) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM friendships 
    WHERE status = 'accepted' 
      AND ((user_id = user1 AND friend_id = user2) OR (user_id = user2 AND friend_id = user1))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for getting friend activity (study sessions with subject info)
-- This will be queried through RLS
CREATE OR REPLACE VIEW friend_activity AS
SELECT 
  ss.id,
  ss.user_id,
  ss.subject_id,
  ss.started_at,
  ss.ended_at,
  ss.duration_seconds,
  s.name as subject_name,
  s.color as subject_color,
  p.display_name,
  p.username,
  p.avatar_url,
  p.privacy_activity
FROM study_sessions ss
LEFT JOIN subjects s ON ss.subject_id = s.id
JOIN profiles p ON ss.user_id = p.id
WHERE ss.ended_at IS NOT NULL;

-- Drop existing policy if exists and recreate
DROP POLICY IF EXISTS "Users can view friend activity" ON study_sessions;

-- Policy to allow viewing friend's study sessions (if they allow it)
CREATE POLICY "Users can view friend activity"
  ON study_sessions FOR SELECT
  USING (
    user_id = auth.uid() 
    OR (
      EXISTS (
        SELECT 1 FROM friendships 
        WHERE status = 'accepted' 
          AND ((user_id = auth.uid() AND friend_id = study_sessions.user_id) 
               OR (friend_id = auth.uid() AND user_id = study_sessions.user_id))
      )
      AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = study_sessions.user_id AND privacy_activity = true
      )
    )
  );

-- Policy to allow viewing friend's paper entries (if they allow it)
DROP POLICY IF EXISTS "Users can view friend paper entries" ON paper_entries;

CREATE POLICY "Users can view friend paper entries"
  ON paper_entries FOR SELECT
  USING (
    user_id = auth.uid() 
    OR (
      EXISTS (
        SELECT 1 FROM friendships 
        WHERE status = 'accepted' 
          AND ((user_id = auth.uid() AND friend_id = paper_entries.user_id) 
               OR (friend_id = auth.uid() AND user_id = paper_entries.user_id))
      )
      AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = paper_entries.user_id AND privacy_papers = true
      )
    )
  );

-- Policy to allow viewing friend's paper configs (if they allow it)
DROP POLICY IF EXISTS "Users can view friend paper configs" ON subject_paper_configs;

CREATE POLICY "Users can view friend paper configs"
  ON subject_paper_configs FOR SELECT
  USING (
    user_id = auth.uid() 
    OR (
      EXISTS (
        SELECT 1 FROM friendships 
        WHERE status = 'accepted' 
          AND ((user_id = auth.uid() AND friend_id = subject_paper_configs.user_id) 
               OR (friend_id = auth.uid() AND user_id = subject_paper_configs.user_id))
      )
      AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = subject_paper_configs.user_id AND privacy_papers = true
      )
    )
  );
