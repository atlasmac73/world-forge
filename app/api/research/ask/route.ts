/**
 * ATLAS v67 — Research Notebook Q&A (NotebookLM-style grounded answers)
 * POST /api/research/ask
 * Owner/admin only. Answers a question grounded in a notebook's curated
 * sources. Optionally runs a model tournament and saves the winning answer.
 *
 * Grounding is direct context-stuffing over the curated source set (bounded),
 * not a vector DB — consistent with v67's "no RAG layer yet" rule.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireUser, requireAdmin } from '@/lib/permissions'
import { writeAuditLog } from '@/lib/audit/logger'
import { checkKillSwitch, KILL_SWITCH_RESPONSE } from '@/lib/agents/killSwitch'
import { runCompletion } from '@/lib/tournament/providers'
import { runTournament, buildModelCompetitors } from '@/lib/tournament/engine'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

// Cap grounding payload so we never blow the context window.
const MAX_GROUNDING_CHARS = 60_000

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const supabase = createServiceClient()

  const { armed } = await checkKillSwitch(supabase)
  if (armed) return NextResponse.json(KILL_SWITCH_RESPONSE, { status: 503 })

  const body = await req.json().catch(() => null)
  const notebookId: string = body?.notebookId ?? ''
  const question: string = (body?.question ?? '').trim()
  const useTournament: boolean = Boolean(body?.tournament)

  if (!notebookId) return NextResponse.json({ ok: false, error: 'notebookId is required' }, { status: 400 })
  if (!question) return NextResponse.json({ ok: false, error: 'question is required' }, { status: 400 })

  // Assemble bounded grounding context from curated sources.
  const { data: sources } = await supabase
    .from('research_sources')
    .select('id, title, content')
    .eq('notebook_id', notebookId)
    .order('created_at', { ascending: true })

  const sourceRows = sources ?? []
  let grounding = ''
  const usedSourceIds: string[] = []
  for (const s of sourceRows) {
    const block = `\n\n[SOURCE: ${s.title}]\n${s.content ?? ''}`
    if (grounding.length + block.length > MAX_GROUNDING_CHARS) break
    grounding += block
    usedSourceIds.push(s.id)
  }

  const system = [
    'You are the ATLAS Research Notebook assistant.',
    'Answer the question ONLY using the provided sources. Ground every claim in them.',
    'If the sources do not contain the answer, say so explicitly — do not invent facts.',
    'Cite source titles inline like [SOURCE: title] where relevant.',
  ].join(' ')

  const groundedPrompt = `SOURCES:${grounding || '\n(no sources added yet)'}\n\nQUESTION: ${question}`

  // ── Tournament-backed answer ──────────────────────────────────────────────
  if (useTournament) {
    const modelIds: string[] = Array.isArray(body.modelIds) && body.modelIds.length >= 2
      ? body.modelIds
      : ['claude-opus-4-6', 'claude-sonnet-4-6'] // both Anthropic → always executable
    const { competitors, skipped } = await buildModelCompetitors(supabase, modelIds)

    const outcome = await runTournament(supabase, {
      title: `Research: ${question.slice(0, 80)}`,
      mode: 'model',
      prompt: `${system}\n\n${groundedPrompt}`,
      competitors,
      groundingContext: undefined, // already embedded in prompt
      notebookId,
      createdBy: user.id,
    })

    // Pull the winning entry's output to store as the answer.
    let answer = ''
    let modelUsed = outcome.winnerLabel ?? ''
    if (outcome.tournamentId) {
      const { data: entries } = await supabase
        .from('tournament_entries')
        .select('output, competitor_label, rank')
        .eq('tournament_id', outcome.tournamentId)
        .order('rank', { ascending: true, nullsFirst: false })
        .limit(1)
      answer = entries?.[0]?.output ?? ''
      modelUsed = entries?.[0]?.competitor_label ?? modelUsed
    }

    const { data: finding } = await supabase
      .from('research_findings')
      .insert({
        notebook_id: notebookId, question, answer,
        grounded_source_ids: usedSourceIds,
        tournament_id: outcome.tournamentId || null,
        model_used: modelUsed, created_by: user.id,
      })
      .select('*').single()

    await writeAuditLog({
      user_id: user.id, action: 'RESEARCH_ASK_TOURNAMENT',
      resource_type: 'research_notebooks', resource_id: notebookId,
      metadata: { question, tournamentId: outcome.tournamentId, winner: modelUsed, skipped },
    })

    return NextResponse.json({
      ok: true, mode: 'tournament', answer, finding,
      tournament: outcome, skipped,
    })
  }

  // ── Single grounded answer ────────────────────────────────────────────────
  const model = process.env.ANTHROPIC_MODEL_POWER ?? 'claude-opus-4-5-20251001'
  let answer = ''
  try {
    const res = await runCompletion('Anthropic', {
      apiModelId: model, system, prompt: groundedPrompt, maxTokens: 1500,
    })
    answer = res.text
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Answer generation failed' },
      { status: 500 }
    )
  }

  const { data: finding } = await supabase
    .from('research_findings')
    .insert({
      notebook_id: notebookId, question, answer,
      grounded_source_ids: usedSourceIds, model_used: model, created_by: user.id,
    })
    .select('*').single()

  await writeAuditLog({
    user_id: user.id, action: 'RESEARCH_ASK',
    resource_type: 'research_notebooks', resource_id: notebookId,
    metadata: { question, sourcesUsed: usedSourceIds.length },
  })

  return NextResponse.json({ ok: true, mode: 'single', answer, finding })
}
