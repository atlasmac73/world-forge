/**
 * ATLAS v67 — Kill Switch API
 * GET  /api/system/killswitch — check current state (any authenticated user)
 * POST /api/system/killswitch — toggle (owner/admin only)
 *
 * When armed: all /api/agents/* routes return 503
 * Does NOT block the user-facing app, only AI/agent execution
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data } = await supabase
      .from('system_config')
      .select('value, updated_at')
      .eq('key', 'kill_switch')
      .single()

    const armed = data?.value === true || data?.value === 'true'

    return NextResponse.json({ armed, updated_at: data?.updated_at ?? null })
  } catch {
    // system_config table may not exist yet — fail safe (not armed)
    return NextResponse.json({ armed: false, updated_at: null })
  }
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Use requireAdmin — correctly queries profiles by user_id
  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const body = await req.json()
  const { armed } = body
  if (typeof armed !== 'boolean') {
    return NextResponse.json({ error: 'armed must be boolean' }, { status: 400 })
  }

  const { error } = await supabase
    .from('system_config')
    .upsert({
      key: 'kill_switch',
      value: armed,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Audit log — non-fatal
  try {
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: armed ? 'KILL_SWITCH_ARMED' : 'KILL_SWITCH_DISARMED',
      resource_type: 'system_config',
      resource_id: 'kill_switch',
      metadata: { armed },
    })
  } catch {
    // Non-fatal
  }

  return NextResponse.json({
    armed,
    message: armed
      ? '⛔ KILL SWITCH ARMED — all AI/agent execution halted'
      : '▶ Kill switch disarmed — systems resuming normal operation',
  })
}
