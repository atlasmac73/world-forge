/**
 * ATLAS v67 — Geospatial math helpers (pure, no network)
 * Used by the external connectors (footprint dims, aerial scale) and fusion.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

export interface LatLon { lat: number; lon: number }

const R_EARTH_M = 6371008.8
const rad = (d: number) => (d * Math.PI) / 180

/** Great-circle distance between two lat/lon points, in meters. */
export function haversineMeters(a: LatLon, b: LatLon): number {
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R_EARTH_M * Math.asin(Math.min(1, Math.sqrt(s)))
}

/** Edge lengths (meters) of a polygon ring (open or closed). */
export function polygonEdgesMeters(ring: LatLon[]): number[] {
  if (ring.length < 2) return []
  const edges: number[] = []
  for (let i = 0; i < ring.length - 1; i++) {
    edges.push(haversineMeters(ring[i], ring[i + 1]))
  }
  // close the ring if not already closed
  const first = ring[0], last = ring[ring.length - 1]
  if (first.lat !== last.lat || first.lon !== last.lon) {
    edges.push(haversineMeters(last, first))
  }
  return edges
}

/** Planar area (m²) of a lat/lon ring via local equirectangular projection. */
export function polygonAreaMeters2(ring: LatLon[]): number {
  if (ring.length < 3) return 0
  const lat0 = rad(ring.reduce((s, p) => s + p.lat, 0) / ring.length)
  const pts = ring.map(p => ({
    x: rad(p.lon) * Math.cos(lat0) * R_EARTH_M,
    y: rad(p.lat) * R_EARTH_M,
  }))
  let area = 0
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length
    area += pts[i].x * pts[j].y - pts[j].x * pts[i].y
  }
  return Math.abs(area) / 2
}

/** Ray-casting point-in-polygon test. */
export function pointInRing(pt: LatLon, ring: LatLon[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].lon, yi = ring[i].lat
    const xj = ring[j].lon, yj = ring[j].lat
    const intersect = (yi > pt.lat) !== (yj > pt.lat) &&
      pt.lon < ((xj - xi) * (pt.lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

/** Degrees-bbox around a point given a half-size in meters. */
export function bboxAround(lat: number, lon: number, halfMeters: number) {
  const dLat = halfMeters / 111320
  const dLon = halfMeters / (111320 * Math.cos(rad(lat)) || 1e-6)
  return { west: lon - dLon, south: lat - dLat, east: lon + dLon, north: lat + dLat, halfMeters }
}

/** Ground-sample-distance (meters per pixel) for a square box rendered to N px. */
export function metersPerPixel(boxMeters: number, imagePx: number): number {
  return imagePx > 0 ? boxMeters / imagePx : 0
}

/** Centroid of a lat/lon ring. */
export function centroid(ring: LatLon[]): LatLon {
  const n = ring.length || 1
  return {
    lat: ring.reduce((s, p) => s + p.lat, 0) / n,
    lon: ring.reduce((s, p) => s + p.lon, 0) / n,
  }
}
