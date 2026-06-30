/**
 * ATLAS v67 — Enrichment → fusion constraints
 * Convert free public-data enrichment (OSM building footprint, NAIP aerial scale)
 * into measurement Observations so a single geolocated capture yields measurements
 * automatically — and so public data can be fused with a user's tape on the same
 * edge. Closes the "photo → measurement, no app" loop.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import type { Observation, Unit } from './index'
import { feetFromMeters } from './fusion'

const FT2_PER_M2 = 10.7639

interface BuildingFootprint {
  longest_edge_m?: number
  perimeter_m?: number
  area_m2?: number
  edges_m?: number[]
}
interface Enrichment {
  building?: { available?: boolean; building?: BuildingFootprint }
  naip?: { available?: boolean; meters_per_pixel?: number }
}

const toLen = (m: number, unit: Unit) => (unit === 'ft' ? feetFromMeters(m) : m)
const toArea = (m2: number, unit: Unit) => (unit === 'ft' ? m2 * FT2_PER_M2 : m2)

/**
 * Single estimate Observation for the OSM building's longest edge, in `unit`.
 * Used to fuse public footprint data with a user's tape on the same edge.
 * OSM footprints are ~±0.5 m; σ = max(0.5 m, 3% of length).
 */
export function footprintEdgeObservation(enrichment: Enrichment, unit: Unit): Observation | null {
  const b = enrichment.building
  if (!b?.available || !b.building?.longest_edge_m) return null
  const value = toLen(b.building.longest_edge_m, unit)
  const sigma = Math.max(toLen(0.5, unit), value * 0.03)
  return { type: 'estimate', value, sigma, source: 'OSM footprint (longest edge)', method: 'footprint', unit }
}

export interface DerivedMeasurement {
  label: string
  kind: 'length' | 'area'
  observation: Observation
}

/** All measurements we can derive directly from enrichment (no user input). */
export function footprintDerivedMeasurements(enrichment: Enrichment, unit: Unit): DerivedMeasurement[] {
  const b = enrichment.building
  if (!b?.available || !b.building) return []
  const fp = b.building
  const out: DerivedMeasurement[] = []

  if (fp.longest_edge_m) {
    const v = toLen(fp.longest_edge_m, unit)
    out.push({ label: 'Building longest edge (OSM)', kind: 'length',
      observation: { type: 'estimate', value: v, sigma: Math.max(toLen(0.5, unit), v * 0.03), source: 'OSM footprint', method: 'footprint', unit } })
  }
  if (fp.perimeter_m) {
    const v = toLen(fp.perimeter_m, unit)
    out.push({ label: 'Building perimeter (OSM)', kind: 'length',
      observation: { type: 'estimate', value: v, sigma: Math.max(toLen(1, unit), v * 0.03), source: 'OSM footprint', method: 'footprint', unit } })
  }
  if (fp.area_m2) {
    const v = toArea(fp.area_m2, unit)
    out.push({ label: 'Building footprint area (OSM)', kind: 'area',
      observation: { type: 'estimate', value: v, sigma: v * 0.05, source: 'OSM footprint', method: 'footprint', unit } })
  }
  return out
}
