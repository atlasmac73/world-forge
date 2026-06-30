/**
 * THE ARK — Skills API
 * GET /api/skills — List skills (paginated, filterable)
 * Isaac Brandon Burdette, Sole Inventor — Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError

  const { searchParams } = req.nextUrl
  const category = searchParams.get('category')
  const search   = searchParams.get('q')
  const limit    = Math.min(Number(searchParams.get('limit') ?? '50'), 200)
  const offset   = Number(searchParams.get('offset') ?? '0')

  try {
    const supabase = createClient()
    let query = supabase
      .from('skills')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    if (category) query = query.eq('category', category)
    if (search)   query = query.ilike('name', `%${search}%`)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      ok: true,
      data: data ?? [],
      meta: { total: count ?? 0, limit, offset },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch skills'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
