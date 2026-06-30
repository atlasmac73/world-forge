/**
 * ATLAS v67 — Genesis HQ Kanban Card by ID
 * PATCH  /api/genesis-hq/kanban/cards/[cardId] → move/edit a card (owner-only)
 * DELETE /api/genesis-hq/kanban/cards/[cardId] → remove a card (owner-only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireGenesisHqOwner, handleGenesisHqPermissionError } from '@/lib/genesis-hq/permissions'
import { UpdateKanbanCardSchema } from '@/lib/genesis-hq/validators'
import { writeAuditLog } from '@/lib/audit/logger'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const ctx = await requireGenesisHqOwner()
    const body = await req.json()
    const parsed = UpdateKanbanCardSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('genesis_hq_kanban_cards')
      .update(parsed.data)
      .eq('id', (await params).cardId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

    await writeAuditLog({
      user_id: ctx.userId,
      action: 'GENESIS_HQ_KANBAN_CARD_UPDATED',
      resource_type: 'genesis_hq',
      resource_id: (await params).cardId,
      metadata: parsed.data,
    })

    return NextResponse.json(data)
  } catch (error) {
    return handleGenesisHqPermissionError(error)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const ctx = await requireGenesisHqOwner()
    const supabase = createServiceClient()
    const { error } = await supabase.from('genesis_hq_kanban_cards').delete().eq('id', (await params).cardId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await writeAuditLog({
      user_id: ctx.userId,
      action: 'GENESIS_HQ_KANBAN_CARD_DELETED',
      resource_type: 'genesis_hq',
      resource_id: (await params).cardId,
      metadata: {},
    })

    return NextResponse.json({ deleted: true })
  } catch (error) {
    return handleGenesisHqPermissionError(error)
  }
}
