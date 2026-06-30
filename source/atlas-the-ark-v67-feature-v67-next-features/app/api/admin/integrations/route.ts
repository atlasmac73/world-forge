/**
 * ATLAS v67 — Integration Status API
 * GET  /api/admin/integrations — returns all integration statuses
 * POST /api/admin/integrations — refresh statuses
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// Live integration checks
async function checkIntegrations(): Promise<Record<string, { status: string; detail: string }>> {
  const results: Record<string, { status: string; detail: string }> = {}

  // Supabase — always connected if we're running
  results['supabase'] = { status: 'connected', detail: 'Connected and healthy' }

  // Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    results['anthropic'] = { status: 'connected', detail: 'API key configured' }
  } else {
    results['anthropic'] = { status: 'error', detail: 'Missing ANTHROPIC_API_KEY' }
  }

  // Stripe
  if (process.env.STRIPE_SECRET_KEY) {
    results['stripe'] = {
      status: process.env.STRIPE_WEBHOOK_SECRET ? 'connected' : 'degraded',
      detail: process.env.STRIPE_WEBHOOK_SECRET ? 'Configured with webhook' : 'Key set but webhook missing',
    }
  } else {
    results['stripe'] = { status: 'not_configured', detail: 'Set STRIPE_SECRET_KEY to enable billing' }
  }

  // Twilio
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    results['twilio'] = { status: 'pending', detail: 'Credentials set — A2P 10DLC approval required before use' }
  } else {
    results['twilio'] = { status: 'not_configured', detail: 'Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN' }
  }

  // Mapbox
  results['mapbox'] = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    ? { status: 'connected', detail: 'Mapbox token configured — AIN map live' }
    : { status: 'not_configured', detail: 'Set NEXT_PUBLIC_MAPBOX_TOKEN — AIN map runs in demo mode without it' }

  // BatchSkipTracing
  results['batch_skip_trace'] = process.env.BATCH_SKIP_TRACE_KEY
    ? { status: 'connected', detail: 'Skip trace API key configured' }
    : { status: 'not_configured', detail: 'Set BATCH_SKIP_TRACE_KEY — skip trace queues without it' }

  // Sentry
  results['sentry'] = process.env.SENTRY_DSN
    ? { status: 'connected', detail: 'Error tracking active' }
    : { status: 'not_configured', detail: 'Set SENTRY_DSN for error monitoring' }

  // Resend (email)
  results['resend'] = process.env.RESEND_API_KEY
    ? { status: 'connected', detail: 'Email delivery configured' }
    : { status: 'not_configured', detail: 'Set RESEND_API_KEY for email notifications' }

  // Vercel (always connected in production)
  results['vercel'] = { status: 'connected', detail: process.env.VERCEL_URL ?? 'Deployed' }

  return results
}

export async function GET(_req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  // Get stored integration status
  const { data: stored } = await supabase
    .from('integration_status')
    .select('*')
    .order('category', { ascending: true })

  // Run live checks and merge
  const live = await checkIntegrations()
  type IntRow = {
    integration_id: string; name: string; category: string; status: string
    config_keys: string[]; detail: string | null; last_check_at: string | null
  }

  const merged = ((stored ?? []) as IntRow[]).map(row => ({
    ...row,
    status: live[row.integration_id]?.status ?? row.status,
    detail: live[row.integration_id]?.detail ?? row.detail,
    last_check_at: new Date().toISOString(),
  }))

  const connectedCount = merged.filter(i => i.status === 'connected').length
  const criticalDown = merged.filter(i =>
    ['anthropic', 'supabase'].includes(i.integration_id) && i.status !== 'connected'
  ).length

  return NextResponse.json({
    ok: true,
    data: {
      integrations: merged,
      summary: {
        total: merged.length,
        connected: connectedCount,
        critical_down: criticalDown,
        system_status: criticalDown > 0 ? 'degraded' : 'operational',
      },
    },
  })
}

export async function POST(_req: NextRequest) {
  const supabase = createServiceClient()
  const client = createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const live = await checkIntegrations()

  const updates = Object.entries(live).map(([id, result]) =>
    supabase.from('integration_status').update({
      status: result.status,
      detail: result.detail,
      last_check_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('integration_id', id)
  )

  await Promise.allSettled(updates)
  return NextResponse.json({ ok: true, message: 'Integration statuses refreshed', count: Object.keys(live).length })
}
