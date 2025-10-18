-- Enable required extension for hashing utilities
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add credential fields to participants
ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS credentials_generated_at TIMESTAMPTZ DEFAULT now();

-- Populate legacy rows with generated credentials (if any)
UPDATE public.participants
SET
  username = COALESCE(
    username,
    'user_' || substr(gen_random_uuid()::text, 1, 8)
  ),
  password_hash = COALESCE(password_hash, encode(digest(gen_random_uuid()::text, 'sha256'), 'hex')),
  credentials_generated_at = COALESCE(credentials_generated_at, now());

ALTER TABLE public.participants
  ALTER COLUMN username SET NOT NULL,
  ALTER COLUMN password_hash SET NOT NULL,
  ALTER COLUMN credentials_generated_at SET NOT NULL;

ALTER TABLE public.participants
  ADD CONSTRAINT participants_username_key UNIQUE (username);

-- Admin users and sessions
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_sessions (
  token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS admin_sessions_admin_id_idx ON public.admin_sessions (admin_id);
CREATE INDEX IF NOT EXISTS admin_sessions_expires_at_idx ON public.admin_sessions (expires_at);

-- Prize catalog
CREATE TABLE IF NOT EXISTS public.prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  weight INT NOT NULL DEFAULT 1 CHECK (weight > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Application settings key/value storage
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.touch_app_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS app_settings_set_updated_at ON public.app_settings;
CREATE TRIGGER app_settings_set_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.touch_app_settings_updated_at();

-- Seed default configuration and admin account
INSERT INTO public.app_settings (key, value)
VALUES ('points_required_for_wheel', jsonb_build_object('value', 300))
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value;

INSERT INTO public.prizes (name, weight)
VALUES
  ('�,��,�,''�1S�,?�1?�,?�,-�,��1O', 40),
  ('�,z�,�,؅,?�,,�,?�1?�,^', 30),
  ('�,,�,-�,؅,-�,�1^�,��,��,��,�,?', 20),
  ('�,,�,-�,s�,,�,,�,"�,-�,�1^�,��1^�,�,��,��,T�,,�,?', 10)
ON CONFLICT DO NOTHING;

INSERT INTO public.admin_users (username, password_hash)
VALUES (
  'admin',
  encode(digest('admin123', 'sha256'), 'hex')
)
ON CONFLICT (username) DO NOTHING;
