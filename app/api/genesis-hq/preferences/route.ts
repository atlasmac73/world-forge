/**
 * ATLAS v67 — Genesis HQ User Preferences
 * GET /api/genesis-hq/preferences → current user's own prefs
 * PUT /api/genesis-hq/preferences → upsert current user's own prefs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireGenesisHqAccess, handleGenesisHqPermissionError } from '@/lib/genesis-hq/permissions'
import { UpdateGenesisHqPreferencesSchema } from '@/lib/genesis-hq/validators'

export async function GET() {
  try {
    const ctx = await requireGenesisHqAccess()
    const supabase = createClient()
    const { data, error } = await supabase
      .from('genesis_hq_user_preferences')
      .select('*')
      .eq('user_id', ctx.userId)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? { user_id: ctx.userId, default_view: 'roadmap', collapsed_phases: {} })
  } catch (error) {
    return handleGenesisHqPermissionError(error)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ctx = await requireGenesisHqAccess()
    const body = await req.json()
    const parsed = UpdateGenesisHqPreferencesSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('genesis_hq_user_preferences')
      .upsert({ user_id: ctx.userId, ...parsed.data }, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return handleGenesisHqPermissionError(error)
  }
}
