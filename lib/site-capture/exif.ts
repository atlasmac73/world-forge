/**
 * ATLAS v67 — Server-side EXIF extraction (Level 1)
 * Uses exifr (pure JS) — NOT ExifTool, so it runs on serverless. Reads GPS,
 * timestamp, camera/lens, dimensions, orientation from HEIC/JPG/TIFF buffers.
 * SERVER ONLY.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import exifr from 'exifr'
import type { ParsedExif } from './packet'

function toNum(v: unknown): number | undefined {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number)
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined
}

/** Parse an image buffer into normalized EXIF. Never throws — returns {raw:{}}. */
export async function parseExif(buffer: Buffer | Uint8Array): Promise<ParsedExif> {
  let raw: Record<string, unknown> = {}
  try {
    // `true` = parse all segments/blocks (TIFF, EXIF, GPS, XMP, …).
    raw = (await exifr.parse(buffer, true)) as Record<string, unknown> ?? {}
  } catch {
    return { raw: {} }
  }

  const dt = raw.DateTimeOriginal ?? raw.CreateDate ?? raw.ModifyDate
  const captured_at = dt instanceof Date
    ? dt.toISOString()
    : typeof dt === 'string' ? dt : undefined

  const focal = toNum(raw.FocalLength)

  return {
    latitude: toNum(raw.latitude ?? raw.GPSLatitude),
    longitude: toNum(raw.longitude ?? raw.GPSLongitude),
    altitude_m: toNum(raw.GPSAltitude),
    captured_at,
    camera_model: (raw.Model as string) ?? undefined,
    lens_model: (raw.LensModel as string) ?? undefined,
    focal_length_mm: focal,
    image_width: toNum(raw.ExifImageWidth ?? raw.ImageWidth),
    image_height: toNum(raw.ExifImageHeight ?? raw.ImageHeight),
    orientation: toNum(raw.Orientation),
    raw,
  }
}
