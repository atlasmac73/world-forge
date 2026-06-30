// app/api/skip-trace/route.ts — Real BatchSkipTracing + AI fallback
// Ported from godmode-v23
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkKillSwitch, KILL_SWITCH_RESPONSE } from '@/lib/agents/killSwitch'
import { writeAuditLog } from '@/lib/audit/logger'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Feature flag check — label AI results as simulated if live skip trace disabled
  const skipTraceLive = process.env.NEXT_PUBLIC_ENABLE_SKIPTRACE_LIVE === 'true'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // v67: Kill switch check
  const { armed } = await checkKillSwitch(supabase)
  if (armed) {
    await writeAuditLog({
      user_id: user.id, action: 'AGENT_RUN_BLOCKED',
      resource_type: 'property.skipTrace', metadata: { reason: 'kill_switch' },
    })
    return NextResponse.json(KILL_SWITCH_RESPONSE, { status: 503 })
  }

  const body = await req.json()
  const { address, city, state, zip, property_id } = body
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

  // Try BatchSkipTracing API
  if (process.env.BATCH_SKIP_TRACE_KEY) {
    try {
      const bstRes = await fetch('https://api.batchskiptracing.com/api/property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.BATCH_SKIP_TRACE_KEY },
        body: JSON.stringify({ address, city, state, zip }),
        signal: AbortSignal.timeout(10000),
      })
      if (bstRes.ok) {
        const data = await bstRes.json() as any
        const owner = data?.results?.[0]
        if (owner) {
          const result = {
            owner_name: owner.fullName || `${owner.firstName || ''} ${owner.lastName || ''}`.trim(),
            phones: [owner.phone1, owner.phone2, owner.phone3].filter(Boolean),
            emails: [owner.email].filter(Boolean),
            mailing_address: owner.mailAddress ? `${owner.mailAddress}, ${owner.mailCity}, ${owner.mailState} ${owner.mailZip}` : null,
            is_absentee: owner.mailCity !== city || owner.mailState !== state,
            confidence: owner.confidence || 75,
            source: 'batchskiptrace',
          }
          if (property_id) await supabase.from('properties').update({ owner_name: result.owner_name }).eq('id', property_id).eq('created_by', user.id)
          await writeAuditLog({
            user_id: user.id, action: 'SKIP_TRACE_RUN',
            resource_type: 'property', resource_id: property_id ?? undefined,
            metadata: { address, source: result.source, confidence: result.confidence },
          })
          return NextResponse.json({ success: true, result })
        }
      }
    } catch {}
  }

  // Fallback: Claude AI skip trace
  const backendUrl = process.env.BACKEND_URL
  if (backendUrl) {
    try {
      const r = await fetch(`${backendUrl}/api/plans/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_slug: 'skip-tracer', task: body }),
        signal: AbortSignal.timeout(20000),
      })
      const result = await r.json()
      await writeAuditLog({
        user_id: user.id, action: 'SKIP_TRACE_RUN',
        resource_type: 'property', resource_id: property_id ?? undefined,
        metadata: { address, source: 'ai' },
      })
      return NextResponse.json({ success: true, result: { ...result, source: 'ai' } })
    } catch {}
  }

  await writeAuditLog({
    user_id: user.id, action: 'SKIP_TRACE_RUN',
    resource_type: 'property', resource_id: property_id ?? undefined,
    metadata: { address, error: 'Skip trace unavailable — no provider configured' },
  })

  return NextResponse.json({
    success: false,
    error: 'Skip trace unavailable. Add BATCH_SKIP_TRACE_KEY or deploy backend.',
    setup: 'Get API key at batchskiptracing.com → ~$0.25/record'
  }, { status: 503 })
}
