/**
 * ATLAS v67 — Court Widget Extract API
 * POST /api/court-widget/extract
 *
 * ⚠️ PROTOTYPE ONLY — returns AI-generated research estimates
 * NOT verified official court records
 * Results stored as agent_artifacts for review
 *
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

const ExtractSchema = z.object({
  address:    z.string().min(5),
  county:     z.string().min(2),
  property_id: z.string().uuid().optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { armed } = await checkKillSwitch(supabase)
  if (armed) return NextResponse.json(KILL_SWITCH_RESPONSE, { status: 503 })

  const { user, error: authError } = await requireUser()
  if (authError) return authError

  const body = await req.json()
  const parsed = ExtractSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 })
  }

  const { address, county, property_id } = parsed.data

  const prompt = `You are a West Virginia court record research assistant. You are helping analyze potential court activity related to a property.

Property: ${address}
County: ${county} County, WV

This is a research exercise. Based on common WV court case patterns for distressed properties, generate a realistic sample of potential court records that MIGHT be found for such a property. These are educational examples, NOT actual court records.

Return ONLY valid JSON (no markdown):
{
  "records": [
    {
      "case_number": "XX-C-XXXX or null",
      "case_type": "Foreclosure|Tax Lien|Judgment|Probate|Divorce|Mechanic Lien",
      "filing_date": "YYYY-MM-DD or null",
      "parties": ["Party 1", "Party 2"],
      "status": "Active|Closed|Pending",
      "description": "Brief description of the case",
      "court": "Kanawha County Circuit Court|WV Tax Division|etc",
      "confidence": "low"
    }
  ],
  "extraction_notes": "Brief note about what was found",
  "suggested_verification": "Where to verify: e.g. courtswv.gov, county assessor"
}

Generate 0-3 realistic sample records. If the address doesn't suggest distress, return 0-1 records.
All records must have confidence: "low" since this is AI-generated research.
Always include a note that these require verification at official sources.`

  let extraction: {
    records: Array<{
      case_number?: string; case_type: string; filing_date?: string
      parties: string[]; status: string; description: string; court: string; confidence: 'high' | 'medium' | 'low'
    }>
    extraction_notes: string
    suggested_verification: string
  } = {
    records: [],
    extraction_notes: 'AI extraction unavailable',
    suggested_verification: 'courtswv.gov',
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const cleaned = text.replace(/```json\n?|```\n?/g, '').trim()
    extraction = JSON.parse(cleaned)
  } catch {
    extraction.extraction_notes = 'AI extraction failed — manual court search required'
  }

  // Save as artifact (agent_artifacts or deal_artifacts depending on context)
  let artifactId: string | null = null
  try {
    const { data: artifact } = await supabase
      .from('agent_artifacts')
      .insert({
        user_id:        user.id,
        property_id:    property_id ?? null,
        artifact_type:  'court_research_prototype',
        title:          `Court Research (PROTOTYPE): ${address}`,
        content:        JSON.stringify(extraction, null, 2),
        content_json:   { ...extraction, address, county, is_prototype: true },
        model_used:     'claude-haiku-4-5-20251001',
        quality_score:  20, // Low quality score — this is research only
      })
      .select('id')
      .single()
    artifactId = artifact?.id ?? null
  } catch {
    // Non-fatal
  }

  // Usage event
  try {
    await supabase.from('usage_events').insert({
      user_id: user.id, event_type: 'court_extraction_prototype', credits_used: 2,
    })
  } catch { /* best-effort, ignore */ }

  return NextResponse.json({
    ok: true,
    data: {
      address,
      county: `${county} County, WV`,
      records: extraction.records ?? [],
      extraction_notes: extraction.extraction_notes,
      suggested_verification: extraction.suggested_verification,
      artifact_id: artifactId,
      disclaimer: `⚠️ PROTOTYPE ONLY — These are AI-generated research estimates, NOT verified public court records. Always verify at ${extraction.suggested_verification ?? 'courtswv.gov'} before any legal or investment decisions.`,
    },
  })
}
