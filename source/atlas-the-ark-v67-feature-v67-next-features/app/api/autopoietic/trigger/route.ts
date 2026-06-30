/**
 * ATLAS v67 — Autopoietic Console: Manual Trigger
 * POST /api/autopoietic/trigger
 * Owner/admin only. Runs one tick of the Genesis Cycle engine
 * (SENSE → INTERPRET → MUTATE → SIMULATE → PROMOTE → LEARN).
 * Respects the kill switch and the heartbeat rate limit — both enforced
 * inside runHeartbeatTick() itself, not duplicated here.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireUser, requireAdmin } from '@/lib/permissions'
import { writeAuditLog } from '@/lib/audit/logger'
import { runHeartbeatTick } from '@/lib/autopoietic/heartbeat'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST() {
  const { user, error: authError } = await requireUser()
  if (authError) return authError

  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  // Service client — genesis_cycles/build_blueprints rows are system-owned
  // (no user_id), so they're only writable/readable past RLS this way.
  const supabase = createServiceClient()

  const result = await runHeartbeatTick(supabase, `manual:${user.email ?? user.id}`)

  await writeAuditLog({
    user_id: user.id,
    action: 'GENESIS_CYCLE_TRIGGERED',
    resource_type: 'genesis_cycles',
    resource_id: result.cycle_id ?? undefined,
    metadata: {
      ran: result.ran,
      phase: result.phase,
      blocked_reason: result.blocked_reason,
      blueprints_proposed: result.blueprints_proposed,
      error: result.error,
    },
  })

  if (!result.ran) {
    return NextResponse.json({ ok: false, ...result }, { status: result.error ? 500 : 409 })
  }

  return NextResponse.json({ ok: true, ...result })
}
