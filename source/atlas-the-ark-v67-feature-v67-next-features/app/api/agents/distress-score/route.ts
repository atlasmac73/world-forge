/**
 * THE ARK — Distress Score API
 * A15-OMEN: 8-factor property distress analysis
 * POST /api/agents/distress-score
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkKillSwitch, KILL_SWITCH_RESPONSE } from '@/lib/agents/killSwitch'
import { writeAuditLog } from '@/lib/audit/logger'

export const dynamic = 'force-dynamic'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // v67: Kill switch check
  const { armed } = await checkKillSwitch(supabase)
  if (armed) {
    await writeAuditLog({
      user_id: user.id, action: 'AGENT_RUN_BLOCKED',
      resource_type: 'property.distressScore', metadata: { reason: 'kill_switch' },
    })
    return NextResponse.json(KILL_SWITCH_RESPONSE, { status: 503 })
  }

  const { property_id, address, property_data } = await req.json()

  if (!address && !property_id) {
    return NextResponse.json({ error: 'address or property_id required' }, { status: 400 })
  }

  try {
    // Load property from DB if ID provided
    let propertyInfo = property_data
    if (property_id && !propertyInfo) {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('id', property_id)
        .eq('user_id', user.id)
        .single()
      propertyInfo = data
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: `You are A15-OMEN — the ATLAS Distress Score Engine.
Score properties on 8 factors (each 0-100):
1. tax_delinquency — is owner behind on taxes?
2. vacancy — is property vacant or abandoned?
3. code_violations — are there code violations or complaints?
4. foreclosure_risk — any foreclosure filings or lis pendens?
5. absentee_owner — does owner live elsewhere?
6. liens — are there mechanic's liens, judgment liens?
7. days_on_market — has it been listed too long?
8. physical_condition — visible distress, deferred maintenance?

Return JSON: { distress_score (weighted average), tax_delinquency, vacancy, code_violations, foreclosure_risk, absentee_owner, liens, days_on_market, physical_condition, heat_level ("cold"|"warm"|"hot"|"critical"), deal_grade ("A"|"B"|"C"|"D"|"F"), scoring_notes }`,
      messages: [{
        role: 'user',
        content: `Score distress for: ${address ?? propertyInfo?.address}\n\nProperty data: ${JSON.stringify(propertyInfo ?? {})}`
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const score = JSON.parse(text.replace(/```json|```/g, '').trim())

    // Save to distress_scores and update property if ID exists
    if (property_id) {
      await supabase.from('properties').update({
        distress_score: score.distress_score,
        deal_grade: score.deal_grade,
        status: score.heat_level === 'critical' || score.heat_level === 'hot' ? 'hot' :
                 score.heat_level === 'warm' ? 'warm' : 'cold',
      }).eq('id', property_id)
    }

    await writeAuditLog({
      user_id: user.id, action: 'DISTRESS_SCORED',
      resource_type: 'property', resource_id: property_id ?? undefined,
      metadata: { address, distress_score: score.distress_score, deal_grade: score.deal_grade },
    })

    return NextResponse.json(score)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Distress scoring failed'
    await writeAuditLog({
      user_id: user.id, action: 'DISTRESS_SCORED',
      resource_type: 'property', resource_id: property_id ?? undefined,
      metadata: { address, error: message },
    })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
