/**
 * ATLAS v67 — Genesis HQ Idea by ID
 * PATCH  /api/genesis-hq/ideas/[ideaId] → edit (owner-only)
 * DELETE /api/genesis-hq/ideas/[ideaId] → remove (owner-only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireGenesisHqOwner, handleGenesisHqPermissionError } from '@/lib/genesis-hq/permissions'
import { UpdateIdeaSchema } from '@/lib/genesis-hq/validators'
import { writeAuditLog } from '@/lib/audit/logger'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ ideaId: string }> }) {
  try {
    const ctx = await requireGenesisHqOwner()
    const body = await req.json()
    const parsed = UpdateIdeaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('genesis_hq_ideas')
      .update(parsed.data)
      .eq('id', (await params).ideaId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Idea not found' }, { status: 404 })

    await writeAuditLog({
      user_id: ctx.userId,
      action: 'GENESIS_HQ_IDEA_UPDATED',
      resource_type: 'genesis_hq',
      resource_id: (await params).ideaId,
      metadata: parsed.data,
    })

    return NextResponse.json(data)
  } catch (error) {
    return handleGenesisHqPermissionError(error)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ ideaId: string }> }) {
  try {
    const ctx = await requireGenesisHqOwner()
    const supabase = createServiceClient()
    const { error } = await supabase.from('genesis_hq_ideas').delete().eq('id', (await params).ideaId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await writeAuditLog({
      user_id: ctx.userId,
      action: 'GENESIS_HQ_IDEA_DELETED',
      resource_type: 'genesis_hq',
      resource_id: (await params).ideaId,
      metadata: {},
    })

    return NextResponse.json({ deleted: true })
  } catch (error) {
    return handleGenesisHqPermissionError(error)
  }
}
