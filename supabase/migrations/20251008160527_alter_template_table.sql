-- Add missing columns to template table for curated templates

-- Add type enum if not exists
DO $$ BEGIN
  CREATE TYPE template_type AS ENUM ('curated', 'user_uploaded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add missing columns
ALTER TABLE template
  ADD COLUMN IF NOT EXISTS type template_type DEFAULT 'curated',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS spec JSONB,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Make sure org_id can be NULL for curated templates
ALTER TABLE template ALTER COLUMN org_id DROP NOT NULL;

-- Add index for template type
CREATE INDEX IF NOT EXISTS idx_template_type ON template(type);

-- Add RLS policy for curated templates if not exists
DROP POLICY IF EXISTS "Users can view curated and their own templates" ON template;
CREATE POLICY "Users can view curated and their own templates"
  ON template FOR SELECT
  USING (
    type = 'curated' OR
    org_id IN (SELECT org_id FROM app_user WHERE id = auth.uid())
  );
