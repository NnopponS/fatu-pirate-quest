-- Disable RLS on locations table (it's public data and admin auth is handled by Firebase)
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "locations_public_read" ON locations;
DROP POLICY IF EXISTS "locations_allow_update" ON locations;

-- Disable RLS on participants table (admin auth is handled by Firebase)
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "participants_public_read" ON participants;
DROP POLICY IF EXISTS "participants_allow_update" ON participants;
DROP POLICY IF EXISTS "participants_allow_insert" ON participants;

-- Disable RLS on event_settings table (admin auth is handled by Firebase)
ALTER TABLE event_settings DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "event_settings_public_read" ON event_settings;

