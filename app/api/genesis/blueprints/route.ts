/**
 * ATLAS v67 — Genesis Blueprints API
 * GET   /api/genesis/blueprints — list blueprints (owner/admin)
 * POST  /api/genesis/blueprints — submit new blueprint (owner/admin)
 * PATCH /api/genesis/blueprints — approve/reject/update (owner/admin)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // requireAdmin queries profiles.user_id correctly
  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') ?? '50')

  let query = supabase
    .from('build_blueprints')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ blueprints: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const body = await req.json()
  const {
    title, description, blueprint_type, diff_content,
    simulation_result, confidence_score, risk_level,
    proposed_by = 'A03-GENESIS', cycle_id,
  } = body

  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const { data, error } = await supabase
    .from('build_blueprints')
    .insert({
      title,
      description,
      blueprint_type,
      diff_content,
      simulation_result,
      confidence_score,
      risk_level,
      proposed_by,
      cycle_id: cycle_id ?? null,
      status: 'PROPOSED',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ blueprint: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const { id, action, review_notes, github_pr_url } = await req.json()
  if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 })

  const validActions = ['approve', 'reject', 'deploy', 'start_review', 'mark_failed'] as const
  type ValidAction = typeof validActions[number]
  if (!validActions.includes(action as ValidAction)) {
    return NextResponse.json({ error: `Invalid action. Valid: ${validActions.join(', ')}` }, { status: 400 })
  }

  const statusMap: Record<string, string> = {
    approve: 'APPROVED',
    reject: 'REJECTED',
    deploy: 'DEPLOYED',
    start_review: 'UNDER_REVIEW',
    mark_failed: 'FAILED',
  }

  const updates: Record<string, unknown> = {
    status: statusMap[action],
    review_notes: review_notes ?? null,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  }

  if (action === 'deploy' && github_pr_url) {
    updates.github_pr_url = github_pr_url
    updates.deployed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('build_blueprints')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Audit log — non-fatal
  try {
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: `BLUEPRINT_${statusMap[action]}`,
      resource_type: 'build_blueprints',
      resource_id: id,
      metadata: { action, review_notes },
    })
  } catch {
    // Non-fatal
  }

  return NextResponse.json({ blueprint: data })
}
