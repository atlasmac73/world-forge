/**
 * ATLAS v67 — Distress Scoring API
 * POST /api/scoring — score a property (persists result)
 * GET  /api/scoring — get scoring history for user
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/permissions'
import { scoreProperty, type ScoringInput } from '@/lib/scoring/engine'
import { checkKillSwitch, KILL_SWITCH_RESPONSE } from '@/lib/agents/killSwitch'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const ScoringInputSchema = z.object({
  property_id:      z.string().uuid().optional(),
  tax_delinquent:   z.boolean().optional(),
  tax_owed:         z.number().optional(),
  assessed_value:   z.number().optional(),
  is_vacant:        z.boolean().optional(),
  is_abandoned:     z.boolean().optional(),
  occupancy:        z.string().optional(),
  in_foreclosure:   z.boolean().optional(),
  lis_pendens:      z.boolean().optional(),
  reo:              z.boolean().optional(),
  arv:              z.number().optional(),
  asking_price:     z.number().optional(),
  estimated_repair: z.number().optional(),
  equity_pct:       z.number().optional(),
  days_on_market:   z.number().optional(),
  absentee_owner:   z.boolean().optional(),
  out_of_state_owner: z.boolean().optional(),
  liens:            z.boolean().optional(),
  judgements:       z.boolean().optional(),
  probate:          z.boolean().optional(),
  divorce:          z.boolean().optional(),
  county_median_dom: z.number().optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Kill switch check
  const { armed } = await checkKillSwitch(supabase)
  if (armed) return NextResponse.json(KILL_SWITCH_RESPONSE, { status: 503 })

  const { user, error: authError } = await requireUser()
  if (authError) return authError

  const body = await req.json()
  const parsed = ScoringInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 })
  }

  const input: ScoringInput = parsed.data
  const result = scoreProperty(input)

  // Persist result
  const { data: saved, error: saveError } = await supabase
    .from('property_distress_scores')
    .insert({
      property_id:   parsed.data.property_id ?? null,
      user_id:       user.id,
      score:         result.score,
      grade:         result.grade,
      signals_fired: result.signals_fired,
      signals_total: result.signals_total,
      mao:           result.mao ?? null,
      arv:           input.arv ?? null,
      repair_cost:   input.estimated_repair ?? null,
      equity_pct:    result.equity_pct ?? null,
      raw_signals:   result.signals,
    })
    .select('id')
    .single()

  if (saveError) {
    // Non-fatal — return result even if persist failed
    console.error('Failed to persist score:', saveError.message)
  }

  // Log usage event
  await supabase.from('usage_events').insert({
    user_id:      user.id,
    event_type:   'distress_score',
    resource_type: 'property',
    resource_id:  parsed.data.property_id ?? null,
    credits_used: 1,
  }).then(() => null)

  return NextResponse.json({
    ok: true,
    data: {
      ...result,
      score_id: saved?.id ?? null,
    },
  })
}

export async function GET(_req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('property_distress_scores')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data: data ?? [] })
}
