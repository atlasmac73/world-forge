/**
 * THE ARK — Genesis Cycle API
 * Triggers the Autopoietic Genesis Cycle (A03-GENESIS + A25-ZEUS)
 * 6 phases: SENSE → INTERPRET → MUTATE → SIMULATE → PROMOTE → LEARN
 * POST /api/genesis/cycle
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { writeAuditLog } from '@/lib/audit/logger'

export const dynamic = 'force-dynamic'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PHASES = ['SENSE', 'INTERPRET', 'MUTATE', 'SIMULATE', 'PROMOTE', 'LEARN'] as const

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Genesis requires T6+
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('tier_code')
    .eq('user_id', user.id)
    .single()

  if (!sub || !['T6', 'T7'].includes(sub.tier_code)) {
    return NextResponse.json({ error: 'SOVEREIGN (T6) plan required for Genesis Cycle' }, { status: 403 })
  }

  const { trigger = 'manual', context = {} } = await req.json()
  const cycleStart = Date.now()

  // Start cycle in DB
  const { data: cycle } = await supabase
    .from('genesis_cycles')
    .insert({
      user_id: user.id,
      phase: 'SENSE',
      triggered_by: trigger,
      input_data: context,
      status: 'running',
      agents_involved: ['A03-GENESIS', 'A25-ZEUS'],
    })
    .select()
    .single()

  const logs: string[] = []

  try {
    // Run all 6 phases
    const phaseOutputs: Record<string, unknown> = {}

    for (const phase of PHASES) {
      logs.push(`[${phase}] Starting...`)

      await supabase.from('genesis_cycles')
        .update({ phase })
        .eq('id', cycle!.id)

      const phaseResponse = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system: `You are A03-GENESIS running phase ${phase} of the ATLAS Autopoietic Genesis Cycle.

SENSE: Scan platform metrics, agent performance, user patterns.
INTERPRET: Analyze data, identify improvement opportunities.
MUTATE: Propose minimal, targeted improvements.
SIMULATE: Validate proposed changes against test scenarios.
PROMOTE: Create deployment-ready change proposals.
LEARN: Extract learnable patterns, update capability models.

Return JSON with: { phase, findings (array), recommendations (array), confidence (0-100), next_action }`,
        messages: [{
          role: 'user',
          content: `Execute genesis phase ${phase} for THE ARK platform.
Context: ${JSON.stringify(context)}
Prior phases: ${JSON.stringify(phaseOutputs)}
Trigger: ${trigger}`
        }],
      })

      const text = phaseResponse.content[0].type === 'text' ? phaseResponse.content[0].text : '{}'
      const output = JSON.parse(text.replace(/```json|```/g, '').trim())
      phaseOutputs[phase] = output
      logs.push(`[${phase}] Complete. Confidence: ${output.confidence ?? 'N/A'}%`)
    }

    const duration_ms = Date.now() - cycleStart

    // Complete cycle
    await supabase.from('genesis_cycles').update({
      phase: 'LEARN',
      status: 'complete',
      output_data: phaseOutputs,
      agents_involved: ['A03-GENESIS', 'A25-ZEUS', 'A15-OMEN', 'A16-TEMPEST'],
      duration_ms,
      completed_at: new Date().toISOString(),
    }).eq('id', cycle!.id)

    await writeAuditLog({
      user_id: user.id, action: 'GENESIS_CYCLE_TRIGGERED',
      resource_type: 'genesis_cycles', resource_id: cycle!.id,
      metadata: { trigger, duration_ms, phases: PHASES },
    })

    return NextResponse.json({
      cycle_id: cycle!.id,
      status: 'complete',
      phases: phaseOutputs,
      duration_ms,
      logs,
    })

  } catch (err) {
    await supabase.from('genesis_cycles')
      .update({ status: 'failed' })
      .eq('id', cycle!.id)

    const message = err instanceof Error ? err.message : 'Genesis cycle failed'
    await writeAuditLog({
      user_id: user.id, action: 'GENESIS_CYCLE_TRIGGERED',
      resource_type: 'genesis_cycles', resource_id: cycle?.id,
      metadata: { trigger, error: message },
    })
    return NextResponse.json({ error: message, logs }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('genesis_cycles')
    .select('*')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(10)

  return NextResponse.json(data ?? [])
}
