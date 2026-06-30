/**
 * ATLAS v67 — custom known-object + new field-trial anchors
 */
import { describe, it, expect } from 'vitest'
import { constraintFromCustomObject } from '@/lib/measurement/fusion'
import { fuseObservations } from '@/lib/measurement'
import { getKnownObject } from '@/lib/measurement/knownObjects'

describe('constraintFromCustomObject', () => {
  it('scales a target from a user-supplied object size', () => {
    // 24in marker board spans 120px; target spans 600px → 5 × 24in = 120in = 10 ft
    const c = constraintFromCustomObject({
      label: '24x24 marker board', sizeMeters: 24 * 0.0254,
      referencePixels: 120, targetPixels: 600, unit: 'ft',
    })!
    expect(c.value).toBeCloseTo(10, 1)
    expect(c.method).toBe('custom_object')
  })
  it('returns null for non-positive size', () => {
    expect(constraintFromCustomObject({ label: 'x', sizeMeters: 0, referencePixels: 10, targetPixels: 10 })).toBeNull()
  })
})

describe('custom_object observation fuses with a tape', () => {
  it('agrees and tightens', () => {
    const r = fuseObservations([
      { type: 'manual', value: 10, unit: 'ft' },
      { type: 'custom_object', label: 'marker board', sizeValue: 24, sizeUnit: 'in', referencePixels: 120, targetPixels: 600 },
    ], 'ft')
    expect(r.value).toBeGreaterThan(9.5)
    expect(r.value).toBeLessThan(10.5)
    expect(r.conflict).toBe(false)
  })
})

describe('new field-trial known objects exist', () => {
  it('includes the 4-ft level and fence panels', () => {
    expect(getKnownObject('four_ft_level')?.size_m).toBeCloseTo(1.2192, 4)
    expect(getKnownObject('fence_panel_6ft')?.size_m).toBeCloseTo(1.8288, 4)
    expect(getKnownObject('fence_panel_8ft')?.size_m).toBeCloseTo(2.4384, 4)
  })
})
