/**
 * ATLAS v67 — Genesis HQ Task Updates
 * PATCH /api/genesis-hq/tasks/[taskId] → toggle done / edit text / priority / due date
 * Owner-only (see lib/genesis-hq/permissions.ts).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireGenesisHqOwner, handleGenesisHqPermissionError } from '@/lib/genesis-hq/permissions'
import { UpdateTaskSchema } from '@/lib/genesis-hq/validators'
import { writeAuditLog } from '@/lib/audit/logger'

export async function PATCH(req: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const ctx = await requireGenesisHqOwner()
    const body = await req.json()
    const parsed = UpdateTaskSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('genesis_hq_tasks')
      .update(parsed.data)
      .eq('id', params.taskId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    await writeAuditLog({
      user_id: ctx.userId,
      action: 'GENESIS_HQ_TASK_UPDATED',
      resource_type: 'genesis_hq',
      resource_id: params.taskId,
      metadata: parsed.data,
    })

    return NextResponse.json(data)
  } catch (error) {
    return handleGenesisHqPermissionError(error)
  }
}
