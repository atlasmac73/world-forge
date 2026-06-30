/**
 * THE ARK — SMS Send (A06-HERALD)
 * POST /api/comms/sms-send
 * Requires: SMS_ENABLED feature flag + TWILIO_* env vars
 * TCPA compliant: auto-appends STOP opt-out
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const Schema = z.object({
  to:          z.string().min(10),
  body:        z.string().min(1).max(1600),
  campaign_id: z.string().uuid().optional(),
  lead_id:     z.string().uuid().optional(),
})

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError

  try {
    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { to, body: msgBody, campaign_id, lead_id } = parsed.data

    // TCPA: must include opt-out
    const finalBody = msgBody.includes('STOP') ? msgBody : `${msgBody}\n\nReply STOP to opt out.`

    // Mock mode when Twilio not configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      return NextResponse.json({
        ok: true,
        data: {
          mock: true,
          note: 'Twilio not configured — register A2P 10DLC at twilio.com, then add env vars',
          sid: `MOCK_${Date.now()}`,
          to,
          body: finalBody,
          status: 'mock_queued',
        }
      })
    }

    const twilio = (await import('twilio')).default
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

    const message = await client.messages.create({
      body: finalBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    })

    // Async: update campaign stats (non-critical)
    const supabase = await createClient()
    if (campaign_id) {
      await supabase.rpc('increment_campaign_sent', { p_campaign_id: campaign_id })
    }

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'sms.sent',
      resource_type: 'message',
      resource_id: message.sid,
      metadata: { to, campaign_id, lead_id },
    })

    return NextResponse.json({
      ok: true,
      data: { sid: message.sid, status: message.status, to },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'SMS send failed'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
