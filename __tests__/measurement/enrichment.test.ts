/**
 * ATLAS v67 — enrichment → constraints unit tests
 */
import { describe, it, expect } from 'vitest'
import { footprintEdgeObservation, footprintDerivedMeasurements } from '@/lib/measurement/enrichmentConstraints'
import { fuseObservations } from '@/lib/measurement'

const enrichment = {
  building: { available: true, building: { longest_edge_m: 10, perimeter_m: 40, area_m2: 100 } },
}

describe('footprintEdgeObservation', () => {
  it('converts the longest edge to a fusion observation', () => {
    const obs = footprintEdgeObservation(enrichment, 'ft')!
    expect(obs.type).toBe('estimate')
    if (obs.type === 'estimate') {
      expect(obs.value).toBeCloseTo(32.81, 1)   // 10 m → ft
      expect(obs.sigma).toBeGreaterThan(0)
      expect(obs.method).toBe('footprint')
    }
  })
  it('returns null without a building', () => {
    expect(footprintEdgeObservation({}, 'ft')).toBeNull()
  })
})

describe('footprintDerivedMeasurements', () => {
  it('derives edge, perimeter, and area', () => {
    const d = footprintDerivedMeasurements(enrichment, 'ft')
    expect(d.map(x => x.kind)).toEqual(expect.arrayContaining(['length', 'area']))
    const area = d.find(x => x.kind === 'area')!
    if (area.observation.type === 'estimate') {
      expect(area.observation.value).toBeCloseTo(1076.39, 0)   // 100 m² → ft²
    }
  })
  it('footprint edge fuses with a tape (tightens + consensus)', () => {
    const edge = footprintEdgeObservation(enrichment, 'ft')!
    const fused = fuseObservations([{ type: 'manual', value: 33, unit: 'ft' }, edge], 'ft')
    expect(fused.value).toBeGreaterThan(32)
    expect(fused.value).toBeLessThan(34)
    expect(fused.conflict).toBe(false)
  })
})
