/**
 * THE ARK — Vercel Cron Heartbeat
 * Runs every 15 minutes via Vercel Cron.
 * Triggers Genesis Cycle phases + resets daily credits + checks system health.
 * GET /api/heartbeat
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const results: Record<string, unknown> = {}

  // 1. Reset daily credits for all users whose last_reset_date < today
  const { error: resetError } = await supabase.rpc('reset_daily_credits')
  results.credit_reset = resetError ? `error: ${resetError.message}` : 'ok'

  // 2. Fire SENSE event (Genesis Cycle Phase 1)
  await supabase.from('atlas_events').insert({
    event_type: 'HEARTBEAT_SENSE',
    source: 'vercel_cron',
    payload: {
      timestamp: new Date().toISOString(),
      phase: 'SENSE',
      next_phase: 'INTERPRET',
    },
    processed: false,
  })
  results.genesis_sense = 'fired'

  // 3. Platform health metrics
  const { count: propertyCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
  const { count: agentRunCount } = await supabase
    .from('agent_runs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  results.health = {
    properties: propertyCount,
    agent_runs_24h: agentRunCount,
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json({ status: 'ok', ...results })
}
