/**
 * ATLAS v67 — Vanishing point estimation (single-image metrology helper)
 * Given image-space line segments that are parallel in the real world, find
 * their common vanishing point (least-squares intersection). Vanishing points
 * give camera orientation/focal length and let us rectify a plane to measure on.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

export interface LineSegment { x1: number; y1: number; x2: number; y2: number }

/**
 * Least-squares intersection of lines (each segment defines a line a·x+b·y+c=0).
 * Minimizes sum of squared point-to-line distances. Returns null if degenerate
 * (lines effectively parallel → vanishing point at infinity).
 */
export function vanishingPoint(segments: LineSegment[]): { x: number; y: number } | null {
  if (segments.length < 2) return null

  // Normal-equation accumulation for [Saa Sab; Sab Sbb] [x;y] = [-Sac; -Sbc]
  let Saa = 0, Sab = 0, Sbb = 0, Sac = 0, Sbc = 0
  for (const s of segments) {
    const dx = s.x2 - s.x1
    const dy = s.y2 - s.y1
    const len = Math.hypot(dx, dy)
    if (len < 1e-6) continue
    // line through (x1,y1),(x2,y2): a x + b y + c = 0, normalized
    const a = -dy / len
    const b = dx / len
    const c = -(a * s.x1 + b * s.y1)
    Saa += a * a; Sab += a * b; Sbb += b * b; Sac += a * c; Sbc += b * c
  }

  const det = Saa * Sbb - Sab * Sab
  if (Math.abs(det) < 1e-9) return null   // parallel → VP at infinity
  const x = (-Sac * Sbb + Sbc * Sab) / det
  const y = (-Saa * Sbc + Sab * Sac) / det
  return { x, y }
}

/**
 * Estimate camera focal length (px) from two orthogonal vanishing points and the
 * principal point (usually image center). f = sqrt(-(vp1-pp)·(vp2-pp)).
 * Returns null if the geometry doesn't yield a real focal length.
 */
export function focalFromVanishingPoints(
  vp1: { x: number; y: number },
  vp2: { x: number; y: number },
  principal: { x: number; y: number }
): number | null {
  const dot =
    (vp1.x - principal.x) * (vp2.x - principal.x) +
    (vp1.y - principal.y) * (vp2.y - principal.y)
  const f2 = -dot
  return f2 > 0 ? Math.sqrt(f2) : null
}
