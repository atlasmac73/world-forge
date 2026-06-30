/**
 * ATLAS v67 — Billing Tier Feature Gates
 * Server-side tier gate enforcement for all premium features.
 * Never trust client-side tier claims — always verify server-side.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export type TierCode = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7'

// ─── Tier definitions ─────────────────────────────────────────────────────────

export const TIER_CONFIG: Record<TierCode, {
  name:           string
  price_monthly:  number
  credits_daily:  number
  features:       string[]
}> = {
  T1: { name: 'Free',      price_monthly: 0,    credits_daily: 50,    features: ['properties:10', 'leads:5', 'ai_chat:basic'] },
  T2: { name: 'Starter',   price_monthly: 49,   credits_daily: 200,   features: ['properties:100', 'leads:50', 'godmode:5/day', 'ain:basic', 'loi:5/day', 'ai_chat'] },
  T3: { name: 'Pro',       price_monthly: 149,  credits_daily: 1000,  features: ['properties:unlimited', 'leads:unlimited', 'godmode:25/day', 'ain:full', 'skip_trace', 'top250', 'rehab', 'underwriting', 'ai_chat'] },
  T4: { name: 'Elite',     price_monthly: 299,  credits_daily: 5000,  features: ['everything:T3', 'loi:batch', 'top250:export', 'api_access', 'ai_chat:power'] },
  T5: { name: 'Sovereign', price_monthly: 499,  credits_daily: 10000, features: ['everything:T4', 'white_label', 'custom_agents'] },
  T6: { name: 'God Mode',  price_monthly: 999,  credits_daily: 50000, features: ['everything:T5', 'model_select', 'direct_founder'] },
  T7: { name: 'Founder',   price_monthly: 0,    credits_daily: 999999, features: ['everything', 'admin', 'override:all'] },
}

// ─── Feature gate definitions ─────────────────────────────────────────────────

export const FEATURE_GATES = {
  // Properties
  'properties:unlimited': ['T3','T4','T5','T6','T7'],
  'properties:100':       ['T2','T3','T4','T5','T6','T7'],

  // God Mode
  'godmode':              ['T2','T3','T4','T5','T6','T7'],
  'godmode:unlimited':    ['T4','T5','T6','T7'],

  // AIN
  'ain:full':             ['T3','T4','T5','T6','T7'],
  'ain:basic':            ['T2','T3','T4','T5','T6','T7'],

  // Tools
  'skip_trace':           ['T3','T4','T5','T6','T7'],
  'top250':               ['T3','T4','T5','T6','T7'],
  'top250:export':        ['T4','T5','T6','T7'],
  'rehab':                ['T3','T4','T5','T6','T7'],
  'underwriting':         ['T2','T3','T4','T5','T6','T7'],
  'loi':                  ['T2','T3','T4','T5','T6','T7'],
  'loi:batch':            ['T4','T5','T6','T7'],
  'court_widget':         ['T3','T4','T5','T6','T7'],
  'd4d':                  ['T2','T3','T4','T5','T6','T7'],
  'pipeline':             ['T2','T3','T4','T5','T6','T7'],

  // AI
  'ai_chat':              ['T2','T3','T4','T5','T6','T7'],
  'ai_chat:power':        ['T4','T5','T6','T7'],

  // Admin
  'admin':                ['T7'],
  'api_access':           ['T4','T5','T6','T7'],
  'model_select':         ['T6','T7'],
  'white_label':          ['T5','T6','T7'],
} as const

export type FeatureKey = keyof typeof FEATURE_GATES

// ─── Gate check functions ─────────────────────────────────────────────────────

export function tierHasFeature(tier: TierCode, feature: FeatureKey): boolean {
  return (FEATURE_GATES[feature] as readonly string[]).includes(tier)
}

/** Get user's current tier from DB — never trust client */
export async function getUserTier(userId: string): Promise<TierCode> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('tier_code')
    .eq('user_id', userId)
    .single()
  return (data?.tier_code as TierCode) ?? 'T1'
}

/** Check if user has feature access — returns NextResponse(402) if not */
export async function requireFeature(
  userId: string,
  feature: FeatureKey
): Promise<{ tier: TierCode; error: null } | { tier: null; error: NextResponse }> {
  // T7 owners bypass all gates
  const supabase = createServiceClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .single()

  if (profile?.role === 'owner') {
    return { tier: 'T7', error: null }
  }

  const tier = await getUserTier(userId)
  if (tierHasFeature(tier, feature)) {
    return { tier, error: null }
  }

  // Find minimum tier for this feature
  const minTier = (FEATURE_GATES[feature] as readonly string[])[0] ?? 'T2'
  const minTierName = TIER_CONFIG[minTier as TierCode]?.name ?? minTier

  return {
    tier: null,
    error: NextResponse.json({
      ok:      false,
      error:   `This feature requires ${minTierName} plan or higher.`,
      code:    'UPGRADE_REQUIRED',
      feature,
      current_tier: tier,
      required_tier: minTier,
      upgrade_url:   '/pricing',
    }, { status: 402 }),
  }
}

/** Get all features available to a tier */
export function getTierFeatures(tier: TierCode): FeatureKey[] {
  return (Object.keys(FEATURE_GATES) as FeatureKey[]).filter(f => tierHasFeature(tier, f))
}

/** Check credit limit */
export async function checkCredits(
  userId: string,
  creditsNeeded: number
): Promise<{ ok: boolean; remaining: number; error?: NextResponse }> {
  const supabase = createServiceClient()
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('credits_used_today, credits_limit_daily')
    .eq('user_id', userId)
    .single()

  if (!sub) return { ok: false, remaining: 0 }

  const remaining = sub.credits_limit_daily - sub.credits_used_today
  if (remaining < creditsNeeded) {
    return {
      ok: false,
      remaining,
      error: NextResponse.json({
        ok:    false,
        error: `Credit limit reached (${sub.credits_used_today}/${sub.credits_limit_daily}). Resets daily.`,
        code:  'CREDIT_LIMIT',
        remaining,
        needed: creditsNeeded,
      }, { status: 402 }),
    }
  }
  return { ok: true, remaining }
}

/** Deduct credits — call after successful operation */
export async function deductCredits(userId: string, amount: number): Promise<void> {
  const supabase = createServiceClient()
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('credits_used_today')
    .eq('user_id', userId)
    .single()
  if (!sub) return
  await supabase
    .from('subscriptions')
    .update({ credits_used_today: sub.credits_used_today + amount })
    .eq('user_id', userId)
}
