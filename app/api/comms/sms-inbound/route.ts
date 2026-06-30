/**
 * THE ARK — SMS Inbound Webhook
 * Handles replies from property owners.
 * Twilio calls this URL when someone replies to your SMS.
 * POST /api/comms/sms-inbound
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const from = formData.get('From') as string
  const body = formData.get('Body') as string
  const to = formData.get('To') as string
  const messageSid = formData.get('MessageSid') as string

  if (!from || !body) {
    return new NextResponse('<?xml version="1.0"?><Response/>', {
      headers: { 'Content-Type': 'text/xml' }
    })
  }

  const supabase = createServiceClient()
  const normalizedBody = body.trim().toUpperCase()

  // Handle STOP — opt-out (TCPA mandatory)
  if (normalizedBody === 'STOP' || normalizedBody.startsWith('STOP ')) {
    await supabase.from('audit_logs').insert({
      action: 'sms.optout',
      new_data: { phone: from, message_sid: messageSid },
    })

    return new NextResponse(
      '<?xml version="1.0"?><Response><Message>You have been unsubscribed. You will receive no more messages.</Message></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  // Find matching lead by phone number
  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, property_id, status, touch_sequence')
    .eq('phone', from)
    .limit(1)

  if (leads && leads.length > 0) {
    const lead = leads[0]

    // Update lead status to contacted if they replied
    await supabase
      .from('leads')
      .update({
        status: 'contacted',
        last_contact: new Date().toISOString(),
      })
      .eq('id', lead.id)

    // Update campaign response count
    await supabase
      .from('outreach_campaigns')
      .update({ response_count: 1 }) // Would need RPC to increment safely
      .eq('id', 'placeholder') // TODO: match by phone

    // Create notification for user
    const { data: property } = await supabase
      .from('properties')
      .select('user_id, address')
      .eq('id', lead.property_id ?? '')
      .single()

    if (property) {
      await supabase.from('notifications').insert({
        user_id: property.user_id,
        type: 'sms_reply',
        title: `📱 SMS Reply from ${lead.name}`,
        body: `"${body}" — ${property.address}`,
        action_url: `/dashboard/comms?lead=${lead.id}`,
        metadata: { from, message: body, lead_id: lead.id, message_sid: messageSid },
      })
    }
  }

  // Log inbound
  await supabase.from('audit_logs').insert({
    action: 'sms.received',
    new_data: { from, to, body, message_sid: messageSid },
  })

  // Auto-respond with neutral acknowledgment
  const autoReply = normalizedBody === 'YES' || normalizedBody === 'INFO'
    ? 'Thank you for your interest! Someone from our team will reach out within 24 hours. - Atlas Investments'
    : ''

  if (autoReply) {
    return new NextResponse(
      `<?xml version="1.0"?><Response><Message>${autoReply}</Message></Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  return new NextResponse('<?xml version="1.0"?><Response/>', {
    headers: { 'Content-Type': 'text/xml' }
  })
}
