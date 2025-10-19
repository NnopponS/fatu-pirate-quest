-- Add username and password fields to participants table
ALTER TABLE participants ADD COLUMN IF NOT EXISTS username text UNIQUE;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS password_hash text;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_participants_username ON participants(username);