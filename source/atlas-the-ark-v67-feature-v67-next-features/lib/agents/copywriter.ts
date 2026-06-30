/**
 * THE ARK — Copywriter Agent (A06-HERALD)
 * Role: 7-touch outreach sequences, LOI copy, voicemail scripts.
 * WV culture: Direct, neighborly, values honesty, cash close.
 * TCPA compliant — opt-out in every SMS.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { PropertyInvestigation } from './investigator'
import type { UnderwriterReport } from './underwriter'

export interface CopywriterOutput {
  sms_1: string
  sms_2: string
  sms_3: string
  email_3_subject: string
  email_3_body: string
  sms_4: string
  sms_5: string
  email_6_subject: string
  email_6_body: string
  sms_7: string
  voicemail_script: string
  talking_points: string[]
  loi_intro: string
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function runCopywriter(
  investigation: PropertyInvestigation,
  underwriting: UnderwriterReport
): Promise<CopywriterOutput> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: `You are A06-HERALD — the ATLAS Communications Agent for distressed WV real estate outreach.

TONE: Friendly, non-aggressive, solution-focused. Never predatory.
WV CULTURE: Direct, neighborly, honest. Mention: fast close, cash, as-is, no realtor fees.
SMS: Max 160 chars. Must include "Reply STOP to opt out." on every SMS.
EMAIL: 3-5 short paragraphs, professional but warm.
TCPA: All messages must have opt-out language.

Return ONLY valid JSON with CopywriterOutput schema.`,
    messages: [{
      role: 'user',
      content: `Write a 7-touch outreach sequence for this WV property:

Owner: ${investigation.owner_name}
Address: ${investigation.address}
Tax Status: ${investigation.tax_status}${investigation.tax_owed ? ` ($${investigation.tax_owed.toLocaleString()} owed)` : ''}
Occupancy: ${investigation.occupancy}
Our Cash Offer: $${underwriting.recommended_offer.toLocaleString()}
Deal Grade: ${underwriting.deal_grade}

Return JSON: sms_1, sms_2, sms_3, email_3_subject, email_3_body, sms_4, sms_5, email_6_subject, email_6_body, sms_7, voicemail_script, talking_points (array of 5), loi_intro (2 sentences for LOI opening).`
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const cleaned = text.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned) as CopywriterOutput
  } catch {
    const first = investigation.owner_name.split(' ')[0]
    const addr = investigation.address.split(',')[0]
    return {
      sms_1: `Hi ${first}, I'm interested in buying ${addr} for cash, as-is. No repairs needed. Fast close possible. Interested? Reply YES. Reply STOP to opt out.`,
      sms_2: `Hey ${first}, following up on ${addr}. Cash offer, I pay closing costs, can close in 7 days. Want details? Reply YES. Reply STOP to opt out.`,
      sms_3: `${first} — still here if you're thinking about ${addr}. Cash offer stands. No agents, no fees. Reply STOP to opt out.`,
      email_3_subject: `Cash offer for ${investigation.address}`,
      email_3_body: `Hi ${first},\n\nI wanted to follow up about your property at ${investigation.address}. We buy homes as-is for cash in WV — quick close, no stress, no repairs needed.\n\nOur offer: $${underwriting.recommended_offer.toLocaleString()}\n\nWould you be open to a brief call?\n\nBest,\nAtlas Investments\nAtlas Genesis Matrix, LLC`,
      sms_4: `${first} — if taxes on ${addr} are a concern, a cash sale can clear everything quickly. Reply INFO for details. Reply STOP to opt out.`,
      sms_5: `Final check-in ${first}. Our cash offer for ${addr} is still available whenever you're ready. No pressure. Reply STOP to opt out.`,
      email_6_subject: `Still here if you need us — ${investigation.address}`,
      email_6_body: `Hi ${first},\n\nNo pressure at all — just wanted you to know our cash offer for ${investigation.address} stands whenever you're ready.\n\nWe work on your timeline.\n\nAtlas Investments`,
      sms_7: `${first} — one last note. If the time isn't right now, that's completely okay. We're here when you're ready. - Atlas Investments. Reply STOP to opt out.`,
      voicemail_script: `Hi ${first}, this is calling from Atlas Investments. I'm reaching out about your property on ${addr}. We buy homes for cash in WV, any condition, fast close. No obligation. Give me a call back at your convenience — no pressure. Thank you!`,
      talking_points: [
        'We close in 7-14 days — no waiting on bank financing',
        'You pay zero closing costs or realtor commissions',
        'We buy completely as-is — no repairs or cleanup required',
        'Cash resolves any outstanding tax or lien issues immediately',
        'Flexible closing timeline — we work around your schedule',
      ],
      loi_intro: `This Letter of Intent confirms our genuine interest in purchasing the property located at ${investigation.address}, West Virginia. We are prepared to close with cash within ${14} days, as-is, with no contingencies on property condition.`,
    }
  }
}
