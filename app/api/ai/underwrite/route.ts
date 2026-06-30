/**
 * ATLAS v67 — AI Underwriting / MAO Calculator
 * POST /api/ai/underwrite
 * Runs AI-enhanced underwriting with MAO calculation and deal analysis.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/permissions'
import { checkKillSwitch, KILL_SWITCH_RESPONSE } from '@/lib/agents/killSwitch'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const UnderwriteSchema = z.object({
  property_id:       z.string().uuid().optional(),
  deal_id:           z.string().uuid().optional(),
  address:           z.string().min(1),
  arv:               z.number().positive(),
  asking_price:      z.number().positive().optional(),
  estimated_repair:  z.number().min(0),
  target_margin:     z.number().min(0.5).max(0.85).default(0.70),
  hold_costs_monthly: z.number().optional(),
  closing_costs:     z.number().optional(),
  deal_type:         z.enum(['wholesale','fix_flip','rental','subject_to','creative']).default('wholesale'),
  market_notes:      z.string().optional(),
})

function calculateMAO(arv: number, repair: number, margin: number, closingCosts = 0) {
  return Math.max(0, arv * margin - repair - closingCosts)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { armed } = await checkKillSwitch(supabase)
  if (armed) return NextResponse.json(KILL_SWITCH_RESPONSE, { status: 503 })

  const { user, error: authError } = await requireUser()
  if (authError) return authError

  const body = await req.json()
  const parsed = UnderwriteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 })

  const d = parsed.data
  const mao = calculateMAO(d.arv, d.estimated_repair, d.target_margin, d.closing_costs ?? 0)
  const equity = d.asking_price ? ((d.arv - d.asking_price) / d.arv) * 100 : null
  const spread = d.asking_price ? d.asking_price - mao : null
  const dealGrade = spread !== null && spread <= 0 ? 'A' : spread !== null && spread < 10000 ? 'B' : spread !== null && spread < 25000 ? 'C' : 'D'

  const prompt = `You are ATLAS A02-UNDERWRITER, a real estate underwriting agent specializing in WV/Appalachian markets.

Underwrite this deal:

Property: ${d.address}
Deal Type: ${d.deal_type}
ARV (After Repair Value): $${d.arv.toLocaleString()}
Estimated Repair Cost: $${d.estimated_repair.toLocaleString()}
Asking Price: ${d.asking_price ? `$${d.asking_price.toLocaleString()}` : 'Not listed'}
Target Margin: ${(d.target_margin * 100).toFixed(0)}%
Closing Costs: $${(d.closing_costs ?? 3000).toLocaleString()}
${d.hold_costs_monthly ? `Monthly Hold Cost: $${d.hold_costs_monthly.toLocaleString()}` : ''}
${d.market_notes ? `Market Notes: ${d.market_notes}` : ''}

Pre-calculated:
- MAO (Maximum Allowable Offer): $${mao.toLocaleString()}
- Equity at Asking: ${equity !== null ? `${equity.toFixed(1)}%` : 'N/A'}
- Spread vs MAO: ${spread !== null ? `$${spread.toLocaleString()}` : 'N/A'}
- Preliminary Grade: ${dealGrade}

Provide:
1. Deal summary (2 sentences)
2. Whether this is worth pursuing (yes/no) and why
3. Negotiation target price
4. Exit strategy recommendation
5. Top 3 risks
6. Top 3 opportunities
7. One thing to verify before moving forward

Be specific to WV real estate market conditions. Be direct. Show your math.`

  let analysis = ''
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })
    analysis = response.content[0].type === 'text' ? response.content[0].text : ''
  } catch (err) {
    analysis = `AI analysis unavailable. Manual review required.\n\nMAO: $${mao.toLocaleString()}\nDeal Grade: ${dealGrade}`
  }

  // Save artifact
  const artifact = await supabase
    .from('deal_artifacts')
    .insert({
      user_id:       user.id,
      property_id:   d.property_id ?? null,
      deal_id:       d.deal_id ?? null,
      artifact_type: 'underwriting',
      title:         `Underwriting — ${d.address}`,
      content:       analysis,
      content_json: {
        arv: d.arv,
        repair: d.estimated_repair,
        mao,
        asking_price: d.asking_price,
        equity_pct: equity,
        spread,
        deal_grade: dealGrade,
        deal_type: d.deal_type,
        target_margin: d.target_margin,
      },
      model_used: 'claude-sonnet-4-20250514',
    })
    .select('id')
    .single()
    .then(r => r.data)

  await supabase.from('usage_events').insert({
    user_id: user.id, event_type: 'underwriting', credits_used: 5,
  }).then(() => null)

  return NextResponse.json({
    ok: true,
    data: {
      mao,
      equity_pct: equity,
      spread,
      deal_grade: dealGrade,
      target_margin: d.target_margin,
      analysis,
      artifact_id: artifact?.id ?? null,
    },
  })
}
