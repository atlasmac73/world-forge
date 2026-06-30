/**
 * THE ARK — Admin Invite Management
 * POST /api/admin/invite — create invite
 * GET  /api/admin/invite — list invites
 * DELETE /api/admin/invite?id=xxx — revoke invite
 *
 * Requires: admin or owner role
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireUser, requireAdmin } from '@/lib/permissions'
import { z } from 'zod'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

const CreateInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'beta_tester', 'contractor', 'viewer']).default('beta_tester'),
  expires_in_days: z.number().min(1).max(30).default(7),
})

// ─── POST — Create invite ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError

  const { error: roleError } = await requireAdmin(user.id)
  if (roleError) return roleError

  try {
    const body = await req.json()
    const parsed = CreateInviteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email, role, expires_in_days } = parsed.data
    const token = randomBytes(32).toString('hex')
    const expires_at = new Date(Date.now() + expires_in_days * 86400_000).toISOString()

    const supabase = createServiceClient()

    // Check if invite already exists for this email
    const { data: existing } = await supabase
      .from('invites')
      .select('id, status')
      .eq('email', email.toLowerCase())
      .neq('status', 'accepted')
      .neq('status', 'revoked')
      .maybeSingle()

    if (existing) {
      // Revoke old invite and create fresh
      await supabase
        .from('invites')
        .update({ status: 'revoked' })
        .eq('id', existing.id)
    }

    const { data: invite, error } = await supabase
      .from('invites')
      .insert({
        email: email.toLowerCase(),
        role,
        token,
        expires_at,
        status: 'pending',
        invited_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/invite?token=${token}`

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'invite_created',
      resource_type: 'invite',
      resource_id: invite.id,
      metadata: { email, role, expires_at },
    })

    return NextResponse.json({
      ok: true,
      data: { invite, invite_url: inviteUrl },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create invite'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

// ─── GET — List invites ───────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError

  const { error: roleError } = await requireAdmin(user.id)
  if (roleError) return roleError

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data })
}

// ─── DELETE — Revoke invite ───────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError

  const { error: roleError } = await requireAdmin(user.id)
  if (roleError) return roleError

  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('invites')
    .update({ status: 'revoked' })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'invite_revoked',
    resource_type: 'invite',
    resource_id: id,
    metadata: {},
  })

  return NextResponse.json({ ok: true })
}
