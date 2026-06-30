-- ================================================================
-- THE ARK — Pilot Operations Schema (Part E-008 + E-009)
-- Atlas Genesis Matrix LLC · Isaac Brandon Burdette, Sole Inventor
-- Run AFTER schema.sql, schema_canon.sql, schema_living_graph.sql
-- ================================================================

-- ─── ORGANIZATIONS (multi-tenant foundation) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE,
  owner_user_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan            TEXT DEFAULT 'pilot' CHECK (plan IN ('pilot','starter','pro','enterprise','god_mode')),
  atlas_id        TEXT UNIQUE DEFAULT 'ORG-' || upper(substr(md5(random()::text), 1, 8)),
  website         TEXT,
  industry        TEXT,
  employee_count  INTEGER,
  settings        JSONB DEFAULT '{}',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members see their org" ON organizations FOR SELECT USING (
  id IN (SELECT org_id FROM workspace_members WHERE user_id = auth.uid())
  OR owner_user_id = auth.uid()
);

-- ─── WORKSPACES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspaces (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  workspace_type  TEXT DEFAULT 'general' CHECK (workspace_type IN (
    'general','contractor','real_estate','pilot_demo','investor_demo','internal'
  )),
  settings        JSONB DEFAULT '{}',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members see their workspace" ON workspaces FOR SELECT USING (
  id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);

-- ─── WORKSPACE MEMBERS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id          UUID REFERENCES organizations(id),
  role            TEXT DEFAULT 'member' CHECK (role IN ('owner','admin','member','viewer','guest')),
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','invited','suspended','removed')),
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own memberships" ON workspace_members FOR SELECT USING (auth.uid() = user_id);

-- ─── CONTRACTOR PROJECTS (Part E-008 workflows) ───────────────────────────────
CREATE TABLE IF NOT EXISTS contractor_projects (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name    TEXT NOT NULL,
  project_type    TEXT DEFAULT 'construction' CHECK (project_type IN (
    'construction','renovation','tenant_improvement','commercial','residential',
    'medical','industrial','mixed_use','real_estate','demo'
  )),
  customer_name   TEXT,
  customer_email  TEXT,
  customer_phone  TEXT,
  location        TEXT,
  city            TEXT,
  state           TEXT DEFAULT 'WV',
  status          TEXT DEFAULT 'preconstruction' CHECK (status IN (
    'preconstruction','planning','proposal','active','on_hold','complete','cancelled'
  )),
  description     TEXT,
  scope_summary   TEXT,
  budget_estimate NUMERIC,
  contract_value  NUMERIC,
  start_date      DATE,
  end_date        DATE,
  permit_required BOOLEAN DEFAULT FALSE,
  permit_status   TEXT,
  hazmat_required BOOLEAN DEFAULT FALSE,
  activation_score NUMERIC DEFAULT 0,
  value_score     NUMERIC DEFAULT 0,
  trust_score     NUMERIC DEFAULT 0,
  project_files   JSONB DEFAULT '[]',
  imported_emails JSONB DEFAULT '[]',
  imported_events JSONB DEFAULT '[]',
  agent_runs      JSONB DEFAULT '[]',
  tags            TEXT[],
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE contractor_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own contractor projects" ON contractor_projects FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_contractor_projects_user ON contractor_projects(user_id);
CREATE INDEX idx_contractor_projects_status ON contractor_projects(status);

-- ─── PROJECT TASKS (Kanban — 15 cognitive columns) ───────────────────────────
CREATE TABLE IF NOT EXISTS project_tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID REFERENCES contractor_projects(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  column_name     TEXT DEFAULT 'Inbox' CHECK (column_name IN (
    'Inbox','Captured','Research','Discovery','Opportunity','Risk',
    'Recommendation','Decision Required','Approved','Planned',
    'In Progress','Waiting','Blocked','Completed','Knowledge Base'
  )),
  priority        TEXT DEFAULT 'medium' CHECK (priority IN ('critical','high','medium','low')),
  source          TEXT DEFAULT 'manual' CHECK (source IN (
    'manual','ai_extraction','email','document','recommendation','agent'
  )),
  due_date        DATE,
  assigned_to     TEXT,
  evidence_refs   JSONB DEFAULT '[]',
  approved        BOOLEAN DEFAULT FALSE,
  approved_at     TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  ai_suggested    BOOLEAN DEFAULT FALSE,
  ai_confidence   NUMERIC,
  sort_order      INTEGER DEFAULT 0,
  tags            TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own tasks" ON project_tasks FOR ALL USING (auth.uid() = user_id);

-- ─── PROJECT FILES + DOCUMENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_files (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID REFERENCES contractor_projects(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id    UUID REFERENCES workspaces(id),
  file_name       TEXT NOT NULL,
  file_type       TEXT,
  file_size_bytes BIGINT,
  storage_path    TEXT,
  signed_url      TEXT,
  signed_url_expires_at TIMESTAMPTZ,
  parse_status    TEXT DEFAULT 'pending' CHECK (parse_status IN (
    'pending','processing','ready','failed','unsupported','scanned_no_ocr'
  )),
  extracted_text  TEXT,
  chunk_count     INTEGER DEFAULT 0,
  summary         TEXT,
  source          TEXT DEFAULT 'upload' CHECK (source IN ('upload','google_drive','email_attachment')),
  google_file_id  TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own files" ON project_files FOR ALL USING (auth.uid() = user_id);

-- Document chunks for search
CREATE TABLE IF NOT EXISTS document_chunks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id         UUID REFERENCES project_files(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES contractor_projects(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  chunk_index     INTEGER NOT NULL,
  content         TEXT NOT NULL,
  char_count      INTEGER,
  search_vector   TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own chunks" ON document_chunks FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_doc_chunks_search ON document_chunks USING GIN(search_vector);
CREATE INDEX idx_doc_chunks_project ON document_chunks(project_id);

-- ─── GOOGLE CONNECTOR (Part E-009 OAuth flow) ────────────────────────────────
CREATE TABLE IF NOT EXISTS google_connections (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  workspace_id        UUID REFERENCES workspaces(id),
  google_user_id      TEXT,
  google_email        TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at    TIMESTAMPTZ,
  scopes_granted      TEXT[],
  is_read_only        BOOLEAN DEFAULT TRUE,
  status              TEXT DEFAULT 'active' CHECK (status IN ('active','expired','revoked','error')),
  revoked_at          TIMESTAMPTZ,
  last_synced_at      TIMESTAMPTZ,
  import_count        INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE google_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own google connections" ON google_connections FOR ALL USING (auth.uid() = user_id);

-- Google imported records (selective import — not auto-sync)
CREATE TABLE IF NOT EXISTS google_imports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES contractor_projects(id) ON DELETE CASCADE,
  workspace_id    UUID REFERENCES workspaces(id),
  source_type     TEXT NOT NULL CHECK (source_type IN ('gmail','drive','calendar')),
  external_id     TEXT NOT NULL,
  subject         TEXT,
  snippet         TEXT,
  body_excerpt    TEXT,
  sender          TEXT,
  received_at     TIMESTAMPTZ,
  file_name       TEXT,
  file_type       TEXT,
  event_title     TEXT,
  event_start     TIMESTAMPTZ,
  event_end       TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}',
  imported_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE google_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own google imports" ON google_imports FOR ALL USING (auth.uid() = user_id);

-- ─── TRUST DASHBOARD (Part E-008/009 core requirement) ───────────────────────
CREATE TABLE IF NOT EXISTS trust_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id    UUID REFERENCES workspaces(id),
  event_type      TEXT NOT NULL CHECK (event_type IN (
    'user_signed_up','organization_created','workspace_created','project_created',
    'google_connected','google_revoked','gmail_imported','drive_file_imported',
    'calendar_event_imported','file_uploaded','document_parsed','search_performed',
    'agent_run_completed','task_suggestion_created','task_suggestion_approved',
    'task_created','recommendation_created','recommendation_accepted','recommendation_rejected',
    'memory_approved','memory_deleted','trust_dashboard_viewed','daily_briefing_viewed',
    'chief_of_staff_question_asked','pilot_feedback_submitted','permission_changed',
    'connector_revoked','data_exported','data_deleted'
  )),
  resource_type   TEXT,
  resource_id     UUID,
  description     TEXT,
  metadata        JSONB DEFAULT '{}',
  ip_address      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE trust_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own trust events" ON trust_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role inserts" ON trust_events FOR INSERT USING (true);
CREATE INDEX idx_trust_events_user ON trust_events(user_id, created_at DESC);

-- ─── PROJECT MEMORIES (Memory Engine for pilot) ───────────────────────────────
CREATE TABLE IF NOT EXISTS project_memories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES contractor_projects(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  memory_type     TEXT DEFAULT 'fact' CHECK (memory_type IN (
    'fact','preference','lesson','risk','contact','deadline','open_question','scope_assumption'
  )),
  importance      INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  approved        BOOLEAN DEFAULT FALSE,
  approved_at     TIMESTAMPTZ,
  source          TEXT,
  evidence_refs   JSONB DEFAULT '[]',
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE project_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own memories" ON project_memories FOR ALL USING (auth.uid() = user_id);

-- ─── PILOT METRICS (Activation + Value + Trust scores) ────────────────────────
CREATE TABLE IF NOT EXISTS pilot_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id    UUID REFERENCES workspaces(id),
  session_start   TIMESTAMPTZ DEFAULT NOW(),
  session_end     TIMESTAMPTZ,
  activation_score INTEGER DEFAULT 0,
  events_fired    JSONB DEFAULT '[]',
  -- Activation events (from Part E-008 Section 19)
  account_created     BOOLEAN DEFAULT FALSE,
  org_created         BOOLEAN DEFAULT FALSE,
  workspace_created   BOOLEAN DEFAULT FALSE,
  project_created     BOOLEAN DEFAULT FALSE,
  file_uploaded       BOOLEAN DEFAULT FALSE,
  google_imported     BOOLEAN DEFAULT FALSE,
  doc_summary_run     BOOLEAN DEFAULT FALSE,
  task_extraction_run BOOLEAN DEFAULT FALSE,
  task_approved       BOOLEAN DEFAULT FALSE,
  recommendation_reviewed BOOLEAN DEFAULT FALSE,
  cos_question_asked  BOOLEAN DEFAULT FALSE,
  trust_dashboard_opened BOOLEAN DEFAULT FALSE,
  -- Return metrics
  is_return_session   BOOLEAN DEFAULT FALSE,
  session_number      INTEGER DEFAULT 1
);
ALTER TABLE pilot_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own sessions" ON pilot_sessions FOR ALL USING (auth.uid() = user_id);

-- ─── PILOT FEEDBACK ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pilot_feedback (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id    UUID REFERENCES workspaces(id),
  project_id      UUID REFERENCES contractor_projects(id),
  feedback_type   TEXT NOT NULL CHECK (feedback_type IN (
    'bug','confusion','wrong_ai_output','missing_feature','feature_request',
    'trust_concern','pricing_feedback','workflow_gap','performance_issue','positive_signal'
  )),
  feature_area    TEXT,
  severity        TEXT DEFAULT 'medium' CHECK (severity IN ('blocker','high','medium','low','idea')),
  summary         TEXT NOT NULL,
  details         TEXT,
  status          TEXT DEFAULT 'new' CHECK (status IN (
    'new','triaged','accepted','rejected','planned','in_progress','fixed','closed'
  )),
  priority_score  NUMERIC DEFAULT 50,
  -- Feature request scoring dimensions (Part E-008 Section 25)
  user_value_score     INTEGER,
  frequency_score      INTEGER,
  revenue_impact_score INTEGER,
  strategic_fit_score  INTEGER,
  build_difficulty     INTEGER,
  pilot_urgency        INTEGER,
  related_pr           TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at          TIMESTAMPTZ
);
ALTER TABLE pilot_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own feedback" ON pilot_feedback FOR ALL USING (auth.uid() = user_id);

-- ─── CUSTOMER DISCOVERY NOTES (Part E-008 Section 40) ─────────────────────────
CREATE TABLE IF NOT EXISTS discovery_interviews (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interviewer_id  UUID REFERENCES auth.users(id),
  interview_date  TIMESTAMPTZ DEFAULT NOW(),
  user_type       TEXT,
  company_type    TEXT,
  project_volume  TEXT,
  current_tools   TEXT[],
  top_pain_points TEXT,
  current_workflow TEXT,
  atlas_reaction  TEXT,
  most_valuable_feature TEXT,
  least_clear_feature TEXT,
  trust_concerns  TEXT,
  pricing_reaction TEXT,
  feature_requests TEXT[],
  direct_quotes   TEXT[],
  fit_score       INTEGER CHECK (fit_score BETWEEN 1 AND 5),
  follow_up_action TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE discovery_interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read interviews" ON discovery_interviews FOR ALL USING (auth.uid() = interviewer_id);

-- ─── MVP TRACTION METRICS (Part E-008 Section 47) ─────────────────────────────
CREATE TABLE IF NOT EXISTS traction_metrics (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  total_workspaces INTEGER DEFAULT 0,
  pilot_workspaces INTEGER DEFAULT 0,
  active_pilot_users INTEGER DEFAULT 0,
  projects_created INTEGER DEFAULT 0,
  files_uploaded   INTEGER DEFAULT 0,
  google_records_imported INTEGER DEFAULT 0,
  doc_summaries    INTEGER DEFAULT 0,
  task_extraction_runs INTEGER DEFAULT 0,
  tasks_suggested  INTEGER DEFAULT 0,
  tasks_accepted   INTEGER DEFAULT 0,
  recommendation_cards INTEGER DEFAULT 0,
  recommendations_accepted INTEGER DEFAULT 0,
  daily_briefings_generated INTEGER DEFAULT 0,
  cos_questions    INTEGER DEFAULT 0,
  trust_dashboard_views INTEGER DEFAULT 0,
  memories_approved INTEGER DEFAULT 0,
  return_sessions  INTEGER DEFAULT 0,
  time_saved_hours_total NUMERIC DEFAULT 0,
  wtp_signals      INTEGER DEFAULT 0,
  paid_pilot_revenue NUMERIC DEFAULT 0,
  UNIQUE(metric_date)
);
ALTER TABLE traction_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service manages metrics" ON traction_metrics FOR ALL USING (auth.role() = 'service_role');

-- ─── INVESTOR PROOF MILESTONES (Part E-008 Section 46) ────────────────────────
CREATE TABLE IF NOT EXISTS investor_milestones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_code  TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  achieved        BOOLEAN DEFAULT FALSE,
  achieved_at     TIMESTAMPTZ,
  evidence_type   TEXT,
  evidence_url    TEXT,
  evidence_note   TEXT,
  milestone_order INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE investor_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service manages milestones" ON investor_milestones FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Auth read milestones" ON investor_milestones FOR SELECT USING (auth.uid() IS NOT NULL);

-- Seed all 15 milestones from Part E-008
INSERT INTO investor_milestones (milestone_code, title, milestone_order) VALUES
  ('M01', 'Working MVP demo',                1),
  ('M02', 'First pilot workspace',           2),
  ('M03', 'First real project organized',    3),
  ('M04', 'First Google import',             4),
  ('M05', 'First successful document summary',5),
  ('M06', 'First AI-suggested task accepted',6),
  ('M07', 'First recommendation accepted',   7),
  ('M08', 'First Trust Dashboard use',       8),
  ('M09', 'First returning pilot user',      9),
  ('M10', 'First willingness-to-pay signal', 10),
  ('M11', 'First paid pilot',                11),
  ('M12', 'First case study',                12),
  ('M13', 'First repeatable demo video',     13),
  ('M14', 'First investor data room',        14),
  ('M15', 'First investor conversation with proof', 15)
ON CONFLICT (milestone_code) DO NOTHING;

-- ─── DEMO WORKSPACE SEED DATA ─────────────────────────────────────────────────
-- 2 Garden Center pilot project (Part E-008 Section 8)

CREATE OR REPLACE FUNCTION seed_demo_workspace(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
  v_workspace_id UUID;
  v_project_id UUID;
BEGIN
  -- Create demo organization
  INSERT INTO organizations (owner_user_id, name, slug, plan)
  VALUES (p_user_id, 'Atlas Demo Organization', 'atlas-demo', 'pilot')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_org_id;

  IF v_org_id IS NULL THEN
    SELECT id INTO v_org_id FROM organizations WHERE owner_user_id = p_user_id LIMIT 1;
  END IF;

  -- Create demo workspace
  INSERT INTO workspaces (org_id, name, workspace_type)
  VALUES (v_org_id, 'Atlas Contractor Pilot', 'pilot_demo')
  RETURNING id INTO v_workspace_id;

  -- Add user as workspace owner
  INSERT INTO workspace_members (workspace_id, user_id, org_id, role)
  VALUES (v_workspace_id, p_user_id, v_org_id, 'owner');

  -- Create 2 Garden Center project
  INSERT INTO contractor_projects (
    workspace_id, user_id, project_name, project_type, customer_name, customer_email,
    location, city, state, status, scope_summary, budget_estimate, permit_required, hazmat_required
  ) VALUES (
    v_workspace_id, p_user_id,
    '2 Garden Center — Medical Tenant Improvement',
    'medical',
    'Shannon Hill / Family Practice', 'shannon.hill@familypractice.com',
    '2 Garden Center', 'Broomfield', 'CO',
    'proposal',
    'Medical tenant improvement. Building upgrades including roof/window/mechanical/interior coordination. Permit and compliance tracking. Proposal preparation.',
    1342000, TRUE, TRUE
  ) RETURNING id INTO v_project_id;

  -- Seed demo tasks (Part E-008 Section 9)
  INSERT INTO project_tasks (project_id, user_id, title, column_name, priority, ai_suggested, approved) VALUES
    (v_project_id, p_user_id, 'Confirm final scope assumptions', 'Planned', 'high', TRUE, TRUE),
    (v_project_id, p_user_id, 'Confirm paint/material selections', 'Planned', 'high', TRUE, TRUE),
    (v_project_id, p_user_id, 'Review permit requirements', 'Planned', 'critical', TRUE, TRUE),
    (v_project_id, p_user_id, 'Confirm mechanical scope', 'In Progress', 'high', TRUE, TRUE),
    (v_project_id, p_user_id, 'Confirm window count and specs', 'Planned', 'medium', TRUE, FALSE),
    (v_project_id, p_user_id, 'Prepare customer update', 'Recommendation', 'high', TRUE, FALSE),
    (v_project_id, p_user_id, 'Review asbestos/lead/hazard assumptions', 'Decision Required', 'critical', TRUE, FALSE),
    (v_project_id, p_user_id, 'Verify schedule assumptions', 'Research', 'medium', TRUE, FALSE),
    (v_project_id, p_user_id, 'Prepare revised proposal packet', 'Planned', 'high', FALSE, TRUE),
    (v_project_id, p_user_id, 'Collect missing documents', 'In Progress', 'medium', FALSE, TRUE);

  -- Seed demo memories
  INSERT INTO project_memories (user_id, project_id, content, memory_type, importance, approved) VALUES
    (p_user_id, v_project_id, 'Customer prefers written updates over phone calls.', 'preference', 8, TRUE),
    (p_user_id, v_project_id, 'Project requires hazmat/asbestos inspection before final pricing.', 'risk', 10, TRUE),
    (p_user_id, v_project_id, 'Permit review must be complete before schedule commitment.', 'risk', 9, TRUE),
    (p_user_id, v_project_id, 'Shannon Hill is the decision maker — no board approval needed.', 'contact', 7, TRUE),
    (p_user_id, v_project_id, 'Budget jumped significantly in latest revision — explanation needed.', 'open_question', 8, FALSE);

  RETURN v_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── RELEASE VERSIONING (Part E-009 Section 31) ───────────────────────────────
CREATE TABLE IF NOT EXISTS release_versions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version         TEXT UNIQUE NOT NULL,
  release_date    DATE DEFAULT CURRENT_DATE,
  summary         TEXT,
  new_features    TEXT[],
  bug_fixes       TEXT[],
  security_notes  TEXT[],
  known_issues    TEXT[],
  tested_items    TEXT[],
  status          TEXT DEFAULT 'development' CHECK (status IN (
    'development','staging','production','deprecated'
  )),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE release_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read releases" ON release_versions FOR SELECT USING (auth.uid() IS NOT NULL);

INSERT INTO release_versions (version, summary, new_features, status) VALUES
  ('v0.1', 'App Shell',             ARRAY['Next.js 14 foundation','ATLAS design system','Supabase connection'], 'production'),
  ('v0.2', 'Auth + Workspace + RLS', ARRAY['Supabase Auth','Organization/workspace creation','Full RLS'], 'production'),
  ('v0.3', 'Projects + Tasks',      ARRAY['Contractor project CRUD','15-column Kanban','Task extraction'], 'production'),
  ('v0.4', 'Files + Search',        ARRAY['File upload','Document parsing','Project search'], 'production'),
  ('v0.5', 'Google Connector',      ARRAY['Gmail selective import','Drive selective import','Calendar attach','Revocation'], 'development'),
  ('v0.6', 'Agent Runtime',         ARRAY['Document Summary Agent','Task Extraction Agent','Agent Run History'], 'development'),
  ('v0.7', 'Recommendations',       ARRAY['Recommendation cards','Memory approval','Project briefings'], 'development'),
  ('v0.8', 'Workflow Engine',       ARRAY['Document-to-task workflow','Email-to-task','Customer update draft'], 'development'),
  ('v0.9', 'Chief of Staff + Trust',ARRAY['LUKA streaming copilot','Evidence Drawer','Trust Dashboard'], 'development'),
  ('v1.0', 'Contractor Command Center Pilot', ARRAY['All pilot workflows','Demo workspace','QA complete'], 'development')
ON CONFLICT (version) DO NOTHING;

-- ─── REALTIME ──────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE project_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE pilot_feedback;
ALTER PUBLICATION supabase_realtime ADD TABLE trust_events;
ALTER PUBLICATION supabase_realtime ADD TABLE project_memories;

-- ─── INDEXES ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_column  ON project_tasks(column_name);
CREATE INDEX IF NOT EXISTS idx_project_files_project ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_google_imports_user   ON google_imports(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_pilot_sessions_user   ON pilot_sessions(user_id);
