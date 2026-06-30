/**
 * ATLAS v67 — Genesis HQ Kanban Cards
 * POST /api/genesis-hq/kanban/cards → create a card (owner-only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireGenesisHqOwner, handleGenesisHqPermissionError } from '@/lib/genesis-hq/permissions'
import { CreateKanbanCardSchema } from '@/lib/genesis-hq/validators'
import { writeAuditLog } from '@/lib/audit/logger'

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireGenesisHqOwner()
    const body = await req.json()
    const parsed = CreateKanbanCardSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('genesis_hq_kanban_cards')
      .insert({ ...parsed.data, created_by: ctx.userId })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await writeAuditLog({
      user_id: ctx.userId,
      action: 'GENESIS_HQ_KANBAN_CARD_CREATED',
      resource_type: 'genesis_hq',
      resource_id: data.id,
      metadata: parsed.data,
    })

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return handleGenesisHqPermissionError(error)
  }
}
