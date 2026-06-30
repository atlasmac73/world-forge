/**
 * ATLAS v67 — Measurement fusion core
 * Combine many independent estimates of the SAME quantity, each with its own
 * uncertainty (σ), into one best estimate + error bar + confidence, and flag
 * when sources disagree. Inverse-variance (maximum-likelihood) weighting.
 *
 * This is the "bounce back and forth" engine: every method (tape, LiDAR, known
 * object, shadow, satellite, GPS) is just a Constraint; adding a tight one
 * tightens the whole result.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { getKnownObject } from './knownObjects'

export const M_PER_FT = 0.3048
export const feetFromMeters = (m: number) => m / M_PER_FT
export const metersFromFeet = (ft: number) => ft * M_PER_FT

export interface Constraint {
  value: number      // estimate of the target, in the result's unit
  sigma: number      // 1-σ uncertainty, same unit (must be > 0)
  source: string     // human label, e.g. "tape measure", "license plate scale"
  method?: string    // method family, e.g. "known_object", "shadow", "lidar"
}

export interface FusionResult {
  value: number
  sigma: number
  confidence: number                 // 0-100
  conflict: boolean
  reduced_chi_square: number
  sources: Array<Constraint & { weight: number; z: number }>
}

/**
 * Fuse constraints via inverse-variance weighting.
 * Conflict = any |z| > 3 (a source >3σ from consensus) or reduced χ² > 4.
 */
export function fuse(constraints: Constraint[]): FusionResult {
  const valid = constraints.filter(c => Number.isFinite(c.value) && c.sigma > 0)
  if (valid.length === 0) {
    return { value: NaN, sigma: Infinity, confidence: 0, conflict: false, reduced_chi_square: 0, sources: [] }
  }

  const weights = valid.map(c => 1 / (c.sigma * c.sigma))
  const wSum = weights.reduce((a, b) => a + b, 0)
  const value = valid.reduce((acc, c, i) => acc + weights[i] * c.value, 0) / wSum
  const sigma = Math.sqrt(1 / wSum)

  const chi2 = valid.reduce((acc, c, i) => acc + weights[i] * (c.value - value) ** 2, 0)
  const dof = Math.max(1, valid.length - 1)
  const reducedChi2 = chi2 / dof

  const sources = valid.map((c, i) => ({
    ...c,
    weight: weights[i] / wSum,
    z: (c.value - value) / c.sigma,
  }))
  const conflict = reducedChi2 > 4 || sources.some(s => Math.abs(s.z) > 3)

  // Confidence: precision (relative σ) × agreement × evidence breadth.
  const relSigma = Math.abs(value) > 1e-9 ? sigma / Math.abs(value) : 1
  const precision = clamp(1 - relSigma / 0.2, 0, 1)        // 0% relσ→1, ≥20%→0
  const agreement = conflict ? 0.4 : 1
  const breadth = 0.7 + 0.3 * Math.min(valid.length, 3) / 3
  const confidence = Math.round(100 * precision * agreement * breadth)

  return { value, sigma, confidence, conflict, reduced_chi_square: reducedChi2, sources }
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

/**
 * Build a constraint from a known reference object visible in the same image:
 * scale (units per pixel) = known_size / reference_pixels; target = target_pixels × scale.
 * σ propagates the object's real-world tolerance + an assumed pixel error.
 */
export function constraintFromKnownObject(args: {
  objectKey: string
  referencePixels: number
  targetPixels: number
  unit?: 'ft' | 'm'
  pixelError?: number        // 1-σ pixel measurement error (default 2px each)
}): Constraint | null {
  const obj = getKnownObject(args.objectKey)
  if (!obj || args.referencePixels <= 0) return null
  const unit = args.unit ?? 'ft'
  const sizeUnit = unit === 'ft' ? feetFromMeters(obj.size_m) : obj.size_m
  const tolUnit = unit === 'ft' ? feetFromMeters(obj.tolerance_m) : obj.tolerance_m

  const scale = sizeUnit / args.referencePixels        // unit per pixel
  const value = args.targetPixels * scale

  // Relative error: object tolerance ⊕ pixel error on both measurements.
  const px = args.pixelError ?? 2
  const relTol = tolUnit / sizeUnit
  const relRef = px / args.referencePixels
  const relTgt = px / Math.max(1, args.targetPixels)
  const relSigma = Math.sqrt(relTol ** 2 + relRef ** 2 + relTgt ** 2)

  return {
    value,
    sigma: Math.max(value * relSigma, 1e-4),
    source: `known object: ${obj.label}`,
    method: 'known_object',
  }
}

/**
 * Like constraintFromKnownObject but for a user-supplied custom reference object
 * (e.g. a 24x24 marker board). Caller passes the real-world size in meters.
 */
export function constraintFromCustomObject(args: {
  label: string
  sizeMeters: number
  toleranceMeters?: number
  referencePixels: number
  targetPixels: number
  unit?: 'ft' | 'm'
  pixelError?: number
}): Constraint | null {
  if (!(args.sizeMeters > 0) || args.referencePixels <= 0) return null
  const unit = args.unit ?? 'ft'
  const sizeUnit = unit === 'ft' ? feetFromMeters(args.sizeMeters) : args.sizeMeters
  const tolUnit = unit === 'ft' ? feetFromMeters(args.toleranceMeters ?? args.sizeMeters * 0.01) : (args.toleranceMeters ?? args.sizeMeters * 0.01)

  const scale = sizeUnit / args.referencePixels
  const value = args.targetPixels * scale

  const px = args.pixelError ?? 2
  const relTol = tolUnit / sizeUnit
  const relRef = px / args.referencePixels
  const relTgt = px / Math.max(1, args.targetPixels)
  const relSigma = Math.sqrt(relTol ** 2 + relRef ** 2 + relTgt ** 2)

  return {
    value,
    sigma: Math.max(value * relSigma, 1e-4),
    source: `custom object: ${args.label}`,
    method: 'custom_object',
  }
}
