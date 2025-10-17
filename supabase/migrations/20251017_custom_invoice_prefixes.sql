-- Add custom invoice prefix support to client table
ALTER TABLE client
  ADD COLUMN use_custom_invoice_prefix BOOLEAN DEFAULT FALSE,
  ADD COLUMN invoice_prefix TEXT,
  ADD COLUMN invoice_counter INTEGER DEFAULT 1;

-- Add comments to document the purpose of these columns
COMMENT ON COLUMN client.use_custom_invoice_prefix IS 'Whether this client uses a custom invoice number prefix (e.g., NATHAN-2025-001)';
COMMENT ON COLUMN client.invoice_prefix IS 'Custom prefix for invoice numbers (e.g., NATHAN, SOLARBANK)';
COMMENT ON COLUMN client.invoice_counter IS 'Starting counter for custom invoice numbers (default: 1)';

-- Create table to track per-client invoice counters by year
CREATE TABLE IF NOT EXISTS client_invoice_counter (
  client_id UUID NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  current_counter INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (client_id, year)
);

-- Add index for faster lookups
CREATE INDEX idx_client_invoice_counter_client_year ON client_invoice_counter(client_id, year);

-- Add comment
COMMENT ON TABLE client_invoice_counter IS 'Tracks sequential invoice numbers for clients with custom prefixes, organized by year';

-- Drop existing next_invoice_number function
DROP FUNCTION IF EXISTS next_invoice_number(UUID);

-- Recreate next_invoice_number function with client_id parameter support
CREATE OR REPLACE FUNCTION next_invoice_number(
  p_org_id UUID,
  p_client_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year INTEGER;
  v_counter INTEGER;
  v_prefix TEXT;
  v_use_custom BOOLEAN;
  v_invoice_number TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM NOW());

  -- Check if client has custom prefix enabled
  IF p_client_id IS NOT NULL THEN
    SELECT use_custom_invoice_prefix, invoice_prefix, invoice_counter
    INTO v_use_custom, v_prefix, v_counter
    FROM client
    WHERE id = p_client_id AND org_id = p_org_id;

    -- If client uses custom prefix
    IF v_use_custom = TRUE AND v_prefix IS NOT NULL THEN
      -- Get or create counter for this client/year
      INSERT INTO client_invoice_counter (client_id, year, current_counter)
      VALUES (p_client_id, v_year, v_counter)
      ON CONFLICT (client_id, year)
      DO UPDATE SET
        current_counter = client_invoice_counter.current_counter + 1,
        updated_at = NOW()
      RETURNING current_counter INTO v_counter;

      -- If this is a new year, use the initial counter from client table
      IF NOT FOUND THEN
        v_counter := v_counter;
      END IF;

      -- Format: PREFIX-YYYY-NNN
      v_invoice_number := v_prefix || '-' || v_year || '-' || LPAD(v_counter::TEXT, 3, '0');
      RETURN v_invoice_number;
    END IF;
  END IF;

  -- Default: Use global INV-YYYY-NNNN format
  -- Find the highest invoice number for this org and year with INV prefix
  SELECT COALESCE(MAX(
    CASE
      WHEN number ~ '^INV-[0-9]{4}-[0-9]+$'
      THEN CAST(SUBSTRING(number FROM 'INV-[0-9]{4}-([0-9]+)$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO v_counter
  FROM invoice
  WHERE org_id = p_org_id
    AND number LIKE 'INV-' || v_year || '-%';

  v_invoice_number := 'INV-' || v_year || '-' || LPAD(v_counter::TEXT, 4, '0');
  RETURN v_invoice_number;
END;
$$;

-- Add comment
COMMENT ON FUNCTION next_invoice_number(UUID, UUID) IS 'Generates next invoice number - either custom client prefix (e.g., NATHAN-2025-001) or global format (INV-2025-0001)';
