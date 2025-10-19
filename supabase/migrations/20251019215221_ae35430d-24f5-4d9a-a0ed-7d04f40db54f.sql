-- Enable RLS on event_settings
ALTER TABLE event_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read event settings
CREATE POLICY "event_settings_public_read" ON event_settings
  FOR SELECT
  USING (true);

-- Create policy to allow only admins to update event settings (will be enforced via service role key in edge functions)
-- For now, no direct update policy as admins use edge functions with service role key