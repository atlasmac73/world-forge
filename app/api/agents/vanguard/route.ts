/**
 * THE ARK — A13-VANGUARD Market Heatmap API
 * Route: POST /api/agents/vanguard
 * Follows existing agent route pattern (auth → tier gate → execute → log).
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/logger'
import { runVanguard, analyzeCounty } from '@/lib/agents/vanguard'
import { checkKillSwitch } from '@/lib/agents/killSwitch'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = createClient()

  // Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Kill switch
  const { armed } = await checkKillSwitch(supabase)
  if (armed) return NextResponse.json({ error: 'System paused' }, { status: 503 })

  // Tier gate — T2 minimum (matches tool registry)
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('tier_code, credits_used_today, credits_limit_daily')
    .eq('user_id', user.id)
    .single()

  const tierOrder: Record<string, number> = { T1: 1, T2: 2, T3: 3, T4: 4, T5: 5, T6: 6, T7: 7 }
  const userTier = tierOrder[sub?.tier_code ?? 'T1'] ?? 1
  if (userTier < 2) {
    return NextResponse.json({ error: 'T2 subscription required for market heatmap' }, { status: 403 })
  }

  // Credit gate — 8 credits
  const used = sub?.credits_used_today ?? 0
  const limit = sub?.credits_limit_daily ?? 50
  if (used + 8 > limit) {
    return NextResponse.json({ error: 'Daily credit limit reached' }, { status: 429 })
  }

  const body = await req.json()
  const { market = 'wv', county } = body

  // Log run start
  let runId: string | null = null
  try {
    const { data: run } = await supabase.from('agent_runs').insert({
      user_id: user.id,
      agent_code: 'A13-VANGUARD',
      tool_name: 'market.heatmap',
      status: 'running',
      input: { market, county },
      credits_consumed: 8,
    }).select('id').single()
    runId = run?.id ?? null
  } catch { /* best-effort */ }

  try {
    const result = county
      ? await analyzeCounty(county, market === 'co' ? 'CO' : 'WV')
      : await runVanguard(market as 'wv' | 'co' | 'both')

    // Finalize run + deduct credits
    await Promise.all([
      runId ? supabase.from('agent_runs').update({
        status: 'completed',
        output: result,
        completed_at: new Date().toISOString(),
      }).eq('id', runId) : Promise.resolve(),
      supabase.from('subscriptions').update({
        credits_used_today: used + 8,
      }).eq('user_id', user.id),
    ])

    await writeAuditLog({
      user_id: user.id,
      action: 'AGENT_RUN',
      resource_type: 'agent_run',
      resource_id: runId ?? undefined,
      metadata: { agent: 'A13-VANGUARD', market, county },
    })

    return NextResponse.json({ data: result, run_id: runId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (runId) {
      await supabase.from('agent_runs').update({ status: 'failed', output: { error: msg } }).eq('id', runId)
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
