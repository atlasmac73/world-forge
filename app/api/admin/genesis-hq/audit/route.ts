/**
 * ATLAS v67 — Genesis HQ Admin: Audit Log
 * GET /api/admin/genesis-hq/audit → recent Genesis HQ admin actions (owner-only)
 *
 * Reads from the shared `audit_logs` table (lib/audit/logger.ts) filtered
 * to resource_type = 'genesis_hq' — there is no dedicated audit table for
 * this feature in v67. Reads via the service-role client since audit_logs
 * has no authenticated-role RLS read policy.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireGenesisHqOwner, handleGenesisHqPermissionError } from '@/lib/genesis-hq/permissions'
import { GENESIS_HQ_AUDIT_PAGE_SIZE } from '@/lib/genesis-hq/constants'

export async function GET(req: NextRequest) {
  try {
    await requireGenesisHqOwner()
    const { searchParams } = new URL(req.url)
    const limit = Math.min(Number(searchParams.get('limit')) || GENESIS_HQ_AUDIT_PAGE_SIZE, 200)

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('resource_type', 'genesis_hq')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ events: data ?? [] })
  } catch (error) {
    return handleGenesisHqPermissionError(error)
  }
}
