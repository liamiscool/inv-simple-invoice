-- inv Database Schema
-- Multi-tenant invoice application with org-scoping

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ORGANIZATIONS
-- =====================================================
CREATE TABLE app_org (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for app_org
ALTER TABLE app_org ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own org"
  ON app_org FOR SELECT
  USING (id IN (
    SELECT org_id FROM app_user WHERE id = auth.uid()
  ));

-- =====================================================
-- USERS
-- =====================================================
CREATE TABLE app_user (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES app_org(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  phone TEXT,
  website TEXT,
  bank_details TEXT, -- Payment instructions for invoices
  default_currency TEXT DEFAULT 'USD',
  default_payment_terms INTEGER DEFAULT 30, -- Days
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for app_user
ALTER TABLE app_user ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON app_user FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON app_user FOR UPDATE
  USING (id = auth.uid());

-- =====================================================
-- CLIENTS
-- =====================================================
CREATE TABLE client (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES app_org(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for client
ALTER TABLE client ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their org's clients"
  ON client FOR ALL
  USING (org_id IN (
    SELECT org_id FROM app_user WHERE id = auth.uid()
  ));

-- =====================================================
-- TEMPLATES
-- =====================================================
CREATE TYPE template_type AS ENUM ('curated', 'user_uploaded');

CREATE TABLE template (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES app_org(id) ON DELETE CASCADE, -- NULL for curated templates
  type template_type NOT NULL DEFAULT 'curated',
  title TEXT NOT NULL,
  description TEXT,
  spec JSONB NOT NULL, -- Template specification
  preview_url TEXT, -- Stored in Supabase Storage
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for template
ALTER TABLE template ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view curated and their own templates"
  ON template FOR SELECT
  USING (
    type = 'curated' OR
    org_id IN (SELECT org_id FROM app_user WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage their own templates"
  ON template FOR ALL
  USING (org_id IN (
    SELECT org_id FROM app_user WHERE id = auth.uid()
  ));

-- =====================================================
-- INVOICES
-- =====================================================
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'void');

CREATE TABLE invoice (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES app_org(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES client(id) ON DELETE RESTRICT,
  template_id UUID REFERENCES template(id) ON DELETE SET NULL,
  number TEXT NOT NULL, -- e.g., INV-2025-0001
  status invoice_status DEFAULT 'draft',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  currency TEXT DEFAULT 'USD',
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_total NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  amount_paid NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, number)
);

-- RLS for invoice
ALTER TABLE invoice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their org's invoices"
  ON invoice FOR ALL
  USING (org_id IN (
    SELECT org_id FROM app_user WHERE id = auth.uid()
  ));

-- =====================================================
-- INVOICE ITEMS
-- =====================================================
CREATE TABLE invoice_item (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  qty NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 0, -- Percentage (e.g., 10.00 for 10%)
  line_total NUMERIC(12,2) GENERATED ALWAYS AS (qty * unit_price) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for invoice_item
ALTER TABLE invoice_item ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage items for their org's invoices"
  ON invoice_item FOR ALL
  USING (invoice_id IN (
    SELECT id FROM invoice WHERE org_id IN (
      SELECT org_id FROM app_user WHERE id = auth.uid()
    )
  ));

-- =====================================================
-- INVOICE PAYMENTS
-- =====================================================
CREATE TABLE invoice_payment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT, -- e.g., "Bank Transfer", "Check", etc.
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for invoice_payment
ALTER TABLE invoice_payment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage payments for their org's invoices"
  ON invoice_payment FOR ALL
  USING (invoice_id IN (
    SELECT id FROM invoice WHERE org_id IN (
      SELECT org_id FROM app_user WHERE id = auth.uid()
    )
  ));

-- =====================================================
-- SUBSCRIPTION MANAGEMENT
-- =====================================================
CREATE TYPE plan_type AS ENUM ('free', 'pro');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');

CREATE TABLE plan_subscription (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES app_org(id) ON DELETE CASCADE UNIQUE,
  plan plan_type NOT NULL DEFAULT 'free',
  status subscription_status DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for plan_subscription
ALTER TABLE plan_subscription ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's subscription"
  ON plan_subscription FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM app_user WHERE id = auth.uid()
  ));

-- =====================================================
-- CLIENT LIMIT TRACKING (Free Plan)
-- =====================================================
CREATE TABLE client_counter (
  org_id UUID PRIMARY KEY REFERENCES app_org(id) ON DELETE CASCADE,
  client_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for client_counter
ALTER TABLE client_counter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's client count"
  ON client_counter FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM app_user WHERE id = auth.uid()
  ));

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Update invoice totals when items change
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE invoice
  SET
    subtotal = (
      SELECT COALESCE(SUM(line_total), 0)
      FROM invoice_item
      WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
    ),
    tax_total = (
      SELECT COALESCE(SUM(line_total * (tax_rate / 100)), 0)
      FROM invoice_item
      WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
    ),
    total = (
      SELECT COALESCE(SUM(line_total * (1 + tax_rate / 100)), 0)
      FROM invoice_item
      WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_item_update_totals
AFTER INSERT OR UPDATE OR DELETE ON invoice_item
FOR EACH ROW
EXECUTE FUNCTION update_invoice_totals();

-- Function: Update invoice amount_paid when payments change
CREATE OR REPLACE FUNCTION update_invoice_amount_paid()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE invoice
  SET
    amount_paid = (
      SELECT COALESCE(SUM(amount), 0)
      FROM invoice_payment
      WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
    ),
    status = CASE
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM invoice_payment WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)) >= total THEN 'paid'::invoice_status
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM invoice_payment WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)) > 0 THEN 'partially_paid'::invoice_status
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_payment_update_paid
AFTER INSERT OR UPDATE OR DELETE ON invoice_payment
FOR EACH ROW
EXECUTE FUNCTION update_invoice_amount_paid();

-- Function: Update client counter
CREATE OR REPLACE FUNCTION update_client_counter()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO client_counter (org_id, client_count, updated_at)
    VALUES (NEW.org_id, 1, NOW())
    ON CONFLICT (org_id)
    DO UPDATE SET client_count = client_counter.client_count + 1, updated_at = NOW();
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE client_counter
    SET client_count = GREATEST(client_count - 1, 0), updated_at = NOW()
    WHERE org_id = OLD.org_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_counter_trigger
AFTER INSERT OR DELETE ON client
FOR EACH ROW
EXECUTE FUNCTION update_client_counter();

-- Function: Auto-create org and subscription for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create organization
  INSERT INTO app_org (name) VALUES (NEW.email || '''s Organization')
  RETURNING id INTO new_org_id;

  -- Create user profile
  INSERT INTO app_user (id, org_id, email, full_name)
  VALUES (NEW.id, new_org_id, NEW.email, NEW.raw_user_meta_data->>'full_name');

  -- Create free plan subscription
  INSERT INTO plan_subscription (org_id, plan, status)
  VALUES (new_org_id, 'free', 'active');

  -- Initialize client counter
  INSERT INTO client_counter (org_id, client_count)
  VALUES (new_org_id, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_app_user_org_id ON app_user(org_id);
CREATE INDEX idx_client_org_id ON client(org_id);
CREATE INDEX idx_template_org_id ON template(org_id);
CREATE INDEX idx_template_type ON template(type);
CREATE INDEX idx_invoice_org_id ON invoice(org_id);
CREATE INDEX idx_invoice_client_id ON invoice(client_id);
CREATE INDEX idx_invoice_status ON invoice(status);
CREATE INDEX idx_invoice_item_invoice_id ON invoice_item(invoice_id);
CREATE INDEX idx_invoice_payment_invoice_id ON invoice_payment(invoice_id);
CREATE INDEX idx_plan_subscription_org_id ON plan_subscription(org_id);
CREATE INDEX idx_plan_subscription_stripe_customer_id ON plan_subscription(stripe_customer_id);
