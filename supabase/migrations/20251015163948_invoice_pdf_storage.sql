-- Create storage bucket for invoice PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoice-pdfs',
  'invoice-pdfs',
  true, -- Public bucket for easy client access
  10485760, -- 10MB limit per file
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for invoice-pdfs bucket
-- Allow authenticated users to upload PDFs for their own org
CREATE POLICY "Users can upload invoice PDFs for their org"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoice-pdfs' AND
  auth.uid() IN (
    SELECT id FROM app_user WHERE org_id = (
      SELECT org_id FROM app_user WHERE id = auth.uid()
    )
  )
);

-- Allow authenticated users to read PDFs from their own org
CREATE POLICY "Users can read invoice PDFs from their org"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoice-pdfs' AND
  auth.uid() IN (
    SELECT id FROM app_user WHERE org_id = (
      SELECT org_id FROM app_user WHERE id = auth.uid()
    )
  )
);

-- Allow public access to all PDFs (for client downloads via email link)
CREATE POLICY "Public can read invoice PDFs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'invoice-pdfs');

-- Allow authenticated users to delete PDFs from their own org
CREATE POLICY "Users can delete invoice PDFs from their org"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'invoice-pdfs' AND
  auth.uid() IN (
    SELECT id FROM app_user WHERE org_id = (
      SELECT org_id FROM app_user WHERE id = auth.uid()
    )
  )
);

-- Add pdf_url column to invoice table to track stored PDF location
ALTER TABLE invoice
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ;

-- Add comment explaining the columns
COMMENT ON COLUMN invoice.pdf_url IS 'URL to the PDF stored in Supabase Storage';
COMMENT ON COLUMN invoice.pdf_generated_at IS 'Timestamp when the PDF was last generated';
