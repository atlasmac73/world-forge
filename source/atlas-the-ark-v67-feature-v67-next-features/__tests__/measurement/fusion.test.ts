/**
 * ATLAS v67 — Measurement fusion + solar unit tests (pure math, no network)
 */
import { describe, it, expect } from 'vitest'
import { fuse, constraintFromKnownObject, feetFromMeters, metersFromFeet } from '@/lib/measurement/fusion'
import { fuseObservations } from '@/lib/measurement'
import { sunPosition, heightFromShadow, shadowFromHeight } from '@/lib/measurement/sun'

describe('fuse', () => {
  it('combines estimates and tightens uncertainty', () => {
    const r = fuse([
      { value: 30, sigma: 1, source: 'a' },
      { value: 32, sigma: 1, source: 'b' },
    ])
    expect(r.value).toBeCloseTo(31, 5)
    expect(r.sigma).toBeLessThan(1)            // fusion is tighter than any input
    expect(r.conflict).toBe(false)
  })

  it('weights the tighter source more', () => {
    const r = fuse([
      { value: 10, sigma: 5, source: 'loose' },
      { value: 20, sigma: 0.5, source: 'tight' },
    ])
    expect(r.value).toBeGreaterThan(19)        // pulled toward the tight one
  })

  it('flags conflict when sources strongly disagree', () => {
    const r = fuse([
      { value: 10, sigma: 0.2, source: 'a' },
      { value: 25, sigma: 0.2, source: 'b' },
    ])
    expect(r.conflict).toBe(true)
  })

  it('returns empty result for no valid constraints', () => {
    const r = fuse([{ value: NaN, sigma: 1, source: 'x' }])
    expect(r.confidence).toBe(0)
  })
})

describe('constraintFromKnownObject', () => {
  it('derives scale from a reference object', () => {
    // license plate (1 ft wide) spans 100px; target spans 1000px → ~10 ft
    const c = constraintFromKnownObject({
      objectKey: 'us_license_plate', referencePixels: 100, targetPixels: 1000, unit: 'ft',
    })!
    expect(c.value).toBeCloseTo(10, 1)
    expect(c.sigma).toBeGreaterThan(0)
  })
  it('returns null for an unknown object', () => {
    expect(constraintFromKnownObject({ objectKey: 'nope', referencePixels: 10, targetPixels: 10 })).toBeNull()
  })
})

describe('unit conversion', () => {
  it('round-trips ft<->m', () => {
    expect(metersFromFeet(feetFromMeters(5))).toBeCloseTo(5, 9)
    expect(feetFromMeters(1)).toBeCloseTo(3.28084, 4)
  })
})

describe('fuseObservations', () => {
  it('mixes a tape measure with a known-object estimate', () => {
    const r = fuseObservations([
      { type: 'manual', value: 32, unit: 'ft' },
      { type: 'known_object', objectKey: 'us_license_plate', referencePixels: 50, targetPixels: 1600 },
    ], 'ft')
    expect(r.value).toBeGreaterThan(30)
    expect(r.value).toBeLessThan(34)
    expect(r.confidence).toBeGreaterThan(0)
  })
})

describe('sun', () => {
  it('computes a plausible solar elevation at solar noon', () => {
    // Charleston WV, summer, ~17:00 UTC (~1pm local) → sun high
    const s = sunPosition(38.35, -81.63, new Date('2026-06-21T17:00:00Z'))
    expect(s.elevation_deg).toBeGreaterThan(40)
    expect(s.azimuth_deg).toBeGreaterThanOrEqual(0)
    expect(s.azimuth_deg).toBeLessThanOrEqual(360)
  })
  it('shadow/height are inverse at a given sun elevation', () => {
    const h = heightFromShadow(10, 45)   // 45° → height == shadow
    expect(h).toBeCloseTo(10, 6)
    expect(shadowFromHeight(10, 45)).toBeCloseTo(10, 6)
  })
})
