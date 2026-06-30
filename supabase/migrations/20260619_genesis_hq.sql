-- ============================================================
-- ATLAS Genesis HQ — Product Command Center — v67
-- Founder-only roadmap / kanban / idea-library / mind-map / patent-moat
-- tracker for personal product strategy.
--
-- Unrelated to the existing Genesis Cycle self-improvement engine
-- (genesis_cycles / build_blueprints / lib/autopoietic/heartbeat.ts /
-- app/api/genesis/*). Namespaced "genesis_hq_*" throughout to avoid any
-- collision.
--
-- Unlike the v22 prototype, this app already has real RBAC
-- (profiles.role) — owner/admin/beta_tester/contractor/viewer — so
-- Genesis HQ write access is gated by profiles.role = 'owner' instead of
-- an email env var. Audit events use the existing shared audit_logs
-- table (lib/audit/logger.ts) instead of a dedicated table.
--
-- Isaac Brandon Burdette · Atlas Genesis Matrix LLC
-- ============================================================

-- ─── PHASES ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS genesis_hq_phases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  label       TEXT NOT NULL,
  title       TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#00f5c4',
  status      TEXT NOT NULL DEFAULT 'planned'
              CHECK (status IN ('active','planned','future','complete','archived')),
  eta         TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── AREAS ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS genesis_hq_areas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id    UUID NOT NULL REFERENCES genesis_hq_phases(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  icon        TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── TASKS ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS genesis_hq_tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id    UUID NOT NULL REFERENCES genesis_hq_phases(id) ON DELETE CASCADE,
  area_id     UUID NOT NULL REFERENCES genesis_hq_areas(id) ON DELETE CASCADE,
  source_key  TEXT NOT NULL UNIQUE,
  text        TEXT NOT NULL,
  done        BOOLEAN NOT NULL DEFAULT FALSE,
  priority    TEXT NOT NULL DEFAULT 'medium'
              CHECK (priority IN ('critical','high','medium','low')),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  due_date    DATE,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── KANBAN COLUMNS ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS genesis_hq_kanban_columns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT NOT NULL UNIQUE,
  label       TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#444444',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── KANBAN CARDS ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS genesis_hq_kanban_cards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_key  TEXT NOT NULL,
  task_id     UUID REFERENCES genesis_hq_tasks(id) ON DELETE SET NULL,
  text        TEXT NOT NULL,
  priority    TEXT NOT NULL DEFAULT 'medium'
              CHECK (priority IN ('critical','high','medium','low')),
  phase_label TEXT,
  area_title  TEXT,
  color       TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── IDEAS ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS genesis_hq_ideas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_number    INTEGER UNIQUE,
  category         TEXT NOT NULL
                   CHECK (category IN ('CAPTURE','GENERATE','PRIVACY','CONNECT','PATENT')),
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  patent_direction TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'concept',
  score            INTEGER CHECK (score BETWEEN 0 AND 100),
  tags             TEXT[] NOT NULL DEFAULT '{}',
  created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── MIND MAP NODES ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS genesis_hq_mindmap_nodes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key        TEXT NOT NULL UNIQUE,
  label             TEXT NOT NULL,
  x                 NUMERIC NOT NULL,
  y                 NUMERIC NOT NULL,
  radius            NUMERIC NOT NULL,
  color             TEXT NOT NULL,
  parent_source_key TEXT,
  text_color        TEXT DEFAULT '#ffffff',
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── MOAT SECTIONS ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS genesis_hq_moat_sections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT,
  title       TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#00f5c4',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── MOAT ITEMS ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS genesis_hq_moat_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id  UUID NOT NULL REFERENCES genesis_hq_moat_sections(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── USER PREFERENCES ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS genesis_hq_user_preferences (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  default_view     TEXT NOT NULL DEFAULT 'roadmap',
  collapsed_phases JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── INDEXES ─────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_genesis_hq_areas_phase        ON genesis_hq_areas(phase_id);
CREATE INDEX IF NOT EXISTS idx_genesis_hq_tasks_phase        ON genesis_hq_tasks(phase_id);
CREATE INDEX IF NOT EXISTS idx_genesis_hq_tasks_area         ON genesis_hq_tasks(area_id);
CREATE INDEX IF NOT EXISTS idx_genesis_hq_tasks_done         ON genesis_hq_tasks(done);
CREATE INDEX IF NOT EXISTS idx_genesis_hq_kanban_cards_col   ON genesis_hq_kanban_cards(column_key, sort_order);
CREATE INDEX IF NOT EXISTS idx_genesis_hq_kanban_cards_task  ON genesis_hq_kanban_cards(task_id);
CREATE INDEX IF NOT EXISTS idx_genesis_hq_ideas_category     ON genesis_hq_ideas(category);
CREATE INDEX IF NOT EXISTS idx_genesis_hq_ideas_tags         ON genesis_hq_ideas USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_genesis_hq_ideas_fts          ON genesis_hq_ideas USING gin(
  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(patent_direction,''))
);
CREATE INDEX IF NOT EXISTS idx_genesis_hq_moat_items_section ON genesis_hq_moat_items(section_id);

-- ─── UPDATED_AT TRIGGERS ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_genesis_hq_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_genesis_hq_phases_updated_at ON genesis_hq_phases;
CREATE TRIGGER trg_genesis_hq_phases_updated_at
  BEFORE UPDATE ON genesis_hq_phases
  FOR EACH ROW EXECUTE FUNCTION update_genesis_hq_updated_at();

DROP TRIGGER IF EXISTS trg_genesis_hq_areas_updated_at ON genesis_hq_areas;
CREATE TRIGGER trg_genesis_hq_areas_updated_at
  BEFORE UPDATE ON genesis_hq_areas
  FOR EACH ROW EXECUTE FUNCTION update_genesis_hq_updated_at();

DROP TRIGGER IF EXISTS trg_genesis_hq_tasks_updated_at ON genesis_hq_tasks;
CREATE TRIGGER trg_genesis_hq_tasks_updated_at
  BEFORE UPDATE ON genesis_hq_tasks
  FOR EACH ROW EXECUTE FUNCTION update_genesis_hq_updated_at();

DROP TRIGGER IF EXISTS trg_genesis_hq_kanban_columns_updated_at ON genesis_hq_kanban_columns;
CREATE TRIGGER trg_genesis_hq_kanban_columns_updated_at
  BEFORE UPDATE ON genesis_hq_kanban_columns
  FOR EACH ROW EXECUTE FUNCTION update_genesis_hq_updated_at();

DROP TRIGGER IF EXISTS trg_genesis_hq_kanban_cards_updated_at ON genesis_hq_kanban_cards;
CREATE TRIGGER trg_genesis_hq_kanban_cards_updated_at
  BEFORE UPDATE ON genesis_hq_kanban_cards
  FOR EACH ROW EXECUTE FUNCTION update_genesis_hq_updated_at();

DROP TRIGGER IF EXISTS trg_genesis_hq_ideas_updated_at ON genesis_hq_ideas;
CREATE TRIGGER trg_genesis_hq_ideas_updated_at
  BEFORE UPDATE ON genesis_hq_ideas
  FOR EACH ROW EXECUTE FUNCTION update_genesis_hq_updated_at();

DROP TRIGGER IF EXISTS trg_genesis_hq_mindmap_nodes_updated_at ON genesis_hq_mindmap_nodes;
CREATE TRIGGER trg_genesis_hq_mindmap_nodes_updated_at
  BEFORE UPDATE ON genesis_hq_mindmap_nodes
  FOR EACH ROW EXECUTE FUNCTION update_genesis_hq_updated_at();

DROP TRIGGER IF EXISTS trg_genesis_hq_moat_sections_updated_at ON genesis_hq_moat_sections;
CREATE TRIGGER trg_genesis_hq_moat_sections_updated_at
  BEFORE UPDATE ON genesis_hq_moat_sections
  FOR EACH ROW EXECUTE FUNCTION update_genesis_hq_updated_at();

DROP TRIGGER IF EXISTS trg_genesis_hq_moat_items_updated_at ON genesis_hq_moat_items;
CREATE TRIGGER trg_genesis_hq_moat_items_updated_at
  BEFORE UPDATE ON genesis_hq_moat_items
  FOR EACH ROW EXECUTE FUNCTION update_genesis_hq_updated_at();

DROP TRIGGER IF EXISTS trg_genesis_hq_user_preferences_updated_at ON genesis_hq_user_preferences;
CREATE TRIGGER trg_genesis_hq_user_preferences_updated_at
  BEFORE UPDATE ON genesis_hq_user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_genesis_hq_updated_at();

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────

ALTER TABLE genesis_hq_phases            ENABLE ROW LEVEL SECURITY;
ALTER TABLE genesis_hq_areas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE genesis_hq_tasks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE genesis_hq_kanban_columns    ENABLE ROW LEVEL SECURITY;
ALTER TABLE genesis_hq_kanban_cards      ENABLE ROW LEVEL SECURITY;
ALTER TABLE genesis_hq_ideas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE genesis_hq_mindmap_nodes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE genesis_hq_moat_sections     ENABLE ROW LEVEL SECURITY;
ALTER TABLE genesis_hq_moat_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE genesis_hq_user_preferences  ENABLE ROW LEVEL SECURITY;

-- Content tables: any authenticated user can read.
CREATE POLICY "genesis_hq_phases_read_all"         ON genesis_hq_phases         FOR SELECT TO authenticated USING (true);
CREATE POLICY "genesis_hq_areas_read_all"          ON genesis_hq_areas          FOR SELECT TO authenticated USING (true);
CREATE POLICY "genesis_hq_tasks_read_all"          ON genesis_hq_tasks          FOR SELECT TO authenticated USING (true);
CREATE POLICY "genesis_hq_kanban_columns_read_all" ON genesis_hq_kanban_columns FOR SELECT TO authenticated USING (true);
CREATE POLICY "genesis_hq_kanban_cards_read_all"   ON genesis_hq_kanban_cards   FOR SELECT TO authenticated USING (true);
CREATE POLICY "genesis_hq_ideas_read_all"          ON genesis_hq_ideas          FOR SELECT TO authenticated USING (true);
CREATE POLICY "genesis_hq_mindmap_nodes_read_all"  ON genesis_hq_mindmap_nodes  FOR SELECT TO authenticated USING (true);
CREATE POLICY "genesis_hq_moat_sections_read_all"  ON genesis_hq_moat_sections  FOR SELECT TO authenticated USING (true);
CREATE POLICY "genesis_hq_moat_items_read_all"     ON genesis_hq_moat_items     FOR SELECT TO authenticated USING (true);

-- Content tables: writes restricted to profiles.role = 'owner'. Server
-- routes additionally enforce this via lib/genesis-hq/permissions.ts
-- (requireGenesisHqOwner -> lib/permissions' requireOwner) before ever
-- reaching the service-role client, so this is defense-in-depth, not the
-- only gate.
CREATE POLICY "genesis_hq_phases_write_owner" ON genesis_hq_phases
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'owner'));

CREATE POLICY "genesis_hq_areas_write_owner" ON genesis_hq_areas
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'owner'));

CREATE POLICY "genesis_hq_tasks_write_owner" ON genesis_hq_tasks
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'owner'));

CREATE POLICY "genesis_hq_kanban_columns_write_owner" ON genesis_hq_kanban_columns
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'owner'));

CREATE POLICY "genesis_hq_kanban_cards_write_owner" ON genesis_hq_kanban_cards
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'owner'));

CREATE POLICY "genesis_hq_ideas_write_owner" ON genesis_hq_ideas
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'owner'));

CREATE POLICY "genesis_hq_mindmap_nodes_write_owner" ON genesis_hq_mindmap_nodes
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'owner'));

CREATE POLICY "genesis_hq_moat_sections_write_owner" ON genesis_hq_moat_sections
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'owner'));

CREATE POLICY "genesis_hq_moat_items_write_owner" ON genesis_hq_moat_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'owner'));

-- User preferences: each user owns their own row directly.
CREATE POLICY "genesis_hq_user_preferences_own_row" ON genesis_hq_user_preferences
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Realtime for live kanban/task updates across sessions
ALTER PUBLICATION supabase_realtime ADD TABLE genesis_hq_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE genesis_hq_kanban_cards;
