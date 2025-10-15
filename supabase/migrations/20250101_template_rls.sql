-- Enable RLS on template table
ALTER TABLE template ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view curated templates (org_id IS NULL) and their own org's templates
CREATE POLICY "Users can view curated and own org templates"
ON template
FOR SELECT
USING (
  org_id IS NULL
  OR org_id IN (
    SELECT org_id FROM app_user WHERE id = auth.uid()
  )
);

-- Policy: Users can insert templates only for their own org
CREATE POLICY "Users can insert templates for own org"
ON template
FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT org_id FROM app_user WHERE id = auth.uid()
  )
);

-- Policy: Users can update only their own org's custom templates
CREATE POLICY "Users can update own org custom templates"
ON template
FOR UPDATE
USING (
  org_id IN (
    SELECT org_id FROM app_user WHERE id = auth.uid()
  )
  AND kind = 'custom'
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM app_user WHERE id = auth.uid()
  )
  AND kind = 'custom'
);

-- Policy: Users can delete only their own org's custom templates
CREATE POLICY "Users can delete own org custom templates"
ON template
FOR DELETE
USING (
  org_id IN (
    SELECT org_id FROM app_user WHERE id = auth.uid()
  )
  AND kind = 'custom'
);

-- Policy: Service role can insert curated templates (org_id IS NULL)
-- This requires using the service role key in your seeding/migration scripts
CREATE POLICY "Service role can manage curated templates"
ON template
FOR ALL
USING (org_id IS NULL)
WITH CHECK (org_id IS NULL);
