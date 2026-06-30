/**
 * ATLAS v67 — Solar position (NOAA algorithm) + shadow geometry
 * Given lat/lon + UTC time, compute sun elevation & azimuth (no network).
 * Used for: height-from-shadow, shadow-from-height, and sun-as-compass.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI
const mod360 = (x: number) => ((x % 360) + 360) % 360

export interface SunPosition {
  elevation_deg: number   // above horizon (negative = below)
  azimuth_deg: number     // clockwise from true north
  declination_deg: number
}

/** NOAA solar position. `date` is interpreted in UTC. */
export function sunPosition(lat: number, lon: number, date: Date): SunPosition {
  const jd = date.getTime() / 86400000 + 2440587.5
  const T = (jd - 2451545) / 36525

  const L0 = mod360(280.46646 + T * (36000.76983 + T * 0.0003032))
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T)
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T)
  const C =
    Math.sin(rad(M)) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * T) +
    Math.sin(rad(3 * M)) * 0.000289
  const trueLong = L0 + C
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(rad(125.04 - 1934.136 * T))
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60
  const eps = eps0 + 0.00256 * Math.cos(rad(125.04 - 1934.136 * T))
  const declination = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lambda))))

  const y = Math.tan(rad(eps / 2)) ** 2
  const eqTime =
    4 *
    deg(
      y * Math.sin(2 * rad(L0)) -
        2 * e * Math.sin(rad(M)) +
        4 * e * y * Math.sin(rad(M)) * Math.cos(2 * rad(L0)) -
        0.5 * y * y * Math.sin(4 * rad(L0)) -
        1.25 * e * e * Math.sin(2 * rad(M))
    )

  const utcMinutes =
    date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60
  let trueSolarTime = (utcMinutes + eqTime + 4 * lon) % 1440
  if (trueSolarTime < 0) trueSolarTime += 1440
  const ha = trueSolarTime / 4 < 0 ? trueSolarTime / 4 + 180 : trueSolarTime / 4 - 180

  const cosZenith =
    Math.sin(rad(lat)) * Math.sin(rad(declination)) +
    Math.cos(rad(lat)) * Math.cos(rad(declination)) * Math.cos(rad(ha))
  const zenith = deg(Math.acos(Math.min(1, Math.max(-1, cosZenith))))
  const elevation = 90 - zenith

  const cosAz =
    (Math.sin(rad(lat)) * Math.cos(rad(zenith)) - Math.sin(rad(declination))) /
    (Math.cos(rad(lat)) * Math.sin(rad(zenith)))
  const azAcos = deg(Math.acos(Math.min(1, Math.max(-1, cosAz))))
  const azimuth = ha > 0 ? mod360(azAcos + 180) : mod360(540 - azAcos)

  return { elevation_deg: elevation, azimuth_deg: azimuth, declination_deg: declination }
}

/** Height of a vertical object from its shadow length (same units in/out). */
export function heightFromShadow(shadowLength: number, sunElevationDeg: number): number {
  return shadowLength * Math.tan(rad(sunElevationDeg))
}

/** Expected shadow length of a vertical object of given height. */
export function shadowFromHeight(height: number, sunElevationDeg: number): number {
  return height / Math.tan(rad(sunElevationDeg))
}
