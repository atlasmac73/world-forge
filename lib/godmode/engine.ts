/**
 * ATLAS v67 — God Mode Engine
 * Orchestrates the 4-agent pod: ORACLE → INVESTIGATOR → UNDERWRITER → COPYWRITER
 * Merges best of v12 God Mode engine with v67 conventions.
 * All runs persisted. Kill switch respected. No mock data.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { checkKillSwitch } from '@/lib/agents/killSwitch'
import { routeModel, type TierCode } from '@/lib/models/router'
import { scoreProperty, type ScoringInput } from '@/lib/scoring/engine'

// ─── Types ───────────────────────────────────────────────────────────────────

export type GodModePhase = 'orchestrate' | 'investigate' | 'underwrite' | 'copywrite' | 'complete' | 'failed'

export interface GodModeInput {
  address: string
  property_id?: string
  deal_id?: string
  user_id: string
  tier_code?: TierCode
  options?: {
    skip_copywrite?: boolean  // For faster runs
    save_artifacts?: boolean
    max_credits?: number
  }
}

export interface GodModeProgress {
  phase:       GodModePhase
  run_id?:     string
  step_count:  number
  elapsed_ms:  number
  error?:      string
}

export interface GodModeResult {
  ok:         boolean
  run_id:     string | null
  address:    string
  dossier:    Record<string, unknown> | null
  score:      number | null
  grade:      string | null
  mao:        number | null
  duration_ms: number
  agents_used: string[]
  artifacts:  string[]  // artifact IDs
  error?:     string
}

// ─── Engine ──────────────────────────────────────────────────────────────────

export async function runGodMode(
  supabase: SupabaseClient,
  input: GodModeInput,
  onProgress?: (p: GodModeProgress) => void
): Promise<GodModeResult> {
  const startTime = Date.now()
  const { address, user_id, tier_code = 'T1', options = {} } = input
  const { save_artifacts = true } = options

  const report = (phase: GodModePhase, stepCount: number, error?: string) => {
    onProgress?.({
      phase,
      elapsed_ms: Date.now() - startTime,
      step_count: stepCount,
      error,
    })
  }

  // 1. Kill switch
  const { armed } = await checkKillSwitch(supabase)
  if (armed) {
    return {
      ok: false, run_id: null, address, dossier: null,
      score: null, grade: null, mao: null,
      duration_ms: Date.now() - startTime,
      agents_used: [], artifacts: [],
      error: 'Kill switch armed — God Mode halted',
    }
  }

  // 2. Create run record
  report('orchestrate', 0)
  let run: { id: string } | null = null
  try {
    const { data } = await supabase
      .from('agent_runs')
      .insert({
        user_id,
        agent_code:  'A01-ORACLE',
        tool_name:   'god_mode',
        status:      'running',
        input:       { address, tier_code },
        credits_consumed: 25,
      })
      .select('id')
      .single()
    run = data
  } catch { /* best-effort, ignore */ }

  const runId = run?.id ?? null
  const artifactIds: string[] = []

  try {
    // 3. Route models based on tier
    const investigatorModel = routeModel('dossier', tier_code)
    const underwriterModel  = routeModel('underwriting', tier_code)

    // 4. INVESTIGATOR phase — dynamic import to avoid circular deps
    report('investigate', 1)
    const { runInvestigator } = await import('@/lib/agents/investigator')
    const step1Start = Date.now()
    const investigation = await runInvestigator(address)

    await saveStep(supabase, runId, {
      stepNumber: 1,
      agentCode: 'A12-SPECTER',
      agentName: 'SPECTER Investigator',
      stepType: 'investigate',
      inputJson: { address },
      outputJson: investigation,
      durationMs: Date.now() - step1Start,
      modelUsed: investigatorModel.modelId,
    })

    // 5. UNDERWRITER phase
    report('underwrite', 2)
    const { runUnderwriter } = await import('@/lib/agents/underwriter')
    const step2Start = Date.now()
    const underwriting = await runUnderwriter(investigation)

    await saveStep(supabase, runId, {
      stepNumber: 2,
      agentCode: 'A15-OMEN',
      agentName: 'OMEN Underwriter',
      stepType: 'underwrite',
      inputJson: { investigation_address: investigation.address },
      outputJson: {
        arv: underwriting.arv,
        mao: underwriting.recommended_offer,
        grade: underwriting.deal_grade,
        score: underwriting.distress_score,
      },
      durationMs: Date.now() - step2Start,
      modelUsed: underwriterModel.modelId,
    })

    // 6. Run distress scoring engine on underwriting data
    const scoringInput: ScoringInput = {
      tax_delinquent:   investigation.tax_status === 'delinquent',
      tax_owed:         investigation.tax_owed,
      is_vacant:        investigation.occupancy === 'vacant',
      arv:              underwriting.arv,
      asking_price:     undefined,
      estimated_repair: underwriting.estimated_repair,
      absentee_owner:   investigation.owner_mailing_address !== undefined,
      liens:            investigation.liens.length > 0,
    }
    const scoringResult = scoreProperty(scoringInput)

    // 7. COPYWRITER phase (optional)
    let copy: Record<string, unknown> = {}
    if (!options.skip_copywrite) {
      report('copywrite', 3)
      const { runCopywriter } = await import('@/lib/agents/copywriter')
      const step3Start = Date.now()
      copy = await runCopywriter(investigation, underwriting) as unknown as Record<string, unknown>

      await saveStep(supabase, runId, {
        stepNumber: 3,
        agentCode: 'A06-HERALD',
        agentName: 'HERALD Copywriter',
        stepType: 'copywrite',
        inputJson: { address, owner_name: investigation.owner_name },
        outputJson: { sequences_generated: true },
        durationMs: Date.now() - step3Start,
        modelUsed: routeModel('copywriting', tier_code).modelId,
      })
    }

    // 8. Compose full dossier
    const dossier: Record<string, unknown> = {
      address:               investigation.address,
      owner_name:            investigation.owner_name,
      owner_phone:           investigation.owner_phone,
      owner_email:           investigation.owner_email,
      // Financial
      arv:                   underwriting.arv,
      assessed_value:        investigation.assessed_value,
      estimated_repair:      underwriting.estimated_repair,
      recommended_offer:     underwriting.recommended_offer,
      mao:                   underwriting.recommended_offer,
      equity_pct:            underwriting.equity_pct,
      net_profit_potential:  underwriting.net_profit_potential,
      // Distress (from scoring engine + agent)
      distress_score:        scoringResult.score,
      agent_distress_score:  underwriting.distress_score,
      deal_grade:            underwriting.deal_grade,
      scoring_grade:         scoringResult.grade,
      signals_fired:         scoringResult.signals_fired,
      distress_signals:      scoringResult.signals,
      risk_factors:          underwriting.risk_factors,
      investment_thesis:     underwriting.investment_thesis,
      // Owner
      tax_delinquent:        investigation.tax_status === 'delinquent',
      tax_owed:              investigation.tax_owed,
      occupancy:             investigation.occupancy,
      liens:                 investigation.liens,
      // Outreach
      ...copy,
      // Meta
      agents_used:           options.skip_copywrite
        ? ['A01-ORACLE', 'A12-SPECTER', 'A15-OMEN']
        : ['A01-ORACLE', 'A12-SPECTER', 'A15-OMEN', 'A06-HERALD'],
      run_id:                runId,
      tier_code,
      duration_ms:           Date.now() - startTime,
      generated_at:          new Date().toISOString(),
    }

    // 9. Save artifact
    if (save_artifacts && runId) {
      let artifact: { id: string } | null = null
      try {
        const { data } = await supabase
          .from('agent_artifacts')
          .insert({
            run_id:         runId,
            user_id,
            property_id:    input.property_id ?? null,
            deal_id:        input.deal_id ?? null,
            artifact_type:  'dossier',
            title:          `God Mode Dossier: ${address}`,
            content:        JSON.stringify(dossier, null, 2),
            content_json:   dossier,
            model_used:     investigatorModel.modelId,
            quality_score:  scoringResult.score,
          })
          .select('id')
          .single()
        artifact = data
      } catch { /* best-effort, ignore */ }

      if (artifact?.id) artifactIds.push(artifact.id)
    }

    // 10. Finalize run
    const duration = Date.now() - startTime
    if (runId) {
      try {
        await supabase.from('agent_runs').update({
          status:       'completed',
          output:       dossier,
          duration_ms:  duration,
          completed_at: new Date().toISOString(),
        }).eq('id', runId)
      } catch { /* best-effort, ignore */ }
    }

    report('complete', options.skip_copywrite ? 3 : 4)

    return {
      ok:          true,
      run_id:      runId,
      address,
      dossier,
      score:       scoringResult.score,
      grade:       scoringResult.grade,
      mao:         underwriting.recommended_offer,
      duration_ms: duration,
      agents_used: dossier.agents_used as string[],
      artifacts:   artifactIds,
    }

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    report('failed', 0, errMsg)

    if (runId) {
      try {
        await supabase.from('agent_runs').update({
          status: 'failed',
          output: { error: errMsg },
        }).eq('id', runId)
      } catch { /* best-effort, ignore */ }
    }

    return {
      ok: false, run_id: runId, address,
      dossier: null, score: null, grade: null, mao: null,
      duration_ms: Date.now() - startTime,
      agents_used: [], artifacts: [],
      error: errMsg,
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function saveStep(
  supabase: SupabaseClient,
  runId: string | null,
  step: {
    stepNumber: number; agentCode: string; agentName: string; stepType: string
    inputJson: unknown; outputJson: unknown; durationMs: number; modelUsed: string
  }
) {
  if (!runId) return
  try {
    await supabase.from('agent_run_steps').insert({
      run_id:      runId,
      step_number: step.stepNumber,
      agent_code:  step.agentCode,
      agent_name:  step.agentName,
      step_type:   step.stepType,
      status:      'done',
      input_json:  step.inputJson,
      output_json: step.outputJson,
      duration_ms: step.durationMs,
      started_at:  new Date(Date.now() - step.durationMs).toISOString(),
      finished_at: new Date().toISOString(),
    })
  } catch { /* best-effort, ignore */ }
}
