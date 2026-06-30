/**
 * ATLAS v67 — Site Capture: location enrichment
 * GET /api/site-capture/enrich?lat=..&lon=..
 * Pulls free public data (USGS elevation, Census geo, parcel if keyed) for a
 * point. Owner/admin only. Useful standalone and reused by ingest.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUser, requireAdmin } from '@/lib/permissions'
import { enrichLocation } from '@/lib/site-capture/connectors'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const lat = parseFloat(req.nextUrl.searchParams.get('lat') ?? '')
  const lon = parseFloat(req.nextUrl.searchParams.get('lon') ?? '')
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ ok: false, error: 'valid lat & lon required' }, { status: 400 })
  }

  const enrichment = await enrichLocation(lat, lon)
  return NextResponse.json({ ok: true, enrichment })
}
