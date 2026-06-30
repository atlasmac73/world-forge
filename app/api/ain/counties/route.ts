/**
 * ATLAS v67 — AIN Counties API
 * GET /api/ain/counties — returns all 55 WV counties with latest scores
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error: authError } = await requireUser()
  if (authError) return authError

  const supabase = createClient()
  const { searchParams } = new URL(req.url)
  const region = searchParams.get('region')
  const grade  = searchParams.get('grade')
  const minScore = searchParams.get('min_score')

  // Fetch counties with latest score
  let query = supabase
    .from('counties')
    .select(`
      id, name, fips, seat, region, population, is_default,
      ain_county_scores (
        id, score, grade,
        tax_delinquent_pct, vacancy_pct, foreclosure_rate,
        median_dom, median_price, distressed_listings, total_listings,
        data_source, is_demo, scored_at
      )
    `)
    .eq('state', 'WV')
    .order('name', { ascending: true })

  if (region) query = query.eq('region', region)

  const { data: counties, error } = await query
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  // Attach latest score to each county + apply filters
  type AinScore = {
    id: string; score: number; grade: string
    tax_delinquent_pct: number; vacancy_pct: number; foreclosure_rate: number
    median_dom: number; median_price: number | null; distressed_listings: number
    total_listings: number; data_source: string; is_demo: boolean; scored_at: string
  }

  type CountyRow = {
    id: string; name: string; fips: string | null; seat: string | null
    region: string | null; population: number | null; is_default: boolean
    ain_county_scores: AinScore[]
  }

  const enriched = ((counties ?? []) as CountyRow[])
    .map((c) => {
      const scores = c.ain_county_scores ?? []
      const latest = scores.sort((a, b) =>
        new Date(b.scored_at).getTime() - new Date(a.scored_at).getTime()
      )[0] ?? null

      return {
        id:               c.id,
        name:             c.name,
        fips:             c.fips,
        seat:             c.seat,
        region:           c.region,
        population:       c.population,
        is_default:       c.is_default,
        score:            latest?.score ?? 0,
        grade:            latest?.grade ?? 'UNKNOWN',
        tax_delinquent_pct:  latest?.tax_delinquent_pct ?? 0,
        vacancy_pct:         latest?.vacancy_pct ?? 0,
        foreclosure_rate:    latest?.foreclosure_rate ?? 0,
        median_dom:          latest?.median_dom ?? 0,
        median_price:        latest?.median_price ?? null,
        distressed_listings: latest?.distressed_listings ?? 0,
        total_listings:      latest?.total_listings ?? 0,
        data_source:     latest?.data_source ?? 'UNKNOWN',
        is_demo:         latest?.is_demo ?? true,
        scored_at:       latest?.scored_at ?? null,
      }
    })
    .filter((c) => {
      if (grade && c.grade !== grade) return false
      if (minScore && c.score < parseInt(minScore)) return false
      return true
    })
    .sort((a, b) => b.score - a.score)

  const hasDemo = enriched.some(c => c.is_demo)

  return NextResponse.json({
    ok: true,
    data: enriched,
    meta: {
      total: enriched.length,
      has_demo_data: hasDemo,
      demo_notice: hasDemo
        ? 'Some data is demo/estimated. Connect live county data sources in Admin → Integrations.'
        : null,
    },
  })
}
