/**
 * ATLAS v67 — Tournament History
 * GET /api/tournament        → recent tournaments (owner/admin only)
 * GET /api/tournament?id=... → one tournament with its ranked entries
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireUser, requireAdmin } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const supabase = createServiceClient()
  const id = req.nextUrl.searchParams.get('id')

  if (id) {
    const { data: tournament } = await supabase
      .from('tournaments').select('*').eq('id', id).single()
    const { data: entries } = await supabase
      .from('tournament_entries').select('*')
      .eq('tournament_id', id)
      .order('rank', { ascending: true, nullsFirst: false })
    return NextResponse.json({ ok: true, tournament, entries: entries ?? [] })
  }

  const { data, error } = await supabase
    .from('tournaments')
    .select('id, title, mode, status, winner_label, winner_score, summary, created_at, completed_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, tournaments: data ?? [] })
}

export async function DELETE(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })

  // tournament_entries cascade-delete via FK; research_findings.tournament_id is
  // ON DELETE SET NULL, so saved findings survive with the link cleared.
  const supabase = createServiceClient()
  const { error } = await supabase.from('tournaments').delete().eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
