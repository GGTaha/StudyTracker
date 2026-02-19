-- Phase 2: Add session_tags table and seed subjects
-- Run this in your Supabase SQL Editor

-- Session tags table
CREATE TABLE IF NOT EXISTS public.session_tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280' NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add tag_id to study_sessions
ALTER TABLE public.study_sessions 
ADD COLUMN IF NOT EXISTS tag_id UUID REFERENCES public.session_tags(id) ON DELETE SET NULL;

-- Index for session_tags
CREATE INDEX IF NOT EXISTS idx_session_tags_user_id ON public.session_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_tag_id ON public.study_sessions(tag_id);

-- RLS for session_tags
ALTER TABLE public.session_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tags"
  ON public.session_tags FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Insert default tags (global, user_id is NULL)
INSERT INTO public.session_tags (id, user_id, name, color, is_default) VALUES
  ('00000000-0000-0000-0000-000000000001', NULL, 'Past Papers', '#EF4444', true),
  ('00000000-0000-0000-0000-000000000002', NULL, 'Practice', '#F59E0B', true),
  ('00000000-0000-0000-0000-000000000003', NULL, 'General', '#6B7280', true)
ON CONFLICT (id) DO NOTHING;

-- Insert default A-Level CIE subjects (these will be copied per user)
-- We'll handle this in the app instead to avoid conflicts
