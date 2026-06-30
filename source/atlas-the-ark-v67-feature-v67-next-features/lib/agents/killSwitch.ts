/**
 * ATLAS v67 — Kill Switch Check
 * Import this in all /api/agents/* routes before executing.
 * Returns { armed: boolean }
 * 
 * Usage:
 *   const { armed } = await checkKillSwitch(supabase)
 *   if (armed) return NextResponse.json({ error: 'System halted — kill switch is armed.' }, { status: 503 })
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export async function checkKillSwitch(
  supabase: SupabaseClient
): Promise<{ armed: boolean }> {
  try {
    const { data } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'kill_switch')
      .single()

    const armed = data?.value === true || data?.value === 'true'
    return { armed }
  } catch {
    // If table doesn't exist or query fails, default to NOT armed
    // Fail open on kill switch check (don't block agents if config is unavailable)
    return { armed: false }
  }
}

/** Helper response for armed kill switch — use in agent routes */
export const KILL_SWITCH_RESPONSE = {
  error: '⛔ System halted — kill switch is armed. Contact the administrator.',
  code: 'KILL_SWITCH_ARMED',
} as const
