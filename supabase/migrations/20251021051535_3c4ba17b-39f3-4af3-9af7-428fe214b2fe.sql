-- Create storage bucket for location images
INSERT INTO storage.buckets (id, name, public)
VALUES ('location-images', 'location-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for location images bucket
CREATE POLICY "Anyone can view location images"
ON storage.objects FOR SELECT
USING (bucket_id = 'location-images');

CREATE POLICY "Admins can upload location images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'location-images');

CREATE POLICY "Admins can update location images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'location-images');

CREATE POLICY "Admins can delete location images"
ON storage.objects FOR DELETE
USING (bucket_id = 'location-images');

-- Add qr_code_version to locations table to track QR code invalidation
ALTER TABLE locations ADD COLUMN IF NOT EXISTS qr_code_version INTEGER DEFAULT 1;

-- Add map_url, image_url, description if they don't exist
ALTER TABLE locations ADD COLUMN IF NOT EXISTS map_url TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS description TEXT;

-- Function to adjust participant points (for admin)
CREATE OR REPLACE FUNCTION adjust_participant_points(p_participant_id UUID, p_points_delta INTEGER)
RETURNS VOID
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