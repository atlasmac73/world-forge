// app/api/health/route.ts
// Real health checks + v67 Command Center metrics
// GET /api/health           — base health check
// GET /api/health?include=sprints — includes sprint_log rows
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { log, newCorrelationId } from '@/lib/observability/logger'

export const dynamic = 'force-dynamic'

interface Check { name: string; status: 'ok' | 'degraded' | 'down'; detail?: string; ms?: number }

export async function GET(req: NextRequest) {
  const correlationId = newCorrelationId()
  const { searchParams } = new URL(req.url)
  const includeMetrics = searchParams.get('include')
  const checks: Check[] = []

  const supabase = createServiceClient()

  // Supabase connectivity
  const sbStart = Date.now()
  try {
    const { error } = await supabase.from('portals').select('id').limit(1)
    checks.push(error
      ? { name: 'supabase', status: 'down', detail: error.message, ms: Date.now() - sbStart }
      : { name: 'supabase', status: 'ok', ms: Date.now() - sbStart })
  } catch (e) {
    checks.push({ name: 'supabase', status: 'down', detail: e instanceof Error ? e.message : 'unknown', ms: Date.now() - sbStart })
  }

  // Env presence (never prints values)
  const envCheck = (k: string): Check => ({
    name: `env:${k}`,
    status: process.env[k] ? 'ok' : 'down',
    detail: process.env[k] ? 'set' : 'missing',
  })
  checks.push(envCheck('NEXT_PUBLIC_SUPABASE_URL'))
  checks.push(envCheck('SUPABASE_SERVICE_ROLE_KEY'))
  checks.push(envCheck('ANTHROPIC_API_KEY'))
  checks.push({ name: 'stripe', status: process.env.STRIPE_SECRET_KEY ? 'ok' : 'degraded', detail: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not configured (billing off)' })
  checks.push({ name: 'twilio', status: process.env.TWILIO_ACCOUNT_SID ? 'ok' : 'degraded', detail: process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'mock mode' })
  checks.push({ name: 'skip_trace', status: process.env.BATCH_SKIP_TRACE_KEY ? 'ok' : 'degraded', detail: process.env.BATCH_SKIP_TRACE_KEY ? 'live' : 'AI fallback' })
  checks.push({ name: 'ai_router', status: process.env.ANTHROPIC_API_KEY ? 'ok' : 'down', detail: process.env.ANTHROPIC_API_KEY ? 'ready' : 'no key' })

  const down = checks.filter(c => c.status === 'down')
  const overall = down.some(c => ['supabase', 'env:NEXT_PUBLIC_SUPABASE_URL'].includes(c.name)) ? 'down'
    : down.length ? 'degraded' : 'ok'

  // v67: Command Center metrics (only when explicitly requested)
  let metrics: Record<string, unknown> = {}
  if (includeMetrics) {
    try {
      // Agent runs count
      const { count: agentRunsCount } = await supabase
        .from('agent_runs')
        .select('*', { count: 'exact', head: true })
      metrics.agent_runs = agentRunsCount ?? 0

      // Blueprint counts
      const { count: blueprintsCount } = await supabase
        .from('build_blueprints')
        .select('*', { count: 'exact', head: true })
      metrics.blueprints = blueprintsCount ?? 0

      const { count: pendingCount } = await supabase
        .from('build_blueprints')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PROPOSED')
      metrics.pending_approvals = pendingCount ?? 0

      // Genesis cycles count
      const { count: genesisCyclesCount } = await supabase
        .from('genesis_cycles')
        .select('*', { count: 'exact', head: true })
      metrics.genesis_cycles = genesisCyclesCount ?? 0

    } catch {
      // Tables may not exist yet — return zeros
      metrics = { agent_runs: 0, blueprints: 0, pending_approvals: 0, genesis_cycles: 0 }
    }
  }

  // Sprint log (only when include=sprints)
  let sprints: unknown[] = []
  if (includeMetrics === 'sprints' || includeMetrics === 'all') {
    try {
      const { data } = await supabase
        .from('sprint_log')
        .select('*')
        .order('sprint_number', { ascending: true })
      sprints = data ?? []
    } catch {
      sprints = []
    }

    if (includeMetrics) {
      // Also get metrics when fetching sprints
      try {
        const [
          { count: agentRuns },
          { count: blueprints },
          { count: pending },
          { count: genesis },
        ] = await Promise.all([
          supabase.from('agent_runs').select('*', { count: 'exact', head: true }),
          supabase.from('build_blueprints').select('*', { count: 'exact', head: true }),
          supabase.from('build_blueprints').select('*', { count: 'exact', head: true }).eq('status', 'PROPOSED'),
          supabase.from('genesis_cycles').select('*', { count: 'exact', head: true }),
        ])
        metrics = { agent_runs: agentRuns ?? 0, blueprints: blueprints ?? 0, pending_approvals: pending ?? 0, genesis_cycles: genesis ?? 0 }
      } catch {
        metrics = { agent_runs: 0, blueprints: 0, pending_approvals: 0, genesis_cycles: 0 }
      }
    }
  }

  log.info('health check', { correlationId, overall, down: down.length })

  return NextResponse.json(
    {
      overall,
      ts: new Date().toISOString(),
      correlationId,
      checks,
      ...metrics,
      ...(sprints.length > 0 ? { sprints } : {}),
    },
    { status: overall === 'down' ? 503 : 200 }
  )
}
