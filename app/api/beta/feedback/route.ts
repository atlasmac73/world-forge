/**
 * THE ARK — Beta Feedback
 * POST /api/beta/feedback     — submit feedback (any authenticated user)
 * GET  /api/beta/feedback     — read own feedback
 * GET  /api/beta/feedback?admin=1 — read all feedback (admin/owner only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requireUser, requireAdmin } from '@/lib/permissions'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const FeedbackSchema = z.object({
  portal:  z.string().max(100).optional(),
  type:    z.enum(['bug', 'feature', 'ux', 'performance', 'general']).default('general'),
  message: z.string().min(5).max(2000),
  rating:  z.number().min(1).max(5).optional(),
})

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError

  try {
    const body = await req.json()
    const parsed = FeedbackSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('beta_feedback')
      .insert({ ...parsed.data, user_id: user.id })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to submit feedback'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError

  const isAdmin = req.nextUrl.searchParams.get('admin') === '1'

  if (isAdmin) {
    // Require admin/owner role
    const { error: roleError } = await requireAdmin(user.id)
    if (roleError) return roleError

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('beta_feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, data })
  }

  // Own feedback only
  const supabase = createClient()
  const { data, error } = await supabase
    .from('beta_feedback')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data })
}
