-- Enable realtime for locations table
ALTER PUBLICATION supabase_realtime ADD TABLE locations;

-- Enable realtime for event_settings table
ALTER PUBLICATION supabase_realtime ADD TABLE event_settings;

-- Grant necessary permissions for realtime
GRANT SELECT ON locations TO anon, authenticated;
GRANT SELECT ON event_settings TO anon, authenticated;

