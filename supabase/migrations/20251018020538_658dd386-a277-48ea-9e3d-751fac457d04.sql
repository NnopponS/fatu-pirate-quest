-- Create participants table
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  age INT,
  grade_level TEXT,
  school TEXT,
  program TEXT,
  points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create locations table
CREATE TABLE IF NOT EXISTS public.locations (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  points INT NOT NULL DEFAULT 100
);

-- Create checkins table
CREATE TABLE IF NOT EXISTS public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  location_id INT NOT NULL REFERENCES public.locations(id),
  method TEXT NOT NULL DEFAULT 'qr',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(participant_id, location_id)
);

-- Create spins table
CREATE TABLE IF NOT EXISTS public.spins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  prize TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(participant_id)
);

-- Enable RLS
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spins ENABLE ROW LEVEL SECURITY;

-- Public read for locations (everyone can see where to check-in)
CREATE POLICY "public_read_locations"
  ON public.locations FOR SELECT
  TO anon
  USING (true);

-- Create function to increment points
CREATE OR REPLACE FUNCTION public.increment_points(pid_in UUID, plus_in INT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE participants SET points = points + plus_in WHERE id = pid_in;
$$;

-- Seed locations with the 4 event locations
INSERT INTO public.locations (id, name, lat, lng, points) VALUES
  (1, 'ยิมเนเซียม 4', 14.0661446, 100.6033427, 100),
  (2, 'คณะศิลปกรรมศาสตร์', 14.06879, 100.604679, 100),
  (3, 'โรงละคร (Thammasat Playhouse)', 14.071901, 100.6076747, 100),
  (4, 'โรงทอ (Textiles Workshop)', 14.0671832, 100.6067732, 100)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  points = EXCLUDED.points;