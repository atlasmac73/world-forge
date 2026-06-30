/**
 * ATLAS v67 — Measurement orchestrator
 * Converts heterogeneous "observations" (tape, known-object pixels, shadow,
 * LiDAR/AR estimates, etc.) into uniform Constraints and fuses them into one
 * measurement with confidence. This is the entry point the /measure API calls.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { fuse, constraintFromKnownObject, constraintFromCustomObject, feetFromMeters, metersFromFeet, type Constraint, type FusionResult } from './fusion'
import { heightFromShadow } from './sun'

export type Unit = 'ft' | 'm'
export type SizeUnit = 'in' | 'ft' | 'm'

const SIZE_TO_M: Record<SizeUnit, number> = { in: 0.0254, ft: 0.3048, m: 1 }

export type Observation =
  | { type: 'manual'; value: number; unit?: Unit; sigma?: number; source?: string }
  | { type: 'estimate'; value: number; unit?: Unit; sigma: number; source: string; method?: string }
  | { type: 'known_object'; objectKey: string; referencePixels: number; targetPixels: number; pixelError?: number }
  | { type: 'custom_object'; label: string; sizeValue: number; sizeUnit?: SizeUnit; referencePixels: number; targetPixels: number; toleranceValue?: number; pixelError?: number }
  | { type: 'shadow'; shadowLength: number; unit?: Unit; sunElevationDeg: number; sigmaPct?: number }

function toUnit(value: number, from: Unit, to: Unit): number {
  if (from === to) return value
  return to === 'ft' ? feetFromMeters(value) : metersFromFeet(value)
}

/** Turn one observation into a Constraint in the result unit (or null if invalid). */
export function observationToConstraint(obs: Observation, resultUnit: Unit): Constraint | null {
  switch (obs.type) {
    case 'manual': {
      const u = obs.unit ?? resultUnit
      const value = toUnit(obs.value, u, resultUnit)
      // Tape/direct: default ±0.02 ft (~1/4 inch) unless caller overrides.
      const sigma = obs.sigma != null ? toUnit(obs.sigma, u, resultUnit) : (resultUnit === 'ft' ? 0.02 : 0.006)
      return { value, sigma: Math.max(sigma, 1e-4), source: obs.source ?? 'tape / manual', method: 'manual' }
    }
    case 'estimate': {
      const u = obs.unit ?? resultUnit
      return {
        value: toUnit(obs.value, u, resultUnit),
        sigma: Math.max(toUnit(obs.sigma, u, resultUnit), 1e-4),
        source: obs.source,
        method: obs.method ?? 'estimate',
      }
    }
    case 'known_object':
      return constraintFromKnownObject({ ...obs, unit: resultUnit })
    case 'custom_object': {
      const su = obs.sizeUnit ?? 'in'
      return constraintFromCustomObject({
        label: obs.label,
        sizeMeters: obs.sizeValue * SIZE_TO_M[su],
        toleranceMeters: obs.toleranceValue != null ? obs.toleranceValue * SIZE_TO_M[su] : undefined,
        referencePixels: obs.referencePixels,
        targetPixels: obs.targetPixels,
        unit: resultUnit,
        pixelError: obs.pixelError,
      })
    }
    case 'shadow': {
      const u = obs.unit ?? resultUnit
      const h = heightFromShadow(obs.shadowLength, obs.sunElevationDeg)
      const value = toUnit(h, u, resultUnit)
      return {
        value,
        sigma: Math.max(Math.abs(value) * (obs.sigmaPct ?? 0.1), 1e-4),
        source: `shadow @ ${obs.sunElevationDeg.toFixed(1)}° sun`,
        method: 'shadow',
      }
    }
    default:
      return null
  }
}

export function fuseObservations(observations: Observation[], resultUnit: Unit = 'ft'): FusionResult {
  const constraints = observations
    .map(o => observationToConstraint(o, resultUnit))
    .filter((c): c is Constraint => c !== null)
  return fuse(constraints)
}
