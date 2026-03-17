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

-- 2. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ideas_updated_at
    BEFORE UPDATE ON ideas
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 3. Row Level Security Policies
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

-- Allow public read of active ideas
CREATE POLICY "Public read active ideas" ON ideas
    FOR SELECT USING (status = 'active');

-- Allow users to read their own hidden/archived ideas
CREATE POLICY "Users read own ideas" ON ideas
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Allow authenticated users to create ideas
CREATE POLICY "Authenticated users insert ideas" ON ideas
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own ideas
CREATE POLICY "Users update own ideas" ON ideas
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Allow public to increment views/votes (Requires a bit more care, but for this demo:)
CREATE POLICY "Public increment views/votes" ON ideas
    FOR UPDATE USING (true);
