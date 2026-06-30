/**
 * ATLAS Scoring Engine — 8-Signal Distress Scoring
 * Derived from atlas-godmode-v12-port, adapted to v67 conventions.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 *
 * 8 Signals:
 * 1. Tax Delinquency       (weight: 20)
 * 2. Vacancy / Abandonment (weight: 18)
 * 3. Foreclosure Activity  (weight: 18)
 * 4. Equity Deficit        (weight: 15)
 * 5. Days on Market        (weight: 12)
 * 6. Owner Distress        (weight: 10)
 * 7. Court / Legal         (weight: 7)
 * 8. Market Velocity       (weight: 5) [inverse — slow market = higher distress]
 * Total: 100 points
 */

export type SignalType =
  | 'tax_delinquent'
  | 'vacancy'
  | 'foreclosure'
  | 'equity_deficit'
  | 'days_on_market'
  | 'owner_distress'
  | 'court_activity'
  | 'market_velocity'

export type DistressGrade = 'CRITICAL' | 'HOT' | 'WARM' | 'COOL' | 'COLD' | 'UNKNOWN'

export interface ScoringInput {
  // Tax
  tax_delinquent?: boolean
  tax_owed?: number
  assessed_value?: number

  // Vacancy
  is_vacant?: boolean
  is_abandoned?: boolean
  occupancy?: string

  // Foreclosure
  in_foreclosure?: boolean
  lis_pendens?: boolean
  reo?: boolean

  // Equity
  arv?: number
  asking_price?: number
  estimated_repair?: number
  equity_pct?: number

  // Market
  days_on_market?: number
  listing_price_reductions?: number

  // Owner
  absentee_owner?: boolean
  out_of_state_owner?: boolean
  multiple_properties?: boolean

  // Court
  liens?: boolean
  judgements?: boolean
  probate?: boolean
  divorce?: boolean

  // Market velocity (county-level)
  county_median_dom?: number
  market_absorption_rate?: number
}

export interface ScoredSignal {
  type: SignalType
  label: string
  weight: number
  points: number
  fired: boolean
  value?: number | string | boolean
  detail: string
}

export interface ScoringResult {
  score: number
  grade: DistressGrade
  signals: ScoredSignal[]
  signals_fired: number
  signals_total: number
  mao?: number
  equity_pct?: number
  scored_at: string
}

const SIGNAL_WEIGHTS: Record<SignalType, number> = {
  tax_delinquent:  20,
  vacancy:         18,
  foreclosure:     18,
  equity_deficit:  15,
  days_on_market:  12,
  owner_distress:  10,
  court_activity:   7,
  market_velocity:  5,
}

function gradeFromScore(score: number): DistressGrade {
  if (score >= 80) return 'CRITICAL'
  if (score >= 65) return 'HOT'
  if (score >= 45) return 'WARM'
  if (score >= 25) return 'COOL'
  if (score >= 1)  return 'COLD'
  return 'UNKNOWN'
}

function computeMAO(arv: number, repair: number, targetMargin = 0.70): number {
  // MAO = (ARV × 0.70) - Repair Costs
  return Math.max(0, arv * targetMargin - repair)
}

export function scoreProperty(input: ScoringInput): ScoringResult {
  const signals: ScoredSignal[] = []
  let totalScore = 0

  // 1. Tax Delinquency
  const taxFired = Boolean(input.tax_delinquent)
  const taxPoints = taxFired ? SIGNAL_WEIGHTS.tax_delinquent : 0
  signals.push({
    type: 'tax_delinquent',
    label: 'Tax Delinquency',
    weight: SIGNAL_WEIGHTS.tax_delinquent,
    points: taxPoints,
    fired: taxFired,
    value: input.tax_owed,
    detail: taxFired
      ? `Tax delinquent${input.tax_owed ? ` — $${input.tax_owed.toLocaleString()} owed` : ''}`
      : 'No tax delinquency detected',
  })

  // 2. Vacancy / Abandonment
  const vacancyFired = Boolean(input.is_vacant || input.is_abandoned || input.occupancy === 'vacant')
  const vacancyPoints = input.is_abandoned
    ? SIGNAL_WEIGHTS.vacancy
    : vacancyFired
    ? Math.round(SIGNAL_WEIGHTS.vacancy * 0.7)
    : 0
  signals.push({
    type: 'vacancy',
    label: 'Vacancy / Abandonment',
    weight: SIGNAL_WEIGHTS.vacancy,
    points: vacancyPoints,
    fired: vacancyFired,
    value: input.occupancy,
    detail: input.is_abandoned
      ? 'Property confirmed abandoned'
      : vacancyFired
      ? 'Property appears vacant'
      : 'No vacancy detected',
  })

  // 3. Foreclosure
  const foreclosureFired = Boolean(input.in_foreclosure || input.lis_pendens || input.reo)
  const foreclosurePoints = input.reo
    ? Math.round(SIGNAL_WEIGHTS.foreclosure * 0.6)
    : input.in_foreclosure || input.lis_pendens
    ? SIGNAL_WEIGHTS.foreclosure
    : 0
  signals.push({
    type: 'foreclosure',
    label: 'Foreclosure Activity',
    weight: SIGNAL_WEIGHTS.foreclosure,
    points: foreclosurePoints,
    fired: foreclosureFired,
    detail: input.reo
      ? 'Bank-owned (REO)'
      : input.lis_pendens
      ? 'Lis Pendens filed'
      : input.in_foreclosure
      ? 'Active foreclosure'
      : 'No foreclosure activity',
  })

  // 4. Equity Deficit
  const equityPct = input.equity_pct
    ?? (input.arv && input.asking_price
      ? ((input.arv - input.asking_price) / input.arv) * 100
      : null)
  const equityFired = equityPct !== null && equityPct < 20
  const equityPoints = equityFired
    ? equityPct! < 0
      ? SIGNAL_WEIGHTS.equity_deficit
      : Math.round(SIGNAL_WEIGHTS.equity_deficit * (1 - equityPct! / 20))
    : 0
  signals.push({
    type: 'equity_deficit',
    label: 'Equity Deficit',
    weight: SIGNAL_WEIGHTS.equity_deficit,
    points: equityPoints,
    fired: equityFired,
    value: equityPct !== null ? Math.round(equityPct) : undefined,
    detail: equityPct !== null
      ? equityPct < 0
        ? `Negative equity — ${Math.abs(Math.round(equityPct))}% underwater`
        : equityFired
        ? `Low equity — ${Math.round(equityPct)}%`
        : `Adequate equity — ${Math.round(equityPct)}%`
      : 'Equity data unavailable',
  })

  // 5. Days on Market
  const dom = input.days_on_market ?? 0
  const domFired = dom > 90
  const domPoints = domFired
    ? dom > 365
      ? SIGNAL_WEIGHTS.days_on_market
      : dom > 180
      ? Math.round(SIGNAL_WEIGHTS.days_on_market * 0.8)
      : Math.round(SIGNAL_WEIGHTS.days_on_market * 0.5)
    : 0
  signals.push({
    type: 'days_on_market',
    label: 'Days on Market',
    weight: SIGNAL_WEIGHTS.days_on_market,
    points: domPoints,
    fired: domFired,
    value: dom,
    detail: dom > 0 ? `${dom} days on market` : 'No listing data',
  })

  // 6. Owner Distress
  const ownerFired = Boolean(
    input.absentee_owner || input.out_of_state_owner
  )
  const ownerPoints = ownerFired ? Math.round(SIGNAL_WEIGHTS.owner_distress * 0.7) : 0
  signals.push({
    type: 'owner_distress',
    label: 'Owner Distress',
    weight: SIGNAL_WEIGHTS.owner_distress,
    points: ownerPoints,
    fired: ownerFired,
    detail: input.out_of_state_owner
      ? 'Out-of-state owner — absentee'
      : input.absentee_owner
      ? 'Absentee owner'
      : 'Owner appears local',
  })

  // 7. Court / Legal
  const courtFired = Boolean(
    input.liens || input.judgements || input.probate || input.divorce
  )
  const courtFlags = [
    input.liens && 'liens',
    input.judgements && 'judgements',
    input.probate && 'probate',
    input.divorce && 'divorce filing',
  ].filter(Boolean)
  signals.push({
    type: 'court_activity',
    label: 'Court / Legal',
    weight: SIGNAL_WEIGHTS.court_activity,
    points: courtFired ? SIGNAL_WEIGHTS.court_activity : 0,
    fired: courtFired,
    detail: courtFired ? `Active: ${courtFlags.join(', ')}` : 'No court activity',
  })

  // 8. Market Velocity (slow market = distress indicator)
  const marketSlow = (input.county_median_dom ?? 0) > 90
  signals.push({
    type: 'market_velocity',
    label: 'Market Velocity',
    weight: SIGNAL_WEIGHTS.market_velocity,
    points: marketSlow ? SIGNAL_WEIGHTS.market_velocity : 0,
    fired: marketSlow,
    value: input.county_median_dom,
    detail: input.county_median_dom
      ? `County median DOM: ${input.county_median_dom} days`
      : 'No market velocity data',
  })

  // Compute total
  totalScore = signals.reduce((sum, s) => sum + s.points, 0)
  const clampedScore = Math.min(100, Math.max(0, totalScore))

  // MAO calc
  const mao = input.arv && input.estimated_repair
    ? computeMAO(input.arv, input.estimated_repair)
    : undefined

  return {
    score: clampedScore,
    grade: gradeFromScore(clampedScore),
    signals,
    signals_fired: signals.filter(s => s.fired).length,
    signals_total: signals.length,
    mao,
    equity_pct: equityPct ?? undefined,
    scored_at: new Date().toISOString(),
  }
}

/** Batch score multiple properties */
export function batchScore(
  properties: Array<{ id: string } & ScoringInput>
): Array<{ id: string } & ScoringResult> {
  return properties.map(p => ({ id: p.id, ...scoreProperty(p) }))
}
