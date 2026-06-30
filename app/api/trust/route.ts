/**
 * THE ARK — Trust Dashboard API
 * GET /api/trust — Returns all trust data for current user
 * Trust is the moat. Identity + Permissions + Context + Memory + Connections.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [events, connectors, agentRuns, memories, permissions] = await Promise.all([
    supabase.from('trust_events').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(100),
    supabase.from('connector_accounts').select('id,connector_type,connector_name,status,scopes,connected_at,last_synced_at')
      .eq('user_id', user.id),
    supabase.from('agent_runs').select('id,agent_code,tool_name,status,credits_consumed,duration_ms,created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    supabase.from('atlas_memories').select('id,scope,summary,importance,created_at').eq('user_id', user.id).limit(20),
    supabase.from('atlas_permissions').select('id,permission_type,grant_type,object_type,is_active,created_at')
      .eq('granter_user_id', user.id).limit(50),
  ])

  // Compute trust summary — using explicit types since Supabase types.ts not yet generated
  type Connector = { status: string }
  type AgentRun  = { credits_consumed?: number | null }
  type Permission = { is_active?: boolean | null }

  const activeConnectors = (connectors.data as Connector[] | null)?.filter((c) => c.status === 'active').length ?? 0
  const totalRuns = agentRuns.data?.length ?? 0
  const creditSpent = (agentRuns.data as AgentRun[] | null)?.reduce((s, r) => s + (r.credits_consumed ?? 0), 0) ?? 0

  return NextResponse.json({
    summary: {
      data_sources: 1,
      active_connectors: activeConnectors,
      agent_runs_30d: totalRuns,
      credits_spent_30d: creditSpent,
      audit_events: events.data?.length ?? 0,
      memories_stored: memories.data?.length ?? 0,
      active_permissions: (permissions.data as Permission[] | null)?.filter((p) => p.is_active).length ?? 0,
    },
    events: events.data ?? [],
    connectors: connectors.data ?? [],
    agent_runs: agentRuns.data ?? [],
    memories: memories.data ?? [],
    permissions: permissions.data ?? [],
    constitution_clauses: 10,
    digital_bill_of_rights: true,
  })
}
