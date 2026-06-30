-- ================================================================
-- THE ARK — Master Canon Extended Schema
-- Supermassive Canonical Specification v1.0
-- Atlas Genesis Matrix LLC · Isaac Brandon Burdette, Sole Inventor
--
-- Run AFTER schema.sql
-- Adds: Data Fabric, Identity Engine, Permission Engine,
--       Object Engine, Knowledge Graph, Memory Engine, Event Bus,
--       200-Category Taxonomy, Kanban Intelligence, AI Tournament,
--       Living Graph, Connectors, Workflows, Outcomes, SovereignGate
-- ================================================================

-- ─── IDENTITY ENGINE (Layer 1, Cat 81) ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS atlas_identities (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  atlas_id    TEXT UNIQUE NOT NULL DEFAULT 'ATL-' || upper(substr(md5(random()::text), 1, 8)),
  display_name TEXT,
  roles       TEXT[] DEFAULT '{"member"}',
  is_founder  BOOLEAN DEFAULT FALSE,
  is_admin    BOOLEAN DEFAULT FALSE,
  tier_code   TEXT DEFAULT 'T1',
  device_ids  TEXT[],
  org_ids     UUID[],
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE atlas_identities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own identity" ON atlas_identities FOR ALL USING (auth.uid() = user_id);

-- ─── OBJECT ENGINE (Layer 1, Cat 84) ─────────────────────────────────────────
-- Every piece of information becomes an Atlas Object

CREATE TABLE IF NOT EXISTS atlas_objects (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  object_type     TEXT NOT NULL CHECK (object_type IN (
    'person','organization','project','asset','property','document','communication',
    'task','event','workflow','goal','knowledge','agent','skill','memory',
    'location','device','connector','permission','vault','blueprint','bid',
    'contract','invoice','lead','deal','twin','simulation','canvas'
  )),
  owner_user_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id          UUID,
  title           TEXT NOT NULL,
  description     TEXT,
  content         TEXT,
  content_type    TEXT DEFAULT 'text/plain',
  visibility      TEXT DEFAULT 'private' CHECK (visibility IN ('private','org','public','invite')),
  permission_scope JSONB DEFAULT '{}',
  tags            TEXT[] DEFAULT '{}',
  relationships   JSONB DEFAULT '[]',
  embeddings_ref  TEXT,
  source_url      TEXT,
  source_type     TEXT,
  metadata        JSONB DEFAULT '{}',
  version         INTEGER DEFAULT 1,
  is_archived     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE atlas_objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own objects" ON atlas_objects FOR ALL USING (auth.uid() = owner_user_id);
CREATE INDEX idx_objects_type ON atlas_objects(object_type);
CREATE INDEX idx_objects_user ON atlas_objects(owner_user_id);

-- Object versions
CREATE TABLE IF NOT EXISTS object_versions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  object_id   UUID REFERENCES atlas_objects(id) ON DELETE CASCADE,
  version     INTEGER NOT NULL,
  content     TEXT,
  metadata    JSONB,
  changed_by  UUID REFERENCES auth.users(id),
  changed_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE object_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own versions" ON object_versions FOR SELECT USING (
  EXISTS (SELECT 1 FROM atlas_objects WHERE id = object_id AND owner_user_id = auth.uid())
);

-- ─── KNOWLEDGE GRAPH (Layer 2, Cat 86) ────────────────────────────────────────
-- Stores relationships, not files. Neo4j-compatible structure in Postgres.

CREATE TABLE IF NOT EXISTS graph_nodes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  node_type   TEXT NOT NULL,
  label       TEXT NOT NULL,
  properties  JSONB DEFAULT '{}',
  object_id   UUID REFERENCES atlas_objects(id) ON DELETE SET NULL,
  graph_type  TEXT DEFAULT 'personal' CHECK (graph_type IN (
    'personal','organization','project','property','knowledge',
    'memory','workflow','agent','permission','world'
  )),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE graph_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own nodes" ON graph_nodes FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS graph_edges (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_node_id  UUID REFERENCES graph_nodes(id) ON DELETE CASCADE,
  target_node_id  UUID REFERENCES graph_nodes(id) ON DELETE CASCADE,
  relationship    TEXT NOT NULL,
  weight          NUMERIC DEFAULT 1.0,
  properties      JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE graph_edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own edges" ON graph_edges FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS graph_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seed_term   TEXT,
  nodes_count INTEGER DEFAULT 0,
  edges_count INTEGER DEFAULT 0,
  graph_data  JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE graph_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own sessions" ON graph_sessions FOR ALL USING (auth.uid() = user_id);

-- ─── MEMORY ENGINE (Layer 2, Cat 87) ─────────────────────────────────────────
-- 7 memory scopes: Conversation → Project → Property → Organization → Portfolio → Agent → World

CREATE TABLE IF NOT EXISTS atlas_memories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scope       TEXT NOT NULL CHECK (scope IN (
    'conversation','project','property','organization','portfolio','agent','world'
  )),
  subject_id  UUID,
  subject_type TEXT,
  content     TEXT NOT NULL,
  summary     TEXT,
  importance  INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  freshness   NUMERIC DEFAULT 1.0,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,
  is_pinned   BOOLEAN DEFAULT FALSE,
  tags        TEXT[],
  agent_code  TEXT,
  embedding_ref TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE atlas_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own memories" ON atlas_memories FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_memories_scope ON atlas_memories(scope);
CREATE INDEX idx_memories_user ON atlas_memories(user_id);

-- ─── EVENT BUS (Layer 1, Cat 88) ──────────────────────────────────────────────
-- The nervous system. One event → graph + memory + agents + workflows + kanban + recommendations

CREATE TABLE IF NOT EXISTS atlas_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  source      TEXT,
  subject_id  UUID,
  subject_type TEXT,
  payload     JSONB DEFAULT '{}',
  processed   BOOLEAN DEFAULT FALSE,
  agents_notified TEXT[],
  workflows_triggered TEXT[],
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE atlas_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own events" ON atlas_events FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_events_type ON atlas_events(event_type);
CREATE INDEX idx_events_processed ON atlas_events(processed);

-- ─── PERMISSION ENGINE (Layer 1, Cat 85) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS atlas_permissions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  granter_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  grantee_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  grantee_agent   TEXT,
  object_id       UUID REFERENCES atlas_objects(id) ON DELETE CASCADE,
  object_type     TEXT,
  permission_type TEXT NOT NULL CHECK (permission_type IN (
    'read','write','analyze','share','export','delete','train','automate','delegate'
  )),
  grant_type      TEXT DEFAULT 'approve_once' CHECK (grant_type IN (
    'approve_once','approve_always','never','expiring'
  )),
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT TRUE,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE atlas_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Granters manage permissions" ON atlas_permissions FOR ALL USING (auth.uid() = granter_user_id);
CREATE POLICY "Grantees read permissions" ON atlas_permissions FOR SELECT USING (auth.uid() = grantee_user_id);

-- ─── CONNECTORS (Layer 1, Cat 82) ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS connector_accounts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  connector_type  TEXT NOT NULL,
  connector_name  TEXT NOT NULL,
  access_token    TEXT,
  refresh_token   TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes          TEXT[] DEFAULT '{}',
  is_read_only    BOOLEAN DEFAULT TRUE,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','expired','revoked','error')),
  metadata        JSONB DEFAULT '{}',
  connected_at    TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at  TIMESTAMPTZ
);
ALTER TABLE connector_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own connectors" ON connector_accounts FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS connector_events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connector_id  UUID REFERENCES connector_accounts(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL,
  payload       JSONB,
  processed     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE connector_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own connector events" ON connector_events FOR ALL USING (auth.uid() = user_id);

-- ─── KANBAN INTELLIGENCE (Cat 28) ─────────────────────────────────────────────
-- 15 cognitive columns, 10 card types

CREATE TABLE IF NOT EXISTS kanban_boards (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Deal Pipeline',
  board_type  TEXT DEFAULT 'deal',
  settings    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE kanban_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own boards" ON kanban_boards FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS kanban_cards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id        UUID REFERENCES kanban_boards(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  card_type       TEXT DEFAULT 'opportunity' CHECK (card_type IN (
    'opportunity','risk','decision','research','execution',
    'automation','patent','revenue','strategy','discovery'
  )),
  column_name     TEXT DEFAULT 'Inbox' CHECK (column_name IN (
    'Inbox','Captured','Research','Discovery','Opportunity','Risk',
    'Recommendation','Decision Required','Approved','Planned',
    'In Progress','Waiting','Blocked','Completed','Knowledge Base'
  )),
  priority_score  NUMERIC DEFAULT 50,
  opportunity_score NUMERIC,
  risk_score      NUMERIC,
  complexity_score NUMERIC,
  confidence_score NUMERIC,
  revenue_score   NUMERIC,
  automation_score NUMERIC,
  strategic_score NUMERIC,
  description     TEXT,
  related_property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  related_agent   TEXT,
  tags            TEXT[],
  due_date        DATE,
  created_by_agent TEXT,
  approved_at     TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own cards" ON kanban_cards FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_kanban_user ON kanban_cards(user_id);
CREATE INDEX idx_kanban_column ON kanban_cards(column_name);

-- ─── AI TOURNAMENT (Cat 29) ───────────────────────────────────────────────────
-- Multi-model reasoning, 7 levels

CREATE TABLE IF NOT EXISTS ai_tournaments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question        TEXT NOT NULL,
  tournament_level INTEGER DEFAULT 1 CHECK (tournament_level BETWEEN 1 AND 7),
  models_used     TEXT[] DEFAULT '{"claude-sonnet-4-20250514"}',
  responses       JSONB DEFAULT '[]',
  debate_rounds   JSONB DEFAULT '[]',
  consensus       TEXT,
  synthesis       TEXT,
  winning_model   TEXT,
  option_cards    JSONB DEFAULT '[]',
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','running','complete','failed')),
  tokens_total    INTEGER DEFAULT 0,
  cost_usd        NUMERIC DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);
ALTER TABLE ai_tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own tournaments" ON ai_tournaments FOR ALL USING (auth.uid() = user_id);

-- ─── LIVING GRAPH / MIND MAP OS (Cat 27) ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS mind_map_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seed_term   TEXT NOT NULL,
  graph_mode  TEXT DEFAULT 'personal' CHECK (graph_mode IN (
    'mind_map','property','construction','legal','finance','worldforge',
    'software_build','connector','model','workflow','command','research',
    'offline','privacy','prompt_pack','automation','simulation','transmedia',
    'personal','organization'
  )),
  nodes       JSONB DEFAULT '[]',
  edges       JSONB DEFAULT '[]',
  node_count  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE mind_map_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own mind maps" ON mind_map_sessions FOR ALL USING (auth.uid() = user_id);

-- ─── WORKFLOWS (Cat 38 — Automation Engine) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS workflow_registry (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  trigger_type      TEXT CHECK (trigger_type IN (
    'manual','event','schedule','agent','webhook','condition'
  )),
  trigger_config    JSONB DEFAULT '{}',
  steps             JSONB DEFAULT '[]',
  autonomy_level    INTEGER DEFAULT 1 CHECK (autonomy_level BETWEEN 1 AND 7),
  is_active         BOOLEAN DEFAULT TRUE,
  n8n_workflow_id   TEXT,
  last_run_at       TIMESTAMPTZ,
  run_count         INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE workflow_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own workflows" ON workflow_registry FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS workflow_runs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id   UUID REFERENCES workflow_registry(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status        TEXT DEFAULT 'pending' CHECK (status IN (
    'pending','running','waiting_for_approval','completed','failed','cancelled'
  )),
  input         JSONB,
  result        JSONB,
  error         TEXT,
  steps_log     JSONB DEFAULT '[]',
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own runs" ON workflow_runs FOR ALL USING (auth.uid() = user_id);

-- ─── PROMPT REGISTRY (UCIM / Skills) ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prompt_registry (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_code   TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  category      TEXT,
  agent_code    TEXT,
  tier_required TEXT DEFAULT 'T1',
  version       TEXT DEFAULT 'v1',
  prompt_body   TEXT NOT NULL,
  model_pref    TEXT DEFAULT 'claude-sonnet-4-20250514',
  offline_ok    BOOLEAN DEFAULT FALSE,
  token_estimate INTEGER DEFAULT 500,
  is_active     BOOLEAN DEFAULT TRUE,
  usage_count   INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE prompt_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read prompts" ON prompt_registry FOR SELECT USING (auth.uid() IS NOT NULL);

-- Seed key prompts from the canon
INSERT INTO prompt_registry (prompt_code, name, category, agent_code, prompt_body) VALUES
  ('A12-SKIP-TRACE',    'Skip Trace Owner Lookup',    'real_estate', 'A12-SPECTER',  'Find all contact information for property owner. Return JSON: found_phone[], found_email[], confidence_score.'),
  ('A15-DISTRESS',      '8-Factor Distress Score',    'real_estate', 'A15-OMEN',    'Score property distress on 8 factors (0-100 each): tax_delinquency, vacancy, code_violations, foreclosure_risk, absentee_owner, liens, days_on_market, physical_condition. Return weighted distress_score, heat_level, deal_grade.'),
  ('A06-SMS-7TOUCH',    '7-Touch TCPA SMS Sequence',  'marketing',   'A06-HERALD',  'Write 7-touch outreach SMS for distressed property owner. WV culture, empathetic, direct. Max 160 chars each. Include Reply STOP.'),
  ('A03-WORLDBUILD',    'Leon Therano Lore Generator','transmedia',  'A03-GENESIS', 'Generate canon-consistent lore for the Leon Therano universe. ATLAS OS = reality source code. Elias = anomaly. Oracle = antagonist AI. Return structured JSON with type, title, description, atlas_metaphor.'),
  ('A45-BID-NORMALIZE', 'A45 Bid Normalizer',         'construction','A54-BID',     'Parse unstructured contractor bid text into normalized JSON. Return ONLY valid JSON: contractor_name, scope, line_items[], total, unit_costs, confidence. NEVER fabricate numbers. NEVER add markdown.'),
  ('A17-COMPS',         'Comparable Sales Heuristic', 'real_estate', 'A103-COMPS',  'Analyze comparable sales for property. Return: avg_arv, price_per_sqft, adjustment_factors[], confidence_score, comps[] with address+sold_price+sqft+age.'),
  ('P001-OMNIFOLD',     'OMNIFOLD Device Lore',       'transmedia',  'A230-LEON',   'The OMNIFOLD device is the in-universe manifestation of ATLAS OS — it bridges software architecture and physical reality. Generate a description of the device, its powers, and how it mirrors the ATLAS platform architecture.')
ON CONFLICT (prompt_code) DO NOTHING;

-- ─── DISCOVERY ENGINE (Cat 26) ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS discovery_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  discovery_type  TEXT NOT NULL CHECK (discovery_type IN (
    'opportunity','connection','pattern','missing_info','hidden_risk',
    'hidden_revenue','automation_opportunity','invention','cross_domain','serendipity'
  )),
  title           TEXT NOT NULL,
  description     TEXT,
  confidence      NUMERIC DEFAULT 50,
  value_score     NUMERIC,
  urgency_score   NUMERIC,
  source_nodes    UUID[],
  related_agents  TEXT[],
  kanban_card_id  UUID REFERENCES kanban_cards(id) ON DELETE SET NULL,
  status          TEXT DEFAULT 'new' CHECK (status IN ('new','reviewed','actioned','dismissed')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE discovery_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own discoveries" ON discovery_events FOR ALL USING (auth.uid() = user_id);

-- ─── RECOMMENDATIONS (Cat 31 — Next-Best-Action) ─────────────────────────────
-- 7 option cards: A=Safest, B=Balanced, C=Aggressive, D=Automation, E=Innovation, F=Hidden, G=God

CREATE TABLE IF NOT EXISTS recommendations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type TEXT DEFAULT 'action',
  context           TEXT,
  option_a          JSONB,
  option_b          JSONB,
  option_c          JSONB,
  option_d          JSONB,
  option_e          JSONB,
  option_f          JSONB,
  option_g          JSONB,
  selected_option   TEXT,
  outcome_tracked   BOOLEAN DEFAULT FALSE,
  related_property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  generating_agent  TEXT,
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','expired')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  expires_at        TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own recommendations" ON recommendations FOR ALL USING (auth.uid() = user_id);

-- ─── OUTCOME TRACKING (Cat Evolution PR-115) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS outcome_tracking (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_id     UUID REFERENCES recommendations(id) ON DELETE SET NULL,
  agent_run_id          UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
  outcome_type          TEXT CHECK (outcome_type IN (
    'money_earned','money_saved','time_saved','risk_avoided',
    'relationship_improved','opportunity_created','knowledge_gained',
    'workflow_completed','decision_improved','deal_won','deal_lost'
  )),
  expected_outcome      TEXT,
  actual_outcome        TEXT,
  expected_value        NUMERIC,
  actual_value          NUMERIC,
  lessons_learned       TEXT,
  status                TEXT DEFAULT 'pending' CHECK (status IN ('pending','measured','archived')),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE outcome_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own outcomes" ON outcome_tracking FOR ALL USING (auth.uid() = user_id);

-- ─── IMPROVEMENT QUEUE (Cat Evolution PR-120) ────────────────────────────────

CREATE TABLE IF NOT EXISTS improvement_queue (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type     TEXT NOT NULL CHECK (source_type IN (
    'user_feedback','failed_workflow','rejected_recommendation','slow_task',
    'high_cost_model','low_confidence','repeated_correction','agent_failure'
  )),
  source_id       UUID,
  title           TEXT NOT NULL,
  description     TEXT,
  priority_score  NUMERIC DEFAULT 50,
  impact_estimate NUMERIC DEFAULT 50,
  affected_agent  TEXT,
  affected_skill  TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN (
    'pending','in_progress','deployed','rejected','archived'
  )),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE improvement_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own improvement items" ON improvement_queue FOR ALL USING (auth.uid() = user_id);

-- ─── DIGITAL TWINS (Cat 16) ───────────────────────────────────────────────────
-- 7 levels: Property → Building → Project → Facility → Portfolio → Regional → World

CREATE TABLE IF NOT EXISTS digital_twins (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  twin_level      INTEGER DEFAULT 1 CHECK (twin_level BETWEEN 1 AND 7),
  twin_type       TEXT CHECK (twin_type IN (
    'property','building','project','facility','portfolio','regional','world'
  )),
  name            TEXT NOT NULL,
  related_id      UUID,
  scan_source     TEXT,
  point_cloud_url TEXT,
  model_url       TEXT,
  thumbnail_url   TEXT,
  sqft            NUMERIC,
  condition_score NUMERIC,
  lifecycle_stage TEXT,
  last_inspected  TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE digital_twins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own twins" ON digital_twins FOR ALL USING (auth.uid() = user_id);

-- ─── MLS LISTINGS (Cat 1/2 — Real Data) ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS mls_listings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mls_id          TEXT UNIQUE,
  address         TEXT NOT NULL,
  city            TEXT,
  state           TEXT DEFAULT 'WV',
  zip             TEXT,
  list_price      NUMERIC,
  sold_price      NUMERIC,
  bedrooms        INTEGER,
  bathrooms       NUMERIC,
  sqft            INTEGER,
  year_built      INTEGER,
  days_on_market  INTEGER,
  status          TEXT,
  property_type   TEXT,
  description     TEXT,
  photos_count    INTEGER DEFAULT 0,
  synced_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE mls_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read MLS" ON mls_listings FOR SELECT USING (auth.uid() IS NOT NULL);

-- ─── BLUEPRINTS (Cat 13) ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS blueprints (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id     UUID REFERENCES properties(id) ON DELETE SET NULL,
  file_name       TEXT NOT NULL,
  file_url        TEXT,
  file_type       TEXT CHECK (file_type IN ('dwg','dxf','pdf','jpg','png','rvt','ifc')),
  floor_count     INTEGER,
  total_sqft      NUMERIC,
  rooms_detected  JSONB DEFAULT '[]',
  structural_notes TEXT,
  mechanical_notes TEXT,
  ada_compliance  BOOLEAN,
  ai_analysis     JSONB DEFAULT '{}',
  permit_status   TEXT,
  uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own blueprints" ON blueprints FOR ALL USING (auth.uid() = user_id);

-- ─── SOVEREIGN GATE (A6 — SovereignGate) ─────────────────────────────────────
-- Admin-only control plane. Server-authoritative RBAC + RLS. Immutable audit.

CREATE TABLE IF NOT EXISTS sovereign_gate_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  resource    TEXT,
  ip_address  TEXT,
  user_agent  TEXT,
  payload     JSONB,
  success     BOOLEAN DEFAULT TRUE,
  session_id  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
-- RLS: only service_role can write, admins can read their own
ALTER TABLE sovereign_gate_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service manages sovereign log" ON sovereign_gate_log FOR INSERT USING (true);
CREATE POLICY "Admins read sovereign log" ON sovereign_gate_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM atlas_identities WHERE user_id = auth.uid() AND is_admin = TRUE)
);

-- ─── ATLAS CONSTITUTION (Cat 80) ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS atlas_constitution (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clause_id   TEXT UNIQUE NOT NULL,
  article     TEXT NOT NULL,
  clause_text TEXT NOT NULL,
  is_immutable BOOLEAN DEFAULT TRUE,
  last_reviewed TIMESTAMPTZ DEFAULT NOW(),
  approved_by TEXT DEFAULT 'Isaac Brandon Burdette'
);
ALTER TABLE atlas_constitution ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All read constitution" ON atlas_constitution FOR SELECT USING (true);

INSERT INTO atlas_constitution (clause_id, article, clause_text) VALUES
  ('AC-01', 'Data Sovereignty', 'Atlas cannot sell user data. User data belongs exclusively to the user.'),
  ('AC-02', 'Training Consent', 'Atlas cannot secretly train on user data. All model training requires explicit opt-in consent.'),
  ('AC-03', 'Permissions', 'Atlas cannot bypass user permissions. Every action requires a valid permission grant.'),
  ('AC-04', 'Ownership', 'Atlas cannot revoke user ownership of their data. Users may export and delete at any time.'),
  ('AC-05', 'Surveillance', 'Atlas cannot create hidden surveillance. Every data collection event is logged and user-visible.'),
  ('AC-06', 'Stewardship', 'ATLAS seeks stewardship of permissions, never ownership of data.'),
  ('AC-07', 'Admin Access', 'Even Atlas administrators do not have unrestricted access. All admin actions are logged.'),
  ('AC-08', 'Founder Gate', 'Founder approval required for all irreversible or core system changes.'),
  ('AC-09', 'Cross-User Data', 'Private raw data NEVER crosses users. Cross-user learning uses only anonymized patterns and opt-in templates.'),
  ('AC-10', 'The Atlas Test', 'Every feature must pass: If the user saw this happening, would they be glad Atlas did it?')
ON CONFLICT (clause_id) DO NOTHING;

-- ─── SKILLS EXTENDED (200-Category Taxonomy) ──────────────────────────────────
-- Seeds initial skills from all 200 categories

INSERT INTO skills (skill_code, category, skill_name, description, tier_required, ai_agent) VALUES
-- Cat 1: Driving for Dollars
('SK-0001', 'D4D', 'GPS Pin Drop', 'Drop GPS pin on distressed property during D4D route', 'T1', 'A01-ORACLE'),
('SK-0002', 'D4D', 'Vacancy Detection', 'Detect vacant properties from visual cues', 'T1', 'A27-HUNTER'),
('SK-0003', 'D4D', 'Absentee Owner Finder', 'Find absentee owners from county records', 'T2', 'A12-SPECTER'),
('SK-0004', 'D4D', 'Route Optimizer', 'Optimize D4D driving route by distress density', 'T1', 'A29-PROBE'),
('SK-0005', 'D4D', 'Photo Capture', 'Capture property photos with GPS metadata', 'T1', 'A26-SCOUT'),
('SK-0006', 'D4D', 'Distress Visual Score', 'Score visual distress from photo', 'T1', 'A15-OMEN'),
('SK-0007', 'D4D', 'Neighborhood Heat Score', 'Score neighborhood acquisition opportunity', 'T2', 'A15-OMEN'),
('SK-0008', 'D4D', 'Offline Queue Sync', 'Sync offline D4D data when connectivity restores', 'T1', 'A01-ORACLE'),
-- Cat 2: Property Intelligence
('SK-0026', 'property_intelligence', 'County Assessor Lookup', 'Pull county assessor data for any WV parcel', 'T1', 'A16-TEMPEST'),
('SK-0027', 'property_intelligence', 'Deed History Research', 'Pull full chain of title from county records', 'T2', 'A29-PROBE'),
('SK-0028', 'property_intelligence', 'Lien Search', 'Search all filed liens against property', 'T2', 'A29-PROBE'),
('SK-0029', 'property_intelligence', 'Tax Delinquency Check', 'Check WV tax delinquency status', 'T1', 'A30-REAPER'),
('SK-0030', 'property_intelligence', 'Equity Calculator', 'Calculate owner equity position', 'T1', 'A104-EQUITY'),
-- Cat 3: Seller Acquisition
('SK-0051', 'seller_acquisition', '7-Touch SMS Sequence', 'Generate 7-touch outreach for seller', 'T2', 'A06-HERALD'),
('SK-0052', 'seller_acquisition', 'Seller Motivation Analysis', 'Identify primary seller motivation (taxes/divorce/probate/etc)', 'T2', 'A15-OMEN'),
('SK-0053', 'seller_acquisition', 'LOI Generator', 'Generate WV Letter of Intent', 'T2', 'A76-COUNSEL'),
('SK-0054', 'seller_acquisition', 'PSA Generator', 'Generate Purchase & Sale Agreement', 'T3', 'A76-COUNSEL'),
-- Cat 5: Real Estate Finance
('SK-0101', 'real_estate_finance', 'ARV Calculator', 'Calculate After Repair Value', 'T1', 'A101-UNDER'),
('SK-0102', 'real_estate_finance', 'MAO Formula', 'Calculate Maximum Allowable Offer (ARV×0.70 - Repairs)', 'T1', 'A101-UNDER'),
('SK-0103', 'real_estate_finance', 'ROI Analyzer', 'Calculate fix-flip or BRRRR ROI', 'T2', 'A102-CALC'),
('SK-0104', 'real_estate_finance', 'Cap Rate Calculator', 'Calculate cap rate for rental analysis', 'T2', 'A102-CALC'),
('SK-0105', 'real_estate_finance', 'DSCR Calculator', 'Debt Service Coverage Ratio analysis', 'T3', 'A102-CALC'),
-- Cat 8: Contractor Marketplace
('SK-0176', 'contractor', 'A45 Bid Normalizer', 'Normalize any contractor bid format to standard JSON', 'T2', 'A54-BID'),
('SK-0177', 'contractor', 'Scope of Work Generator', 'Generate SOW from photo or description', 'T2', 'A51-MASON'),
('SK-0178', 'contractor', 'Contractor Verification', 'Verify WV contractor license and insurance', 'T2', 'A54-BID'),
('SK-0179', 'contractor', 'Bid Comparison Matrix', 'Compare multiple bids on normalized basis', 'T3', 'A54-BID'),
-- Cat 10: Estimating
('SK-0226', 'estimating', 'Rehab Cost Estimator', 'Estimate rehab costs by category', 'T2', 'A51-MASON'),
('SK-0227', 'estimating', 'Material Lister', 'Generate complete material list with quantities', 'T2', 'A57-MATERIAL'),
('SK-0228', 'estimating', 'Labor Cost Estimator', 'Estimate labor hours and cost by trade', 'T2', 'A51-MASON'),
-- Cat 13: Blueprint Intelligence
('SK-0301', 'blueprint', 'Blueprint Room Detection', 'Detect and label rooms from blueprint', 'T3', 'A53-BLUEPRINT'),
('SK-0302', 'blueprint', 'Quantity Takeoff', 'Calculate material quantities from blueprint', 'T3', 'A53-BLUEPRINT'),
('SK-0303', 'blueprint', 'Code Compliance Check', 'Check blueprint against WV building code', 'T3', 'A77-ARBITER'),
-- Cat 15: Reality Capture
('SK-0351', 'reality_capture', 'LiDAR Point Cloud', 'Process LiDAR scan to point cloud', 'T5', 'A226-LIDAR'),
('SK-0352', 'reality_capture', 'Photogrammetry Model', 'Generate 3D model from photos', 'T5', 'A227-POLYCAM'),
-- Cat 27: Mind Map
('SK-2701', 'mind_map', 'Spider Web Expansion', 'Expand any concept into 50-node graph', 'T1', 'A01-ORACLE'),
('SK-2702', 'mind_map', 'Cross-Domain Connection', 'Find connections between disparate domains', 'T3', 'A25-ZEUS'),
-- Cat 36: WorldForge
('SK-3501', 'worldforge', 'Leon Therano Lore Generator', 'Generate canon-consistent universe lore', 'T5', 'A230-LEON'),
('SK-3502', 'worldforge', 'OMNIFOLD Device Description', 'Generate OMNIFOLD device lore entries', 'T5', 'A230-LEON'),
('SK-3503', 'worldforge', 'Novel Chapter Outline', 'Outline next chapter of saga', 'T5', 'A231-ELIAS'),
('SK-3504', 'worldforge', 'Screenplay Beat Sheet', 'Generate beat sheet for film adaptation', 'T5', 'A233-FILM'),
-- Cat 91: Leon Therano Universe
('SK-9101', 'transmedia', 'Character Voice Generator', 'Write in specific character voice', 'T5', 'A231-ELIAS'),
('SK-9102', 'transmedia', 'Canon Continuity Check', 'Check new content against existing canon', 'T5', 'A232-CANON'),
('SK-9103', 'transmedia', 'Game Quest Writer', 'Write quest content for game adaptation', 'T5', 'A234-GAME'),
-- Cat 98: Patent Command
('SK-9801', 'patent', 'Patent Draft Claim', 'Draft independent claim for patent application', 'T5', 'A79-PATENT'),
('SK-9802', 'patent', 'Prior Art Search', 'Search USPTO for prior art', 'T5', 'A79-PATENT'),
('SK-9803', 'patent', 'Patentability Assessment', 'Assess novelty and non-obviousness', 'T5', 'A79-PATENT')
ON CONFLICT (skill_code) DO NOTHING;

-- ─── VAULTS (Layer 1 — Empire Vault System) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS atlas_vaults (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vault_code  TEXT NOT NULL,
  vault_name  TEXT NOT NULL,
  vault_type  TEXT DEFAULT 'personal' CHECK (vault_type IN (
    'personal','org','ip','legal','technical','business','marketing',
    'app_builds','skills','media','transmedia','exports','partners'
  )),
  description TEXT,
  is_encrypted BOOLEAN DEFAULT TRUE,
  file_count  INTEGER DEFAULT 0,
  total_size_bytes BIGINT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE atlas_vaults ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own vaults" ON atlas_vaults FOR ALL USING (auth.uid() = user_id);

-- Create 11 default empire vaults for founder
CREATE OR REPLACE FUNCTION create_default_vaults(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO atlas_vaults (user_id, vault_code, vault_name, vault_type, description) VALUES
    (p_user_id, 'V01', 'IP Protection', 'ip', 'P001-P100 patents, CPC matrices, infringement monitors'),
    (p_user_id, 'V02', 'Legal', 'legal', 'ToS, NDA, Privacy, LLC Agreements, Atlas Constitution'),
    (p_user_id, 'V03', 'Technical', 'technical', 'Codebase ZIPs, Supabase schemas, n8n workflows, CI/CD'),
    (p_user_id, 'V04', 'Business', 'business', 'Trillion Dollar Plan, Series A dataroom, franchise models'),
    (p_user_id, 'V05', 'Marketing', 'marketing', 'Product Hunt, 90-day calendar, App Store copy'),
    (p_user_id, 'V06', 'App Builds', 'app_builds', 'v1-v65 archives, THE ARK v40, all version ZIPs'),
    (p_user_id, 'V07', 'Skills Bible', 'skills', '10,000 skill taxonomy, 200 categories, prompt packs'),
    (p_user_id, 'V08', 'Media', 'media', 'UI screenshots, Runway AI, Suno AI, design assets'),
    (p_user_id, 'V09', 'Transmedia', 'transmedia', 'Leon Therano 13-book saga, 7 films, VR, game design'),
    (p_user_id, 'V10', 'Exports', 'exports', 'GitHub logs, Vercel deployments, session exports'),
    (p_user_id, 'V11', 'Partners', 'partners', 'Atlas MAC docs, Burdette Build docs, 2 Garden Center contract')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── REALTIME EXTENSIONS ──────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE kanban_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE atlas_events;
ALTER PUBLICATION supabase_realtime ADD TABLE discovery_events;
ALTER PUBLICATION supabase_realtime ADD TABLE recommendations;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE workflow_runs;

-- ─── INDEXES FOR PERFORMANCE ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_objects_type_user   ON atlas_objects(object_type, owner_user_id);
CREATE INDEX IF NOT EXISTS idx_memories_scope_user ON atlas_memories(scope, user_id);
CREATE INDEX IF NOT EXISTS idx_events_user_type    ON atlas_events(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_kanban_user_col     ON kanban_cards(user_id, column_name);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_user    ON graph_nodes(user_id, graph_type);
CREATE INDEX IF NOT EXISTS idx_graph_edges_source  ON graph_edges(source_node_id);
