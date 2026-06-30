// lib/genesis-hq/types.ts
// ATLAS v67 — Genesis HQ (Product Command Center) — TypeScript Types
//
// Genesis HQ is unrelated to the existing "Genesis Cycle" self-improvement
// engine (lib/autopoietic/heartbeat.ts, app/api/genesis/*). It's a roadmap /
// kanban / idea-library / mind-map / patent-moat tracker for the founder's
// own product strategy. Namespaced "genesis-hq" / "genesis_hq_*" throughout
// to avoid any collision with the Genesis Cycle engine.

export type GenesisHqPriority = 'critical' | 'high' | 'medium' | 'low'
export type GenesisHqPhaseStatus = 'active' | 'planned' | 'future' | 'complete' | 'archived'
export type GenesisHqView = 'roadmap' | 'kanban' | 'mindmap' | 'ideas' | 'moat'
export type GenesisHqIdeaCategory = 'CAPTURE' | 'GENERATE' | 'PRIVACY' | 'CONNECT' | 'PATENT'
export type GenesisHqKanbanColumnKey = 'backlog' | 'inprogress' | 'review' | 'done'

export interface GenesisHqPhase {
  id: string
  slug: string // "p1" - "p5"
  label: string // "PHASE 1"
  title: string // "FOUNDATION & PROTECTION"
  color: string
  status: GenesisHqPhaseStatus
  eta: string | null
  sort_order: number
  created_by: string | null
  created_at: string
  updated_at: string
  areas?: GenesisHqArea[]
}

export interface GenesisHqArea {
  id: string
  phase_id: string
  slug: string // "a1" - "a8"
  title: string
  icon: string | null
  sort_order: number
  created_at: string
  updated_at: string
  tasks?: GenesisHqTask[]
}

export interface GenesisHqTask {
  id: string
  phase_id: string
  area_id: string
  source_key: string // "t1" - "t56"
  text: string
  done: boolean
  priority: GenesisHqPriority
  sort_order: number
  due_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface GenesisHqKanbanColumn {
  id: string
  key: GenesisHqKanbanColumnKey
  label: string
  color: string
  sort_order: number
  created_at: string
  updated_at: string
  cards?: GenesisHqKanbanCard[]
}

export interface GenesisHqKanbanCard {
  id: string
  column_key: GenesisHqKanbanColumnKey
  task_id: string | null
  text: string
  priority: GenesisHqPriority
  phase_label: string | null
  area_title: string | null
  color: string | null
  sort_order: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface GenesisHqIdea {
  id: string
  source_number: number | null
  category: GenesisHqIdeaCategory
  title: string
  description: string
  patent_direction: string
  status: string
  score: number | null
  tags: string[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface GenesisHqMindMapNode {
  id: string
  source_key: string // "root", "n1", "c1", etc
  label: string
  x: number
  y: number
  radius: number
  color: string
  parent_source_key: string | null
  text_color: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface GenesisHqMoatSection {
  id: string
  slug: string
  icon: string | null
  title: string
  color: string
  sort_order: number
  created_at: string
  updated_at: string
  items?: GenesisHqMoatItem[]
}

export interface GenesisHqMoatItem {
  id: string
  section_id: string
  text: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface GenesisHqStats {
  totalTasks: number
  doneTasks: number
  progressPct: number
  totalIdeas: number
  totalPhases: number
  totalAreas: number
  kanbanColumns: number
  kanbanCards: number
}

// Mirrors a row from the shared `audit_logs` table (lib/audit/logger.ts),
// filtered to resource_type = 'genesis_hq'. There is no dedicated
// genesis_hq_audit_events table in v67 — Genesis HQ reuses the platform's
// shared audit log instead.
export interface GenesisHqAuditEvent {
  id: string
  user_id: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface GenesisHqUserPreferences {
  id: string
  user_id: string
  default_view: GenesisHqView
  collapsed_phases: Record<string, boolean>
  created_at: string
  updated_at: string
}

export interface GenesisHqOverview {
  stats: GenesisHqStats
  phases: GenesisHqPhase[]
  kanban: GenesisHqKanbanColumn[]
  ideas: GenesisHqIdea[]
  mindmap: GenesisHqMindMapNode[]
  moat: GenesisHqMoatSection[]
}

export interface GenesisHqAdminStatus {
  isOwner: boolean
  phaseCount: number
  areaCount: number
  taskCount: number
  kanbanColumnCount: number
  kanbanCardCount: number
  ideaCount: number
  mindmapNodeCount: number
  moatSectionCount: number
  moatItemCount: number
  isSeeded: boolean
}

// ─── Query Params ──────────────────────────────────────────────
export interface GenesisHqIdeaQuery {
  category?: GenesisHqIdeaCategory | 'ALL'
  q?: string
  limit?: number
  offset?: number
}
