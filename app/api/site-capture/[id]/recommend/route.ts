/**
 * ATLAS v67 — Site Capture: next-best-capture recommender
 * GET /api/site-capture/[id]/recommend
 * Reads the capture's data + measurement confidences and suggests the captures
 * that would most reduce uncertainty. Owner/admin only.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireUser, requireAdmin } from '@/lib/permissions'
import { recommendNextCaptures, type CaptureContext, type MeasurementSummary } from '@/lib/measurement/recommend'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const supabase = createServiceClient()
  const { data: capture } = await supabase
    .from('site_captures').select('latitude, enrichment').eq('id', params.id).single()
  const { data: assets } = await supabase
    .from('capture_assets').select('latitude').eq('capture_id', params.id)
  const { data: measurements } = await supabase
    .from('measurements').select('label, confidence, conflict, source_provenance').eq('capture_id', params.id)

  const enrichment = (capture?.enrichment ?? {}) as {
    naip?: { available?: boolean }; building?: { available?: boolean }
  }
  const ctx: CaptureContext = {
    hasLocation: capture?.latitude != null,
    anyAssetHasGps: (assets ?? []).some(a => a.latitude != null),
    hasNaip: Boolean(enrichment.naip?.available),
    hasBuilding: Boolean(enrichment.building?.available),
    assetCount: (assets ?? []).length,
  }
  const summaries: MeasurementSummary[] = (measurements ?? []).map(m => ({
    label: m.label,
    confidence: m.confidence,
    conflict: Boolean(m.conflict),
    sourceCount: Array.isArray(m.source_provenance) ? m.source_provenance.length : 0,
  }))

  return NextResponse.json({ ok: true, context: ctx, recommendations: recommendNextCaptures(ctx, summaries) })
}
