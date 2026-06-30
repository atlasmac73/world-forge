/**
 * THE ARK — Stripe Webhook
 * POST /api/billing/webhook
 * Verifies signature, syncs subscription state to Supabase
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const TIER_CREDITS: Record<string, number> = {
  T1: 100, T2: 500, T3: 2000, T4: 5000, T5: 10000, T6: 50000, T7: 100000,
}

const PRICE_TO_TIER: Record<string, string> = {
  [process.env.STRIPE_PRICE_T2_STARTER ?? 'none_t2']: 'T2',
  [process.env.STRIPE_PRICE_T3_PRO ?? 'none_t3']: 'T3',
  [process.env.STRIPE_PRICE_T4_POWER ?? 'none_t4']: 'T4',
  [process.env.STRIPE_PRICE_T5_ELITE ?? 'none_t5']: 'T5',
  [process.env.STRIPE_PRICE_T6_SOVEREIGN ?? 'none_t6']: 'T6',
  [process.env.STRIPE_PRICE_T7_GOD_MODE ?? 'none_t7']: 'T7',
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: 'Stripe not configured' }, { status: 503 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ ok: false, error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: import('stripe').Stripe.Event
  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature failed'
    console.error('[Stripe Webhook]', message)
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as import('stripe').Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const tierCode = session.metadata?.tier_code ?? 'T2'
        if (!userId) break

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          tier_code: tierCode,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          status: 'active',
          credits_limit_daily: TIER_CREDITS[tierCode] ?? 100,
          credits_used_today: 0,
          current_period_start: new Date().toISOString(),
        }, { onConflict: 'user_id' })

        await supabase.from('audit_logs').insert({
          user_id: userId,
          action: 'subscription.upgraded',
          resource_type: 'subscription',
          metadata: { tier_code: tierCode, via: 'stripe_checkout' },
        })
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as import('stripe').Stripe.Subscription
        const userId = sub.metadata?.user_id
        if (!userId) break
        const priceId = sub.items.data[0]?.price.id ?? ''
        const tierCode = PRICE_TO_TIER[priceId] ?? 'T1'
        await supabase.from('subscriptions').update({
          tier_code: tierCode,
          status: sub.status,
          credits_limit_daily: TIER_CREDITS[tierCode] ?? 100,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }).eq('stripe_subscription_id', sub.id)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as import('stripe').Stripe.Subscription
        await supabase.from('subscriptions').update({
          tier_code: 'T1', status: 'canceled', credits_limit_daily: 100,
        }).eq('stripe_subscription_id', sub.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as import('stripe').Stripe.Invoice
        if (invoice.subscription) {
          await supabase.from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', invoice.subscription as string)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as import('stripe').Stripe.Invoice
        if (invoice.subscription) {
          await supabase.from('subscriptions')
            .update({ status: 'active', credits_used_today: 0 })
            .eq('stripe_subscription_id', invoice.subscription as string)
        }
        break
      }
    }
  } catch (err) {
    console.error('[Stripe Webhook] Handler error:', err)
    // Return 200 so Stripe doesn't retry — log the error
  }

  return NextResponse.json({ ok: true, received: true })
}
