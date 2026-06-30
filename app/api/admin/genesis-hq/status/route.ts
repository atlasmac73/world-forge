/**
 * ATLAS v67 — Genesis HQ Admin: Status
 * GET /api/admin/genesis-hq/status → row counts + seeded flag + isOwner
 * Any authenticated user can call this (so the UI can show "view-only"
 * state correctly), but isOwner reflects the real server-side check.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireGenesisHqAccess, handleGenesisHqPermissionError } from '@/lib/genesis-hq/permissions'
import type { GenesisHqAdminStatus } from '@/lib/genesis-hq/types'

export async function GET() {
  try {
    const ctx = await requireGenesisHqAccess()
    const supabase = createClient()

    const counts = await Promise.all(
      [
        'genesis_hq_phases',
        'genesis_hq_areas',
        'genesis_hq_tasks',
        'genesis_hq_kanban_columns',
        'genesis_hq_kanban_cards',
        'genesis_hq_ideas',
        'genesis_hq_mindmap_nodes',
        'genesis_hq_moat_sections',
        'genesis_hq_moat_items',
      ].map((table) => supabase.from(table).select('*', { count: 'exact', head: true }))
    )

    const [phaseCount, areaCount, taskCount, kanbanColumnCount, kanbanCardCount, ideaCount, mindmapNodeCount, moatSectionCount, moatItemCount] =
      counts.map((r) => r.count ?? 0)

    const status: GenesisHqAdminStatus = {
      isOwner: ctx.isOwner,
      phaseCount,
      areaCount,
      taskCount,
      kanbanColumnCount,
      kanbanCardCount,
      ideaCount,
      mindmapNodeCount,
      moatSectionCount,
      moatItemCount,
      isSeeded: phaseCount > 0,
    }

    return NextResponse.json(status)
  } catch (error) {
    return handleGenesisHqPermissionError(error)
  }
}
