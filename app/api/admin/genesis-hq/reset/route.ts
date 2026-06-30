/**
 * ATLAS v67 — Genesis HQ Admin: Reset
 * POST /api/admin/genesis-hq/reset → wipes all Genesis HQ content (owner-only)
 * Requires exact body { confirm: "RESET GENESIS HQ" }. Audit-logged BEFORE deletion.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireGenesisHqOwner, handleGenesisHqPermissionError, GenesisHqAccessError } from '@/lib/genesis-hq/permissions'
import { AdminResetSchema } from '@/lib/genesis-hq/validators'
import { writeAuditLog } from '@/lib/audit/logger'

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireGenesisHqOwner()
    const body = await req.json()
    const parsed = AdminResetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Confirmation text did not match "RESET GENESIS HQ"' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Log BEFORE deleting — audit_logs is preserved across reset (it's the
    // shared platform audit table, not a Genesis HQ-owned table).
    await writeAuditLog({
      user_id: ctx.userId,
      action: 'GENESIS_HQ_RESET_RUN',
      resource_type: 'genesis_hq',
      metadata: {},
    })

    // Dependency order: children before parents.
    const tables = [
      'genesis_hq_kanban_cards',
      'genesis_hq_kanban_columns',
      'genesis_hq_moat_items',
      'genesis_hq_moat_sections',
      'genesis_hq_mindmap_nodes',
      'genesis_hq_ideas',
      'genesis_hq_tasks',
      'genesis_hq_areas',
      'genesis_hq_phases',
      'genesis_hq_user_preferences',
    ]

    for (const table of tables) {
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) return NextResponse.json({ error: `Failed clearing ${table}: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ reset: true, tablesCleared: tables.length })
  } catch (error) {
    if (error instanceof GenesisHqAccessError) return handleGenesisHqPermissionError(error)
    console.error('[Genesis HQ Reset] Error:', error)
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 })
  }
}
