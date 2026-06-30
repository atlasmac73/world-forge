/**
 * ATLAS v67 — Tournament Engine
 * The shared scoring engine behind founder research, agent contests, and
 * Genesis blueprint self-evaluation (SIMULATE phase).
 *
 * Flow: dispatch a prompt to N competitors → collect outputs → LLM-judge
 * ranks them → persist tournaments + tournament_entries → return the verdict.
 *
 * Modes:
 *   'model'     — same prompt to multiple models (bake-off)
 *   'agent'     — same prompt through different ATLAS agent personas
 *   'blueprint' — score competing Genesis blueprints (outputs pre-supplied)
 *
 * SAFETY: callers gate on owner/admin + kill switch. This engine only reads
 * model_registry and writes its own tables. No deploys, no code mutation.
 * SERVER ONLY.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  isProviderAvailable,
  resolveApiModelId,
  runCompletion,
  estimateCostCents,
} from './providers'
import { judgeCandidates, DEFAULT_CRITERIA, type JudgeCriterion } from './judge'

export type TournamentMode = 'model' | 'agent' | 'blueprint'

export interface Competitor {
  kind: TournamentMode
  id: string
  label: string
  provider?: string      // required for 'model' mode
  system?: string        // persona prompt for 'agent' mode
  presetOutput?: string  // pre-supplied output for 'blueprint' mode
}

export interface RunTournamentInput {
  title: string
  mode: TournamentMode
  prompt: string
  competitors: Competitor[]
  groundingContext?: string
  criteria?: JudgeCriterion[]
  createdBy?: string
  notebookId?: string
  blueprintId?: string
  maxTokens?: number
}

export interface TournamentOutcome {
  tournamentId: string
  status: 'COMPLETE' | 'FAILED'
  winnerLabel: string | null
  winnerScore: number | null
  summary: string
  entries: Array<{
    id: string
    label: string
    score: number | null
    rank: number | null
    status: string
  }>
  error?: string
}

/** ATLAS agent personas for 'agent' mode contests (real, implemented agents). */
export const AGENT_PERSONAS: Record<string, string> = {
  'A01-ORACLE':
    'You are A01-ORACLE, the ATLAS orchestrator. Answer with structured, decisive reasoning and a clear recommendation.',
  'A12-SPECTER':
    'You are A12-SPECTER, the ATLAS property investigation agent. Answer like a forensic researcher: evidence-first, cite signals, flag uncertainty.',
  'A15-OMEN':
    'You are A15-OMEN, the ATLAS underwriting agent. Answer with quantitative rigor, show the math, and state assumptions explicitly.',
  'A06-HERALD':
    'You are A06-HERALD, the ATLAS outreach copywriter. Answer persuasively and concisely, optimized for seller response.',
}

/**
 * Build model-mode competitors from the model_registry, keeping only models
 * whose provider is actually executable given configured API keys.
 */
export async function buildModelCompetitors(
  supabase: SupabaseClient,
  modelIds: string[]
): Promise<{ competitors: Competitor[]; skipped: string[] }> {
  const { data } = await supabase
    .from('model_registry')
    .select('id, display_name, provider')
    .in('id', modelIds)

  const rows = data ?? []
  const competitors: Competitor[] = []
  const skipped: string[] = []

  for (const id of modelIds) {
    const row = rows.find(r => r.id === id)
    const provider = row?.provider ?? 'Unknown'
    if (!row || !isProviderAvailable(provider)) {
      skipped.push(`${id}${row ? ` (${provider} not configured)` : ' (unknown model)'}`)
      continue
    }
    competitors.push({
      kind: 'model',
      id,
      label: row.display_name ?? id,
      provider,
    })
  }

  return { competitors, skipped }
}

/**
 * Run a full tournament and persist it. Returns the verdict.
 */
export async function runTournament(
  supabase: SupabaseClient,
  input: RunTournamentInput
): Promise<TournamentOutcome> {
  const criteria = input.criteria ?? DEFAULT_CRITERIA

  // 1. Create tournament row
  const { data: t, error: tErr } = await supabase
    .from('tournaments')
    .insert({
      title: input.title,
      mode: input.mode,
      prompt: input.prompt,
      context: input.groundingContext ? { grounding: input.groundingContext } : {},
      config: { criteria, use_voting: false },
      status: 'RUNNING',
      notebook_id: input.notebookId ?? null,
      blueprint_id: input.blueprintId ?? null,
      created_by: input.createdBy ?? null,
    })
    .select('id')
    .single()

  if (tErr || !t) {
    return {
      tournamentId: '',
      status: 'FAILED',
      winnerLabel: null,
      winnerScore: null,
      summary: '',
      entries: [],
      error: tErr?.message ?? 'Failed to create tournament',
    }
  }
  const tournamentId = t.id as string

  if (input.competitors.length === 0) {
    await supabase.from('tournaments').update({
      status: 'FAILED',
      error_log: 'No executable competitors (check provider API keys).',
      completed_at: new Date().toISOString(),
    }).eq('id', tournamentId)
    return {
      tournamentId, status: 'FAILED', winnerLabel: null, winnerScore: null,
      summary: '', entries: [],
      error: 'No executable competitors — configure provider API keys.',
    }
  }

  // 2. Produce each competitor's output (parallel), persisting entries.
  const entryRecords = await Promise.all(
    input.competitors.map(async comp => {
      const { data: entry } = await supabase
        .from('tournament_entries')
        .insert({
          tournament_id: tournamentId,
          competitor_kind: comp.kind,
          competitor_id: comp.id,
          competitor_label: comp.label,
          provider: comp.provider ?? null,
          status: 'RUNNING',
        })
        .select('id')
        .single()

      const entryId = entry?.id as string | undefined

      // Blueprint mode: output is pre-supplied (no model call to generate it).
      if (comp.presetOutput != null) {
        if (entryId) {
          await supabase.from('tournament_entries').update({
            output: comp.presetOutput, status: 'COMPLETE',
          }).eq('id', entryId)
        }
        return { entryId, comp, output: comp.presetOutput }
      }

      // Model / agent mode: call a provider.
      const provider = comp.provider ?? 'Anthropic'
      const apiModelId =
        comp.kind === 'agent'
          ? (process.env.ANTHROPIC_MODEL_DEFAULT ?? 'claude-sonnet-4-20250514')
          : resolveApiModelId(comp.id, provider)

      try {
        const result = await runCompletion(provider, {
          apiModelId,
          system: comp.system,
          prompt: input.groundingContext
            ? `${input.prompt}\n\nGROUNDING CONTEXT:\n${input.groundingContext}`
            : input.prompt,
          maxTokens: input.maxTokens ?? 1024,
        })
        if (entryId) {
          await supabase.from('tournament_entries').update({
            output: result.text,
            status: 'COMPLETE',
            latency_ms: result.latencyMs,
            input_tokens: result.inputTokens,
            output_tokens: result.outputTokens,
            cost_cents: estimateCostCents(provider, result.inputTokens, result.outputTokens),
          }).eq('id', entryId)
        }
        return { entryId, comp, output: result.text }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'completion failed'
        if (entryId) {
          await supabase.from('tournament_entries').update({
            status: 'FAILED', error: msg,
          }).eq('id', entryId)
        }
        return { entryId, comp, output: '' }
      }
    })
  )

  // 3. Judge the ones that produced output.
  const judgeable = entryRecords.filter(e => e.entryId && e.output.trim().length > 0)
  if (judgeable.length === 0) {
    await supabase.from('tournaments').update({
      status: 'FAILED',
      error_log: 'No competitor produced output to judge.',
      completed_at: new Date().toISOString(),
    }).eq('id', tournamentId)
    return {
      tournamentId, status: 'FAILED', winnerLabel: null, winnerScore: null,
      summary: '', entries: [], error: 'No competitor produced output.',
    }
  }

  const verdict = await judgeCandidates(
    input.prompt,
    judgeable.map(e => ({ id: e.entryId as string, label: e.comp.label, output: e.output })),
    criteria,
    input.groundingContext
  )

  // 4. Write scores + ranks back to entries.
  const ranked = [...verdict.scores].sort((a, b) => b.score - a.score)
  await Promise.all(
    ranked.map((s, idx) =>
      supabase.from('tournament_entries').update({
        score: s.score,
        score_breakdown: s.breakdown,
        rank: idx + 1,
      }).eq('id', s.id)
    )
  )

  const winnerScoreEntry = verdict.winnerId
    ? verdict.scores.find(s => s.id === verdict.winnerId)
    : ranked[0]
  const winnerComp = judgeable.find(e => e.entryId === (winnerScoreEntry?.id ?? ranked[0]?.id))
  const winnerLabel = winnerComp?.comp.label ?? null
  const winnerScore = winnerScoreEntry?.score ?? ranked[0]?.score ?? null

  // 5. Finalize tournament.
  await supabase.from('tournaments').update({
    status: 'COMPLETE',
    winner_label: winnerLabel,
    winner_score: winnerScore,
    summary: {
      verdict: verdict.summary,
      judge_model: verdict.judgeModel,
      judged: judgeable.length,
      parsed: verdict.parsed,
    },
    completed_at: new Date().toISOString(),
  }).eq('id', tournamentId)

  return {
    tournamentId,
    status: 'COMPLETE',
    winnerLabel,
    winnerScore,
    summary: verdict.summary,
    entries: ranked.map((s, idx) => {
      const rec = judgeable.find(e => e.entryId === s.id)
      return {
        id: s.id,
        label: rec?.comp.label ?? s.id,
        score: s.score,
        rank: idx + 1,
        status: 'COMPLETE',
      }
    }),
  }
}
