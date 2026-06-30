/**
 * THE ARK — Invite Token Validation
 * GET /api/invite/validate?token=xxx
 * Public endpoint — validates without auth
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ ok: false, error: 'Token required' }, { status: 400 })
  }

  try {
    const supabase = createServiceClient()

    const { data: invite, error } = await supabase
      .from('invites')
      .select('id, email, role, status, expires_at')
      .eq('token', token)
      .single()

    if (error || !invite) {
      return NextResponse.json({ ok: false, error: 'Invalid invite token' }, { status: 404 })
    }

    if (invite.status === 'accepted') {
      return NextResponse.json({ ok: false, error: 'Invite already used' }, { status: 410 })
    }

    if (invite.status === 'revoked') {
      return NextResponse.json({ ok: false, error: 'Invite has been revoked' }, { status: 410 })
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ ok: false, error: 'Invite has expired' }, { status: 410 })
    }

    return NextResponse.json({
      ok: true,
      invite: { email: invite.email, role: invite.role },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Validation failed'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
