/**
 * ATLAS v67 — God Mode API Route
 * POST /api/godmode
 * Runs the 4-agent God Mode pod via the engine.
 * Kill switch enforced. Full persistence via engine.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkKillSwitch, KILL_SWITCH_RESPONSE } from '@/lib/agents/killSwitch'
import { runGodMode, type GodModeInput } from '@/lib/godmode/engine'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const GodModeSchema = z.object({
  address:     z.string().min(5),
  property_id: z.string().uuid().optional(),
  deal_id:     z.string().uuid().optional(),
  options: z.object({
    skip_copywrite: z.boolean().optional(),
    save_artifacts: z.boolean().optional(),
  }).optional(),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { armed } = await checkKillSwitch(supabase)
  if (armed) return NextResponse.json(KILL_SWITCH_RESPONSE, { status: 503 })

  const body = await req.json()
  const parsed = GodModeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 })
  }

  // Get user tier
  let sub: { tier_code: string; credits_used_today: number; credits_limit_daily: number } | null = null
  try {
    const { data } = await supabase
      .from('subscriptions')
      .select('tier_code, credits_used_today, credits_limit_daily')
      .eq('user_id', user.id)
      .single()
    sub = data
  } catch { /* best-effort, ignore */ }

  const tierCode = (sub?.tier_code as GodModeInput['tier_code']) ?? 'T1'

  // Credit check
  if (sub && sub.credits_used_today + 25 > sub.credits_limit_daily) {
    return NextResponse.json({
      ok: false,
      error: `Daily credit limit reached (${sub.credits_used_today}/${sub.credits_limit_daily}). Upgrade your tier.`
    }, { status: 402 })
  }

  const engineInput: GodModeInput = {
    address:     parsed.data.address,
    property_id: parsed.data.property_id,
    deal_id:     parsed.data.deal_id,
    user_id:     user.id,
    tier_code:   tierCode,
    options:     parsed.data.options,
  }

  const result = await runGodMode(supabase, engineInput)

  // Update credits
  if (result.ok && sub) {
    try {
      await supabase
        .from('subscriptions')
        .update({ credits_used_today: sub.credits_used_today + 25 })
        .eq('user_id', user.id)
    } catch { /* best-effort, ignore */ }
  }

  return NextResponse.json(
    result,
    { status: result.ok ? 200 : 500 }
  )
}

export async function GET(_req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Return recent God Mode runs
  const { data, error } = await supabase
    .from('agent_runs')
    .select(`
      id, status, input, duration_ms, credits_consumed, completed_at, created_at,
      agent_run_steps (step_number, agent_code, status, duration_ms)
    `)
    .eq('user_id', user.id)
    .eq('tool_name', 'god_mode')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, runs: data ?? [] })
}
