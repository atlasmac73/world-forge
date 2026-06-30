/**
 * ATLAS v67 — geo math + recommender unit tests (pure, no network)
 */
import { describe, it, expect } from 'vitest'
import {
  haversineMeters, polygonEdgesMeters, polygonAreaMeters2, pointInRing,
  bboxAround, metersPerPixel,
} from '@/lib/measurement/geo'
import { recommendNextCaptures, type CaptureContext, type MeasurementSummary } from '@/lib/measurement/recommend'

const LAT = 38.0, LON = -81.0
const dLat = 10 / 111320
const dLon = 10 / (111320 * Math.cos((LAT * Math.PI) / 180))
const square = [
  { lat: LAT, lon: LON },
  { lat: LAT + dLat, lon: LON },
  { lat: LAT + dLat, lon: LON + dLon },
  { lat: LAT, lon: LON + dLon },
]

describe('geo', () => {
  it('haversine ~111 m for 0.001° latitude', () => {
    expect(haversineMeters({ lat: 0, lon: 0 }, { lat: 0.001, lon: 0 })).toBeCloseTo(111.2, 0)
  })
  it('square edges are ~10 m', () => {
    const edges = polygonEdgesMeters(square)
    expect(edges).toHaveLength(4)
    edges.forEach(e => expect(e).toBeGreaterThan(9.5))
    edges.forEach(e => expect(e).toBeLessThan(10.5))
  })
  it('square area is ~100 m²', () => {
    expect(polygonAreaMeters2(square)).toBeGreaterThan(95)
    expect(polygonAreaMeters2(square)).toBeLessThan(105)
  })
  it('point-in-ring works', () => {
    expect(pointInRing({ lat: LAT + dLat / 2, lon: LON + dLon / 2 }, square)).toBe(true)
    expect(pointInRing({ lat: LAT + 1, lon: LON + 1 }, square)).toBe(false)
  })
  it('bbox is symmetric and m/px scales', () => {
    const b = bboxAround(LAT, LON, 60)
    expect(b.north - LAT).toBeCloseTo(LAT - b.south, 9)
    expect(metersPerPixel(120, 1024)).toBeCloseTo(0.1172, 3)
  })
})

describe('recommender', () => {
  const baseCtx: CaptureContext = { hasLocation: true, anyAssetHasGps: true, hasNaip: false, hasBuilding: false, assetCount: 5 }

  it('prioritizes breaking a conflict', () => {
    const ms: MeasurementSummary[] = [{ label: 'pool', confidence: 60, conflict: true, sourceCount: 2 }]
    const recs = recommendNextCaptures(baseCtx, ms)
    expect(recs[0].expected_gain).toBe('high')
    expect(recs[0].action.toLowerCase()).toContain('re-measure')
  })

  it('flags single-source measurements', () => {
    const ms: MeasurementSummary[] = [{ label: 'edge', confidence: 80, conflict: false, sourceCount: 1 }]
    const recs = recommendNextCaptures(baseCtx, ms)
    expect(recs.some(r => r.action.includes('2nd independent method'))).toBe(true)
  })

  it('demands GPS when missing', () => {
    const ctx: CaptureContext = { ...baseCtx, hasLocation: false, anyAssetHasGps: false }
    const recs = recommendNextCaptures(ctx, [])
    expect(recs.some(r => r.method === 'gps' && r.expected_gain === 'high')).toBe(true)
  })

  it('sorts high-gain first', () => {
    const ms: MeasurementSummary[] = [{ label: 'a', confidence: 40, conflict: false, sourceCount: 3 }]
    const recs = recommendNextCaptures({ ...baseCtx, assetCount: 1 }, ms)
    const ranks = recs.map(r => r.expected_gain)
    const order = { high: 3, medium: 2, low: 1 }
    for (let i = 1; i < ranks.length; i++) {
      expect(order[ranks[i - 1]]).toBeGreaterThanOrEqual(order[ranks[i]])
    }
  })
})
