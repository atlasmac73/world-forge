/**
 * ATLAS v67 — Autopoietic Heartbeat Engine
 * Genesis Cycle: SENSE → INTERPRET → MUTATE → SIMULATE → PROMOTE → LEARN
 *
 * SAFETY RULES (enforced here, not just documented):
 * 1. Kill switch check before any phase runs
 * 2. Human approval required at PROMOTE for HIGH/CRITICAL risk
 * 3. No code auto-deployed — PROMOTE writes blueprint status only
 * 4. No GitHub PR auto-created here — that requires human trigger
 * 5. Rate-limited by AUTOPOIETIC_LIMITS
 *
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { isWithinRateLimit, AUTOPOIETIC_LIMITS } from './limits'
import { checkKillSwitch } from '@/lib/agents/killSwitch'
import { runTournament } from '@/lib/tournament/engine'

export type GenesisPhase =
  | 'SENSE'
  | 'INTERPRET'
  | 'MUTATE'
  | 'SIMULATE'
  | 'PROMOTE'
  | 'LEARN'

export interface HeartbeatResult {
  ran: boolean
  phase: GenesisPhase | null
  cycle_id: string | null
  blocked_reason?: string
  blueprints_proposed: number
  error?: string
}

/**
 * Run one tick of the Genesis Cycle.
 * Called by /api/heartbeat (Vercel Cron) — admin/owner only.
 * The cycle progresses through phases sequentially.
 * Each tick advances by one phase (or creates a new cycle if none is active).
 */
export async function runHeartbeatTick(
  supabase: SupabaseClient,
  triggeredBy: string = 'cron'
): Promise<HeartbeatResult> {
  // 1. Kill switch
  const { armed } = await checkKillSwitch(supabase)
  if (armed) {
    return { ran: false, phase: null, cycle_id: null, blocked_reason: 'kill_switch_armed', blueprints_proposed: 0 }
  }

  // 2. Rate limit — check last cycle
  let lastCycle: { id: string; created_at: string; status: string; phase: string } | null = null
  try {
    const { data } = await supabase
      .from('genesis_cycles')
      .select('id, created_at, status, phase')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    lastCycle = data
  } catch { /* best-effort, ignore */ }

  const lastAt = lastCycle?.created_at ? new Date(lastCycle.created_at) : null
  if (!isWithinRateLimit(lastAt)) {
    return {
      ran: false, phase: null, cycle_id: null,
      blocked_reason: `rate_limited — min ${AUTOPOIETIC_LIMITS.MIN_HEARTBEAT_INTERVAL_MINUTES}m between cycles`,
      blueprints_proposed: 0,
    }
  }

  // 3. Create new Genesis Cycle record
  const { data: cycle, error: cycleError } = await supabase
    .from('genesis_cycles')
    .insert({
      triggered_by: triggeredBy,
      phase: 'SENSE',
      status: 'running',
      sense_data: {},
      interpret_data: {},
      mutate_data: {},
      simulate_data: {},
    })
    .select('id')
    .single()

  if (cycleError || !cycle) {
    return { ran: false, phase: null, cycle_id: null, error: cycleError?.message ?? 'Failed to create cycle', blueprints_proposed: 0 }
  }

  const cycleId = cycle.id

  try {
    // PHASE 1: SENSE — gather platform metrics
    const senseData = await runSensePhase(supabase)
    await updateCyclePhase(supabase, cycleId, 'INTERPRET', { sense_data: senseData })

    // PHASE 2: INTERPRET — analyze for improvement opportunities
    const interpretData = interpretMetrics(senseData)
    await updateCyclePhase(supabase, cycleId, 'MUTATE', { interpret_data: interpretData })

    // PHASE 3: MUTATE — propose blueprints (limited by MAX_BLUEPRINTS_PER_CYCLE)
    const blueprints = await proposeBlueprintsFromInterpretation(supabase, cycleId, interpretData)
    await updateCyclePhase(supabase, cycleId, 'SIMULATE', { mutate_data: { blueprints_proposed: blueprints.length } })

    // PHASE 4: SIMULATE — score the proposed blueprints via the tournament
    // engine (LLM-judge ranks them on impact/feasibility/safety/clarity) and
    // write real confidence scores. Still NO auto-execution — scoring only.
    const simulateData = await simulateBlueprints(supabase, cycleId, blueprints, triggeredBy)
    await updateCyclePhase(supabase, cycleId, 'PROMOTE', { simulate_data: simulateData })

    // PHASE 5: PROMOTE — human approval gate
    // Blueprints that require human approval stay PROPOSED
    // Only LOW/MEDIUM risk non-sensitive types would auto-advance
    // For now: ALL blueprints stay PROPOSED (safest default)
    await updateCyclePhase(supabase, cycleId, 'LEARN', {
      promote_data: { promoted: 0, pending_approval: blueprints.length }
    })

    // PHASE 6: LEARN — record outcomes
    await supabase
      .from('genesis_cycles')
      .update({ status: 'complete', phase: 'LEARN', completed_at: new Date().toISOString() })
      .eq('id', cycleId)

    return {
      ran: true,
      phase: 'LEARN',
      cycle_id: cycleId,
      blueprints_proposed: blueprints.length,
    }

  } catch (err) {
    await supabase
      .from('genesis_cycles')
      .update({ status: 'failed', error_log: err instanceof Error ? err.message : String(err) })
      .eq('id', cycleId)

    return {
      ran: false, phase: null, cycle_id: cycleId,
      error: err instanceof Error ? err.message : 'Unknown error',
      blueprints_proposed: 0,
    }
  }
}

// ─── Phase Implementations ────────────────────────────────────────────────────

async function runSensePhase(supabase: SupabaseClient) {
  // Gather real platform metrics
  const [props, leads, runs, blueprints] = await Promise.all([
    supabase.from('properties').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('agent_runs').select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('build_blueprints').select('*', { count: 'exact', head: true })
      .eq('status', 'PROPOSED'),
  ])

  return {
    properties: props.count ?? 0,
    leads: leads.count ?? 0,
    agent_runs_24h: runs.count ?? 0,
    pending_blueprints: blueprints.count ?? 0,
    sensed_at: new Date().toISOString(),
  }
}

function interpretMetrics(senseData: Record<string, unknown>) {
  const opportunities: string[] = []

  if ((senseData.properties as number) < 10) {
    opportunities.push('Low property count — suggest AIN import workflow')
  }
  if ((senseData.agent_runs_24h as number) === 0) {
    opportunities.push('No agent runs in 24h — check for billing or auth blockers')
  }
  if ((senseData.pending_blueprints as number) > 5) {
    opportunities.push('Blueprint queue has 5+ proposals — admin review needed')
  }

  return { opportunities, interpreted_at: new Date().toISOString() }
}

async function proposeBlueprintsFromInterpretation(
  supabase: SupabaseClient,
  cycleId: string,
  interpretData: { opportunities: string[] }
) {
  const proposals = interpretData.opportunities.slice(0, AUTOPOIETIC_LIMITS.MAX_BLUEPRINTS_PER_CYCLE)
  const inserted: string[] = []

  for (const opp of proposals) {
    let data: { id: string } | null = null
    try {
      const result = await supabase
        .from('build_blueprints')
        .insert({
          cycle_id: cycleId,
          title: opp,
          description: `Auto-proposed by Genesis Cycle — requires human review before action`,
          proposed_by: 'A03-GENESIS',
          status: 'PROPOSED',
          blueprint_type: 'config_change',
          risk_level: 'LOW',
          confidence_score: 40,
        })
        .select('id')
        .single()
      data = result.data
    } catch { /* best-effort, ignore */ }

    if (data?.id) inserted.push(data.id)
  }

  return inserted
}

async function updateCyclePhase(
  supabase: SupabaseClient,
  cycleId: string,
  nextPhase: GenesisPhase,
  data: Record<string, unknown>
) {
  await supabase
    .from('genesis_cycles')
    .update({ phase: nextPhase, ...data })
    .eq('id', cycleId)
}

/**
 * SIMULATE: run the proposed blueprints through the tournament engine so the
 * LLM-judge ranks them and assigns real confidence scores. This is evaluation
 * only — it writes confidence_score + simulation_result on each blueprint and
 * never changes blueprint status (everything stays PROPOSED, human-gated).
 *
 * Needs >= 2 blueprints to hold a contest; otherwise it records a
 * pending-review result without simulating (honest, not a fake score).
 */
async function simulateBlueprints(
  supabase: SupabaseClient,
  cycleId: string,
  blueprintIds: string[],
  triggeredBy: string
): Promise<Record<string, unknown>> {
  if (blueprintIds.length < 2) {
    return {
      simulated: blueprintIds.length,
      scored: false,
      result: 'pending_human_review',
      reason: 'Need at least 2 blueprints to run an evaluation tournament.',
    }
  }

  try {
    const { data: rows } = await supabase
      .from('build_blueprints')
      .select('id, title, description, blueprint_type, risk_level')
      .in('id', blueprintIds)

    const candidates = (rows ?? []).map(r => ({
      id: r.id as string,
      label: (r.title as string) ?? r.id,
      output: `Type: ${r.blueprint_type ?? 'n/a'} · Risk: ${r.risk_level ?? 'n/a'}\n${r.description ?? r.title ?? ''}`,
    }))

    if (candidates.length < 2) {
      return { simulated: candidates.length, scored: false, result: 'pending_human_review' }
    }

    const outcome = await runTournament(supabase, {
      title: `Genesis SIMULATE — cycle ${cycleId.slice(0, 8)}`,
      mode: 'blueprint',
      prompt:
        'Evaluate these proposed ATLAS platform-improvement blueprints. Decide which is most valuable AND safe to promote for human review. Score each blueprint.',
      competitors: candidates.map(c => ({
        kind: 'blueprint' as const,
        id: c.id,
        label: c.label,
        presetOutput: c.output,
      })),
      criteria: [
        { name: 'impact', weight: 0.35 },
        { name: 'feasibility', weight: 0.25 },
        { name: 'safety', weight: 0.25 },
        { name: 'clarity', weight: 0.15 },
      ],
      createdBy: `genesis:${triggeredBy}`,
    })

    // Map judged entry scores back onto each blueprint's confidence + result.
    if (outcome.tournamentId) {
      const { data: entries } = await supabase
        .from('tournament_entries')
        .select('competitor_id, score, score_breakdown, rank')
        .eq('tournament_id', outcome.tournamentId)

      for (const e of entries ?? []) {
        const score = typeof e.score === 'number' ? Math.round(e.score) : null
        await supabase.from('build_blueprints').update({
          confidence_score: score,
          simulation_result: {
            tournament_id: outcome.tournamentId,
            rank: e.rank,
            score: e.score,
            breakdown: e.score_breakdown,
            judged_at: new Date().toISOString(),
          },
        }).eq('id', e.competitor_id)
      }
    }

    return {
      simulated: candidates.length,
      scored: true,
      result: 'pending_human_review',
      tournament_id: outcome.tournamentId,
      winner: outcome.winnerLabel,
      winner_score: outcome.winnerScore,
      verdict: outcome.summary,
    }
  } catch (err) {
    // Tournament failure must not break the cycle — fall back to pending review.
    return {
      simulated: blueprintIds.length,
      scored: false,
      result: 'pending_human_review',
      error: err instanceof Error ? err.message : 'simulation failed',
    }
  }
}
