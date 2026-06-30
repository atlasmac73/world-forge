/**
 * ATLAS v67 — Research Findings actions
 * PATCH  /api/research/findings   { id, pinned }  → pin/unpin a finding
 * DELETE /api/research/findings?id=...            → delete a finding
 * Owner/admin only.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireUser, requireAdmin } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const body = await req.json().catch(() => null)
  const id: string = body?.id ?? ''
  if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })
  if (typeof body?.pinned !== 'boolean') {
    return NextResponse.json({ ok: false, error: 'pinned (boolean) is required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('research_findings')
    .update({ pinned: body.pinned })
    .eq('id', id)
    .select('id, pinned')
    .single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, finding: data })
}

export async function DELETE(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase.from('research_findings').delete().eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
