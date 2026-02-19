-- New Papers v2 Tables Migration
-- Run this in Supabase SQL Editor

-- Drop existing tables to recreate with new schema
-- WARNING: This will delete existing data!
DROP TABLE IF EXISTS paper_entries CASCADE;
DROP TABLE IF EXISTS subject_paper_configs CASCADE;

-- Paper entries table - stores individual paper attempts
CREATE TABLE paper_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
  session TEXT NOT NULL CHECK (session IN ('May/Jun', 'Feb/Mar', 'Oct/Nov')),
  paper_code TEXT NOT NULL, -- e.g., '11', '12', '21', '31' etc.
  marks INTEGER CHECK (marks >= 0),
  max_marks INTEGER NOT NULL DEFAULT 75 CHECK (max_marks > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subject paper configurations - stores which papers each subject uses
-- New structure: papers is a JSONB array like [{"paper": "1", "max_marks": 75}, {"paper": "2", "max_marks": 80}]
CREATE TABLE subject_paper_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  papers JSONB NOT NULL DEFAULT '[{"paper": "1", "max_marks": 75}]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, subject_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_paper_entries_user_id ON paper_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_entries_subject_id ON paper_entries(subject_id);
CREATE INDEX IF NOT EXISTS idx_paper_entries_year_session ON paper_entries(year, session);
CREATE INDEX IF NOT EXISTS idx_subject_paper_configs_user_id ON subject_paper_configs(user_id);

-- Enable RLS
ALTER TABLE paper_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_paper_configs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own paper entries" ON paper_entries;
DROP POLICY IF EXISTS "Users can insert own paper entries" ON paper_entries;
DROP POLICY IF EXISTS "Users can update own paper entries" ON paper_entries;
DROP POLICY IF EXISTS "Users can delete own paper entries" ON paper_entries;
DROP POLICY IF EXISTS "Users can view own paper configs" ON subject_paper_configs;
DROP POLICY IF EXISTS "Users can insert own paper configs" ON subject_paper_configs;
DROP POLICY IF EXISTS "Users can update own paper configs" ON subject_paper_configs;
DROP POLICY IF EXISTS "Users can delete own paper configs" ON subject_paper_configs;

-- RLS Policies for paper_entries
CREATE POLICY "Users can view own paper entries" 
  ON paper_entries FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own paper entries" 
  ON paper_entries FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own paper entries" 
  ON paper_entries FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own paper entries" 
  ON paper_entries FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for subject_paper_configs
CREATE POLICY "Users can view own paper configs" 
  ON subject_paper_configs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own paper configs" 
  ON subject_paper_configs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own paper configs" 
  ON subject_paper_configs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own paper configs" 
  ON subject_paper_configs FOR DELETE 
  USING (auth.uid() = user_id);

-- Updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_paper_entries_updated_at ON paper_entries;
CREATE TRIGGER update_paper_entries_updated_at
  BEFORE UPDATE ON paper_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subject_paper_configs_updated_at ON subject_paper_configs;
CREATE TRIGGER update_subject_paper_configs_updated_at
  BEFORE UPDATE ON subject_paper_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
