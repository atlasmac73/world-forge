/**
 * ATLAS v67 — Site Capture: auto-measure from public data
 * POST /api/site-capture/[id]/auto-measure
 * Derives measurements directly from the capture's enrichment (OSM building
 * footprint: longest edge, perimeter, area) with no user input, and stores them.
 * Owner/admin only.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireUser, requireAdmin } from '@/lib/permissions'
import { writeAuditLog } from '@/lib/audit/logger'
import { fuseObservations, type Unit } from '@/lib/measurement'
import { footprintDerivedMeasurements } from '@/lib/measurement/enrichmentConstraints'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const body = await req.json().catch(() => ({}))
  const unit: Unit = body?.unit === 'm' ? 'm' : 'ft'

  const supabase = createServiceClient()
  const { data: capture } = await supabase
    .from('site_captures').select('enrichment').eq('id', params.id).single()

  const derived = footprintDerivedMeasurements((capture?.enrichment ?? {}) as Record<string, never>, unit)
  if (derived.length === 0) {
    return NextResponse.json({
      ok: false,
      error: 'No public footprint data to derive from. Add a GPS-tagged photo, or no OSM building exists here.',
    }, { status: 400 })
  }

  const created = []
  for (const d of derived) {
    const result = fuseObservations([d.observation], unit)
    const { data } = await supabase.from('measurements').insert({
      capture_id: params.id,
      label: d.label,
      kind: d.kind,
      unit: d.kind === 'area' ? `${unit}2` : unit,
      value: result.value,
      sigma: result.sigma,
      confidence: result.confidence,
      conflict: result.conflict,
      source_provenance: result.sources,
      created_by: user.id,
    }).select('*').single()
    if (data) created.push(data)
  }

  await writeAuditLog({
    user_id: user.id, action: 'SITE_MEASUREMENT_RUN',
    resource_type: 'site_captures', resource_id: params.id,
    metadata: { auto: true, derived: created.length },
  })

  return NextResponse.json({ ok: true, created })
}
