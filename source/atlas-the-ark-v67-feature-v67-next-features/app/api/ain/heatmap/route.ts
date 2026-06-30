/**
 * ATLAS v67 — AIN Heatmap Aggregation
 * GET /api/ain/heatmap — returns county heat map data for visualization
 * Includes grade distribution, regional breakdowns, and top counties.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const { error: authError } = await requireUser()
  if (authError) return authError

  const supabase = createClient()

  // Get all counties with latest score
  const { data: counties, error } = await supabase
    .from('counties')
    .select(`
      id, name, region, is_default,
      ain_county_scores (
        score, grade, tax_delinquent_pct, vacancy_pct, foreclosure_rate,
        median_price, distressed_listings, total_listings, is_demo, scored_at
      )
    `)
    .eq('state', 'WV')

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  type AinScore = {
    score: number; grade: string; tax_delinquent_pct: number; vacancy_pct: number
    foreclosure_rate: number; median_price: number | null; distressed_listings: number
    total_listings: number; is_demo: boolean; scored_at: string
  }
  type CountyRow = {
    id: string; name: string; region: string | null; is_default: boolean
    ain_county_scores: AinScore[]
  }

  const enriched = ((counties ?? []) as CountyRow[]).map(c => {
    const scores = (c.ain_county_scores ?? []).sort(
      (a, b) => new Date(b.scored_at).getTime() - new Date(a.scored_at).getTime()
    )
    const latest = scores[0] ?? null
    return {
      id:      c.id,
      name:    c.name,
      region:  c.region,
      score:   latest?.score ?? 0,
      grade:   latest?.grade ?? 'UNKNOWN',
      is_demo: latest?.is_demo ?? true,
      tax_delinquent_pct:  latest?.tax_delinquent_pct ?? 0,
      vacancy_pct:         latest?.vacancy_pct ?? 0,
      foreclosure_rate:    latest?.foreclosure_rate ?? 0,
      distressed_listings: latest?.distressed_listings ?? 0,
      total_listings:      latest?.total_listings ?? 0,
      median_price:        latest?.median_price ?? null,
    }
  })

  // Aggregations
  const gradeDist: Record<string, number> = {}
  const regionDist: Record<string, { count: number; avg_score: number; counties: string[] }> = {}

  enriched.forEach(c => {
    // Grade distribution
    gradeDist[c.grade] = (gradeDist[c.grade] ?? 0) + 1

    // Regional breakdown
    const region = c.region ?? 'unknown'
    if (!regionDist[region]) regionDist[region] = { count: 0, avg_score: 0, counties: [] }
    regionDist[region].count++
    regionDist[region].avg_score += c.score
    regionDist[region].counties.push(c.name)
  })

  // Finalize regional averages
  Object.keys(regionDist).forEach(r => {
    regionDist[r].avg_score = Math.round(regionDist[r].avg_score / regionDist[r].count)
  })

  const sorted = [...enriched].sort((a, b) => b.score - a.score)
  const hasDemo = enriched.some(c => c.is_demo)
  const totalDistressed = enriched.reduce((s, c) => s + c.distressed_listings, 0)
  const avgScore = enriched.length
    ? Math.round(enriched.reduce((s, c) => s + c.score, 0) / enriched.length)
    : 0

  return NextResponse.json({
    ok: true,
    data: {
      counties:          sorted,
      grade_distribution: gradeDist,
      regional_breakdown: regionDist,
      top_10:            sorted.slice(0, 10),
      summary: {
        total_counties:    enriched.length,
        avg_score:         avgScore,
        total_distressed:  totalDistressed,
        critical_count:    gradeDist['CRITICAL'] ?? 0,
        hot_count:         gradeDist['HOT'] ?? 0,
        has_demo_data:     hasDemo,
      },
    },
  })
}
