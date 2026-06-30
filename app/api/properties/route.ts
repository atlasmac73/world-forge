import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const zip = searchParams.get('zip')
  const status = searchParams.get('status')
  const minScore = searchParams.get('min_score')
  const limit = parseInt(searchParams.get('limit') ?? '100')

  let query = supabase
    .from('properties')
    .select('*')
    .eq('user_id', user.id)
    .order('distress_score', { ascending: false })
    .limit(limit)

  if (zip) query = query.eq('zip', zip)
  if (status && status !== 'all') query = query.eq('status', status)
  if (minScore) query = query.gte('distress_score', parseInt(minScore))

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabase
    .from('properties')
    .insert({ ...body, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
