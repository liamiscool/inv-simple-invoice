-- Make the 'templates' storage bucket public for reading
-- This allows template background images to be loaded in the browser without authentication

-- Update bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'templates';

-- Add RLS policy to allow public read access
CREATE POLICY IF NOT EXISTS "Public read access for templates"
ON storage.objects FOR SELECT
USING (bucket_id = 'templates');
