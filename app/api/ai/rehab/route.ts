/**
 * ATLAS v67 — AI Rehab Estimator
 * POST /api/ai/rehab
 * Generates room-by-room rehab estimate with line items and cost ranges.
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

const RehabSchema = z.object({
  property_id:   z.string().uuid().optional(),
  deal_id:       z.string().uuid().optional(),
  address:       z.string().min(1),
  sq_footage:    z.number().positive().optional(),
  year_built:    z.number().optional(),
  bedrooms:      z.number().optional(),
  bathrooms:     z.number().optional(),
  condition:     z.enum(['gut','poor','fair','average','good']).default('fair'),
  scope_notes:   z.string().optional(),
  rehab_level:   z.enum(['cosmetic','light','full','heavy']).default('light'),
  target_market: z.enum(['retail','rental','wholesale']).default('retail'),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { armed } = await checkKillSwitch(supabase)
  if (armed) return NextResponse.json(KILL_SWITCH_RESPONSE, { status: 503 })

  const { user, error: authError } = await requireUser()
  if (authError) return authError

  const body = await req.json()
  const parsed = RehabSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 })

  const d = parsed.data

  const prompt = `You are ATLAS A07-REHAB, a construction estimating agent specializing in WV/Appalachian rehab projects.

Generate a detailed rehab estimate for:

Property: ${d.address}
Condition: ${d.condition}
Rehab Level: ${d.rehab_level}
Target Market: ${d.target_market}
${d.sq_footage ? `Square Footage: ${d.sq_footage}` : ''}
${d.year_built ? `Year Built: ${d.year_built}` : ''}
${d.bedrooms ? `Bedrooms: ${d.bedrooms}` : ''}
${d.bathrooms ? `Bathrooms: ${d.bathrooms}` : ''}
${d.scope_notes ? `Scope Notes: ${d.scope_notes}` : ''}

Produce a JSON response with this exact structure:
{
  "summary": "2-sentence overview",
  "total_low": number,
  "total_high": number,
  "recommended_budget": number,
  "contingency_pct": number,
  "timeline_weeks": number,
  "line_items": [
    {
      "category": "Kitchen|Bathrooms|Flooring|Roof|HVAC|Electrical|Plumbing|Exterior|Paint|Landscaping|Miscellaneous",
      "description": "string",
      "low": number,
      "high": number,
      "priority": "critical|high|medium|low",
      "notes": "string"
    }
  ],
  "key_risks": ["string"],
  "wv_market_notes": "string"
}

Use WV contractor pricing (generally 15-25% below national averages).
Only return valid JSON, no markdown.`

  let estimate: Record<string, unknown> = {}
  let rawResponse = ''

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })
    rawResponse = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const cleaned = rawResponse.replace(/```json\n?|```\n?/g, '').trim()
    estimate = JSON.parse(cleaned)
  } catch {
    estimate = {
      summary: 'AI estimate unavailable. Manual assessment required.',
      total_low: 0,
      total_high: 0,
      recommended_budget: 0,
      contingency_pct: 15,
      timeline_weeks: 8,
      line_items: [],
      key_risks: ['Manual assessment needed'],
      wv_market_notes: 'Contact local WV contractor for accurate estimate.',
    }
  }

  // Save artifact
  const artifact = await supabase
    .from('deal_artifacts')
    .insert({
      user_id:       user.id,
      property_id:   d.property_id ?? null,
      deal_id:       d.deal_id ?? null,
      artifact_type: 'rehab_estimate',
      title:         `Rehab Estimate — ${d.address}`,
      content:       JSON.stringify(estimate, null, 2),
      content_json:  estimate,
      model_used:    'claude-sonnet-4-20250514',
    })
    .select('id')
    .single()
    .then(r => r.data)

  await supabase.from('usage_events').insert({
    user_id: user.id, event_type: 'rehab_estimate', credits_used: 5,
  }).then(() => null)

  return NextResponse.json({
    ok: true,
    data: {
      ...estimate,
      artifact_id: artifact?.id ?? null,
    },
  })
}
