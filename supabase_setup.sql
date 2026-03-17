-- ROUND 2 DATABASE MIGRATION
-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- 1. Add missing columns to the existing ideas table
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'archived'));
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS expiry_hours INTEGER DEFAULT 24;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure created_at exists (from Round 1 it should, but just in case)
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 1.5 Remove unique constraint on title to allow duplicate titles
ALTER TABLE ideas DROP CONSTRAINT IF EXISTS ideas_title_key;

-- 2. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ideas_updated_at ON ideas;
CREATE TRIGGER update_ideas_updated_at
    BEFORE UPDATE ON ideas
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 3. Row Level Security Policies
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

-- Allow public read of active ideas
DROP POLICY IF EXISTS "Public read active ideas" ON ideas;
CREATE POLICY "Public read active ideas" ON ideas
    FOR SELECT USING (status = 'active');

-- Allow users to read their own hidden/archived ideas
DROP POLICY IF EXISTS "Users read own ideas" ON ideas;
CREATE POLICY "Users read own ideas" ON ideas
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Allow authenticated users to create ideas
DROP POLICY IF EXISTS "Authenticated users insert ideas" ON ideas;
CREATE POLICY "Authenticated users insert ideas" ON ideas
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own ideas
DROP POLICY IF EXISTS "Users update own ideas" ON ideas;
CREATE POLICY "Users update own ideas" ON ideas
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Allow public to increment views/votes (Requires a bit more care, but for this demo:)
DROP POLICY IF EXISTS "Public increment views/votes" ON ideas;
CREATE POLICY "Public increment views/votes" ON ideas
    FOR UPDATE USING (true);

-- Allow users to delete their own ideas
DROP POLICY IF EXISTS "Users delete own ideas" ON ideas;
CREATE POLICY "Users delete own ideas" ON ideas
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
-- ═══════════════════════════════════════════════
-- PHASE 3: ECOSYSTEM TABLES
-- ═══════════════════════════════════════════════

-- 4. Collaborations Table
CREATE TABLE IF NOT EXISTS collaborations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(idea_id, user_id) -- One role per idea
);

ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read collaborations" ON collaborations;
CREATE POLICY "Public read collaborations" ON collaborations
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users join teams" ON collaborations;
CREATE POLICY "Authenticated users join teams" ON collaborations
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 5. Validation Polls Table
CREATE TABLE IF NOT EXISTS polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    response TEXT CHECK (response IN ('yes', 'no', 'maybe')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(idea_id, user_id) -- One vote per user per idea
);

ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read polls" ON polls;
CREATE POLICY "Public read polls" ON polls
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users vote" ON polls;
CREATE POLICY "Authenticated users vote" ON polls
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
