/**
 * THE ARK — Universal Agent Execution Endpoint
 * Routes any tool call through the Zero-Trust Gateway.
 * POST /api/agents/run
 * v67: Kill switch check added
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callTool } from '@/lib/agents/toolGateway'
import { checkKillSwitch, KILL_SWITCH_RESPONSE } from '@/lib/agents/killSwitch'
import { writeAuditLog } from '@/lib/audit/logger'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // v67: Kill switch check — halts all agent execution when armed
  const { armed } = await checkKillSwitch(supabase)
  if (armed) {
    await writeAuditLog({
      user_id: user.id, action: 'AGENT_RUN_BLOCKED',
      resource_type: 'agents.run', metadata: { reason: 'kill_switch' },
    })
    return NextResponse.json(KILL_SWITCH_RESPONSE, { status: 503 })
  }

  try {
    const { tool, input, sessionId } = await req.json()

    if (!tool) return NextResponse.json({ error: 'tool required' }, { status: 400 })

    const result = await callTool({
      tool,
      input: input ?? {},
      userId: user.id,
      sessionId,
    })
    // callTool() writes the compliance audit log itself (lib/agents/toolGateway.ts)
    // since it's the single chokepoint for every tool this route can dispatch to.

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Agent execution failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const page = parseInt(searchParams.get('page') ?? '1')
  const offset = (page - 1) * limit

  const { data, count } = await supabase
    .from('agent_runs')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return NextResponse.json({ data, total: count, page, limit })
}
