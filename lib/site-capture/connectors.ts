/**
 * ATLAS v67 — Site Capture external data connectors
 * Pull free public data for a lat/lon to enrich/constrain measurements.
 * Keyless sources work out of the box; keyed (parcel) sources are gated and
 * report unavailable rather than failing — same pattern as tournament providers.
 * SERVER ONLY.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import {
  bboxAround, metersPerPixel, pointInRing, haversineMeters,
  centroid, polygonEdgesMeters, polygonAreaMeters2,
} from '@/lib/measurement/geo'

async function getJson(url: string, ms = 8000): Promise<unknown | null> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

/** USGS EPQS — bare-earth elevation at a point (meters). Free, keyless. */
export async function usgsElevation(lat: number, lon: number): Promise<{ elevation_m: number | null }> {
  const url = `https://epqs.nationalmap.gov/v1/json?x=${lon}&y=${lat}&units=Meters&wkid=4326&includeDate=false`
  const j = (await getJson(url)) as { value?: unknown; elevation?: unknown } | null
  const raw = j?.value ?? j?.elevation
  const n = typeof raw === 'string' ? parseFloat(raw) : (raw as number)
  return { elevation_m: typeof n === 'number' && Number.isFinite(n) ? n : null }
}

/** US Census Geocoder — reverse geocode to state/county/tract. Free, keyless. */
export async function censusReverseGeocode(
  lat: number, lon: number
): Promise<{ state?: string; county?: string; tract?: string } | null> {
  const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lon}&y=${lat}` +
    `&benchmark=Public_AR_Current&vintage=Current_Current&format=json&layers=all`
  const j = (await getJson(url)) as
    | { result?: { geographies?: Record<string, Array<Record<string, string>>> } }
    | null
  const geos = j?.result?.geographies
  if (!geos) return null
  const states = geos['States']?.[0]
  const counties = geos['Counties']?.[0]
  const tracts = geos['Census Tracts']?.[0]
  return {
    state: states?.NAME,
    county: counties?.NAME,
    tract: tracts?.NAME,
  }
}

/** Parcel lookup — gated behind a provider key (e.g. Regrid). Honest when off. */
export async function parcelLookup(
  lat: number, lon: number
): Promise<{ available: boolean; parcel?: Record<string, unknown>; reason?: string }> {
  const token = process.env.REGRID_API_TOKEN
  if (!token) {
    return { available: false, reason: 'Parcel connector not configured (REGRID_API_TOKEN missing)' }
  }
  const url = `https://app.regrid.com/api/v2/parcels/point?lat=${lat}&lon=${lon}&token=${token}`
  const j = (await getJson(url)) as { parcels?: { features?: Array<{ properties?: Record<string, unknown> }> } } | null
  const props = j?.parcels?.features?.[0]?.properties
  return props ? { available: true, parcel: props } : { available: false, reason: 'No parcel found' }
}

/**
 * USGS NAIP aerial imagery (export a tile around the point). Free, keyless.
 * Returns an image href + the bbox + meters-per-pixel (the scale anchor: a
 * known ground-sample-distance lets pixels in the aerial map to real meters).
 */
export async function usgsNaipImage(
  lat: number, lon: number, halfMeters = 60, sizePx = 1024
): Promise<{ available: boolean; href?: string; bbox?: number[]; meters_per_pixel?: number; reason?: string }> {
  const b = bboxAround(lat, lon, halfMeters)
  const url = `https://services.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer/exportImage` +
    `?bbox=${b.west},${b.south},${b.east},${b.north}&bboxSR=4326&imageSR=4326` +
    `&size=${sizePx},${sizePx}&format=jpgpng&f=json`
  const j = (await getJson(url)) as { href?: string; width?: number } | null
  if (!j?.href) return { available: false, reason: 'NAIP tile unavailable for this point' }
  return {
    available: true,
    href: j.href,
    bbox: [b.west, b.south, b.east, b.north],
    meters_per_pixel: metersPerPixel(2 * halfMeters, sizePx),
  }
}

/**
 * OSM building footprint via Overpass (free, keyless, rate-limited). Finds the
 * building polygon at/nearest the point and returns metric edge lengths + area —
 * real measurement constraints for the no-app path.
 */
export async function osmBuildingFootprint(
  lat: number, lon: number, radiusM = 40
): Promise<{ available: boolean; building?: { id: number; edges_m: number[]; perimeter_m: number; area_m2: number; longest_edge_m: number }; reason?: string }> {
  const q = `[out:json][timeout:25];way["building"](around:${radiusM},${lat},${lon});out geom;`
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`
  const j = (await getJson(url, 25000)) as
    | { elements?: Array<{ id: number; geometry?: Array<{ lat: number; lon: number }> }> }
    | null
  const ways = (j?.elements ?? []).filter(e => (e.geometry?.length ?? 0) >= 3)
  if (ways.length === 0) return { available: false, reason: 'No OSM building near this point' }

  // Prefer the polygon containing the point; else nearest centroid.
  const pt = { lat, lon }
  let chosen = ways.find(w => pointInRing(pt, w.geometry!))
  if (!chosen) {
    chosen = ways.reduce((best, w) => {
      const d = haversineMeters(pt, centroid(w.geometry!))
      const bd = haversineMeters(pt, centroid(best.geometry!))
      return d < bd ? w : best
    })
  }
  const ring = chosen.geometry!
  const edges = polygonEdgesMeters(ring)
  return {
    available: true,
    building: {
      id: chosen.id,
      edges_m: edges.map(e => Math.round(e * 100) / 100),
      perimeter_m: Math.round(edges.reduce((a, b) => a + b, 0) * 100) / 100,
      area_m2: Math.round(polygonAreaMeters2(ring) * 100) / 100,
      longest_edge_m: Math.round(Math.max(...edges) * 100) / 100,
    },
  }
}

export interface LocationEnrichment {
  elevation_m: number | null
  geo: { state?: string; county?: string; tract?: string } | null
  parcel: { available: boolean; reason?: string; parcel?: Record<string, unknown> }
  naip: Awaited<ReturnType<typeof usgsNaipImage>>
  building: Awaited<ReturnType<typeof osmBuildingFootprint>>
  fetched_at: string
}

/** Orchestrate all available connectors for a lat/lon (best-effort, parallel). */
export async function enrichLocation(lat: number, lon: number): Promise<LocationEnrichment> {
  const [elev, geo, parcel, naip, building] = await Promise.all([
    usgsElevation(lat, lon),
    censusReverseGeocode(lat, lon),
    parcelLookup(lat, lon),
    usgsNaipImage(lat, lon).catch(() => ({ available: false as const, reason: 'error' })),
    osmBuildingFootprint(lat, lon).catch(() => ({ available: false as const, reason: 'error' })),
  ])
  return {
    elevation_m: elev.elevation_m,
    geo,
    parcel,
    naip,
    building,
    fetched_at: new Date().toISOString(),
  }
}
