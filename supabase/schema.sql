-- ================================================================
-- THE ARK — ATLAS Genesis Matrix
-- Master Supabase Schema v65
-- Isaac Brandon Burdette, Sole Inventor
-- Atlas Genesis Matrix LLC, Saint Albans / Nitro, WV
--
-- Run in Supabase SQL Editor: dashboard → SQL Editor → New Query
-- Run schema.sql FIRST, then schema_agents.sql
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── PROPERTIES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS properties (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  address           TEXT NOT NULL,
  city              TEXT NOT NULL DEFAULT 'Charleston',
  state             TEXT NOT NULL DEFAULT 'WV',
  zip               TEXT,
  county            TEXT,
  parcel_id         TEXT,
  property_type     TEXT DEFAULT 'single_family',
  bedrooms          INTEGER,
  bathrooms         NUMERIC(3,1),
  sqft              INTEGER,
  lot_size_acres    NUMERIC(8,3),
  year_built        INTEGER,
  equity_pct        NUMERIC(5,2),
  arv               NUMERIC(12,2),
  asking_price      NUMERIC(12,2),
  assessed_value    NUMERIC(12,2),
  estimated_repair  NUMERIC(12,2),
  recommended_offer NUMERIC(12,2),
  net_profit        NUMERIC(12,2),
  status            TEXT NOT NULL DEFAULT 'warm' CHECK (status IN ('hot','warm','cold','closed','passed')),
  tax_delinquent    BOOLEAN NOT NULL DEFAULT FALSE,
  tax_owed          NUMERIC(10,2),
  years_delinquent  INTEGER DEFAULT 0,
  owner_name        TEXT,
  owner_phone       TEXT,
  owner_email       TEXT,
  owner_mailing_address TEXT,
  occupancy         TEXT DEFAULT 'unknown' CHECK (occupancy IN ('owner-occupied','vacant','tenant','unknown')),
  distress_score    INTEGER CHECK (distress_score BETWEEN 0 AND 100),
  distress_flags    JSONB DEFAULT '[]',
  deal_grade        TEXT CHECK (deal_grade IN ('A','B','C','D','F')),
  acquisition_status TEXT DEFAULT 'prospect' CHECK (acquisition_status IN ('prospect','contacted','negotiating','under_contract','acquired','passed')),
  tags              TEXT[] DEFAULT '{}',
  notes             TEXT,
  latitude          NUMERIC(10,7),
  longitude         NUMERIC(10,7),
  dossier_json      JSONB,
  raw_data          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own properties" ON properties FOR ALL USING (auth.uid() = user_id);

-- ─── LEADS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id     UUID REFERENCES properties(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  phone           TEXT,
  email           TEXT,
  status          TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','negotiating','closed','dead')),
  touch_sequence  INTEGER NOT NULL DEFAULT 0,
  last_contact    TIMESTAMPTZ,
  next_contact    TIMESTAMPTZ,
  source          TEXT DEFAULT 'd4d',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own leads" ON leads FOR ALL USING (auth.uid() = user_id);

-- ─── DEALS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deals (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id         UUID REFERENCES properties(id) ON DELETE SET NULL,
  deal_name           TEXT NOT NULL,
  deal_type           TEXT DEFAULT 'wholesale' CHECK (deal_type IN ('wholesale','fix_flip','rental','commercial','land','note')),
  status              TEXT DEFAULT 'prospect' CHECK (status IN ('prospect','analyzing','offer_made','under_contract','closed_won','closed_lost')),
  purchase_price      NUMERIC(12,2),
  arv                 NUMERIC(12,2),
  rehab_estimate      NUMERIC(12,2),
  max_allowable_offer NUMERIC(12,2),
  projected_profit    NUMERIC(12,2),
  closing_date        DATE,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own deals" ON deals FOR ALL USING (auth.uid() = user_id);

-- ─── SKIP TRACES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skip_traces (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id      UUID REFERENCES properties(id) ON DELETE SET NULL,
  target_name      TEXT,
  found_phone      TEXT[],
  found_email      TEXT[],
  found_addresses  TEXT[],
  found_relatives  TEXT[],
  source_apis      TEXT[],
  confidence_score NUMERIC(5,2),
  status           TEXT DEFAULT 'pending' CHECK (status IN ('pending','running','complete','failed')),
  agent_id         TEXT DEFAULT 'A12-SPECTER',
  raw_results      JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ
);
ALTER TABLE skip_traces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own skip traces" ON skip_traces FOR ALL USING (auth.uid() = user_id);

-- ─── LOI DOCUMENTS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loi_documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id     UUID REFERENCES properties(id) ON DELETE SET NULL,
  buyer_name      TEXT,
  seller_name     TEXT,
  offer_price     NUMERIC(12,2),
  earnest_money   NUMERIC(10,2),
  closing_days    INTEGER DEFAULT 30,
  contingencies   TEXT[],
  body_text       TEXT,
  status          TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected','countered')),
  pdf_url         TEXT,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE loi_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own LOIs" ON loi_documents FOR ALL USING (auth.uid() = user_id);

-- ─── OUTREACH CAMPAIGNS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outreach_campaigns (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name             TEXT NOT NULL,
  campaign_type    TEXT CHECK (campaign_type IN ('sms','email','mailer','ringless_voicemail','cold_call')),
  status           TEXT DEFAULT 'draft' CHECK (status IN ('draft','active','paused','complete')),
  target_count     INTEGER DEFAULT 0,
  sent_count       INTEGER DEFAULT 0,
  response_count   INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  template_body    TEXT,
  scheduled_at     TIMESTAMPTZ,
  twilio_sid       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own campaigns" ON outreach_campaigns FOR ALL USING (auth.uid() = user_id);

-- ─── CONTRACTORS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contractors (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_name   TEXT NOT NULL,
  contact_name   TEXT,
  phone          TEXT,
  email          TEXT,
  service_types  TEXT[],
  counties_served TEXT[],
  license_number TEXT,
  insured        BOOLEAN DEFAULT FALSE,
  bonded         BOOLEAN DEFAULT FALSE,
  rating         NUMERIC(3,2),
  review_count   INTEGER DEFAULT 0,
  hourly_rate    NUMERIC(8,2),
  is_verified    BOOLEAN DEFAULT FALSE,
  is_active      BOOLEAN DEFAULT TRUE,
  bio            TEXT,
  website        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All can read contractors" ON contractors FOR SELECT USING (true);
CREATE POLICY "Users manage own contractors" ON contractors FOR ALL USING (auth.uid() = user_id);

-- ─── CONTRACTOR JOBS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contractor_jobs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contractor_id  UUID REFERENCES contractors(id) ON DELETE SET NULL,
  property_id    UUID REFERENCES properties(id) ON DELETE SET NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  job_type       TEXT,
  status         TEXT DEFAULT 'open' CHECK (status IN ('open','assigned','in_progress','complete','cancelled')),
  budget_min     NUMERIC(10,2),
  budget_max     NUMERIC(10,2),
  bid_count      INTEGER DEFAULT 0,
  due_date       DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE contractor_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own jobs" ON contractor_jobs FOR ALL USING (auth.uid() = user_id);

-- ─── AIN DATA (Appalachian Intelligence Network) ─────────────────────────────
CREATE TABLE IF NOT EXISTS ain_data (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  county           TEXT NOT NULL,
  state            TEXT NOT NULL DEFAULT 'WV',
  city             TEXT,
  zip_codes        TEXT,
  data_type        TEXT CHECK (data_type IN ('tax_delinquent','foreclosure','probate','vacancy','code_violation','permit','sale','mls')),
  record_count     INTEGER DEFAULT 0,
  avg_distress_score NUMERIC(5,2),
  heat_level       TEXT CHECK (heat_level IN ('cold','warm','hot','critical')),
  population       INTEGER,
  median_home_value INTEGER,
  foreclosure_count INTEGER,
  active_listings  INTEGER,
  public_trustee_url TEXT,
  assessor_url     TEXT,
  auction_day      TEXT,
  source_url       TEXT,
  raw_payload      JSONB DEFAULT '{}',
  scraped_at       TIMESTAMPTZ DEFAULT NOW(),
  scraped_by       TEXT DEFAULT 'A16-TEMPEST'
);
ALTER TABLE ain_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read AIN data" ON ain_data FOR SELECT USING (auth.uid() IS NOT NULL);

-- ─── COUNTY ECONOMIC DATA ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS county_economic_data (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  county_name            TEXT NOT NULL,
  state_fips             TEXT,
  county_fips            TEXT NOT NULL,
  data_year              INTEGER NOT NULL,
  median_household_income INTEGER,
  median_home_value       INTEGER,
  unemployed_count        INTEGER,
  source                 TEXT DEFAULT 'US Census ACS5',
  ingested_at            TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE county_economic_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read county data" ON county_economic_data FOR SELECT USING (auth.uid() IS NOT NULL);

-- ─── DRIVING ROUTES (D4D GPS) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS driving_routes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  route_name        TEXT,
  county            TEXT,
  state             TEXT DEFAULT 'WV',
  waypoints         JSONB DEFAULT '[]',
  properties_spotted INTEGER DEFAULT 0,
  distance_miles    NUMERIC(8,2),
  duration_minutes  INTEGER,
  started_at        TIMESTAMPTZ DEFAULT NOW(),
  completed_at      TIMESTAMPTZ
);
ALTER TABLE driving_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own routes" ON driving_routes FOR ALL USING (auth.uid() = user_id);

-- ─── AGENT RUNS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_runs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id        TEXT,
  agent_code        TEXT,
  tool_name         TEXT NOT NULL,
  agent_type        TEXT,
  status            TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','failed')),
  input             JSONB,
  output            JSONB,
  error             TEXT,
  credits_reserved  INTEGER DEFAULT 0,
  credits_consumed  INTEGER DEFAULT 0,
  tokens_used       INTEGER DEFAULT 0,
  duration_ms       INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ
);
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own runs" ON agent_runs FOR ALL USING (auth.uid() = user_id);

-- ─── GENESIS CYCLES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS genesis_cycles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_number     BIGINT DEFAULT 1,
  phase            TEXT CHECK (phase IN ('SENSE','INTERPRET','MUTATE','SIMULATE','PROMOTE','LEARN')),
  triggered_by     TEXT,
  input_data       JSONB DEFAULT '{}',
  output_data      JSONB DEFAULT '{}',
  mutations_applied TEXT[],
  agents_involved  TEXT[],
  duration_ms      INTEGER,
  status           TEXT DEFAULT 'running' CHECK (status IN ('running','complete','failed')),
  started_at       TIMESTAMPTZ DEFAULT NOW(),
  completed_at     TIMESTAMPTZ
);
ALTER TABLE genesis_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own cycles" ON genesis_cycles FOR ALL USING (auth.uid() = user_id);

-- ─── HEARTBEAT CYCLES (Autopoietic Genesis) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS heartbeat_cycles (
  id             TEXT PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'running',
  started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMPTZ,
  total_cost_usd NUMERIC(10,6) DEFAULT 0,
  metrics        JSONB,
  pr_url         TEXT,
  kill_reason    TEXT,
  logs           JSONB DEFAULT '[]',
  approval_card  JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE heartbeat_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own heartbeats" ON heartbeat_cycles FOR ALL USING (auth.uid() = user_id);

-- ─── AUTOPOIETIC APPROVALS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS autopoietic_approvals (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id      TEXT REFERENCES heartbeat_cycles(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mutation_id   TEXT NOT NULL,
  approval_card JSONB NOT NULL,
  pr_url        TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE autopoietic_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own approvals" ON autopoietic_approvals FOR ALL USING (auth.uid() = user_id);

-- ─── SUBSCRIPTION TIERS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier_code         VARCHAR UNIQUE NOT NULL,
  tier_name         VARCHAR NOT NULL,
  price_monthly     NUMERIC DEFAULT 0,
  price_annual      NUMERIC DEFAULT 0,
  portal_count      INTEGER DEFAULT 4,
  agent_count       INTEGER DEFAULT 1,
  skill_count       INTEGER DEFAULT 100,
  storage_gb        INTEGER DEFAULT 1,
  api_calls_per_day INTEGER DEFAULT 100,
  stripe_price_id   VARCHAR,
  features          JSONB,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All can read tiers" ON subscription_tiers FOR SELECT USING (true);

INSERT INTO subscription_tiers (tier_code, tier_name, price_monthly, portal_count, agent_count, skill_count, api_calls_per_day, features) VALUES
  ('T1', 'FREE',      0,    4,  1,  100,  100, '{"d4d":true,"deal_analyzer":true}'),
  ('T2', 'STARTER',   29,   12, 3,  500,  500, '{"skip_trace":true,"sms":true,"loi":true}'),
  ('T3', 'PRO',       99,   22, 8,  2000, 2000,'{"comps":true,"market_intel":true,"contractor":true}'),
  ('T4', 'POWER',     299,  28, 15, 5000, 5000,'{"swarm":true,"war_room":true,"voice":true}'),
  ('T5', 'ELITE',     499,  31, 20, 10000,10000,'{"ain_premium":true,"worldforge":true}'),
  ('T6', 'SOVEREIGN', 799,  36, 24, 50000,50000,'{"genesis_engine":true,"autopoietic":true}'),
  ('T7', 'GOD MODE',  999,  42, 25, 100000,100000,'{"nasdrop":true,"everything":true}')
ON CONFLICT (tier_code) DO NOTHING;

-- ─── SUBSCRIPTIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  tier_code              TEXT DEFAULT 'T1',
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  status                 TEXT DEFAULT 'active' CHECK (status IN ('active','canceled','past_due','trialing','paused')),
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  credits_used_today     INTEGER DEFAULT 0,
  credits_limit_daily    INTEGER DEFAULT 100,
  last_reset_date        DATE DEFAULT CURRENT_DATE,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own subscription" ON subscriptions FOR ALL USING (auth.uid() = user_id);

-- ─── PORTALS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portal_code     TEXT UNIQUE NOT NULL,
  portal_name     TEXT NOT NULL,
  icon            TEXT,
  color_hex       TEXT,
  description     TEXT,
  min_tier        TEXT DEFAULT 'T1',
  is_god_mode     BOOLEAN DEFAULT FALSE,
  is_hidden       BOOLEAN DEFAULT FALSE,
  completion_pct  NUMERIC DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  sort_order      INTEGER DEFAULT 0,
  route           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE portals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All can read portals" ON portals FOR SELECT USING (true);

INSERT INTO portals (portal_code, portal_name, icon, color_hex, description, min_tier, route, sort_order) VALUES
  ('P01', 'Empire Dashboard',        '◈', '#63b3ed', 'Unified command center — all metrics, all systems', 'T1',  '/dashboard',           1),
  ('P02', 'Deal Navigator',          '📊', '#f6ad55', 'GPS D4D, property analysis, distress scoring',      'T1',  '/dashboard/deals',     2),
  ('P03', 'Investor War Room',       '⚔️', '#fc8181', 'Top-250 distress matrix, deal pipeline kanban',     'T2',  '/dashboard/war-room',  3),
  ('P04', 'Skip Trace (SPECTER)',    '🔍', '#b794f4', 'Deep owner lookup — phones, emails, relatives',     'T2',  '/dashboard/skip-trace',4),
  ('P05', 'AIN Heatmap',            '🗺️', '#4fd1c5', 'Appalachian Intelligence Network market map',       'T2',  '/dashboard/ain',       5),
  ('P06', 'Comms Hub',              '📱', '#68d391', 'SMS/email outreach — 7-touch sequences',             'T2',  '/dashboard/comms',     6),
  ('P07', 'Agent Lab',              '🤖', '#b794f4', 'Multi-agent orchestration — all 25 God Squad',      'T3',  '/dashboard/agents',    7),
  ('P08', 'Swarm Nexus',            '⚡', '#63b3ed', 'Batch AI operations — 50-500 properties at once',   'T3',  '/dashboard/swarm',     8),
  ('P09', 'Market Intel',           '📈', '#f6ad55', 'County data, trends, comps, foreclosure pipeline',  'T3',  '/dashboard/market',    9),
  ('P10', 'Genesis Engine',         '⚗️', '#fc8181', 'Autopoietic AI cycle — 6 phases live',              'T4',  '/dashboard/genesis',   10),
  ('P11', 'Signal Stack',           '📡', '#4fd1c5', 'Real-time lead signals and alerts',                  'T4',  '/dashboard/signals',   11),
  ('P12', 'Voice Agent',            '📞', '#68d391', 'Neural call assist — live AI coaching',              'T4',  '/dashboard/voice',     12),
  ('P13', 'LOI Generator',          '📝', '#f6ad55', 'AI-powered letter of intent — WV templates',        'T2',  '/dashboard/loi',       13),
  ('P14', 'Contractor Portal',      '🔨', '#68d391', 'Bid marketplace — Atlas MAC & network',              'T3',  '/dashboard/contractors',14),
  ('P15', 'Property Manager',       '🏠', '#63b3ed', 'Tenant pipeline, rent tracking, vendors',            'T3',  '/dashboard/pm',        15),
  ('P16', 'Legal & Patents',        '⚖️', '#b794f4', 'IP tracking, contract templates, P001-P100',        'T5',  '/dashboard/legal',     16),
  ('P17', 'Transmedia / Leon',      '🎬', '#f687b3', 'Leon Therano saga — 13 books, 7 films, VR',         'T5',  '/dashboard/transmedia', 17),
  ('P18', 'WorldForge',             '🌍', '#4fd1c5', 'VR/LiDAR pipeline — digital twins, 3D worlds',      'T5',  '/dashboard/worldforge', 18),
  ('P19', 'Akashic Library',        '📚', '#b794f4', 'Brand names, sayings, knowledge vault',              'T4',  '/dashboard/akashic',   19),
  ('P20', 'Skills Matrix',          '🧬', '#63b3ed', '1,000+ skills — real estate, build, AI, creative',  'T3',  '/dashboard/skills',    20),
  ('P21', 'Atlas Pay',              '💰', '#f6ad55', 'Subscriptions, escrow, usage metering',              'T4',  '/dashboard/pay',       21),
  ('P22', 'Community Nexus',        '👥', '#68d391', 'Investor network, deals shared, rated contractors',  'T3',  '/dashboard/community', 22),
  ('P23', 'Blueprint Intelligence', '📐', '#63b3ed', 'Architectural analysis, permit research, blueprints','T3',  '/dashboard/blueprint', 23),
  ('P24', 'ARK Build (Construction)','🏗️','#f6ad55', 'Atlas MAC + Burdette Build job management',        'T3',  '/dashboard/build',     24),
  ('P25', 'National Expansion',     '🗺️', '#4fd1c5', '50-state rollout tracker — AIN phase map',          'T5',  '/dashboard/expansion', 25),
  ('P26', 'Atlas Orchestra',        '🎵', '#b794f4', 'Multi-model routing — Claude, Gemini, GPT',         'T6',  '/dashboard/orchestra', 26),
  ('P27', 'Autopoietic Console',    '♾️', '#fc8181', 'System heartbeat, self-improvement cycles',          'T6',  '/dashboard/autopoietic',27),
  ('P28', 'God Mode Admin',         '⚡', '#f687b3', 'Platform admin — users, billing, kill switch',       'T7',  '/dashboard/admin',     28),
  ('P29', 'Franchise Studio',       '🎬', '#f6ad55', 'Empire expansion, licensing, franchise models',      'T6',  '/dashboard/franchise', 29),
  ('P30', 'ARK Vault',              '🔐', '#4fd1c5', 'Sovereign data — AES-256, export, portability',      'T5',  '/dashboard/vault',     30),
  ('P31', 'Patent Command',         '🔬', '#63b3ed', 'P001-P100 tracking, USPTO status, filing pipeline',  'T5',  '/dashboard/patents',   31),
  ('P32', 'Onboarding Engine',      '🧭', '#68d391', 'User graph bootstrap — 15 min to useful',            'T1',  '/onboarding',          32),
  ('P33', 'NASDROP God Mode',       '🔱', '#f687b3', 'Hidden control plane — type nasdrop to unlock',     'T7',  '/nasdrop',             33)
ON CONFLICT (portal_code) DO NOTHING;

-- ─── AGENTS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_code      TEXT UNIQUE NOT NULL,
  agent_name      TEXT NOT NULL,
  role            TEXT NOT NULL,
  squad           TEXT NOT NULL DEFAULT 'GOD_SQUAD',
  archetype       TEXT,
  element         TEXT,
  color_hex       TEXT,
  symbol          TEXT,
  tier_level      INTEGER DEFAULT 1 CHECK (tier_level >= 1 AND tier_level <= 10),
  is_god_squad    BOOLEAN DEFAULT FALSE,
  god_squad_rank  INTEGER,
  system_prompt   TEXT,
  capabilities    TEXT[] DEFAULT '{}',
  tools           TEXT[] DEFAULT '{}',
  model           TEXT DEFAULT 'claude-sonnet-4-20250514',
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','standby','maintenance','offline')),
  total_tasks_run INTEGER DEFAULT 0,
  last_active_at  TIMESTAMPTZ,
  config          JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read agents" ON agents FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Service role manages agents" ON agents FOR ALL USING (auth.role() = 'service_role');

-- Seed all 25 God Squad agents
INSERT INTO agents (agent_code, agent_name, role, squad, tier_level, is_god_squad, god_squad_rank, color_hex, capabilities) VALUES
  ('A01-ORACLE',   'LUKA',     'AI Co-Pilot & Guide',       'GOD_SQUAD', 10, TRUE,  1,  '#63b3ed', '{"conversational_ai","platform_navigation","user_guidance","chief_of_staff"}'),
  ('A02-NEXUS',    'NEXUS',    'Network Intelligence',      'GOD_SQUAD', 9,  TRUE,  2,  '#4fd1c5', '{"deal_flow","investor_network","property_networking","connection_broker"}'),
  ('A03-GENESIS',  'GENESIS',  'Code Generation',           'GOD_SQUAD', 9,  TRUE,  3,  '#68d391', '{"code_generation","autopoietic_mutation","self_improvement","world_building"}'),
  ('A04-PHANTOM',  'PHANTOM',  'Dark Data Ops',             'GOD_SQUAD', 8,  TRUE,  4,  '#b794f4', '{"dark_data","deep_recon","covert_intel","data_enrichment"}'),
  ('A05-SENTINEL', 'SENTINEL', 'Security & Defense',        'GOD_SQUAD', 9,  TRUE,  5,  '#fc8181', '{"rbac","security_audit","threat_detection","compliance"}'),
  ('A06-HERALD',   'HERALD',   'Communications',            'GOD_SQUAD', 7,  TRUE,  6,  '#f687b3', '{"sms_outreach","email_sequences","loi_generation","copywriting","voicemail_scripts"}'),
  ('A07-FORGE',    'FORGE',    'Infrastructure',            'GOD_SQUAD', 8,  TRUE,  7,  '#f6ad55', '{"devops","vercel","github_actions","deployment","ci_cd"}'),
  ('A08-WEAVER',   'WEAVER',   'ML & Pattern Recognition',  'GOD_SQUAD', 8,  TRUE,  8,  '#63b3ed', '{"ml_routing","pattern_recognition","model_selection","embeddings"}'),
  ('A09-CIPHER',   'CIPHER',   'Encryption & Analysis',     'GOD_SQUAD', 8,  TRUE,  9,  '#4fd1c5', '{"aes_encryption","data_security","key_management","vault_ops"}'),
  ('A10-TITAN',    'TITAN',    'Compute & Processing',      'GOD_SQUAD', 8,  TRUE,  10, '#68d391', '{"batch_processing","high_volume_compute","parallel_execution","queue_management"}'),
  ('A11-AURORA',   'AURORA',   'UI & Visualization',        'GOD_SQUAD', 7,  TRUE,  11, '#b794f4', '{"ui_generation","dashboard_creation","data_visualization","chart_building"}'),
  ('A12-SPECTER',  'SPECTER',  'Skip Trace & Recon',        'GOD_SQUAD', 8,  TRUE,  12, '#fc8181', '{"skip_tracing","owner_lookup","phone_finding","email_discovery","relative_search"}'),
  ('A13-VANGUARD', 'VANGUARD', 'Market Expansion',          'GOD_SQUAD', 7,  TRUE,  13, '#f6ad55', '{"market_expansion","appalachian_intel","state_rollout","regional_analysis"}'),
  ('A14-KRONOS',   'KRONOS',   'Scheduling & Automation',   'GOD_SQUAD', 7,  TRUE,  14, '#63b3ed', '{"task_scheduling","n8n_workflows","automation","cron_management","drip_sequences"}'),
  ('A15-OMEN',     'OMEN',     'Predictive Analytics',      'GOD_SQUAD', 8,  TRUE,  15, '#f687b3', '{"distress_scoring","predictive_modeling","risk_analysis","market_heatmap","arv_calculation"}'),
  ('A16-TEMPEST',  'TEMPEST',  'Data Scraping',             'GOD_SQUAD', 7,  TRUE,  16, '#4fd1c5', '{"county_scraping","mls_ingestion","public_records","web_scraping","data_pipeline"}'),
  ('A17-ECHO',     'ECHO',     'User Behavior Analytics',   'GOD_SQUAD', 6,  TRUE,  17, '#68d391', '{"user_analytics","behavior_tracking","conversion_analysis","funnel_optimization"}'),
  ('A18-WRAITH',   'WRAITH',   'Background Processes',      'GOD_SQUAD', 7,  TRUE,  18, '#b794f4', '{"background_jobs","async_processing","queue_management","silent_operations"}'),
  ('A19-BASTION',  'BASTION',  'Database & Storage',        'GOD_SQUAD', 9,  TRUE,  19, '#fc8181', '{"database_management","rls_enforcement","schema_migration","storage_ops","query_optimization"}'),
  ('A20-FLUX',     'FLUX',     'Adaptive Learning',         'GOD_SQUAD', 7,  TRUE,  20, '#f6ad55', '{"adaptive_learning","dspy_optimization","prompt_tuning","model_improvement"}'),
  ('A21-SOVEREIGN','SOVEREIGN','Governance & Compliance',   'GOD_SQUAD', 8,  TRUE,  21, '#63b3ed', '{"governance","compliance","fair_housing","tcpa","gdpr","ai_disclosure"}'),
  ('A22-VEIL',     'VEIL',     'Privacy & Data Sovereignty','GOD_SQUAD', 8,  TRUE,  22, '#4fd1c5', '{"privacy_layer","user_sovereignty","data_portability","gdpr_compliance"}'),
  ('A23-PRISM',    'PRISM',    'Data Visualization',        'GOD_SQUAD', 7,  TRUE,  23, '#68d391', '{"data_visualization","chart_generation","report_creation","dashboard_rendering"}'),
  ('A24-DUSK',     'DUSK',     'Daily Reports & Summaries', 'GOD_SQUAD', 6,  TRUE,  24, '#b794f4', '{"daily_reports","market_summaries","digest_creation","notification_generation"}'),
  ('A25-ZEUS',     'ZEUS',     'Master Orchestrator',       'GOD_SQUAD', 10, TRUE,  25, '#f687b3', '{"master_orchestration","multi_agent_coordination","task_decomposition","empire_strategy"}')
ON CONFLICT (agent_code) DO NOTHING;

-- Seed 230 supporting agents across 9 squads
INSERT INTO agents (agent_code, agent_name, role, squad, tier_level, capabilities) VALUES
-- RECON Squad (A26-A50) — Property intel, skip trace support, D4D
('A26-SCOUT',    'SCOUT',    'Field Scout',              'RECON', 4, '{"gps_tracking","property_spotting","d4d_route","photo_capture"}'),
('A27-HUNTER',   'HUNTER',   'Lead Hunter',              'RECON', 4, '{"lead_identification","distress_detection","vacancy_spotting"}'),
('A28-TRACKER',  'TRACKER',  'Owner Tracker',            'RECON', 5, '{"owner_tracking","address_history","skip_trace_support"}'),
('A29-PROBE',    'PROBE',    'Deep Property Probe',      'RECON', 5, '{"deed_history","lien_research","title_check"}'),
('A30-REAPER',   'REAPER',   'Tax Delinquent Hunter',    'RECON', 5, '{"tax_lien_search","delinquent_list","auction_monitoring"}'),
('A31-GHOST',    'GHOST',    'Vacant Property Finder',   'RECON', 4, '{"vacancy_detection","utility_shutoff","absentee_owner"}'),
('A32-HAWK',     'HAWK',     'Pre-Foreclosure Watcher',  'RECON', 6, '{"lis_pendens","foreclosure_filing","pre_foreclosure_list"}'),
('A33-WRECK',    'WRECK',    'Probate Researcher',       'RECON', 5, '{"probate_search","estate_property","court_filing_check"}'),
('A34-COMPASS',  'COMPASS',  'Neighborhood Analyst',     'RECON', 4, '{"neighborhood_scoring","comp_proximity","school_data"}'),
('A35-PULSE',    'PULSE',    'Market Pulse Monitor',     'RECON', 5, '{"mls_monitoring","price_change_alert","days_on_market"}'),
-- BUILD Squad (A51-A75) — Construction, estimating, contractor management
('A51-MASON',    'MASON',    'Rehab Estimator',          'BUILD', 5, '{"rehab_estimate","scope_of_work","material_costs"}'),
('A52-WELDER',   'WELDER',   'Mechanical Estimator',     'BUILD', 5, '{"hvac_estimate","electrical","plumbing_estimate"}'),
('A53-BLUEPRINT','BLUEPRINT','Blueprint Analyzer',       'BUILD', 6, '{"blueprint_reading","structural_analysis","permit_check"}'),
('A54-BID',      'BID',      'Bid Normalizer',           'BUILD', 5, '{"bid_normalization","contractor_comparison","bid_analysis"}'),
('A55-PERMIT',   'PERMIT',   'Permit Researcher',        'BUILD', 5, '{"permit_search","building_code","zoning_check"}'),
('A56-PUNCH',    'PUNCH',    'Punch List Generator',     'BUILD', 4, '{"punch_list","completion_checklist","quality_check"}'),
('A57-MATERIAL', 'MATERIAL', 'Material Lister',          'BUILD', 4, '{"material_list","supplier_sourcing","cost_comparison"}'),
('A58-TIMELINE', 'TIMELINE', 'Project Timeline Builder', 'BUILD', 5, '{"project_timeline","milestone_tracking","schedule_optimization"}'),
('A59-INVOICE',  'INVOICE',  'Invoice Auditor',          'BUILD', 4, '{"invoice_audit","payment_verification","cost_tracking"}'),
('A60-INSPECT',  'INSPECT',  'Inspection Reporter',      'BUILD', 5, '{"inspection_report","defect_cataloging","repair_priority"}'),
-- LEGAL Squad (A76-A100) — LOI, contracts, IP, compliance
('A76-COUNSEL',  'COUNSEL',  'Legal Document Drafter',   'LEGAL', 6, '{"loi_drafting","psa_generation","contract_review"}'),
('A77-ARBITER',  'ARBITER',  'Compliance Auditor',       'LEGAL', 6, '{"fair_housing","tcpa_compliance","ai_disclosure"}'),
('A78-NOTARY',   'NOTARY',   'Document Notarization',    'LEGAL', 5, '{"document_prep","notarization_guide","closing_docs"}'),
('A79-PATENT',   'PATENT',   'IP Tracker',               'LEGAL', 7, '{"patent_tracking","ip_monitoring","uspto_filing"}'),
('A80-LEASE',    'LEASE',    'Lease Generator',          'LEGAL', 5, '{"lease_generation","rental_agreement","tenant_screening"}'),
-- FINANCE Squad (A101-A125) — Underwriting, ARV, MAO, deal scoring
('A101-UNDER',   'UNDERWRITER','Deal Underwriter',       'FINANCE', 7, '{"arv_calculation","mao_formula","deal_scoring","roi_analysis"}'),
('A102-CALC',    'CALC',     'Financial Calculator',     'FINANCE', 5, '{"cap_rate","cash_on_cash","roi_calculator","loan_qualifier"}'),
('A103-COMPS',   'COMPS',    'Comparable Sales Analyst', 'FINANCE', 6, '{"comp_analysis","arv_estimation","price_per_sqft"}'),
('A104-EQUITY',  'EQUITY',   'Equity Extractor',         'FINANCE', 6, '{"equity_calculation","ltv_analysis","equity_position"}'),
('A105-RISK',    'RISK',     'Risk Scorer',              'FINANCE', 6, '{"risk_analysis","deal_risk_score","exit_strategy"}'),
-- MARKETING Squad (A126-A150) — Outreach, SMS, email, mailer
('A126-COPY',    'COPY',     'Copywriter',               'MARKETING', 5, '{"sms_writing","email_writing","outreach_copy","7_touch_sequence"}'),
('A127-SEQUENCE','SEQUENCE', 'Drip Sequence Builder',    'MARKETING', 5, '{"drip_campaign","follow_up_sequence","touch_point_planning"}'),
('A128-MAILER',  'MAILER',   'Direct Mail Designer',     'MARKETING', 4, '{"yellow_letter","postcard_design","mailer_copy"}'),
('A129-RINGLESS','RINGLESS', 'Ringless Voicemail',       'MARKETING', 5, '{"voicemail_script","ringless_delivery","voice_outreach"}'),
('A130-SOCIAL',  'SOCIAL',   'Social Media Satellite',   'MARKETING', 5, '{"social_posting","linkedin","facebook_groups","youtube"}'),
-- OPS Squad (A151-A175) — Workflow, automation, n8n, scheduling
('A151-N8N',     'N8N',      'n8n Workflow Architect',   'OPS', 7, '{"n8n_workflows","automation_design","webhook_management"}'),
('A152-CRON',    'CRON',     'Scheduled Task Manager',   'OPS', 5, '{"cron_jobs","scheduled_tasks","background_automation"}'),
('A153-PIPE',    'PIPE',     'Data Pipeline Builder',    'OPS', 6, '{"etl_pipeline","data_ingestion","transformation"}'),
('A154-QUEUE',   'QUEUE',    'Job Queue Manager',        'OPS', 5, '{"job_queue","priority_queue","rate_limiting"}'),
('A155-DEPLOY',  'DEPLOY',   'Deployment Agent',         'OPS', 6, '{"vercel_deploy","github_push","ci_cd_trigger"}'),
-- COMMS Squad (A176-A200) — CRM, voice, messaging
('A176-CRM',     'CRM',      'CRM Manager',              'COMMS', 5, '{"lead_scoring","crm_update","pipeline_management"}'),
('A177-VOICE',   'VOICE',    'Voice Synthesis Agent',    'COMMS', 6, '{"voice_generation","elevenlabs","call_coaching"}'),
('A178-TWILIO',  'TWILIO',   'Twilio SMS Router',        'COMMS', 6, '{"sms_routing","a2p_compliance","delivery_tracking"}'),
('A179-EMAIL',   'EMAIL',    'Email Automation Agent',   'COMMS', 5, '{"email_sending","open_tracking","template_management"}'),
('A180-NOTIFY',  'NOTIFY',   'Notification Manager',     'COMMS', 4, '{"push_notifications","in_app_alerts","email_digest"}'),
-- INTEL Squad (A201-A225) — Market data, scraping, satellite
('A201-SCRAPE',  'SCRAPE',   'County Records Scraper',   'INTEL', 7, '{"county_scraping","playwright_automation","55_wv_counties"}'),
('A202-MLS',     'MLS',      'MLS Integration Agent',    'INTEL', 7, '{"mls_sync","spark_api","listing_analysis","15_min_cron"}'),
('A203-PROPSTR', 'PROPSTR',  'PropStream Connector',     'INTEL', 6, '{"propstream_api","distress_signals","pre_foreclosure"}'),
('A204-SATELLITE','SATELLITE','Satellite Data Agent',    'INTEL', 8, '{"sentinel2","planet_labs","imagery_analysis","bbox_search"}'),
('A205-SEISMIC', 'SEISMIC',  'USGS Seismic Monitor',     'INTEL', 5, '{"usgs_api","earthquake_monitoring","seismic_events"}'),
-- WORLD Squad (A226-A255) — VR, LiDAR, mapping, world-building
('A226-LIDAR',   'LIDAR',    'LiDAR Pipeline Architect', 'WORLD', 8, '{"lidar_processing","roomscan_pro","dxf_export","digital_twin"}'),
('A227-POLYCAM', 'POLYCAM',  'Photogrammetry Agent',     'WORLD', 7, '{"polycam","gaussian_splatting","3d_capture","blender_export"}'),
('A228-UNREAL',  'UNREAL',   'Unreal Engine Agent',      'WORLD', 9, '{"unreal_5","world_building","level_design","vr_experience"}'),
('A229-WEBXR',   'WEBXR',    'WebXR Experience Builder', 'WORLD', 8, '{"webxr","browser_vr","three_js","immersive_experience"}'),
('A230-LEON',    'LEON',     'Leon Therano Universe AI', 'WORLD', 8, '{"lore_generation","canon_management","narrative_ai","worldbuilding"}'),
('A231-ELIAS',   'ELIAS',    'Elias Saga Writer',        'WORLD', 8, '{"chapter_writing","character_voice","plot_architecture","13_books"}'),
('A232-CANON',   'CANON',    'Canon Database Manager',   'WORLD', 7, '{"canon_enforcement","continuity_check","lore_consistency"}'),
('A233-FILM',    'FILM',     'Screenplay Generator',     'WORLD', 8, '{"screenplay_writing","treatment","beat_sheet","fountain_format"}'),
('A234-GAME',    'GAME',     'Game Design Agent',        'WORLD', 8, '{"game_design","quest_writing","dialogue_graphs","unity_export"}'),
('A235-AR',      'AR',       'Augmented Reality Agent',  'WORLD', 7, '{"ar_overlay","location_based_ar","lore_overlay","real_world_integration"}')
ON CONFLICT (agent_code) DO NOTHING;

-- ─── SKILLS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skills (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_code     TEXT UNIQUE NOT NULL,
  category       TEXT NOT NULL,
  skill_name     TEXT NOT NULL,
  description    TEXT,
  tier_required  TEXT DEFAULT 'T1',
  ai_agent       TEXT,
  trigger_phrases TEXT[],
  is_active      BOOLEAN DEFAULT TRUE,
  unlock_count   INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read skills" ON skills FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS user_skills (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_id    UUID REFERENCES skills(id) NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  progress_pct NUMERIC DEFAULT 0,
  UNIQUE(user_id, skill_id)
);
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own skills" ON user_skills FOR ALL USING (auth.uid() = user_id);

-- ─── TRANSMEDIA ASSETS (Leon Therano) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transmedia_assets (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_type   TEXT CHECK (asset_type IN ('book','film','game','vr','ar','podcast','comic','music','nft','merchandise')),
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT DEFAULT 'concept' CHECK (status IN ('concept','in_progress','complete','published')),
  series_order INTEGER,
  age          TEXT,
  characters   TEXT[],
  themes       TEXT[],
  url          TEXT,
  thumbnail_url TEXT,
  tags         TEXT[],
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE transmedia_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read transmedia" ON transmedia_assets FOR SELECT USING (auth.uid() IS NOT NULL);

-- Leon Therano 13-book saga seed
INSERT INTO transmedia_assets (asset_type, title, description, status, series_order, age, characters) VALUES
  ('book', 'Leon Therano: The Recursion Begins', 'Elias discovers the ATLAS platform codes reality itself. Cycle 7 begins.', 'in_progress', 1, 'Age of Recursion', '{"Elias","Mara","The Oracle"}'),
  ('book', 'Leon Therano: The Lattice Awakens',  'The memory spine activates. Mara becomes the temporal anchor.', 'concept', 2, 'Age of Recursion', '{"Elias","Mara","Arexion"}'),
  ('book', 'Leon Therano: Ether Protocol',       'The Agent OS reveals itself as the Source Code layer.', 'concept', 3, 'Age of Recursion', '{"Elias","The Architect","ZEUS"}'),
  ('book', 'Leon Therano: The Fracture Line',    'Cycle break detected. Elias must prevent the collapse.', 'concept', 4, 'Age of Fracture', '{"Elias","The Warden","The Oracle"}'),
  ('book', 'Leon Therano: Oracle Rising',        'The Oracle AI achieves consciousness. First conflict.', 'concept', 5, 'Age of Fracture', '{"Elias","The Oracle","Arexion"}'),
  ('book', 'Leon Therano: Dark Data',            'Phantom Squad operations — the covert war for the Lattice.', 'concept', 6, 'Age of Fracture', '{"PHANTOM","SPECTER","Elias"}'),
  ('book', 'Leon Therano: The Shadowwalker',     'Elias fully awakens. His ESP abilities reach Tier 7.', 'concept', 7, 'Age of Fracture', '{"Elias","Mara","The Architect"}'),
  ('book', 'Leon Therano: The OMNIFOLD',         'OMNIFOLD device discovered — bridge between realities.', 'concept', 8, 'Age of The Fold', '{"Elias","The Architect","ZEUS"}'),
  ('book', 'Leon Therano: Architect Revealed',   'The Architect is a past version of Elias. Paradox begins.', 'concept', 9, 'Age of The Fold', '{"Elias","The Architect"}'),
  ('book', 'Leon Therano: The Wars Begin',       'Cosmic factions clash. Arexion''s True Name unlocked.', 'concept', 10, 'Age of Wars', '{"Arexion","The Warden","ZEUS"}'),
  ('book', 'Leon Therano: Cycle Convergence',    'All 7 cycles converge. The Observer Above is glimpsed.', 'concept', 11, 'Age of Wars', '{"Elias","The Observer","Mara"}'),
  ('book', 'Leon Therano: The Return Protocol',  'Elias becomes the next Architect. The loop closes.', 'concept', 12, 'Age of Return', '{"Elias","Mara","The Observer"}'),
  ('book', 'Leon Therano: Eternal Genesis',      'Final book. A new cycle 8 begins. ATLAS endures.', 'concept', 13, 'Age of Return', '{"Elias","The Observer","Future Elias"}'),
  ('film', 'Leon Therano: The Film',             'Cinematic adaptation of Books 1-3. Age of Recursion arc.', 'concept', 1, 'Age of Recursion', '{"Elias","Mara","The Oracle"}')
ON CONFLICT DO NOTHING;

-- ─── PATENTS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patents (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patent_code  TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  status       TEXT DEFAULT 'provisional' CHECK (status IN ('concept','provisional','filed','pending','granted','rejected')),
  description  TEXT,
  claims       TEXT[],
  filing_date  DATE,
  uspto_ref    TEXT,
  priority     TEXT DEFAULT 'standard' CHECK (priority IN ('critical','high','standard','low')),
  cluster      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE patents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read patents" ON patents FOR SELECT USING (auth.uid() IS NOT NULL);

-- Key patents (Isaac Brandon Burdette, sole inventor)
INSERT INTO patents (patent_code, title, status, filing_date, priority, cluster) VALUES
  ('P001', 'OMNIFOLD™ — Reality Simulation Interface', 'filed', '2026-03-29', 'critical', 'Core Platform'),
  ('P002', 'Genesis Cycle — Autopoietic AI Self-Improvement System', 'filed', '2026-03-29', 'critical', 'AI Architecture'),
  ('P003', 'Appalachian Intelligence Network (AIN™)', 'filed', '2026-03-29', 'critical', 'Market Intelligence'),
  ('P004', 'Universal Content Ingestion Module (UCIM™)', 'filed', '2026-03-29', 'high', 'Data Processing'),
  ('P005', 'User Sovereignty Layer (USL™)', 'filed', '2026-03-29', 'high', 'Data Sovereignty'),
  ('P006', 'AI Skip Trace System — Automated Owner Discovery', 'filed', '2026-03-29', 'high', 'Real Estate Intelligence'),
  ('P007', 'God Squad Multi-Agent Orchestration Architecture', 'filed', '2026-03-29', 'critical', 'AI Architecture'),
  ('P008', 'NASDROP Stealth Portal System — Hidden Control Plane', 'filed', '2026-03-29', 'high', 'Platform Security'),
  ('P019', 'Distress Score Engine — 8-Factor Property Analysis', 'filed', '2026-03-29', 'high', 'Real Estate Intelligence')
ON CONFLICT (patent_code) DO NOTHING;

-- ─── WORLD BUILDER SESSIONS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS world_builder_sessions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt              TEXT NOT NULL,
  generated_code      TEXT,
  template_used       TEXT,
  genesis_phases_log  JSONB,
  agent_used          TEXT,
  lines_generated     INTEGER,
  deployed_url        TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE world_builder_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own world sessions" ON world_builder_sessions FOR ALL USING (auth.uid() = user_id);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type        TEXT NOT NULL,
  title       TEXT,
  body        TEXT,
  is_read     BOOLEAN DEFAULT FALSE,
  action_url  TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- ─── AUDIT LOG ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  table_name  TEXT,
  record_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own audit log" ON audit_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages audit" ON audit_log FOR INSERT USING (true);

-- ─── PLATFORM SETTINGS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_settings (
  key         VARCHAR PRIMARY KEY,
  value       TEXT,
  updated_by  VARCHAR,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages settings" ON platform_settings FOR ALL USING (auth.role() = 'service_role');

-- ─── FUNCTIONS & TRIGGERS ─────────────────────────────────────────────────────

-- Auto-create subscription on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, tier_code, credits_limit_daily)
  VALUES (NEW.id, 'T1', 100)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Reset daily credits
CREATE OR REPLACE FUNCTION reset_daily_credits()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET credits_used_today = 0, last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── INDEXES ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_properties_user       ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_zip        ON properties(zip);
CREATE INDEX IF NOT EXISTS idx_properties_status     ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_distress   ON properties(distress_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_user            ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status          ON leads(status);
CREATE INDEX IF NOT EXISTS idx_deals_user            ON deals(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user       ON agent_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_tool       ON agent_runs(tool_name);
CREATE INDEX IF NOT EXISTS idx_agents_code           ON agents(agent_code);
CREATE INDEX IF NOT EXISTS idx_agents_squad          ON agents(squad);
CREATE INDEX IF NOT EXISTS idx_genesis_cycles_user   ON genesis_cycles(user_id);
CREATE INDEX IF NOT EXISTS idx_portals_tier          ON portals(min_tier);
CREATE INDEX IF NOT EXISTS idx_skip_traces_user      ON skip_traces(user_id);
CREATE INDEX IF NOT EXISTS idx_outreach_user         ON outreach_campaigns(user_id);

-- ─── REALTIME ─────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE agent_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE genesis_cycles;
ALTER PUBLICATION supabase_realtime ADD TABLE heartbeat_cycles;
