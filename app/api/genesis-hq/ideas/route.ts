/**
 * ATLAS v67 — Genesis HQ Ideas
 * GET  /api/genesis-hq/ideas → list/search/paginate (any authenticated user)
 * POST /api/genesis-hq/ideas → create an idea (owner-only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requireGenesisHqAccess, requireGenesisHqOwner, handleGenesisHqPermissionError } from '@/lib/genesis-hq/permissions'
import { CreateIdeaSchema } from '@/lib/genesis-hq/validators'
import { GENESIS_HQ_IDEA_PAGE_SIZE } from '@/lib/genesis-hq/constants'
import { writeAuditLog } from '@/lib/audit/logger'

export async function GET(req: NextRequest) {
  try {
    await requireGenesisHqAccess()
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const q = searchParams.get('q')
    const limit = Math.min(Number(searchParams.get('limit')) || GENESIS_HQ_IDEA_PAGE_SIZE, 100)
    const offset = Number(searchParams.get('offset')) || 0

    const supabase = await createClient()
    let query = supabase.from('genesis_hq_ideas').select('*', { count: 'exact' }).order('source_number')

    if (category && category !== 'ALL') query = query.eq('category', category)
    if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,patent_direction.ilike.%${q}%`)

    const { data, error, count } = await query.range(offset, offset + limit - 1)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const total = count ?? 0
    return NextResponse.json({ ideas: data ?? [], total, limit, offset, hasMore: offset + limit < total })
  } catch (error) {
    return handleGenesisHqPermissionError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireGenesisHqOwner()
    const body = await req.json()
    const parsed = CreateIdeaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('genesis_hq_ideas')
      .insert({ ...parsed.data, created_by: ctx.userId })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await writeAuditLog({
      user_id: ctx.userId,
      action: 'GENESIS_HQ_IDEA_CREATED',
      resource_type: 'genesis_hq',
      resource_id: data.id,
      metadata: { title: parsed.data.title },
    })

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return handleGenesisHqPermissionError(error)
  }
}
