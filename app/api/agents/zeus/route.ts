/**
 * THE ARK — A25-ZEUS God Squad Swarm API
 * Route: POST /api/agents/zeus
 * T6+ only. Kill switch respected. Full audit trail.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/logger'
import { runZeusSwarm } from '@/lib/agents/zeus'
import { checkKillSwitch } from '@/lib/agents/killSwitch'

export const dynamic = 'force-dynamic'

const OWNER_EMAILS = ['slisaac89@gmail.com', 'atlasmac73@gmail.com']

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Kill switch
  const { armed } = await checkKillSwitch(supabase)
  if (armed) return NextResponse.json({ error: 'System paused' }, { status: 503 })

  // T6 gate (or owner emails bypass)
  const isOwner = OWNER_EMAILS.includes(user.email ?? '')
  if (!isOwner) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('tier_code, credits_used_today, credits_limit_daily')
      .eq('user_id', user.id)
      .single()

    const tierOrder: Record<string, number> = { T1: 1, T2: 2, T3: 3, T4: 4, T5: 5, T6: 6, T7: 7 }
    if ((tierOrder[sub?.tier_code ?? 'T1'] ?? 1) < 4) {
      return NextResponse.json({ error: 'T4+ subscription required for God Squad swarm' }, { status: 403 })
    }

    // Credit gate — 50 credits
    const used = sub?.credits_used_today ?? 0
    const limit = sub?.credits_limit_daily ?? 50
    if (used + 50 > limit) {
      return NextResponse.json({ error: 'Daily credit limit reached' }, { status: 429 })
    }
  }

  const body = await req.json()
  const { mission, agent_ids, max_agents = 4, context = {} } = body

  if (!mission?.trim()) {
    return NextResponse.json({ error: 'mission is required' }, { status: 400 })
  }

  try {
    const result = await runZeusSwarm(supabase, {
      mission,
      user_id: user.id,
      agent_ids,
      max_agents,
      context,
    })

    await writeAuditLog({
      user_id: user.id,
      action: 'AGENT_RUN',
      resource_type: 'agent_run',
      resource_id: result.run_id ?? undefined,
      metadata: {
        agent: 'A25-ZEUS',
        mission: mission.slice(0, 100),
        agents_used: result.agents_used,
        ok: result.ok,
      },
    })

    return NextResponse.json({ data: result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
