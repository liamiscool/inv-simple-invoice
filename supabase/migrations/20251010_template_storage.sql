-- Create storage bucket for custom template uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'templates',
  'templates',
  false, -- Private bucket, access controlled by RLS
  10485760, -- 10MB limit per file
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for template uploads
-- Policy: Users can upload templates to their org folder
CREATE POLICY "Users can upload templates to own org"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'templates' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read their own org templates
CREATE POLICY "Users can view own org templates"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'templates' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own org templates
CREATE POLICY "Users can update own org templates"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'templates' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'templates' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own org templates
CREATE POLICY "Users can delete own org templates"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'templates' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
