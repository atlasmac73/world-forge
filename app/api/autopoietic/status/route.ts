/**
 * ATLAS v67 — Autopoietic Console: Status
 * GET /api/autopoietic/status
 * Owner/admin only. Read-only snapshot of the Genesis Cycle engine:
 * kill switch state, rate limit window, recent cycles, pending blueprints.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireUser, requireAdmin } from '@/lib/permissions'
import { checkKillSwitch } from '@/lib/agents/killSwitch'
import { AUTOPOIETIC_LIMITS, isWithinRateLimit } from '@/lib/autopoietic/limits'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { user, error: authError } = await requireUser()
  if (authError) return authError

  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  // genesis_cycles rows have no user_id (system-triggered), so RLS would
  // hide them from a cookie-bound client — use the service client for reads.
  const supabase = createServiceClient()

  const { armed } = await checkKillSwitch(supabase)

  const [{ data: cycles }, { data: pendingBlueprints }, { count: blueprintCount }] = await Promise.all([
    supabase
      .from('genesis_cycles')
      .select('id, cycle_number, phase, status, triggered_by, sense_data, interpret_data, mutate_data, simulate_data, promote_data, error_log, started_at, completed_at')
      .order('started_at', { ascending: false })
      .limit(10),
    supabase
      .from('build_blueprints')
      .select('id, title, description, blueprint_type, risk_level, confidence_score, simulation_result, status, proposed_by, cycle_id, created_at')
      .in('status', ['PROPOSED', 'UNDER_REVIEW'])
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('build_blueprints')
      .select('*', { count: 'exact', head: true })
      .in('status', ['PROPOSED', 'UNDER_REVIEW']),
  ])

  const lastCycle = cycles?.[0] ?? null
  const lastAt = lastCycle?.started_at ? new Date(lastCycle.started_at) : null
  const withinRateLimit = isWithinRateLimit(lastAt)
  const nextEligibleAt = lastAt
    ? new Date(lastAt.getTime() + AUTOPOIETIC_LIMITS.MIN_HEARTBEAT_INTERVAL_MINUTES * 60000).toISOString()
    : null

  return NextResponse.json({
    ok: true,
    kill_switch_armed: armed,
    rate_limit: {
      can_trigger_now: !armed && withinRateLimit,
      min_interval_minutes: AUTOPOIETIC_LIMITS.MIN_HEARTBEAT_INTERVAL_MINUTES,
      next_eligible_at: withinRateLimit ? null : nextEligibleAt,
    },
    cycles: cycles ?? [],
    pending_blueprints: pendingBlueprints ?? [],
    pending_blueprint_count: blueprintCount ?? 0,
  })
}
