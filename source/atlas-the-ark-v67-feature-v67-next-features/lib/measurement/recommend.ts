/**
 * ATLAS v67 — Active-sensing recommender
 * Given the current state of a capture (what data exists + how confident each
 * measurement is), suggest the next capture that would most reduce uncertainty.
 * Heuristic "information gain": single-source / conflicting / low-confidence
 * measurements and missing data sources are the highest-value gaps to fill.
 * Pure function — no network. Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

export interface CaptureContext {
  hasLocation: boolean
  anyAssetHasGps: boolean
  hasNaip: boolean
  hasBuilding: boolean
  assetCount: number
}

export interface MeasurementSummary {
  label: string
  confidence: number | null
  conflict: boolean
  sourceCount: number
}

export type Gain = 'high' | 'medium' | 'low'

export interface Recommendation {
  action: string
  rationale: string
  method: string
  expected_gain: Gain
}

const RANK: Record<Gain, number> = { high: 3, medium: 2, low: 1 }

export function recommendNextCaptures(
  ctx: CaptureContext,
  measurements: MeasurementSummary[],
  limit = 6
): Recommendation[] {
  const recs: Recommendation[] = []

  // Per-measurement gaps (most actionable).
  for (const m of measurements) {
    if (m.conflict) {
      recs.push({
        action: `Re-measure "${m.label}" with a tape on the actual edge`,
        rationale: 'Sources disagree (>3σ) — a direct tape read breaks the tie and re-anchors scale.',
        method: 'manual', expected_gain: 'high',
      })
    } else if (m.sourceCount <= 1) {
      recs.push({
        action: `Add a 2nd independent method to "${m.label}"`,
        rationale: 'Single-source estimates can\'t be cross-checked; a known-object or tape gives consensus.',
        method: 'known_object|manual', expected_gain: 'high',
      })
    } else if ((m.confidence ?? 0) < 55) {
      recs.push({
        action: `Tighten "${m.label}" (now ${m.confidence ?? 0}% confidence)`,
        rationale: 'Add a tape read or a clearer known-object anchor to shrink the error bar.',
        method: 'manual|known_object', expected_gain: 'medium',
      })
    }
  }

  // Missing-data gaps (unlock whole method families).
  if (!ctx.hasLocation || !ctx.anyAssetHasGps) {
    recs.push({
      action: 'Add a GPS-tagged original photo (Precise Location ON)',
      rationale: 'Location unlocks sun/shadow height, USGS aerial (NAIP) scale, and parcel/footprint data.',
      method: 'gps', expected_gain: 'high',
    })
  } else {
    if (ctx.hasBuilding) {
      recs.push({
        action: 'Confirm one building edge with a tape',
        rationale: 'An OSM footprint is available; one tape read locks absolute scale to its surveyed polygon.',
        method: 'manual+footprint', expected_gain: 'medium',
      })
    } else {
      recs.push({
        action: 'Capture all 4 corners + a tape along one long edge',
        rationale: 'No public footprint here — control corners + one control line let us reconstruct the footprint.',
        method: 'multi-view+manual', expected_gain: 'medium',
      })
    }
    if (ctx.hasNaip) {
      recs.push({
        action: 'Trace a long straight edge on the aerial tile',
        rationale: 'NAIP has a known meters-per-pixel; tracing an edge adds an independent overhead scale source.',
        method: 'aerial', expected_gain: 'medium',
      })
    }
  }

  if (ctx.assetCount < 4) {
    recs.push({
      action: 'Take a wide, a straight-on, and a close shot (with a reference object) per feature',
      rationale: 'More overlapping views improve multi-view fusion and give known-object anchors.',
      method: 'multi-view', expected_gain: 'low',
    })
  }

  if (measurements.length === 0) {
    recs.unshift({
      action: 'Add your first measurement: a tape read on one known edge',
      rationale: 'One real measurement anchors scale for everything else via the fusion graph.',
      method: 'manual', expected_gain: 'high',
    })
  }

  return recs
    .sort((a, b) => RANK[b.expected_gain] - RANK[a.expected_gain])
    .slice(0, limit)
}
