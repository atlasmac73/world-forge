/**
 * THE ARK — Portals API
 * GET /api/portals — Returns all active portals for current user with unlock status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const TIER_ORDER: Record<string, number> = {
  T1: 1, T2: 2, T3: 3, T4: 4, T5: 5, T6: 6, T7: 7,
}

type PortalRow = {
  min_tier?: string | null
  [key: string]: unknown
}

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('tier_code')
    .eq('user_id', user.id)
    .single()

  const userTier = (sub as { tier_code?: string } | null)?.tier_code ?? 'T1'
  const userTierLevel = TIER_ORDER[userTier] ?? 1

  const { data: portals } = await supabase
    .from('portals')
    .select('*')
    .eq('is_active', true)
    .eq('is_hidden', false)
    .order('sort_order')

  const portalsWithStatus = ((portals ?? []) as PortalRow[]).map((p) => ({
    ...p,
    unlocked: TIER_ORDER[p.min_tier ?? 'T1'] <= userTierLevel,
    user_tier: userTier,
  }))

  return NextResponse.json(portalsWithStatus)
}
