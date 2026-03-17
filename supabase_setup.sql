-- Run this in your Supabase SQL Editor:
-- https://acilerrmbmfgxcgjxekh.supabase.co/project/default/sql

CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  problem TEXT,
  description TEXT,
  difficulty INTEGER NOT NULL,
  potential TEXT NOT NULL,
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Recommended)
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read" ON ideas FOR SELECT USING (true);

-- Allow public insert access
CREATE POLICY "Allow public insert" ON ideas FOR INSERT WITH CHECK (true);

-- Allow public update access (for votes)
CREATE POLICY "Allow public update" ON ideas FOR UPDATE USING (true);

-- Allow public delete access
CREATE POLICY "Allow public delete" ON ideas FOR DELETE USING (true);
