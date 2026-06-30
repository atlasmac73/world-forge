/**
 * THE ARK — Feature Flags
 * Check feature flags server-side or client-side
 */

import { createServiceClient } from '@/lib/supabase/server'

export type FeatureFlag =
  | 'PORTAL_DEALS'
  | 'PORTAL_CONTRACTORS'
  | 'PORTAL_AGENT_LAB'
  | 'PORTAL_LIVING_GRAPH'
  | 'PORTAL_WORLD_FORGE'
  | 'PORTAL_NASDROP'
  | 'PORTAL_GENESIS'
  | 'BILLING_ENABLED'
  | 'SMS_ENABLED'
  | 'CONNECTORS_ENABLED'
  | 'AI_ENABLED'

// Cache flags in memory for 60 seconds (per server instance)
const FLAG_CACHE: Map<string, { value: boolean; expires: number }> = new Map()
const CACHE_TTL = 60_000

export async function isFeatureEnabled(flag: FeatureFlag): Promise<boolean> {
  const now = Date.now()
  const cached = FLAG_CACHE.get(flag)
  if (cached && cached.expires > now) return cached.value

  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('flag_key', flag)
      .single()

    const value = (data as { enabled?: boolean } | null)?.enabled ?? false
    FLAG_CACHE.set(flag, { value, expires: now + CACHE_TTL })
    return value
  } catch {
    // If table doesn't exist yet, fall back to env var
    return process.env[`FEATURE_${flag}`] === 'true'
  }
}

export async function getAllFlags(): Promise<Record<string, boolean>> {
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('feature_flags')
      .select('flag_key, enabled')

    type FlagRow = { flag_key: string; enabled: boolean }
    return Object.fromEntries(
      ((data ?? []) as FlagRow[]).map((f) => [f.flag_key, f.enabled])
    )
  } catch {
    return {}
  }
}
