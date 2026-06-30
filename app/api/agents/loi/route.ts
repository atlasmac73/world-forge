/**
 * THE ARK — LOI Generator API
 * A06-HERALD generates Letter of Intent
 * POST /api/agents/loi
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkKillSwitch, KILL_SWITCH_RESPONSE } from '@/lib/agents/killSwitch'
import { writeAuditLog } from '@/lib/audit/logger'

export const dynamic = 'force-dynamic'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // v67: Kill switch check
  const { armed } = await checkKillSwitch(supabase)
  if (armed) {
    await writeAuditLog({
      user_id: user.id, action: 'AGENT_RUN_BLOCKED',
      resource_type: 'deal.loi', metadata: { reason: 'kill_switch' },
    })
    return NextResponse.json(KILL_SWITCH_RESPONSE, { status: 503 })
  }

  const {
    property_id,
    address,
    owner_name,
    buyer_name = 'Isaac Brandon Burdette / Atlas Genesis Matrix, LLC',
    offer_price,
    earnest_money = 1000,
    closing_days = 14,
    contingencies = [],
    deal_type = 'wholesale',
  } = await req.json()

  if (!address || !offer_price) {
    return NextResponse.json({ error: 'address and offer_price required' }, { status: 400 })
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `You are A06-HERALD — the ATLAS Legal Document Agent generating West Virginia Letters of Intent.

WV LOI standards:
- Professional but accessible language
- Include all required terms: parties, property, price, earnest money, closing timeline, contingencies, as-is clause
- WV-specific: reference WV Code, county recording, deed of trust
- Cash purchase format (no financing contingency for wholesale/flip)
- Firm but fair language

Return a professional, ready-to-use LOI as plain text (no JSON wrapper).`,
      messages: [{
        role: 'user',
        content: `Draft a West Virginia Letter of Intent for:

Buyer: ${buyer_name}
Seller/Owner: ${owner_name ?? 'Property Owner'}
Property Address: ${address}
Purchase Price: $${offer_price.toLocaleString()}
Earnest Money: $${earnest_money.toLocaleString()}
Closing Timeline: ${closing_days} days from acceptance
Deal Type: ${deal_type}
Contingencies: ${contingencies.length > 0 ? contingencies.join(', ') : 'None — As-Is purchase'}
Today's Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

Include: header, parties, property description, price/terms, earnest money, closing, inspection (waived for wholesale), as-is clause, signature blocks.`
      }],
    })

    const body_text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Save to loi_documents
    const { data: loi } = await supabase
      .from('loi_documents')
      .insert({
        user_id: user.id,
        property_id: property_id ?? null,
        buyer_name,
        seller_name: owner_name,
        offer_price,
        earnest_money,
        closing_days,
        contingencies,
        body_text,
        status: 'draft',
      })
      .select()
      .single()

    await writeAuditLog({
      user_id: user.id, action: 'LOI_GENERATED',
      resource_type: 'loi_documents', resource_id: loi?.id,
      metadata: { address, offer_price, deal_type },
    })

    return NextResponse.json({ loi_id: loi?.id, body_text, generated_at: new Date().toISOString() })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'LOI generation failed'
    await writeAuditLog({
      user_id: user.id, action: 'LOI_GENERATED',
      resource_type: 'loi_documents', metadata: { address, error: message },
    })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
