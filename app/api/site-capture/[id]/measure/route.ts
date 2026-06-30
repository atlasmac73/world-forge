/**
 * ATLAS v67 — Site Capture: fuse a measurement
 * POST /api/site-capture/[id]/measure
 * Body: { label, kind?, unit?, observations: Observation[] }
 * Fuses all observations into one measurement with confidence + provenance,
 * stores it, and returns it. Owner/admin only.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireUser, requireAdmin } from '@/lib/permissions'
import { writeAuditLog } from '@/lib/audit/logger'
import { fuseObservations, type Observation, type Unit } from '@/lib/measurement'
import { footprintEdgeObservation } from '@/lib/measurement/enrichmentConstraints'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const body = await req.json().catch(() => null)
  const label: string = (body?.label ?? '').trim()
  const unit: Unit = body?.unit === 'm' ? 'm' : 'ft'
  const kind: string = body?.kind ?? 'length'
  const observations: Observation[] = Array.isArray(body?.observations) ? body.observations : []

  if (!label) return NextResponse.json({ ok: false, error: 'label is required' }, { status: 400 })

  const supabase = createServiceClient()

  // Optionally pull the OSM footprint's longest edge into the fusion as an
  // independent constraint (so public data + a user's tape cross-check).
  const allObs: Observation[] = [...observations]
  if (body?.includeFootprintEdge) {
    const { data: cap } = await supabase.from('site_captures').select('enrichment').eq('id', params.id).single()
    const fpObs = footprintEdgeObservation((cap?.enrichment ?? {}) as Record<string, never>, unit)
    if (fpObs) allObs.push(fpObs)
  }

  if (allObs.length === 0) {
    return NextResponse.json({ ok: false, error: 'at least one observation is required' }, { status: 400 })
  }

  const result = fuseObservations(allObs, unit)
  if (!Number.isFinite(result.value)) {
    return NextResponse.json({ ok: false, error: 'No valid observations to fuse' }, { status: 400 })
  }

  const { data, error } = await supabase.from('measurements').insert({
    capture_id: params.id,
    label, kind, unit,
    value: result.value,
    sigma: result.sigma,
    confidence: result.confidence,
    conflict: result.conflict,
    source_provenance: result.sources,
    created_by: user.id,
  }).select('*').single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  await writeAuditLog({
    user_id: user.id, action: 'SITE_MEASUREMENT_RUN',
    resource_type: 'measurements', resource_id: data.id,
    metadata: { label, value: result.value, unit, confidence: result.confidence, conflict: result.conflict, sources: result.sources.length },
  })

  return NextResponse.json({ ok: true, measurement: data, fusion: result })
}
