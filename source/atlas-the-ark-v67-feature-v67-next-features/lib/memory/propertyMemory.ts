/**
 * THE ARK — Property & County Memory Layer
 * Gives SPECTER and OMEN access to prior scoring history before each new run.
 * Extends existing score_runs, distress_signals, ain_county_scores tables.
 * No new schema required — reads what already exists.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 *
 * Ref: 07_PLANS/6_MEMORY_OS_PLAN.md §4.2 — "lowest-net-new-schema path to memory"
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface PropertyMemory {
  address: string
  prior_runs: number
  last_score: number | null
  last_grade: string | null
  last_scored_at: string | null
  score_delta: number | null        // change since previous run (positive = more distressed)
  trend: 'RISING' | 'FALLING' | 'STABLE' | 'FIRST_RUN'
  prior_signals: string[]           // signal types that fired in past runs
  prior_owner_names: string[]       // prior owner names (tracks name changes — absentee signal)
  summary: string                   // one-line memory context for agent system prompt
}

export interface CountyMemory {
  county: string
  state: string
  avg_score_30d: number | null
  avg_score_90d: number | null
  trend: 'HEATING' | 'COOLING' | 'STABLE' | 'NO_DATA'
  total_scored: number
  hot_zip_codes: string[]           // zips with avg score > 70
  top_signal_types: string[]        // most common distress signals in county
  summary: string
}

// ─── Property Memory ─────────────────────────────────────────────────────────

export async function getPropertyMemory(
  supabase: SupabaseClient,
  address: string
): Promise<PropertyMemory> {
  // Pull last 5 score runs for this address
  const { data: runs } = await supabase
    .from('score_runs')
    .select('score, grade, created_at, input_json, output_json')
    .ilike('input_json->address', `%${address}%`)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!runs || runs.length === 0) {
    return {
      address,
      prior_runs: 0,
      last_score: null,
      last_grade: null,
      last_scored_at: null,
      score_delta: null,
      trend: 'FIRST_RUN',
      prior_signals: [],
      prior_owner_names: [],
      summary: 'First time analyzing this property — no prior history.',
    }
  }

  const latest = runs[0]
  const previous = runs[1]
  const delta = previous ? (latest.score ?? 0) - (previous.score ?? 0) : null

  // Gather prior signal types from distress_signals table
  const { data: signals } = await supabase
    .from('distress_signals')
    .select('signal_type')
    .ilike('property_address', `%${address}%`)
    .order('created_at', { ascending: false })
    .limit(20)

  const priorSignals = [...new Set((signals ?? []).map((s: { signal_type: string }) => s.signal_type))]

  // Gather prior owner names from input_json
  const priorOwners = [...new Set(
    runs
      .map(r => (r.input_json as Record<string, unknown>)?.owner_name as string)
      .filter(Boolean)
  )]

  const trend: PropertyMemory['trend'] = delta === null
    ? 'FIRST_RUN'
    : delta > 5
      ? 'RISING'
      : delta < -5
        ? 'FALLING'
        : 'STABLE'

  const trendStr = trend === 'RISING' ? `⬆️ Rising (+${delta})` : trend === 'FALLING' ? `⬇️ Falling (${delta})` : '➡️ Stable'

  return {
    address,
    prior_runs: runs.length,
    last_score: latest.score,
    last_grade: latest.grade,
    last_scored_at: latest.created_at,
    score_delta: delta,
    trend,
    prior_signals: priorSignals,
    prior_owner_names: priorOwners,
    summary: `Previously scored ${runs.length}x. Last score: ${latest.score ?? 'unknown'} (${latest.grade ?? 'unknown'}). Trend: ${trendStr}. Prior signals: ${priorSignals.slice(0, 3).join(', ') || 'none'}.`,
  }
}

// ─── County Memory ────────────────────────────────────────────────────────────

export async function getCountyMemory(
  supabase: SupabaseClient,
  county: string,
  state: string = 'WV'
): Promise<CountyMemory> {
  // Pull from ain_county_scores (already exists in schema)
  const { data: countyData } = await supabase
    .from('ain_county_scores')
    .select('*')
    .ilike('county_name', `%${county}%`)
    .eq('state_code', state)
    .single()

  if (!countyData) {
    return {
      county, state,
      avg_score_30d: null,
      avg_score_90d: null,
      trend: 'NO_DATA',
      total_scored: 0,
      hot_zip_codes: [],
      top_signal_types: [],
      summary: `No county memory for ${county}, ${state} yet.`,
    }
  }

  // Recent score runs for this county
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString()

  const { data: recent30 } = await supabase
    .from('score_runs')
    .select('score')
    .gte('created_at', thirtyDaysAgo)
    .limit(100)

  const { data: recent90 } = await supabase
    .from('score_runs')
    .select('score')
    .gte('created_at', ninetyDaysAgo)
    .limit(200)

  const avg30 = recent30?.length
    ? Math.round(recent30.reduce((s: number, r: { score: number }) => s + (r.score ?? 0), 0) / recent30.length)
    : null

  const avg90 = recent90?.length
    ? Math.round(recent90.reduce((s: number, r: { score: number }) => s + (r.score ?? 0), 0) / recent90.length)
    : null

  const trend: CountyMemory['trend'] =
    avg30 === null || avg90 === null ? 'NO_DATA'
    : avg30 > avg90 + 3 ? 'HEATING'
    : avg30 < avg90 - 3 ? 'COOLING'
    : 'STABLE'

  return {
    county, state,
    avg_score_30d: avg30,
    avg_score_90d: avg90,
    trend,
    total_scored: recent90?.length ?? 0,
    hot_zip_codes: (countyData.top_zip_codes as string[] | null) ?? [],
    top_signal_types: (countyData.top_signals as string[] | null) ?? [],
    summary: `${county} County ${state}: avg score ${avg30 ?? 'n/a'} (30d) vs ${avg90 ?? 'n/a'} (90d). Trend: ${trend}. ${recent90?.length ?? 0} properties scored in last 90 days.`,
  }
}

// ─── Memory context string for agent system prompts ───────────────────────────

export function formatMemoryContext(
  propertyMemory?: PropertyMemory | null,
  countyMemory?: CountyMemory | null
): string {
  const parts: string[] = []

  if (propertyMemory && propertyMemory.prior_runs > 0) {
    parts.push(`PROPERTY MEMORY:\n${propertyMemory.summary}`)
    if (propertyMemory.prior_signals.length > 0) {
      parts.push(`Prior distress signals: ${propertyMemory.prior_signals.join(', ')}`)
    }
  }

  if (countyMemory && countyMemory.trend !== 'NO_DATA') {
    parts.push(`COUNTY MEMORY:\n${countyMemory.summary}`)
  }

  if (parts.length === 0) return ''

  return `\n\n<ATLAS_MEMORY>\n${parts.join('\n\n')}\n</ATLAS_MEMORY>\n\nUse the above memory context to inform your analysis. Reference any changes or trends explicitly.`
}
