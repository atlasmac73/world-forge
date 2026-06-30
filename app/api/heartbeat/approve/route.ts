/**
 * ATLAS v67 — Heartbeat Blueprint Approval
 * POST /api/heartbeat/approve
 * Human approval/rejection of Genesis cycle proposals.
 * Owner/admin only. Writes blueprint status — no auto-deploy.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/permissions'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const ApprovalSchema = z.object({
  blueprint_id: z.string().uuid(),
  action:       z.enum(['approve', 'reject', 'request_changes']),
  review_notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Admin/owner only
  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const body = await req.json()
  const parsed = ApprovalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { blueprint_id, action, review_notes } = parsed.data

  const statusMap: Record<string, string> = {
    approve:         'APPROVED',
    reject:          'REJECTED',
    request_changes: 'UNDER_REVIEW',
  }

  const newStatus = statusMap[action]

  // Get blueprint first to validate it exists and is in approovable state
  const { data: blueprint } = await supabase
    .from('build_blueprints')
    .select('id, status, title, risk_level, blueprint_type')
    .eq('id', blueprint_id)
    .single()

  if (!blueprint) {
    return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 })
  }

  if (!['PROPOSED', 'UNDER_REVIEW'].includes(blueprint.status)) {
    return NextResponse.json({
      error: `Blueprint is ${blueprint.status} — can only approve/reject PROPOSED or UNDER_REVIEW blueprints`
    }, { status: 409 })
  }

  // Update blueprint
  const { data: updated, error } = await supabase
    .from('build_blueprints')
    .update({
      status:      newStatus,
      review_notes: review_notes ?? null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', blueprint_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Audit log
  try {
    await supabase.from('audit_logs').insert({
      user_id:       user.id,
      action:        `BLUEPRINT_${newStatus}`,
      resource_type: 'build_blueprints',
      resource_id:   blueprint_id,
      metadata:      {
        action,
        review_notes,
        blueprint_title: blueprint.title,
        risk_level:      blueprint.risk_level,
      },
    })
  } catch { /* best-effort, ignore */ }

  // If APPROVED with HIGH/CRITICAL risk — add a selfbuild task for human_review
  if (newStatus === 'APPROVED' && ['HIGH', 'CRITICAL'].includes(blueprint.risk_level ?? '')) {
    try {
      await supabase.from('selfbuild_tasks').insert({
        blueprint_id,
        agent_code:              'A01',
        task_type:               'human_review',
        status:                  'QUEUED',
        requires_human_approval: true,
        input_data: { note: `HIGH/CRITICAL risk blueprint approved — requires deployment review before any action` },
      })
    } catch { /* best-effort, ignore */ }
  }

  return NextResponse.json({
    ok: true,
    blueprint: updated,
    message: action === 'approve'
      ? `Blueprint approved. Status: APPROVED. No code deployed — manual deployment required.`
      : action === 'reject'
      ? `Blueprint rejected. No action taken.`
      : `Blueprint marked UNDER_REVIEW. Changes requested.`,
  })
}

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'PROPOSED'

  const { data, error } = await supabase
    .from('build_blueprints')
    .select(`
      id, title, description, blueprint_type, risk_level, confidence_score,
      status, proposed_by, review_notes, reviewed_by, reviewed_at, created_at, cycle_id
    `)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, blueprints: data ?? [], count: (data ?? []).length })
}
