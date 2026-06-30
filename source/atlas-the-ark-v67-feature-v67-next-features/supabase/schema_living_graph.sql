-- ================================================================
-- THE ARK — Living Graph, Cognitive Cockpit, Onboarding Engine
-- Phase Roadmap, PR Registry, Agent Blueprints, Swarm Architecture
-- Atlas Genesis Matrix LLC · Isaac Brandon Burdette, Sole Inventor
-- Run AFTER schema.sql and schema_canon.sql
-- ================================================================

-- ─── LIVING GRAPH MVP (Cat 27 — Spider Web Mind Map) ──────────────────────────
-- When user enters any word → expand to ~50 nodes → grouped by type

CREATE TABLE IF NOT EXISTS living_graph_expansions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seed_input      TEXT NOT NULL,
  input_type      TEXT DEFAULT 'word' CHECK (input_type IN (
    'word','phrase','address','file','idea','command','image','voice','gesture'
  )),
  nodes           JSONB DEFAULT '[]',
  node_count      INTEGER DEFAULT 0,
  selected_nodes  UUID[],
  expansion_depth INTEGER DEFAULT 1,
  graph_mode      TEXT DEFAULT 'personal',
  processing_time_ms INTEGER,
  -- 12-layer pipeline log
  pipeline_log    JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE living_graph_expansions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own expansions" ON living_graph_expansions FOR ALL USING (auth.uid() = user_id);

-- Graph node types from Living Graph
CREATE TABLE IF NOT EXISTS graph_node_types (
  type_code     TEXT PRIMARY KEY,
  type_name     TEXT NOT NULL,
  group_name    TEXT NOT NULL, -- portals|agents|workflows|connectors|prompts|models|sources|risks|opportunities|actions
  icon          TEXT,
  color_hex     TEXT,
  description   TEXT
);
INSERT INTO graph_node_types (type_code, type_name, group_name, color_hex) VALUES
  ('portal',     'Portal',          'portals',      '#63b3ed'),
  ('agent',      'Agent',           'agents',       '#68d391'),
  ('workflow',   'Workflow',        'workflows',    '#f6ad55'),
  ('connector',  'Connector',       'connectors',   '#b794f4'),
  ('prompt',     'Prompt Pack',     'prompts',      '#4fd1c5'),
  ('model',      'AI Model',        'models',       '#fc8181'),
  ('datasource', 'Data Source',     'sources',      '#f687b3'),
  ('risk',       'Risk',            'risks',        '#fc8181'),
  ('opportunity','Opportunity',     'opportunities','#68d391'),
  ('action',     'Next Action',     'actions',      '#f6ad55')
ON CONFLICT (type_code) DO NOTHING;

-- Suggestion option cards (A-G) from any graph expansion
CREATE TABLE IF NOT EXISTS suggestion_cards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  expansion_id    UUID REFERENCES living_graph_expansions(id) ON DELETE CASCADE,
  card_option     TEXT NOT NULL CHECK (card_option IN ('A','B','C','D','E','F','G')),
  card_label      TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  required_permissions TEXT[],
  estimated_cost_credits INTEGER DEFAULT 0,
  estimated_time_min INTEGER,
  risk_level      TEXT CHECK (risk_level IN ('low','medium','high','critical')),
  confidence_score NUMERIC DEFAULT 50,
  next_action     TEXT,
  approval_required BOOLEAN DEFAULT FALSE,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','expired')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE suggestion_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own cards" ON suggestion_cards FOR ALL USING (auth.uid() = user_id);

-- ─── COGNITIVE COCKPIT (Cat 30 — 10 panels, 100+ sliders) ─────────────────────

CREATE TABLE IF NOT EXISTS cockpit_settings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preset          TEXT DEFAULT 'Builder' CHECK (preset IN (
    'Explorer','Builder','Investor','Contractor','Researcher','Inventor','CEO','God Mode'
  )),
  -- Panel 1: Intelligence Depth (10 sliders)
  research_depth          INTEGER DEFAULT 50,
  relationship_depth      INTEGER DEFAULT 50,
  graph_exploration       INTEGER DEFAULT 50,
  memory_recall           INTEGER DEFAULT 50,
  knowledge_radius        INTEGER DEFAULT 50,
  evidence_weight         INTEGER DEFAULT 50,
  source_diversity        INTEGER DEFAULT 50,
  historical_depth        INTEGER DEFAULT 50,
  context_expansion       INTEGER DEFAULT 50,
  reasoning_depth         INTEGER DEFAULT 50,
  -- Panel 2: Discovery
  opportunity_search      INTEGER DEFAULT 50,
  connection_discovery    INTEGER DEFAULT 50,
  cross_domain            INTEGER DEFAULT 50,
  pattern_detection       INTEGER DEFAULT 50,
  missing_info_scan       INTEGER DEFAULT 50,
  weak_signal_detection   INTEGER DEFAULT 50,
  revenue_discovery       INTEGER DEFAULT 50,
  automation_discovery    INTEGER DEFAULT 50,
  business_opportunity    INTEGER DEFAULT 50,
  serendipity_factor      INTEGER DEFAULT 30,
  -- Panel 3: Creativity
  creativity_level        INTEGER DEFAULT 50,
  novelty_preference      INTEGER DEFAULT 50,
  invention_mode          INTEGER DEFAULT 30,
  patent_detection        INTEGER DEFAULT 50,
  idea_generation         INTEGER DEFAULT 50,
  worldbuilding_depth     INTEGER DEFAULT 50,
  product_ideation        INTEGER DEFAULT 50,
  business_creativity     INTEGER DEFAULT 50,
  design_thinking         INTEGER DEFAULT 50,
  strategic_innovation    INTEGER DEFAULT 50,
  -- Panel 4: Risk
  risk_tolerance          INTEGER DEFAULT 50,
  compliance_strictness   INTEGER DEFAULT 70,
  evidence_requirement    INTEGER DEFAULT 60,
  verification_level      INTEGER DEFAULT 60,
  legal_sensitivity       INTEGER DEFAULT 60,
  financial_conservatism  INTEGER DEFAULT 50,
  confidence_threshold    INTEGER DEFAULT 70,
  error_sensitivity       INTEGER DEFAULT 60,
  safety_margin           INTEGER DEFAULT 70,
  uncertainty_visibility  INTEGER DEFAULT 50,
  -- Panel 5: Tournament
  model_count             INTEGER DEFAULT 2,
  debate_depth            INTEGER DEFAULT 50,
  critique_depth          INTEGER DEFAULT 50,
  consensus_threshold     INTEGER DEFAULT 70,
  disagreement_detection  INTEGER DEFAULT 50,
  synthesis_depth         INTEGER DEFAULT 50,
  reasoning_transparency  INTEGER DEFAULT 70,
  cost_budget_tournament  INTEGER DEFAULT 50,
  latency_tolerance       INTEGER DEFAULT 50,
  model_diversity         INTEGER DEFAULT 50,
  -- Panel 6: Agent Autonomy
  agent_autonomy          INTEGER DEFAULT 30,
  task_creation_rate      INTEGER DEFAULT 50,
  recommendation_freq     INTEGER DEFAULT 50,
  workflow_automation     INTEGER DEFAULT 30,
  self_improvement_rate   INTEGER DEFAULT 20,
  agent_collaboration     INTEGER DEFAULT 50,
  agent_independence      INTEGER DEFAULT 30,
  escalation_threshold    INTEGER DEFAULT 70,
  execution_authority     INTEGER DEFAULT 20,
  learning_rate           INTEGER DEFAULT 50,
  -- Panel 7: Kanban
  card_creation_rate      INTEGER DEFAULT 50,
  opportunity_sensitivity INTEGER DEFAULT 50,
  risk_sensitivity        INTEGER DEFAULT 60,
  prioritization_aggression INTEGER DEFAULT 50,
  auto_assignment         INTEGER DEFAULT 30,
  workflow_generation     INTEGER DEFAULT 50,
  dependency_detection    INTEGER DEFAULT 70,
  escalation_speed        INTEGER DEFAULT 50,
  completion_forecasting  INTEGER DEFAULT 50,
  learn_from_outcomes     INTEGER DEFAULT 70,
  -- Panel 8: Mind Map
  node_density            INTEGER DEFAULT 50,
  relationship_visibility INTEGER DEFAULT 60,
  cluster_detection       INTEGER DEFAULT 50,
  graph_expansion_rate    INTEGER DEFAULT 50,
  compression_level       INTEGER DEFAULT 50,
  timeline_depth          INTEGER DEFAULT 50,
  entity_linking          INTEGER DEFAULT 60,
  similarity_search       INTEGER DEFAULT 50,
  relationship_weighting  INTEGER DEFAULT 50,
  graph_depth             INTEGER DEFAULT 50,
  -- Panel 9: Reality Engine
  map_detail              INTEGER DEFAULT 50,
  gis_detail              INTEGER DEFAULT 50,
  twin_detail             INTEGER DEFAULT 50,
  lidar_resolution        INTEGER DEFAULT 50,
  drone_depth             INTEGER DEFAULT 30,
  forecast_horizon        INTEGER DEFAULT 50,
  simulation_detail       INTEGER DEFAULT 30,
  asset_tracking          INTEGER DEFAULT 50,
  capture_frequency       INTEGER DEFAULT 30,
  world_model_expansion   INTEGER DEFAULT 30,
  -- Panel 10: Empire Mode
  portfolio_scope         INTEGER DEFAULT 50,
  business_scope          INTEGER DEFAULT 50,
  cross_company           INTEGER DEFAULT 30,
  investment_aggression   INTEGER DEFAULT 40,
  revenue_optimization    INTEGER DEFAULT 60,
  resource_optimization   INTEGER DEFAULT 60,
  market_expansion        INTEGER DEFAULT 40,
  acquisition_aggression  INTEGER DEFAULT 40,
  long_term_horizon       INTEGER DEFAULT 60,
  empire_intelligence     INTEGER DEFAULT 50,
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE cockpit_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own cockpit" ON cockpit_settings FOR ALL USING (auth.uid() = user_id);

-- Auto-create cockpit with defaults on user signup
CREATE OR REPLACE FUNCTION create_default_cockpit(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO cockpit_settings (user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── ONBOARDING INTELLIGENCE ENGINE (Cat 161) ─────────────────────────────────
-- First 15 minutes problem: create useful User Graph from scratch

CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  step            INTEGER DEFAULT 1 CHECK (step BETWEEN 1 AND 8),
  primary_role    TEXT CHECK (primary_role IN (
    'real_estate','construction','investing','property_management',
    'personal_productivity','business_operations','learning','creator','custom'
  )),
  goals           TEXT[],
  connected_sources TEXT[],
  discovered_objects INTEGER DEFAULT 0,
  graph_bootstrap_complete BOOLEAN DEFAULT FALSE,
  bootstrap_node_count INTEGER DEFAULT 0,
  time_to_useful_min INTEGER,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own onboarding" ON onboarding_sessions FOR ALL USING (auth.uid() = user_id);

-- ─── STANDARD AGENT BLUEPRINT (Part 7 — 19 required fields) ──────────────────

CREATE TABLE IF NOT EXISTS agent_blueprints (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_code          TEXT UNIQUE NOT NULL,
  agent_name          TEXT NOT NULL,
  -- All 19 blueprint fields from Master Canon
  purpose             TEXT NOT NULL,
  portal_access       TEXT[],
  allowed_connectors  TEXT[],
  forbidden_connectors TEXT[],
  model_preference    TEXT DEFAULT 'claude-sonnet-4-20250514',
  offline_fallback    TEXT,
  memory_scope        TEXT CHECK (memory_scope IN (
    'conversation','project','property','organization','portfolio','agent','world'
  )),
  tool_permissions    TEXT[],
  prompt_template     TEXT,
  input_schema        JSONB DEFAULT '{}',
  output_schema       JSONB DEFAULT '{}',
  approval_gates      TEXT[],
  safety_rules        TEXT[],
  cost_budget_credits INTEGER DEFAULT 100,
  evaluation_tests    JSONB DEFAULT '[]',
  failure_recovery    TEXT,
  audit_logging       BOOLEAN DEFAULT TRUE,
  marketplace_eligible BOOLEAN DEFAULT FALSE,
  -- Meta
  category            TEXT,
  squad               TEXT,
  tier_level          INTEGER DEFAULT 1,
  version             TEXT DEFAULT 'v1',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE agent_blueprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read blueprints" ON agent_blueprints FOR SELECT USING (auth.uid() IS NOT NULL);

-- Seed 25 Foundry Council agents (from Sprint 1 spec)
INSERT INTO agent_blueprints (agent_code, agent_name, purpose, model_preference, memory_scope, audit_logging, marketplace_eligible, category, squad, tier_level) VALUES
  ('FC-01', 'Chief Orchestrator',   'Decompose tasks, route to agents, enforce architecture',              'claude-sonnet-4-20250514', 'world',    TRUE, FALSE, 'meta',         'FOUNDRY', 10),
  ('FC-02', 'Product Agent',        'North star, roadmap, feature prioritization',                         'claude-sonnet-4-20250514', 'world',    TRUE, FALSE, 'product',      'FOUNDRY', 9),
  ('FC-03', 'System Architect',     'Monorepo, patterns, dependency graph, architecture decisions',         'claude-sonnet-4-20250514', 'project',  TRUE, FALSE, 'engineering',  'FOUNDRY', 9),
  ('FC-04', 'Database Agent',       'Supabase schema, migrations, RLS, pgvector, query optimization',      'claude-sonnet-4-20250514', 'world',    TRUE, FALSE, 'data',         'FOUNDRY', 9),
  ('FC-05', 'RAG Agent',            'Chunking, embeddings, retrieval quality, reranking, pgvector',        'claude-sonnet-4-20250514', 'world',    TRUE, FALSE, 'knowledge',    'FOUNDRY', 8),
  ('FC-06', 'Security Agent',       'Zero trust, NHI identities, permission policies, threat detection',   'claude-sonnet-4-20250514', 'world',    TRUE, FALSE, 'security',     'FOUNDRY', 9),
  ('FC-07', 'Compliance Agent',     'Fair Housing, TCPA, GDPR, AI disclosure, C2PA, OWASP LLM Top 10',    'claude-sonnet-4-20250514', 'world',    TRUE, FALSE, 'legal',        'FOUNDRY', 8),
  ('FC-08', 'Frontend Agent',       'React/Next.js, design system, portal components, accessibility',      'claude-sonnet-4-20250514', 'project',  TRUE, FALSE, 'frontend',     'FOUNDRY', 7),
  ('FC-09', 'Backend Agent',        'REST/edge functions, API contracts, route architecture',               'claude-sonnet-4-20250514', 'project',  TRUE, FALSE, 'backend',      'FOUNDRY', 8),
  ('FC-10', 'DevOps Agent',         'Vercel, GitHub Actions, CI/CD, environment management, monitoring',   'claude-sonnet-4-20250514', 'world',    TRUE, FALSE, 'devops',       'FOUNDRY', 8),
  ('FC-11', 'Testing Agent',        'Unit tests, integration tests, Playwright e2e, regression suites',    'claude-sonnet-4-20250514', 'project',  TRUE, FALSE, 'quality',      'FOUNDRY', 7),
  ('FC-12', 'Observability Agent',  'Langfuse traces, token costs, latency, cost governance dashboards',   'claude-sonnet-4-20250514', 'world',    TRUE, FALSE, 'monitoring',   'FOUNDRY', 7),
  ('FC-13', 'Model Router Agent',   'LiteLLM gateway, model selection, online/offline routing, budgets',   'claude-sonnet-4-20250514', 'world',    TRUE, FALSE, 'ai_routing',   'FOUNDRY', 8),
  ('FC-14', 'Connector Agent',      'OAuth flows, scope negotiation, token storage, data-access maps',     'claude-sonnet-4-20250514', 'world',    TRUE, FALSE, 'connectors',   'FOUNDRY', 8),
  ('FC-15', 'Workflow Agent',       'n8n workflows, LangGraph chains, trigger logic, retry patterns',      'claude-sonnet-4-20250514', 'project',  TRUE, FALSE, 'automation',   'FOUNDRY', 7),
  ('FC-16', 'Prompt Agent',         'DSPy optimization, prompt versioning, A/B testing, UCIM registry',    'claude-sonnet-4-20250514', 'world',    TRUE, FALSE, 'prompts',      'FOUNDRY', 8),
  ('FC-17', 'Marketplace Agent',    'Skill/agent/workflow listings, pricing, install tracking',            'claude-sonnet-4-20250514', 'world',    TRUE, TRUE,  'marketplace',  'FOUNDRY', 7),
  ('FC-18', 'Data Sovereignty Agent','Permission UI, consent receipts, data portability, delete flows',    'claude-sonnet-4-20250514', 'world',    TRUE, FALSE, 'sovereignty',  'FOUNDRY', 9),
  ('FC-19', 'Geo Intelligence Agent','GIS, Mapbox, county records, WV parcel data, spatial analysis',      'claude-sonnet-4-20250514', 'property', TRUE, FALSE, 'gis',          'FOUNDRY', 8),
  ('FC-20', 'Construction Agent',   'Scope, bids, A45 normalization, permits, milestone tracking',         'claude-sonnet-4-20250514', 'project',  TRUE, TRUE,  'construction', 'FOUNDRY', 7),
  ('FC-21', 'Real Estate Agent',    'D4D, skip trace, ARV, MAO, distress scoring, LOI generation',        'claude-sonnet-4-20250514', 'property', TRUE, TRUE,  'real_estate',  'FOUNDRY', 8),
  ('FC-22', 'Finance Agent',        'ARV, NOI, DSCR, BRRRR, IRR, portfolio analysis, deal grading',       'claude-sonnet-4-20250514', 'portfolio',TRUE, TRUE,  'finance',      'FOUNDRY', 8),
  ('FC-23', 'Legal Agent',          'LOI, PSA, lease generation, contract review, WV-specific templates',  'claude-sonnet-4-20250514', 'project',  TRUE, FALSE, 'legal',        'FOUNDRY', 8),
  ('FC-24', 'WorldForge Agent',     'Leon Therano universe, OMNIFOLD lore, canon management, 13-book saga','claude-sonnet-4-20250514', 'world',    TRUE, FALSE, 'transmedia',   'FOUNDRY', 8),
  ('FC-25', 'Founder Approval Agent','BLOCKS irreversible changes — requires Isaac Brandon Burdette approval','claude-sonnet-4-20250514','world', TRUE, FALSE, 'governance',   'FOUNDRY', 10)
ON CONFLICT (agent_code) DO NOTHING;

-- ─── SWARM ARCHITECTURE (Master Canon Part 6) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS swarm_templates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swarm_code      TEXT UNIQUE NOT NULL,
  swarm_name      TEXT NOT NULL,
  description     TEXT,
  agent_chain     TEXT[] NOT NULL,
  trigger_types   TEXT[],
  category        TEXT,
  estimated_credits INTEGER DEFAULT 50,
  min_tier        TEXT DEFAULT 'T3',
  is_active       BOOLEAN DEFAULT TRUE,
  run_count       INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE swarm_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read swarms" ON swarm_templates FOR SELECT USING (auth.uid() IS NOT NULL);

-- Seed all 20 pre-built swarms from Master Canon
INSERT INTO swarm_templates (swarm_code, swarm_name, agent_chain, category, estimated_credits, min_tier) VALUES
  ('SW-01', 'Deal Acquisition',      ARRAY['A12-SPECTER','A15-OMEN','A101-UNDER','A06-HERALD'], 'real_estate',  75, 'T2'),
  ('SW-02', 'Seller Outreach',       ARRAY['A06-HERALD','A126-COPY','A127-SEQUENCE','A14-KRONOS'], 'marketing', 40, 'T2'),
  ('SW-03', 'Buyer Disposition',     ARRAY['A02-NEXUS','A101-UNDER','A06-HERALD','A76-COUNSEL'], 'real_estate', 60, 'T3'),
  ('SW-04', 'Construction Bid',      ARRAY['A54-BID','A51-MASON','A57-MATERIAL','A58-TIMELINE'], 'construction',50, 'T2'),
  ('SW-05', 'Foreclosure Hunt',      ARRAY['A30-REAPER','A32-HAWK','A15-OMEN','A12-SPECTER'], 'real_estate',   65, 'T3'),
  ('SW-06', 'Patent Drafting',       ARRAY['A79-PATENT','FC-23','FC-07','FC-25'], 'legal',                    80, 'T5'),
  ('SW-07', 'Investor Package',      ARRAY['A101-UNDER','A103-COMPS','A76-COUNSEL','A06-HERALD'], 'finance',   70, 'T3'),
  ('SW-08', 'Marketing Campaign',    ARRAY['A126-COPY','A127-SEQUENCE','A129-RINGLESS','A130-SOCIAL'], 'marketing', 45, 'T2'),
  ('SW-09', 'Market Research',       ARRAY['A16-TEMPEST','A15-OMEN','A204-SATELLITE','A01-ORACLE'], 'intel',   55, 'T3'),
  ('SW-10', 'Product Build',         ARRAY['FC-08','FC-09','FC-04','FC-11','FC-10'], 'engineering',            100, 'T5'),
  ('SW-11', 'Contractor Marketplace',ARRAY['A54-BID','A176-CRM','A177-VOICE','A14-KRONOS'], 'construction',    55, 'T2'),
  ('SW-12', 'Rental Management',     ARRAY['A80-LEASE','A176-CRM','A179-EMAIL','A24-DUSK'], 'property_mgmt',  45, 'T2'),
  ('SW-13', 'Reality Capture',       ARRAY['A226-LIDAR','A227-POLYCAM','A228-UNREAL','A229-WEBXR'], 'world',   90, 'T5'),
  ('SW-14', 'Digital Twin Build',    ARRAY['A226-LIDAR','A53-BLUEPRINT','A228-UNREAL','A23-PRISM'], 'world',   85, 'T5'),
  ('SW-15', 'Knowledge Discovery',   ARRAY['A01-ORACLE','A25-ZEUS','A08-WEAVER','A15-OMEN'], 'intelligence',   60, 'T3'),
  ('SW-16', 'Memory Consolidation',  ARRAY['A18-WRAITH','A08-WEAVER','A24-DUSK','A19-BASTION'], 'intelligence', 40, 'T4'),
  ('SW-17', 'Workforce Management',  ARRAY['FC-20','A152-CRON','A176-CRM','A24-DUSK'], 'construction',         45, 'T3'),
  ('SW-18', 'Logistics Dispatch',    ARRAY['A153-PIPE','A152-CRON','A154-QUEUE','A155-DEPLOY'], 'ops',          50, 'T4'),
  ('SW-19', 'Compliance Audit',      ARRAY['FC-07','A77-ARBITER','A21-SOVEREIGN','FC-25'], 'legal',            70, 'T5'),
  ('SW-20', 'Estimating Full',       ARRAY['A51-MASON','A52-WELDER','A57-MATERIAL','A54-BID'], 'construction', 55, 'T2')
ON CONFLICT (swarm_code) DO NOTHING;

-- ─── 10-PHASE BUILD ROADMAP (from Master Blueprint) ──────────────────────────

CREATE TABLE IF NOT EXISTS build_phases (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_number    INTEGER UNIQUE NOT NULL,
  phase_name      TEXT NOT NULL,
  stage           TEXT CHECK (stage IN ('A_build_now','B_revenue','C_scale','D_platform','E_regional','F_vision')),
  pr_range_start  INTEGER,
  pr_range_end    INTEGER,
  purpose         TEXT,
  outcome         TEXT,
  systems         TEXT[],
  dependencies    TEXT[],
  revenue_impact  TEXT CHECK (revenue_impact IN ('critical','high','medium','low','future')),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','complete')),
  completion_pct  NUMERIC DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE build_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All read phases" ON build_phases FOR SELECT USING (true);

INSERT INTO build_phases (phase_number, phase_name, stage, pr_range_start, pr_range_end, purpose, outcome, systems, revenue_impact) VALUES
  (1,  'Foundation Intelligence',     'A_build_now', 1,   100, 'Create the Atlas Core — data fabric, identity, graph, memory', 'Atlas can understand users, data, relationships, and context', ARRAY['Identity','Authentication','Organizations','Permissions','Object Registry','Universal Graph','Memory','Discovery','Connectors','Automation Foundations'], 'critical'),
  (2,  'Chief of Staff Intelligence', 'A_build_now', 101, 110, 'Create persistent executive intelligence layer', 'Atlas knows what matters', ARRAY['Persistent Chief of Staff','Goal Engine','Decision Engine','Opportunity Radar','Risk Radar','Command Center','Workflow Builder','Memory Compression','Simulation Engine','Intelligence Score'], 'critical'),
  (3,  'Execution Intelligence',      'A_build_now', 111, 120, 'Convert recommendations into action', 'Atlas helps execute work', ARRAY['Execution Engine','Action Decomposition','Mission System','Dynamic Priorities','Outcome Tracking','Feedback Loops','Permissioned Execution','Workflow Runtime','Self-Improvement Queue'], 'high'),
  (4,  'Opportunity OS',              'B_revenue',   121, 160, 'Turn Atlas into opportunity discovery platform', 'Atlas identifies opportunities before users do', ARRAY['Opportunity Graph','Opportunity Scoring','Opportunity Forecasting','Relationship Intelligence','Deal Intelligence','Leverage Engine'], 'high'),
  (5,  'Vertical Products',           'B_revenue',   161, 200, 'Build sellable products for Contractor/Investor/Business', 'First paying customers', ARRAY['Contractor OS','CRM','Estimating','Investor OS','Deal Analysis','Property Intelligence','Acquisition Pipeline','Business OS'], 'critical'),
  (6,  'Marketplace & Knowledge',     'C_scale',     201, 250, 'Turn systems into reusable assets', 'Users contribute value', ARRAY['Skill Marketplace','Workflow Marketplace','Playbook Library','Knowledge Network','Agent Templates'], 'high'),
  (7,  'Community & Network',         'C_scale',     251, 300, 'Create network effects', 'Users help users', ARRAY['Communities','Referrals','Reputation','Collaboration','Opportunity Sharing'], 'medium'),
  (8,  'Platform & Agents',           'D_platform',  301, 400, 'Atlas becomes a platform others build on', 'Others build on Atlas', ARRAY['Agent Runtime','Agent Registry','Workflow Factory','Connector Marketplace','Developer APIs'], 'high'),
  (9,  'Appalachian Network',         'E_regional',  401, 500, 'Regional intelligence infrastructure for WV/Appalachian', 'Atlas becomes regional infrastructure', ARRAY['Local Opportunity Exchange','Business Network','Property Network','Capital Network','Workforce Network'], 'medium'),
  (10, 'Genesis Matrix',              'F_vision',    501, 999, 'Long-term federation and self-improvement vision', 'Atlas evolves into large-scale intelligence platform', ARRAY['Federation','Self-Improvement','Advanced Graph Intelligence','Ecosystem Coordination','Opportunity Commons','Constitutional Governance'], 'future')
ON CONFLICT (phase_number) DO NOTHING;

-- ─── PR REGISTRY (Phase 3 — PRs 111-120 from ChatGPT) ─────────────────────────

CREATE TABLE IF NOT EXISTS pr_registry (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pr_number       INTEGER UNIQUE NOT NULL,
  pr_code         TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  phase_number    INTEGER REFERENCES build_phases(phase_number),
  objective       TEXT,
  tables_created  TEXT[],
  tables_modified TEXT[],
  apis_created    TEXT[],
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','complete','blocked')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pr_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All read PRs" ON pr_registry FOR SELECT USING (true);

INSERT INTO pr_registry (pr_number, pr_code, title, phase_number, objective, tables_created, status) VALUES
  (115, 'PR-115', 'Outcome Tracking Engine',    3, 'Learn from results — every recommendation gets measured', ARRAY['outcome_tracking'], 'complete'),
  (116, 'PR-116', 'Execution Feedback Loop',    3, 'Close the loop between action and learning', ARRAY['outcome_tracking'], 'complete'),
  (117, 'PR-117', 'Autonomous Task Drafting',   3, 'Atlas prepares work before user asks — draft only, never send without approval', ARRAY['workflow_runs'], 'pending'),
  (118, 'PR-118', 'Permissioned Execution',     3, '7 autonomy levels: Suggest Only → God Mode (human oversight required)', ARRAY['atlas_permissions'], 'complete'),
  (119, 'PR-119', 'Workflow Run Engine',        3, 'Run workflows reliably with step-level logging', ARRAY['workflow_runs','workflow_run_steps'], 'complete'),
  (120, 'PR-120', 'Self-Improvement Queue',     3, 'Atlas identifies what should improve next from failures and feedback', ARRAY['improvement_queue'], 'complete')
ON CONFLICT (pr_number) DO NOTHING;

-- ─── WORKFLOW RUN STEPS (PR-119 full spec) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS workflow_run_steps (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_run_id UUID REFERENCES workflow_runs(id) ON DELETE CASCADE,
  step_order      INTEGER NOT NULL,
  step_name       TEXT NOT NULL,
  step_type       TEXT CHECK (step_type IN ('agent','connector','condition','transform','notify','approve','wait','loop')),
  status          TEXT DEFAULT 'pending' CHECK (status IN (
    'pending','running','waiting_for_approval','completed','failed','cancelled','skipped'
  )),
  input           JSONB,
  output          JSONB,
  error           TEXT,
  agent_code      TEXT,
  credits_used    INTEGER DEFAULT 0,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);
ALTER TABLE workflow_run_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own steps" ON workflow_run_steps FOR SELECT USING (
  EXISTS (SELECT 1 FROM workflow_runs WHERE id = workflow_run_id AND user_id = auth.uid())
);

-- ─── 25,000-SKILL TAXONOMY STRUCTURE ──────────────────────────────────────────
-- 100 categories × 100 skills = 10,000 base; 250 × 100 = 25,000 expanded
-- Full category registry (all 100 from Master Canon Part 7)

CREATE TABLE IF NOT EXISTS skill_categories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cat_number      INTEGER UNIQUE NOT NULL,
  cat_code        TEXT UNIQUE NOT NULL,
  cat_name        TEXT NOT NULL,
  tier_group      TEXT NOT NULL CHECK (tier_group IN (
    'real_estate','construction','business_ops','ai_automation','software_dev',
    'data_intelligence','media_content','transmedia_worldforge','empire_systems'
  )),
  skill_range_start INTEGER,
  skill_range_end   INTEGER,
  agent_range_start INTEGER,
  agent_range_end   INTEGER,
  priority          TEXT DEFAULT 'standard' CHECK (priority IN ('critical','high','standard','future')),
  build_status      TEXT DEFAULT 'planned' CHECK (build_status IN ('planned','in_progress','complete')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE skill_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All read skill cats" ON skill_categories FOR SELECT USING (true);

-- Seed all 100 canonical skill categories
INSERT INTO skill_categories (cat_number, cat_code, cat_name, tier_group, skill_range_start, skill_range_end, agent_range_start, agent_range_end, priority) VALUES
-- Real Estate (Cat 1-15)
(1,  'D4D',         'Driving For Dollars',              'real_estate',  1,    100,  1,    25,  'critical'),
(2,  'PROP_INTEL',  'Property Intelligence',            'real_estate',  101,  200,  26,   50,  'critical'),
(3,  'SELLER_ACQ',  'Seller Acquisition',               'real_estate',  201,  300,  51,   75,  'critical'),
(4,  'BUYER_DISP',  'Buyer Disposition',                'real_estate',  301,  400,  76,   100, 'high'),
(5,  'RE_FINANCE',  'Real Estate Finance',              'real_estate',  401,  500,  101,  125, 'critical'),
(6,  'RENTAL',      'Rental Property Management',       'real_estate',  501,  600,  126,  150, 'high'),
(7,  'FORECLOSURE', 'Foreclosure Intelligence',         'real_estate',  601,  700,  151,  175, 'high'),
(8,  'CONTRACTOR',  'Contractor Marketplace',           'real_estate',  701,  800,  176,  200, 'critical'),
(9,  'CONST_PM',    'Construction Project Management',  'construction', 801,  900,  201,  225, 'high'),
(10, 'ESTIMATING',  'Estimating & Bid Intelligence',    'construction', 901,  1000, 226,  250, 'critical'),
(11, 'CRM',         'CRM & Customer Intelligence',      'business_ops', 1001, 1100, 251,  275, 'high'),
(12, 'SALES_MKT',   'Sales & Marketing Automation',     'business_ops', 1101, 1200, 276,  300, 'high'),
(13, 'BLUEPRINT',   'Blueprint Intelligence & Design',  'construction', 1201, 1300, 301,  325, 'standard'),
(14, 'GIS',         'GIS & Mapping Intelligence',       'data_intelligence',1301,1400,326, 350, 'high'),
(15, 'REALITY_CAP', 'Drone, LiDAR & Reality Capture',  'data_intelligence',1401,1500,351, 375, 'standard'),
-- Spatial, Twin & Compliance (Cat 16-25)
(16, 'DIGITAL_TWIN','Digital Twin & World Model',       'data_intelligence',1501,1700,376, 400, 'standard'),
(17, 'COMPLIANCE',  'Permit, Code & Compliance',        'construction', 1701, 1800, 401,  425, 'high'),
(18, 'GOV_DATA',    'Government Data & Public Records', 'data_intelligence',1801,1900,  0,  0,  'high'),
(19, 'WORKFORCE',   'Workforce & Employee Management',  'business_ops', 1901, 2000, 426,  450, 'standard'),
(20, 'FLEET',       'Fleet, Vehicles & Equipment',      'business_ops', 2001, 2100, 451,  475, 'standard'),
(21, 'PROCUREMENT', 'Procurement & Supply Chain',       'business_ops', 2101, 2200, 476,  500, 'standard'),
(22, 'DOC_INTEL',   'Document Intelligence (UCIM)',     'data_intelligence',2201,2300,501, 525, 'high'),
(23, 'KNOW_GRAPH',  'Knowledge Graph & Memory Engine',  'data_intelligence',2301,2400,526, 540, 'critical'),
(24, 'AGENT_MKT',   'Agent Factory & Skill Marketplace','ai_automation', 2401, 2500, 541,  570, 'high'),
(25, 'GOD_MODE',    'GOD MODE Command Center',          'empire_systems',2501, 2600,   0,  0,  'critical'),
-- Thinking Layer (Cat 26-34)
(26, 'DISCOVERY',   'Discovery, Synthesis & Emergence', 'ai_automation', 2601, 2700, 541,  570, 'high'),
(27, 'MIND_MAP',    'ATLAS Mind Map & Knowledge Graph OS','ai_automation',2701,2800, 571,  595, 'high'),
(28, 'KANBAN',      'Kanban Intelligence System',       'ai_automation', 2801, 2900, 596,  620, 'high'),
(29, 'AI_TOURNAMENT','AI Tournament System',            'ai_automation', 2901, 3000, 621,  645, 'high'),
(30, 'COCKPIT',     'User Control System & Cognitive Cockpit','ai_automation',3001,3100,646,670, 'high'),
(31, 'RECOMMEND',   'Recommendation Engine',            'ai_automation', 3101, 3200, 671,  695, 'high'),
(32, 'MEMORY_CTX',  'Cross-Agent Memory & Context Router','ai_automation',3201,3300, 696,  720, 'critical'),
(33, 'EVOLUTION',   'Self-Improvement & Skill Factory', 'ai_automation', 3301, 3400, 721,  745, 'high'),
(34, 'SIMULATION',  'Simulation, Forecasting & Scenarios','ai_automation',3401,3480,  0,   0,  'standard'),
-- Immersive & Ecosystem (Cat 35-45)
(35, 'VR_XR',       'VR/XR Spatial Command',           'data_intelligence',3481,3560,746, 770, 'standard'),
(36, 'WORLDFORGE',  'WorldForge & Reality Engine',      'transmedia_worldforge',3561,3600, 0, 0,'high'),
(37, 'VOICE',       'Voice, Call Center & Conversational OS','business_ops',3601,3640,771,795, 'high'),
(38, 'AUTOMATION',  'Autonomous Workflow & Business Automation','ai_automation',3641,3720,796,820,'high'),
(39, 'APP_STORE',   'App Store, Marketplace & Ecosystem','empire_systems',3721,3800,  0,  0,  'standard'),
(40, 'PAIOS',       'Personal AI Operating System',     'empire_systems',  3801,3880,821, 845, 'high'),
(41, 'FRANCHISE',   'Franchise Operating System',       'empire_systems',  3881,3960,846, 870, 'standard'),
(42, 'EDUCATION',   'Atlas University & Training Engine','business_ops',    3961,4040,871, 895, 'standard'),
(43, 'ATLAS_PAY',   'Atlas Pay & Financial OS',         'empire_systems',  4041,4120,896, 920, 'high'),
(44, 'ATLAS_NET',   'Atlas Network',                    'empire_systems',  4121,4200,921, 945, 'standard'),
(45, 'SUPERGRAPH',  'SuperGraph / Civilization Engine', 'empire_systems',  4201,4280,  0,  0,  'future'),
-- Vertical OS (Cat 46-55)
(46, 'MFG_OS',      'Manufacturing OS',                 'business_ops',    4281,4360,946, 970, 'future'),
(47, 'LOGISTICS_OS','Logistics OS',                     'business_ops',    4361,4440,971, 995, 'future'),
(48, 'ENERGY_OS',   'Energy OS',                        'business_ops',    4441,4520,996,1020, 'future'),
(49, 'AGRI_OS',     'Agriculture OS',                   'business_ops',    4521,4600,  0,  0,  'future'),
(50, 'HEALTH_OS',   'Healthcare OS',                    'business_ops',    4601,4680,  0,  0,  'future'),
(51, 'ROBOTICS_OS', 'Robotics & Autonomous Systems OS', 'business_ops',    4681,4760,  0,  0,  'future'),
(52, 'IOT_OS',      'IoT & Sensor Grid OS',             'data_intelligence',4761,4840,0,  0,  'future'),
(53, 'SMART_CITY',  'Smart City OS',                    'data_intelligence',4841,4920,0,  0,  'future'),
(54, 'REALITY_GRID','Reality Capture Grid',             'data_intelligence',4921,5000,0,  0,  'future'),
(55, 'KNOW_MESH',   'Global Knowledge Mesh',            'data_intelligence',5001,5080,0,  0,  'future'),
-- Genesis Expansion (Cat 56-70)
(56, 'USL',         'Universal Skill Library',          'empire_systems',  5081,5160,0,   0,  'high'),
(57, 'OMNIVERSE',   'Omniverse Engine',                 'empire_systems',  5161,5240,0,   0,  'future'),
(58, 'ECON_SIM',    'Economic Simulation Engine',       'empire_systems',  5241,5320,0,   0,  'future'),
(59, 'AUTO_ENT',    'Autonomous Enterprise Engine',     'empire_systems',  5321,5400,0,   0,  'future'),
(60, 'MULTI_CO',    'Multi-Company Operating System',   'empire_systems',  5401,5480,0,   0,  'standard'),
(61, 'CIVILIZE',    'Atlas Civilization Engine',        'empire_systems',  5481,5560,0,   0,  'future'),
(62, 'RESEARCH',    'Atlas Research Lab',               'empire_systems',  5561,5640,0,   0,  'future'),
(63, 'INNOVATION',  'Atlas Innovation Lab',             'empire_systems',  5641,5720,0,   0,  'future'),
(64, 'VENTURE',     'Atlas Venture Studio',             'empire_systems',  5721,5800,0,   0,  'future'),
(65, 'CAPITAL',     'Atlas Capital Network',            'empire_systems',  5801,5880,0,   0,  'future'),
(66, 'MEDIA_NET',   'Atlas Media Network',              'transmedia_worldforge',5881,5960,0,0, 'standard'),
(67, 'CREATOR',     'Atlas Creator Network',            'transmedia_worldforge',5961,6040,0,0, 'standard'),
(68, 'RESILIENCE',  'Resilience, Security & Recovery',  'empire_systems',  6041,6120,0,   0,  'high'),
(69, 'GENESIS_MKT', 'Atlas Genesis Marketplace',        'empire_systems',  6121,6200,0,   0,  'high'),
(70, 'GENESIS_CORE','Atlas Genesis Matrix Core',        'empire_systems',  6201,6280,0,   0,  'critical'),
-- Meta-Governance (Cat 71-80)
(71, 'META_ORCH',   'Meta-Orchestration Engine',        'ai_automation',   6281,6360,0,   0,  'high'),
(72, 'INTENT',      'Intent Engine',                    'ai_automation',   6361,6440,0,   0,  'high'),
(73, 'GOAL',        'Goal Engine',                      'ai_automation',   6441,6520,0,   0,  'high'),
(74, 'VALUE',       'Value Engine',                     'ai_automation',   6521,6600,0,   0,  'high'),
(75, 'ATTENTION',   'Attention Engine',                 'ai_automation',   6601,6680,0,   0,  'high'),
(76, 'POSSIBILITY', 'Possibility Engine',               'ai_automation',   6681,6760,0,   0,  'standard'),
(77, 'INVENTION',   'Invention Engine',                 'ai_automation',   6761,6840,0,   0,  'standard'),
(78, 'TRUST',       'Trust Engine',                     'ai_automation',   6841,6920,0,   0,  'high'),
(79, 'CONSTITUTION','Constitution Engine',              'ai_automation',   6921,7000,0,   0,  'critical'),
(80, 'GENESIS_CON', 'Genesis Consciousness Layer',      'ai_automation',   7001,7080,0,   0,  'future'),
-- Data Fabric Foundation (Cat 81-93)
(81, 'UIDF',        'Universal Identity & Data Fabric', 'data_intelligence',7081,7160,0,  0,  'critical'),
(82, 'CONNECTOR_E', 'Universal Connector Engine',       'data_intelligence',7161,7240,0,  0,  'critical'),
(83, 'UCIM',        'Universal Content Ingestion Fabric','data_intelligence',7241,7320,0, 0,  'critical'),
(84, 'PERMISSION_E','Permission & Consent Engine',      'data_intelligence',7321,7400,0,  0,  'critical'),
(85, 'DATA_TRUST',  'Data Trust & Sovereignty Layer',   'data_intelligence',7401,7480,0,  0,  'critical'),
(86, 'PERS_GRAPH',  'Personal Knowledge Graph',         'data_intelligence',7481,7560,0,  0,  'critical'),
(87, 'ORG_GRAPH',   'Organization Knowledge Graph',     'data_intelligence',7561,7640,0,  0,  'high'),
(88, 'FED_GRAPH',   'Federated Graph Network',          'data_intelligence',7641,7720,0,  0,  'standard'),
(89, 'PRI',         'Personal Reality Interface',       'data_intelligence',7721,7800,0,  0,  'standard'),
(90, 'CONTEXT_RE',  'Contextual Reality Engine',        'data_intelligence',7801,7880,0,  0,  'high'),
(91, 'AMBIENT',     'Ambient Copilot System',           'ai_automation',   7881,7960,0,   0,  'high'),
(92, 'WORLD_MESH',  'World Knowledge Mesh',             'data_intelligence',7961,8040,0,  0,  'standard'),
(93, 'DIG_MEM',     'Digital Memory of Reality',        'data_intelligence',8041,8120,0,  0,  'standard'),
-- Sovereignty & Rights (Cat 94-110)
(94, 'USER_SOV',    'User Sovereignty Architecture',    'data_intelligence',8121,8200,0,  0,  'critical'),
(95, 'DATA_VAULT',  'Personal Data Vault',              'data_intelligence',8201,8280,0,  0,  'high'),
(96, 'ZK_TRUST',    'Zero-Knowledge Trust Engine',      'data_intelligence',8281,8360,0,  0,  'standard'),
(97, 'AI_OWN',      'Personal AI Ownership Model',      'data_intelligence',8361,8440,0,  0,  'high'),
(98, 'CONSENT',     'Universal Consent Engine',         'data_intelligence',8441,8520,0,  0,  'critical'),
(99, 'QUANTUM',     'Quantum-Ready Security Layer',     'data_intelligence',8521,8600,0,  0,  'future'),
(100,'DIGITAL_BOR', 'Digital Bill of Rights',           'data_intelligence',8601,8680,0,  0,  'critical')
ON CONFLICT (cat_number) DO NOTHING;

-- ─── MODEL PREFERENCES / ROUTER (ATLAS Orchestra) ─────────────────────────────

CREATE TABLE IF NOT EXISTS model_preferences (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  primary_model   TEXT DEFAULT 'claude-sonnet-4-20250514',
  fast_model      TEXT DEFAULT 'claude-haiku-4-5-20251001',
  deep_model      TEXT DEFAULT 'claude-opus-4-5-20251101',
  offline_model   TEXT DEFAULT 'ollama/llama3.1:8b',
  private_model   TEXT DEFAULT 'ollama/mistral:7b',
  vision_model    TEXT DEFAULT 'claude-sonnet-4-20250514',
  use_tournament  BOOLEAN DEFAULT FALSE,
  tournament_level INTEGER DEFAULT 2 CHECK (tournament_level BETWEEN 1 AND 7),
  max_cost_per_run_usd NUMERIC DEFAULT 0.50,
  prefer_offline  BOOLEAN DEFAULT FALSE,
  models_enabled  TEXT[] DEFAULT ARRAY['claude'],
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE model_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own model prefs" ON model_preferences FOR ALL USING (auth.uid() = user_id);

-- ─── TRUST DASHBOARD (Atlas Constitution enforcement) ─────────────────────────

CREATE TABLE IF NOT EXISTS trust_dashboard_snapshots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data_sources_count INTEGER DEFAULT 0,
  active_permissions INTEGER DEFAULT 0,
  connected_connectors INTEGER DEFAULT 0,
  active_agents_count INTEGER DEFAULT 0,
  automations_running INTEGER DEFAULT 0,
  models_used     TEXT[],
  audit_events_30d INTEGER DEFAULT 0,
  data_exported_mb NUMERIC DEFAULT 0,
  last_permission_review TIMESTAMPTZ,
  snapshot_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE trust_dashboard_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own trust snapshots" ON trust_dashboard_snapshots FOR ALL USING (auth.uid() = user_id);

-- ─── REALTIME ADDITIONS ──────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE living_graph_expansions;
ALTER PUBLICATION supabase_realtime ADD TABLE suggestion_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE workflow_run_steps;
ALTER PUBLICATION supabase_realtime ADD TABLE swarm_templates;

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_living_graph_user    ON living_graph_expansions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_user      ON suggestion_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_swarm_category       ON swarm_templates(category);
CREATE INDEX IF NOT EXISTS idx_skill_cats_tier      ON skill_categories(tier_group);
CREATE INDEX IF NOT EXISTS idx_blueprint_squad      ON agent_blueprints(squad);
