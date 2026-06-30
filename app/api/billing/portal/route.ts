/**
 * THE ARK — Stripe Billing Portal
 * POST /api/billing/portal
 * Returns a Stripe Customer Portal URL for the authenticated user.
 * Isaac Brandon Burdette, Sole Inventor — Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/permissions'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ ok: false, error: 'Billing not configured' }, { status: 503 })
  }

  const { user, error: authError } = await requireUser()
  if (authError) return authError

  try {
    const supabase = createServiceClient()

    // Look up the user's Stripe customer ID from subscriptions table
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!sub?.stripe_customer_id) {
      return NextResponse.json(
        { ok: false, error: 'No active subscription found. Subscribe to a plan first.' },
        { status: 404 }
      )
    }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${baseUrl}/`,
    })

    return NextResponse.json({ ok: true, data: { url: session.url } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Portal session failed'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
