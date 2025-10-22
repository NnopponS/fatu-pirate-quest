-- Enable RLS on locations table if not already enabled
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read locations (public access)
CREATE POLICY IF NOT EXISTS "locations_public_read" ON locations
  FOR SELECT
  USING (true);

-- Allow anyone to update locations (admin authentication is handled at app level via Firebase)
CREATE POLICY IF NOT EXISTS "locations_allow_update" ON locations
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Enable RLS on participants table if not already enabled
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read participants (needed for leaderboard, etc.)
CREATE POLICY IF NOT EXISTS "participants_public_read" ON participants
  FOR SELECT
  USING (true);

-- Allow anyone to update participants (admin authentication is handled at app level via Firebase)
CREATE POLICY IF NOT EXISTS "participants_allow_update" ON participants
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anyone to insert participants (for signup)
CREATE POLICY IF NOT EXISTS "participants_allow_insert" ON participants
  FOR INSERT
  WITH CHECK (true);

