/**
 * THE ARK — Stripe Checkout
 * POST /api/billing/checkout
 * Feature-flagged: BILLING_ENABLED must be true
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const Schema = z.object({
  tier_code: z.enum(['T2','T3','T4','T5','T6','T7']),
})

const PRICE_IDS: Record<string, string> = {
  T2: process.env.STRIPE_PRICE_T2_STARTER ?? '',
  T3: process.env.STRIPE_PRICE_T3_PRO ?? '',
  T4: process.env.STRIPE_PRICE_T4_POWER ?? '',
  T5: process.env.STRIPE_PRICE_T5_ELITE ?? '',
  T6: process.env.STRIPE_PRICE_T6_SOVEREIGN ?? '',
  T7: process.env.STRIPE_PRICE_T7_GOD_MODE ?? '',
}

export async function POST(req: NextRequest) {
  // Gate: billing must be enabled
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ ok: false, error: 'Billing not configured' }, { status: 503 })
  }

  const { user, error: authError } = await requireUser()
  if (authError) return authError

  try {
    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { tier_code } = parsed.data
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

    const supabase = createClient()
    const { data: tier } = await supabase
      .from('subscription_tiers')
      .select('stripe_price_id')
      .eq('tier_code', tier_code)
      .single()

    const priceId = tier?.stripe_price_id ?? PRICE_IDS[tier_code]
    if (!priceId) {
      return NextResponse.json({
        ok: false,
        error: `Price ID not configured for ${tier_code}. Add STRIPE_PRICE_${tier_code}_* to Vercel env vars.`
      }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/?upgraded=1&tier=${tier_code}`,
      cancel_url: `${baseUrl}/`,
      customer_email: user.email,
      metadata: { user_id: user.id, tier_code },
      subscription_data: { metadata: { user_id: user.id, tier_code } },
    })

    return NextResponse.json({ ok: true, data: { url: session.url, sessionId: session.id } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
