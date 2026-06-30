-- ============================================================
-- ATLAS Agent Task Queue — v66
-- The self-build brain layer.
-- Isaac Brandon Burdette · Atlas Genesis Matrix LLC
-- ============================================================

CREATE TABLE IF NOT EXISTS agent_tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  title         TEXT NOT NULL,
  description   TEXT,
  type          TEXT NOT NULL DEFAULT 'feature',
  priority      INTEGER NOT NULL DEFAULT 50,
  effort        TEXT DEFAULT 'medium',
  estimated_hrs NUMERIC(6,1),
  source_agent  TEXT,
  source_portal TEXT,
  genesis_cycle_id UUID,
  target_portal TEXT,
  assigned_to   TEXT,
  sprint        INTEGER,
  status        TEXT NOT NULL DEFAULT 'pending',
  approved_by   UUID REFERENCES auth.users(id),
  approved_at   TIMESTAMPTZ,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  result_summary TEXT,
  pr_url        TEXT,
  vercel_url    TEXT,
  tags          TEXT[],
  blocking      UUID[],
  blocked_by    UUID[],
  CONSTRAINT valid_status CHECK (status IN ('pending','approved','in_progress','done','rejected','deferred')),
  CONSTRAINT valid_priority CHECK (priority BETWEEN 0 AND 100),
  CONSTRAINT valid_effort CHECK (effort IN ('tiny','small','medium','large','epic'))
);

CREATE TABLE IF NOT EXISTS agent_task_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      UUID NOT NULL REFERENCES agent_tasks(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor        UUID REFERENCES auth.users(id),
  actor_agent  TEXT,
  event_type   TEXT NOT NULL,
  note         TEXT,
  metadata     JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_status    ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_priority  ON agent_tasks(priority DESC);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_portal    ON agent_tasks(target_portal);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_sprint    ON agent_tasks(sprint);
CREATE INDEX IF NOT EXISTS idx_agent_task_events_task ON agent_task_events(task_id);

CREATE OR REPLACE FUNCTION update_agent_tasks_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_agent_tasks_updated_at ON agent_tasks;
CREATE TRIGGER trg_agent_tasks_updated_at
  BEFORE UPDATE ON agent_tasks
  FOR EACH ROW EXECUTE FUNCTION update_agent_tasks_updated_at();

ALTER TABLE agent_tasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_task_events ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view tasks (read-only)
CREATE POLICY "tasks_read_all" ON agent_tasks
  FOR SELECT TO authenticated USING (true);

-- FIXED: Use profiles.role instead of auth.users raw_app_meta_data
-- This matches the app's actual RBAC system in lib/permissions/index.ts
CREATE POLICY "tasks_write_admin" ON agent_tasks
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "task_events_read_all" ON agent_task_events
  FOR SELECT TO authenticated USING (true);

-- FIXED: Use profiles.role instead of auth.users raw_app_meta_data
CREATE POLICY "task_events_write_admin" ON agent_task_events
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role IN ('owner', 'admin')
    )
  );
