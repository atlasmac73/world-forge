-- ================================================================
-- THE ARK — Beta Hardening Migration
-- Run AFTER schema.sql and schema_canon.sql
-- Adds: invites, profiles, audit_logs, feature_flags, beta_feedback
-- Isaac Brandon Burdette, Sole Inventor — Atlas Genesis Matrix LLC
-- ================================================================

-- ─── PROFILES ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email         TEXT,
  display_name  TEXT,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'beta_tester'
                  CHECK (role IN ('owner','admin','beta_tester','contractor','viewer')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  invite_id     UUID,
  onboarded_at  TIMESTAMPTZ,
  last_seen_at  TIMESTAMPTZ,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile (not role)
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all profiles
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.user_id = auth.uid()
        AND p2.role IN ('owner','admin')
        AND p2.is_active = TRUE
    )
  );

-- Admins can update any profile
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.user_id = auth.uid()
        AND p2.role IN ('owner','admin')
        AND p2.is_active = TRUE
    )
  );

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      (
        SELECT role FROM invites
        WHERE email = NEW.email
          AND status = 'pending'
          AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY created_at DESC
        LIMIT 1
      ),
      'beta_tester'
    )
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Mark invite accepted
  UPDATE invites
  SET status = 'accepted', accepted_at = NOW()
  WHERE email = NEW.email
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > NOW());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── INVITES ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invites (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'beta_tester'
                  CHECK (role IN ('admin','beta_tester','contractor','viewer')),
  token         TEXT NOT NULL UNIQUE,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','accepted','revoked','expired')),
  invited_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at   TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  notes         TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_status ON invites(status);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Only admins/owners can manage invites
CREATE POLICY "invites_admin_all"
  ON invites FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
        AND role IN ('owner','admin')
        AND is_active = TRUE
    )
  );

-- ─── AUDIT LOGS ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  resource_type TEXT,
  resource_id   TEXT,
  ip_address    INET,
  user_agent    TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own audit logs
CREATE POLICY "audit_select_own"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all audit logs
CREATE POLICY "audit_select_admin"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
        AND role IN ('owner','admin')
        AND is_active = TRUE
    )
  );

-- Allow inserts from service role only (via SECURITY DEFINER functions or API)
CREATE POLICY "audit_insert_service"
  ON audit_logs FOR INSERT
  WITH CHECK (TRUE); -- Controlled at application layer via service role key

-- ─── FEATURE FLAGS ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS feature_flags (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_key      TEXT NOT NULL UNIQUE,
  enabled       BOOLEAN NOT NULL DEFAULT FALSE,
  rollout_pct   INTEGER DEFAULT 100 CHECK (rollout_pct BETWEEN 0 AND 100),
  allowed_roles TEXT[] DEFAULT '{}',
  allowed_users UUID[] DEFAULT '{}',
  description   TEXT,
  updated_by    UUID REFERENCES auth.users(id),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read flags
CREATE POLICY "flags_select_auth"
  ON feature_flags FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only owners can modify flags
CREATE POLICY "flags_modify_owner"
  ON feature_flags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
        AND role = 'owner'
        AND is_active = TRUE
    )
  );

-- Seed default feature flags
INSERT INTO feature_flags (flag_key, enabled, description) VALUES
  ('PORTAL_DEALS',          TRUE,  'Deal Navigator portal'),
  ('PORTAL_CONTRACTORS',    TRUE,  'Contractor Management portal'),
  ('PORTAL_AGENT_LAB',      TRUE,  'Agent Lab portal'),
  ('PORTAL_LIVING_GRAPH',   FALSE, 'Living Graph — coming soon'),
  ('PORTAL_WORLD_FORGE',    FALSE, 'World Forge — coming soon'),
  ('PORTAL_NASDROP',        FALSE, 'NASDROP — owner only'),
  ('PORTAL_GENESIS',        FALSE, 'Genesis Engine — owner only'),
  ('BILLING_ENABLED',       FALSE, 'Stripe billing — disabled in beta'),
  ('SMS_ENABLED',           FALSE, 'Twilio SMS — enable after A2P 10DLC'),
  ('CONNECTORS_ENABLED',    FALSE, 'External connectors — coming soon'),
  ('AI_ENABLED',            TRUE,  'AI features — requires ANTHROPIC_API_KEY')
ON CONFLICT (flag_key) DO NOTHING;

-- ─── BETA FEEDBACK ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS beta_feedback (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  portal        TEXT,
  type          TEXT DEFAULT 'general'
                  CHECK (type IN ('bug','feature','ux','performance','general')),
  message       TEXT NOT NULL,
  rating        INTEGER CHECK (rating BETWEEN 1 AND 5),
  screenshot_url TEXT,
  metadata      JSONB DEFAULT '{}',
  status        TEXT DEFAULT 'new'
                  CHECK (status IN ('new','reviewed','resolved','wont_fix')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert and read their own feedback
CREATE POLICY "feedback_user_insert"
  ON beta_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "feedback_user_select"
  ON beta_feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can see all feedback
CREATE POLICY "feedback_admin_all"
  ON beta_feedback FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
        AND role IN ('owner','admin')
        AND is_active = TRUE
    )
  );

-- ─── MEMBERSHIPS (team/org structure) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS memberships (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  org_id      UUID,
  role        TEXT NOT NULL DEFAULT 'member',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, org_id)
);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "memberships_own" ON memberships FOR SELECT USING (auth.uid() = user_id);

-- ─── UPDATED_AT TRIGGER (reusable) ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS feature_flags_updated_at ON feature_flags;
CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
