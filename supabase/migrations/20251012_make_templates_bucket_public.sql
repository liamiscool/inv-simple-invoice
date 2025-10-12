-- Make the 'templates' storage bucket public for reading
-- This allows template background images to be loaded in the browser without authentication

-- Update bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'templates';

-- Drop existing policy if it exists (Supabase doesn't support IF NOT EXISTS for policies)
DROP POLICY IF EXISTS "Public read access for templates" ON storage.objects;

-- Add RLS policy to allow public read access
CREATE POLICY "Public read access for templates"
ON storage.objects FOR SELECT
USING (bucket_id = 'templates');
