-- Add billing and subscription management tables
-- Only creates tables that don't exist yet

-- =====================================================
-- SUBSCRIPTION MANAGEMENT
-- =====================================================
DO $$ BEGIN
  CREATE TYPE plan_type AS ENUM ('free', 'pro');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS plan_subscription (
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

DROP POLICY IF EXISTS "Users can view their org's subscription" ON plan_subscription;
CREATE POLICY "Users can view their org's subscription"
  ON plan_subscription FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM app_user WHERE id = auth.uid()
  ));

-- =====================================================
-- CLIENT LIMIT TRACKING (Free Plan)
-- =====================================================
CREATE TABLE IF NOT EXISTS client_counter (
  org_id UUID PRIMARY KEY REFERENCES app_org(id) ON DELETE CASCADE,
  client_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for client_counter
ALTER TABLE client_counter ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their org's client count" ON client_counter;
CREATE POLICY "Users can view their org's client count"
  ON client_counter FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM app_user WHERE id = auth.uid()
  ));

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

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

DROP TRIGGER IF EXISTS client_counter_trigger ON client;
CREATE TRIGGER client_counter_trigger
AFTER INSERT OR DELETE ON client
FOR EACH ROW
EXECUTE FUNCTION update_client_counter();

-- Function: Update handle_new_user to include subscription and counter
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Check if user already has an org (prevent duplicates on re-trigger)
  SELECT org_id INTO new_org_id FROM app_user WHERE id = NEW.id;

  IF new_org_id IS NULL THEN
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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_plan_subscription_org_id ON plan_subscription(org_id);
CREATE INDEX IF NOT EXISTS idx_plan_subscription_stripe_customer_id ON plan_subscription(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_plan_subscription_stripe_subscription_id ON plan_subscription(stripe_subscription_id);

-- =====================================================
-- INITIALIZE EXISTING ORGS
-- =====================================================
-- Create subscription records for any existing orgs that don't have one
INSERT INTO plan_subscription (org_id, plan, status)
SELECT id, 'free', 'active'
FROM app_org
WHERE id NOT IN (SELECT org_id FROM plan_subscription)
ON CONFLICT (org_id) DO NOTHING;

-- Initialize client counters for existing orgs
INSERT INTO client_counter (org_id, client_count, updated_at)
SELECT
  o.id,
  (SELECT COUNT(*) FROM client WHERE org_id = o.id),
  NOW()
FROM app_org o
WHERE o.id NOT IN (SELECT org_id FROM client_counter)
ON CONFLICT (org_id) DO NOTHING;
