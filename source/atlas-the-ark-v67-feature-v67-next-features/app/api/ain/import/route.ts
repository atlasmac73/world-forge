/**
 * ATLAS v67 — AIN County Score Import (Admin)
 * POST /api/ain/import — bulk import county score data
 * GET  /api/ain/import — get import history
 * Admin/owner only. Accepts CSV or JSON array of county scores.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/permissions'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const CountyScoreSchema = z.object({
  county_name:        z.string().min(2),
  score:              z.number().int().min(0).max(100),
  tax_delinquent_pct: z.number().min(0).max(100).optional(),
  vacancy_pct:        z.number().min(0).max(100).optional(),
  foreclosure_rate:   z.number().min(0).max(100).optional(),
  median_dom:         z.number().int().min(0).optional(),
  median_price:       z.number().int().min(0).optional(),
  distressed_listings: z.number().int().min(0).optional(),
  total_listings:     z.number().int().min(0).optional(),
  data_source:        z.string().optional(),
})

const ImportSchema = z.object({
  scores:      z.array(CountyScoreSchema).min(1).max(55),
  data_source: z.string().default('manual_import'),
  notes:       z.string().optional(),
})

function gradeFromScore(score: number): string {
  if (score >= 80) return 'CRITICAL'
  if (score >= 65) return 'HOT'
  if (score >= 45) return 'WARM'
  if (score >= 25) return 'COOL'
  return 'COLD'
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const body = await req.json()
  const parsed = ImportSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 })
  }

  const { scores, data_source, notes } = parsed.data
  const results = { imported: 0, skipped: 0, errors: [] as string[] }

  for (const score of scores) {
    // Find county by name
    const { data: county } = await supabase
      .from('counties')
      .select('id')
      .eq('state', 'WV')
      .ilike('name', score.county_name)
      .single()

    if (!county) {
      results.skipped++
      results.errors.push(`County not found: ${score.county_name}`)
      continue
    }

    const { error } = await supabase
      .from('ain_county_scores')
      .insert({
        county_id:          county.id,
        score:              score.score,
        grade:              gradeFromScore(score.score),
        tax_delinquent_pct: score.tax_delinquent_pct ?? null,
        vacancy_pct:        score.vacancy_pct ?? null,
        foreclosure_rate:   score.foreclosure_rate ?? null,
        median_dom:         score.median_dom ?? null,
        median_price:       score.median_price ?? null,
        distressed_listings: score.distressed_listings ?? null,
        total_listings:     score.total_listings ?? null,
        data_source:        score.data_source ?? data_source,
        is_demo:            false,
        scored_at:          new Date().toISOString(),
      })

    if (error) {
      results.errors.push(`${score.county_name}: ${error.message}`)
    } else {
      results.imported++
    }
  }

  // Audit log
  try {
    await supabase.from('audit_logs').insert({
      user_id:       user.id,
      action:        'AIN_COUNTY_IMPORT',
      resource_type: 'ain_county_scores',
      metadata:      { imported: results.imported, skipped: results.skipped, source: data_source, notes },
    })
  } catch { /* best-effort, ignore */ }

  return NextResponse.json({
    ok:      results.imported > 0,
    results,
    message: `Imported ${results.imported} county scores. Skipped ${results.skipped}.`,
  }, { status: results.imported > 0 ? 201 : 400 })
}

export async function GET(_req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  // Return import history (last 20 non-demo scores per source)
  const { data } = await supabase
    .from('ain_county_scores')
    .select('data_source, scored_at, is_demo, counties(name)')
    .eq('is_demo', false)
    .order('scored_at', { ascending: false })
    .limit(50)

  const sources = [...new Set((data ?? []).map((r: { data_source: string }) => r.data_source))]

  return NextResponse.json({
    ok:       true,
    sources,
    recent:   data ?? [],
    total:    (data ?? []).length,
  })
}
