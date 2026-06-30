/**
 * ATLAS v67 — Top 250 Matrix API
 * GET  /api/top250 — returns top 250 properties by distress score
 * POST /api/top250 — saves a Top 250 snapshot
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError

  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const limit = Math.min(250, parseInt(searchParams.get('limit') ?? '250'))
  const county = searchParams.get('county')
  const grade  = searchParams.get('grade')

  // Get properties with their latest distress scores
  let propQuery = supabase
    .from('properties')
    .select(`
      id, address, city, state, county, zip,
      arv, asking_price, estimated_repair, equity_pct,
      tax_delinquent, tax_owed, owner_name, distress_score, deal_grade,
      status, created_at,
      property_distress_scores (
        score, grade, mao, signals_fired, signals_total, scored_at
      )
    `)
    .eq('user_id', user.id)
    .neq('status', 'closed')
    .neq('status', 'passed')
    .limit(500)

  if (county) propQuery = propQuery.eq('county', county)

  const { data: props, error } = await propQuery
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  type ScoreRow = { score: number; grade: string; mao: number | null; signals_fired: number; signals_total: number; scored_at: string }
  type PropRow = {
    id: string; address: string; city: string; state: string; county: string | null
    zip: string; arv: number | null; asking_price: number | null; estimated_repair: number | null
    equity_pct: number | null; tax_delinquent: boolean; tax_owed: number | null
    owner_name: string | null; distress_score: number | null; deal_grade: string | null
    status: string; created_at: string
    property_distress_scores: ScoreRow[]
  }

  const ranked = ((props ?? []) as PropRow[])
    .map(p => {
      const scores = p.property_distress_scores ?? []
      const latest = scores.sort((a, b) =>
        new Date(b.scored_at).getTime() - new Date(a.scored_at).getTime()
      )[0]
      const score = latest?.score ?? p.distress_score ?? 0
      return { ...p, computed_score: score, latest_grade: latest?.grade ?? p.deal_grade ?? 'UNKNOWN', mao: latest?.mao ?? null }
    })
    .filter(p => {
      if (grade && p.latest_grade !== grade) return false
      return p.computed_score > 0
    })
    .sort((a, b) => b.computed_score - a.computed_score)
    .slice(0, limit)

  return NextResponse.json({
    ok: true,
    data: ranked,
    meta: {
      total: ranked.length,
      limit,
      top_score: ranked[0]?.computed_score ?? 0,
      avg_score: ranked.length > 0
        ? Math.round(ranked.reduce((s, p) => s + p.computed_score, 0) / ranked.length)
        : 0,
    },
  })
}

export async function POST(_req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError

  const supabase = await createClient()

  // Re-fetch top 250
  const { data: props } = await supabase
    .from('properties')
    .select('id, address, distress_score, deal_grade, county')
    .eq('user_id', user.id)
    .not('distress_score', 'is', null)
    .order('distress_score', { ascending: false })
    .limit(250)

  const entries = props ?? []

  const { data: saved, error } = await supabase
    .from('top250_snapshots')
    .insert({
      user_id:     user.id,
      entries,
      entry_count: entries.length,
      top_score:   (entries[0] as { distress_score?: number } | undefined)?.distress_score ?? 0,
      avg_score:   entries.length > 0
        ? Math.round(entries.reduce((s, p: { distress_score?: number }) => s + (p.distress_score ?? 0), 0) / entries.length)
        : 0,
    })
    .select('id, snapshot_at, entry_count')
    .single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data: saved }, { status: 201 })
}
