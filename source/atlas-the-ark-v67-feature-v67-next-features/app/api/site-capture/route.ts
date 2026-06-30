/**
 * ATLAS v67 — Site Capture: ingest + list
 * GET  /api/site-capture           → list captures
 * GET  /api/site-capture?id=...     → one capture with assets + measurements
 * POST /api/site-capture            → multipart upload: parse EXIF, enrich, store
 * Owner/admin only.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireUser, requireAdmin } from '@/lib/permissions'
import { writeAuditLog } from '@/lib/audit/logger'
import { parseExif } from '@/lib/site-capture/exif'
import type { ParsedExif } from '@/lib/site-capture/packet'
import { enrichLocation } from '@/lib/site-capture/connectors'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/** Classify an uploaded asset by extension/MIME so scans + docs are stored
 *  (not EXIF-parsed) and badged in the UI. */
function classifyAsset(filename: string, mime: string): string {
  const ext = filename.toLowerCase().split('.').pop() ?? ''
  if (['usdz', 'obj', 'ply', 'glb', 'gltf', 'drc', 'e57', 'las', 'laz'].includes(ext)) return 'lidar_scan'
  if (ext === 'zip') return 'lidar_scan'        // scan-app exports are commonly zipped
  if (ext === 'pdf') return 'document'
  if (mime.startsWith('video')) return 'video'
  return 'image'
}

export async function GET(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const supabase = createServiceClient()
  const id = req.nextUrl.searchParams.get('id')

  if (id) {
    const { data: capture } = await supabase.from('site_captures').select('*').eq('id', id).single()
    const { data: assets } = await supabase.from('capture_assets').select('*')
      .eq('capture_id', id).order('created_at', { ascending: true })
    const { data: measurements } = await supabase.from('measurements').select('*')
      .eq('capture_id', id).order('created_at', { ascending: false })
    return NextResponse.json({ ok: true, capture, assets: assets ?? [], measurements: measurements ?? [] })
  }

  const { data, error } = await supabase
    .from('site_captures')
    .select('id, title, latitude, longitude, status, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, captures: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ ok: false, error: 'multipart/form-data required' }, { status: 400 })

  const title = String(form.get('title') ?? '').trim() || 'Untitled capture'
  const notes = form.get('notes') ? String(form.get('notes')) : null
  const files = form.getAll('files').filter((f): f is File => f instanceof File)

  const supabase = createServiceClient()

  // Create the capture shell.
  const { data: capture, error: capErr } = await supabase
    .from('site_captures')
    .insert({ title, notes, created_by: user.id })
    .select('id').single()
  if (capErr || !capture) {
    return NextResponse.json({ ok: false, error: capErr?.message ?? 'Failed to create capture' }, { status: 500 })
  }
  const captureId = capture.id as string

  // Parse each file's EXIF and store an asset row.
  let lat: number | undefined
  let lon: number | undefined
  let gpsAcc: number | undefined
  const assetSummaries: Array<Record<string, unknown>> = []

  for (const file of files) {
    const buf = Buffer.from(await file.arrayBuffer())
    const mediaType = classifyAsset(file.name, file.type)
    // Only images carry EXIF; scans/docs parse to {} harmlessly.
    const exif: ParsedExif = mediaType === 'image' ? await parseExif(buf) : { raw: {} }
    if (lat == null && exif.latitude != null && exif.longitude != null) {
      lat = exif.latitude; lon = exif.longitude
      gpsAcc = typeof exif.raw.GPSHPositioningError === 'number' ? exif.raw.GPSHPositioningError as number : undefined
    }
    const { data: asset } = await supabase.from('capture_assets').insert({
      capture_id: captureId,
      filename: file.name,
      media_type: mediaType,
      has_mesh: mediaType === 'lidar_scan',
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
    }).select('id, filename, latitude, longitude, captured_at, camera_model, focal_length_mm').single()
    if (asset) {
      // Persist the original bytes so the asset can be re-analyzed later.
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${captureId}/${asset.id}-${safe}`
      const up = await supabase.storage.from('site-captures')
        .upload(path, buf, { contentType: file.type || 'application/octet-stream', upsert: true })
      if (!up.error) {
        await supabase.from('capture_assets').update({ storage_ref: path }).eq('id', asset.id)
      }
      assetSummaries.push(asset)
    }
  }

  // Allow explicit lat/lon override from the form.
  const formLat = form.get('lat') ? parseFloat(String(form.get('lat'))) : undefined
  const formLon = form.get('lon') ? parseFloat(String(form.get('lon'))) : undefined
  if (formLat != null && Number.isFinite(formLat)) lat = formLat
  if (formLon != null && Number.isFinite(formLon)) lon = formLon

  // Enrich from free public data if we have a location.
  let enrichment: Record<string, unknown> = {}
  if (lat != null && lon != null) {
    try {
      enrichment = (await enrichLocation(lat, lon)) as unknown as Record<string, unknown>
    } catch { /* best-effort */ }
  }

  await supabase.from('site_captures').update({
    latitude: lat ?? null, longitude: lon ?? null, gps_accuracy_m: gpsAcc ?? null,
    enrichment, updated_at: new Date().toISOString(),
  }).eq('id', captureId)

  await writeAuditLog({
    user_id: user.id, action: 'SITE_CAPTURE_INGEST',
    resource_type: 'site_captures', resource_id: captureId,
    metadata: { files: files.length, hasLocation: lat != null },
  })

  return NextResponse.json({
    ok: true, captureId, assets: assetSummaries,
    location: lat != null ? { lat, lon } : null, enrichment,
  })
}
