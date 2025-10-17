-- Add PDF storage tracking columns to invoice table
ALTER TABLE invoice
  ADD COLUMN pdf_url TEXT,
  ADD COLUMN pdf_generated_at TIMESTAMPTZ;

-- Add index for faster lookups when checking PDF generation status
CREATE INDEX idx_invoice_pdf_generated_at ON invoice(pdf_generated_at) WHERE pdf_generated_at IS NOT NULL;

-- Add comment to document the purpose of these columns
COMMENT ON COLUMN invoice.pdf_url IS 'Public URL to the generated PDF in Supabase Storage';
COMMENT ON COLUMN invoice.pdf_generated_at IS 'Timestamp when the PDF was last generated';
