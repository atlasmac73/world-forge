/**
 * THE ARK — Audit Log API (Immutable)
 * GET /api/audit — Retrieve audit log for current user
 * POST /api/audit — Log a trust event (service use only)
 * "Audit logs prove access history." — Atlas Security Doctrine
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const offset = parseInt(searchParams.get('offset') ?? '0')
  const eventType = searchParams.get('event_type')

  let query = supabase.from('trust_events')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (eventType) query = query.eq('event_type', eventType)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ events: data, total: count, limit, offset })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { event_type, resource_type, resource_id, description, metadata } = body

  if (!event_type) return NextResponse.json({ error: 'event_type required' }, { status: 400 })

  const { data, error } = await supabase.from('trust_events').insert({
    user_id: user.id,
    event_type,
    resource_type,
    resource_id,
    description,
    metadata: metadata ?? {},
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, id: data.id })
}
