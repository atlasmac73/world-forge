/**
 * ATLAS v67 — Research Notebooks
 * GET  /api/research            → list notebooks (owner/admin only)
 * GET  /api/research?id=...      → one notebook with sources + findings
 * POST /api/research             → create a notebook
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireUser, requireAdmin } from '@/lib/permissions'
import { writeAuditLog } from '@/lib/audit/logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const supabase = createServiceClient()
  const id = req.nextUrl.searchParams.get('id')

  if (id) {
    const { data: notebook } = await supabase
      .from('research_notebooks').select('*').eq('id', id).single()
    const { data: sources } = await supabase
      .from('research_sources')
      .select('id, title, source_type, source_ref, token_estimate, created_at')
      .eq('notebook_id', id)
      .order('created_at', { ascending: true })
    const { data: findings } = await supabase
      .from('research_findings').select('*')
      .eq('notebook_id', id)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)
    return NextResponse.json({
      ok: true, notebook, sources: sources ?? [], findings: findings ?? [],
    })
  }

  const { data, error } = await supabase
    .from('research_notebooks')
    .select('id, title, description, status, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, notebooks: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const body = await req.json().catch(() => null)
  const title: string = (body?.title ?? '').trim()
  if (!title) return NextResponse.json({ ok: false, error: 'title is required' }, { status: 400 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('research_notebooks')
    .insert({ title: title.slice(0, 200), description: body.description ?? null, owner_id: user.id })
    .select('id, title, description, status, created_at')
    .single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  await writeAuditLog({
    user_id: user.id, action: 'RESEARCH_NOTEBOOK_CREATED',
    resource_type: 'research_notebooks', resource_id: data.id, metadata: { title },
  })

  return NextResponse.json({ ok: true, notebook: data })
}

// PATCH /api/research  { id, status }  → archive / unarchive a notebook
export async function PATCH(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const body = await req.json().catch(() => null)
  const id: string = body?.id ?? ''
  const status: string = body?.status ?? ''
  if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })
  if (!['ACTIVE', 'ARCHIVED'].includes(status)) {
    return NextResponse.json({ ok: false, error: 'status must be ACTIVE or ARCHIVED' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('research_notebooks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, status')
    .single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, notebook: data })
}

// DELETE /api/research?id=...  → delete a notebook (sources + findings cascade)
export async function DELETE(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase.from('research_notebooks').delete().eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  await writeAuditLog({
    user_id: user.id, action: 'RESEARCH_NOTEBOOK_DELETED',
    resource_type: 'research_notebooks', resource_id: id,
  })

  return NextResponse.json({ ok: true })
}
