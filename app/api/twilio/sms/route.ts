// app/api/twilio/sms/route.ts — Real Twilio SMS (from godmode-v23)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { to, message, lead_id } = await req.json()
  if (!to || !message) return NextResponse.json({ error: 'to and message required' }, { status: 400 })

  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE_NUMBER

  if (!sid || !token || !from) {
    return NextResponse.json({
      error: 'Twilio not configured. Add TWILIO_* env vars.',
      setup: 'Get credentials at twilio.com → ~$0.0079/SMS'
    }, { status: 503 })
  }

  try {
    const twilio = (await import('twilio')).default
    const client = twilio(sid, token)
    const formattedTo = to.startsWith('+') ? to : `+1${to.replace(/\D/g, '')}`
    const sms = await client.messages.create({ to: formattedTo, from, body: message })

    if (lead_id) {
      await supabase.from('properties').update({ last_contact: new Date().toISOString() }).eq('id', lead_id).eq('created_by', user.id)
    }

    await supabase.from('agent_runs').insert({
      owner_user_id: user.id, portal: 'investor', tool: 'sms_send',
      status: 'completed', input: { to, message }, output: { sid: sms.sid },
      credits_used: 0,
    })

    return NextResponse.json({ success: true, sid: sms.sid, status: sms.status })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Batch SMS
export async function PUT(req: NextRequest) {
  // Feature flag: SMS disabled during beta by default
  if (process.env.NEXT_PUBLIC_ENABLE_TWILIO_SEND !== 'true') {
    return NextResponse.json({ error: 'Batch SMS is disabled during beta. Enable NEXT_PUBLIC_ENABLE_TWILIO_SEND=true when ready.' }, { status: 403 })
  }

  // Auth required for batch SMS
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Admin/president only
  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required for batch SMS' }, { status: 403 })
  }

  const { leads, template } = await req.json()
  if (!leads?.length || !template) return NextResponse.json({ error: 'leads and template required' }, { status: 400 })

  const sid = process.env.TWILIO_ACCOUNT_SID
  if (!sid) return NextResponse.json({ error: 'Twilio not configured' }, { status: 503 })

  const twilio = (await import('twilio')).default
  const client = twilio(sid, process.env.TWILIO_AUTH_TOKEN!)
  const results = []

  for (const lead of leads) {
    if (!lead.phone) continue
    const msg = template.replace(/{name}/g, lead.name?.split(' ')[0] || 'there').replace(/{address}/g, lead.address || '')
    const to = lead.phone.startsWith('+') ? lead.phone : `+1${lead.phone.replace(/\D/g, '')}`
    try {
      const sms = await client.messages.create({ to, from: process.env.TWILIO_PHONE_NUMBER!, body: msg })
      results.push({ id: lead.id, success: true, sid: sms.sid })
    } catch (err: any) {
      results.push({ id: lead.id, success: false, error: err.message })
    }
  }

  const sent = results.filter(r => r.success).length
  return NextResponse.json({ success: true, total: leads.length, sent, failed: leads.length - sent, results })
}
