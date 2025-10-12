-- Allow authenticated users to upload templates to storage
-- This enables the blank template generation feature

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload templates" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their own template folder" ON storage.objects;

-- Allow authenticated users to insert (upload) templates
-- Restrict to their own user folder for security
CREATE POLICY "Users can upload to their own template folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'templates' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own templates
CREATE POLICY "Users can delete their own templates"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'templates' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
