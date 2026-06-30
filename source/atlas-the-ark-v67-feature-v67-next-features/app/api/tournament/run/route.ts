/**
 * ATLAS v67 — Tournament Runner
 * POST /api/tournament/run
 * Owner/admin only. Runs an AI tournament (model bake-off, agent contest,
 * or blueprint self-eval) via the shared tournament engine.
 * Respects the kill switch; audits the run.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireUser, requireAdmin } from '@/lib/permissions'
import { writeAuditLog } from '@/lib/audit/logger'
import { checkKillSwitch, KILL_SWITCH_RESPONSE } from '@/lib/agents/killSwitch'
import {
  runTournament,
  buildModelCompetitors,
  AGENT_PERSONAS,
  type Competitor,
  type TournamentMode,
} from '@/lib/tournament/engine'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError

  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const supabase = createServiceClient()

  const { armed } = await checkKillSwitch(supabase)
  if (armed) return NextResponse.json(KILL_SWITCH_RESPONSE, { status: 503 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })

  const mode = (body.mode ?? 'model') as TournamentMode
  const prompt: string = (body.prompt ?? '').trim()
  const title: string = (body.title ?? `${mode} tournament`).slice(0, 200)
  const groundingContext: string | undefined = body.groundingContext
  const notebookId: string | undefined = body.notebookId

  if (!prompt && mode !== 'blueprint') {
    return NextResponse.json({ ok: false, error: 'prompt is required' }, { status: 400 })
  }

  // Build competitors per mode.
  let competitors: Competitor[] = []
  let skipped: string[] = []

  if (mode === 'model') {
    const modelIds: string[] = Array.isArray(body.modelIds) ? body.modelIds : []
    if (modelIds.length < 2) {
      return NextResponse.json(
        { ok: false, error: 'Provide at least 2 modelIds for a bake-off' },
        { status: 400 }
      )
    }
    const built = await buildModelCompetitors(supabase, modelIds)
    competitors = built.competitors
    skipped = built.skipped
    if (competitors.length < 1) {
      return NextResponse.json(
        { ok: false, error: 'No executable models — configure provider API keys', skipped },
        { status: 400 }
      )
    }
  } else if (mode === 'agent') {
    const codes: string[] = Array.isArray(body.agentCodes) && body.agentCodes.length
      ? body.agentCodes
      : Object.keys(AGENT_PERSONAS)
    competitors = codes
      .filter(c => AGENT_PERSONAS[c])
      .map(c => ({ kind: 'agent' as const, id: c, label: c, provider: 'Anthropic', system: AGENT_PERSONAS[c] }))
    if (competitors.length < 2) {
      return NextResponse.json(
        { ok: false, error: 'Provide at least 2 valid agentCodes' },
        { status: 400 }
      )
    }
  } else if (mode === 'blueprint') {
    const candidates: Array<{ id: string; label: string; output: string }> =
      Array.isArray(body.candidates) ? body.candidates : []
    if (candidates.length < 2) {
      return NextResponse.json(
        { ok: false, error: 'Provide at least 2 blueprint candidates' },
        { status: 400 }
      )
    }
    competitors = candidates.map(c => ({
      kind: 'blueprint' as const,
      id: c.id,
      label: c.label,
      presetOutput: c.output,
    }))
  } else {
    return NextResponse.json({ ok: false, error: `Unknown mode "${mode}"` }, { status: 400 })
  }

  const outcome = await runTournament(supabase, {
    title,
    mode,
    prompt: prompt || title,
    competitors,
    groundingContext,
    notebookId,
    blueprintId: body.blueprintId,
    createdBy: user.id,
  })

  await writeAuditLog({
    user_id: user.id,
    action: 'TOURNAMENT_RUN',
    resource_type: 'tournaments',
    resource_id: outcome.tournamentId || undefined,
    metadata: {
      mode,
      competitors: competitors.length,
      skipped,
      winner: outcome.winnerLabel,
      status: outcome.status,
    },
  })

  return NextResponse.json({ ok: outcome.status === 'COMPLETE', skipped, ...outcome })
}
