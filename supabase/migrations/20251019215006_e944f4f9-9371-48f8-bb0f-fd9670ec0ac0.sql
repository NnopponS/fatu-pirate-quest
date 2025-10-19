-- Update locations table with Google Maps URLs and image support
ALTER TABLE locations ADD COLUMN IF NOT EXISTS map_url text;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS description text;

-- Update locations with Google Maps links
UPDATE locations SET map_url = 'https://maps.app.goo.gl/6s7tZPP9vfoErUJk9' WHERE id = 1;
UPDATE locations SET map_url = 'https://maps.app.goo.gl/jrv6XQwt23AnZtjHA' WHERE id = 2;
UPDATE locations SET map_url = 'https://maps.app.goo.gl/xMKChM6VBPx55ir46' WHERE id = 3;
UPDATE locations SET map_url = 'https://maps.app.goo.gl/wThETd28rWZf3DZF6' WHERE id = 4;

-- Add event settings table for admin to manage
CREATE TABLE IF NOT EXISTS event_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL DEFAULT 'FATU Pirate Quest 2025',
  event_description text,
  event_logo_url text,
  points_for_spin integer NOT NULL DEFAULT 300,
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert default event settings
INSERT INTO event_settings (event_name, event_description, points_for_spin)
VALUES ('FATU Pirate Quest 2025', 'ออกเดินทางสู่การผจญภัยล่าสมบัติแห่ง FATU', 300)
ON CONFLICT DO NOTHING;

-- Create admin users table with secure password storage
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create admin sessions table for token-based auth
CREATE TABLE IF NOT EXISTS admin_sessions (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES admin_users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL
);

-- Enable RLS on admin_sessions
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Insert default admin user (password: admin1234)
-- Password hash is SHA-256 of "admin1234"
INSERT INTO admin_users (username, password_hash)
VALUES ('admin', 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270')
ON CONFLICT (username) DO NOTHING;

-- Create function to clean up expired admin sessions
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM admin_sessions WHERE expires_at < now();
END;
$$;

-- Create function to adjust participant points (for admin)
CREATE OR REPLACE FUNCTION adjust_participant_points(
  p_participant_id uuid,
  p_points_delta integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE participants 
  SET points = GREATEST(0, points + p_points_delta)
  WHERE id = p_participant_id;
END;
$$;