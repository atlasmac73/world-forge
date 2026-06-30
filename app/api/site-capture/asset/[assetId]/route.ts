/**
 * ATLAS v67 — Site Capture asset access + re-analysis
 * GET  /api/site-capture/asset/[assetId]  → short-lived signed download URL
 * POST /api/site-capture/asset/[assetId]  → re-download stored bytes, re-parse
 *      EXIF, update the asset (useful when extraction logic improves).
 * Owner/admin only.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireUser, requireAdmin } from '@/lib/permissions'
import { parseExif } from '@/lib/site-capture/exif'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BUCKET = 'site-captures'

export async function GET(_req: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const supabase = createServiceClient()
  const { data: asset } = await supabase
    .from('capture_assets').select('storage_ref').eq('id', (await params).assetId).single()
  if (!asset?.storage_ref) {
    return NextResponse.json({ ok: false, error: 'No stored file for this asset' }, { status: 404 })
  }
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(asset.storage_ref, 300)
  if (error || !data) return NextResponse.json({ ok: false, error: error?.message ?? 'sign failed' }, { status: 500 })
  return NextResponse.json({ ok: true, url: data.signedUrl, expires_in: 300 })
}

export async function POST(_req: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const supabase = createServiceClient()
  const { data: asset } = await supabase
    .from('capture_assets').select('id, storage_ref').eq('id', (await params).assetId).single()
  if (!asset?.storage_ref) {
    return NextResponse.json({ ok: false, error: 'No stored file to re-analyze' }, { status: 404 })
  }

  const dl = await supabase.storage.from(BUCKET).download(asset.storage_ref)
  if (dl.error || !dl.data) {
    return NextResponse.json({ ok: false, error: dl.error?.message ?? 'download failed' }, { status: 500 })
  }
  const buf = Buffer.from(await dl.data.arrayBuffer())
  const exif = await parseExif(buf)

  const { data: updated, error } = await supabase.from('capture_assets').update({
    exif: exif.raw,
    latitude: exif.latitude ?? null,
    longitude: exif.longitude ?? null,
    altitude_m: exif.altitude_m ?? null,
    captured_at: exif.captured_at ?? null,
    camera_model: exif.camera_model ?? null,
    lens_model: exif.lens_model ?? null,
    focal_length_mm: exif.focal_length_mm ?? null,
    image_width: exif.image_width ?? null,
    image_height: exif.image_height ?? null,
    orientation: exif.orientation ?? null,
  }).eq('id', asset.id).select('id, filename, latitude, longitude, camera_model, focal_length_mm').single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, asset: updated })
}
