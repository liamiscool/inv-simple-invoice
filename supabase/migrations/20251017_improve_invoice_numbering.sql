-- Improve invoice numbering with smart counter reclaim and year rollover

-- Drop and recreate the function with improved logic
DROP FUNCTION IF EXISTS next_invoice_number(UUID, UUID);

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
  v_highest_number INTEGER;
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
      -- Find the highest invoice number for this client and year
      -- This provides smart counter reclaim: gaps are automatically filled
      SELECT COALESCE(MAX(
        CASE
          WHEN number ~ ('^' || v_prefix || '-' || v_year || '-[0-9]+$')
          THEN CAST(SUBSTRING(number FROM (v_prefix || '-' || v_year || '-([0-9]+)$')) AS INTEGER)
          ELSE 0
        END
      ), 0)
      INTO v_highest_number
      FROM invoice
      WHERE org_id = p_org_id
        AND client_id = p_client_id
        AND number LIKE v_prefix || '-' || v_year || '-%';

      -- If no invoices exist for this year yet, use the starting counter from client
      IF v_highest_number = 0 THEN
        -- Check if this is a new year (no invoices for this client/year combo)
        SELECT current_counter INTO v_counter
        FROM client_invoice_counter
        WHERE client_id = p_client_id AND year = v_year;

        -- If counter doesn't exist for this year, use client's starting number
        IF NOT FOUND THEN
          v_counter := v_counter; -- Use the invoice_counter from client table
        END IF;
      ELSE
        -- Use next number after highest (this auto-reclaims gaps)
        v_counter := v_highest_number + 1;
      END IF;

      -- Update or create counter tracker
      INSERT INTO client_invoice_counter (client_id, year, current_counter)
      VALUES (p_client_id, v_year, v_counter)
      ON CONFLICT (client_id, year)
      DO UPDATE SET
        current_counter = v_counter,
        updated_at = NOW();

      -- Format: PREFIX-YYYY-NNN
      v_invoice_number := v_prefix || '-' || v_year || '-' || LPAD(v_counter::TEXT, 3, '0');
      RETURN v_invoice_number;
    END IF;
  END IF;

  -- Default: Use global INV-YYYY-NNNN format
  -- Find the highest invoice number for this org and year with INV prefix
  -- This automatically reclaims gaps when invoices are deleted
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
COMMENT ON FUNCTION next_invoice_number(UUID, UUID) IS 'Generates next invoice number with smart counter reclaim and year rollover - either custom client prefix (e.g., NATHAN-2025-001) or global format (INV-2025-0001)';
