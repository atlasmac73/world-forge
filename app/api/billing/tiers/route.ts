/**
 * ATLAS v67 — Billing Tiers API
 * GET /api/billing/tiers — returns available tiers and user's current tier
 * Used by pricing page and upgrade modals.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TIER_CONFIG, getTierFeatures, type TierCode } from '@/lib/billing/gates'

export const dynamic = 'force-dynamic'

const STRIPE_PRICE_IDS: Partial<Record<TierCode, string>> = {
  T2: process.env.STRIPE_PRICE_T2_STARTER ?? '',
  T3: process.env.STRIPE_PRICE_T3_PRO     ?? '',
  T4: process.env.STRIPE_PRICE_T4_POWER   ?? '',
  T5: process.env.STRIPE_PRICE_T5_ELITE   ?? '',
  T6: process.env.STRIPE_PRICE_T7_GOD_MODE ?? '', // T6 God Mode
}

export async function GET(_req: NextRequest) {
  const supabase = await createClient()

  // Get current user (optional — tiers are public)
  const { data: { user } } = await supabase.auth.getUser()

  let currentTier: TierCode = 'T1'
  let creditsUsed = 0
  let creditsLimit = TIER_CONFIG.T1.credits_daily

  if (user) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('tier_code, credits_used_today, credits_limit_daily')
      .eq('user_id', user.id)
      .single()
    if (sub) {
      currentTier  = (sub.tier_code as TierCode) ?? 'T1'
      creditsUsed  = sub.credits_used_today ?? 0
      creditsLimit = sub.credits_limit_daily ?? TIER_CONFIG.T1.credits_daily
    }
  }

  const tiers = (Object.entries(TIER_CONFIG) as [TierCode, typeof TIER_CONFIG[TierCode]][])
    .filter(([code]) => code !== 'T7') // T7 is internal only
    .map(([code, config]) => ({
      code,
      name:          config.name,
      price_monthly: config.price_monthly,
      credits_daily: config.credits_daily,
      features:      getTierFeatures(code),
      stripe_price_id: STRIPE_PRICE_IDS[code] ?? null,
      is_available:  Boolean(STRIPE_PRICE_IDS[code] || code === 'T1'),
      is_current:    code === currentTier,
      is_upgrade:    ['T1','T2','T3','T4','T5','T6'].indexOf(code) > ['T1','T2','T3','T4','T5','T6'].indexOf(currentTier),
    }))

  return NextResponse.json({
    ok: true,
    data: {
      tiers,
      current_tier:  currentTier,
      credits_used:  creditsUsed,
      credits_limit: creditsLimit,
      credits_remaining: Math.max(0, creditsLimit - creditsUsed),
      billing_enabled: Boolean(process.env.STRIPE_SECRET_KEY),
    },
  })
}
