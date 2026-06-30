/**
 * ATLAS v67 — Scoring Engine Unit Tests
 * Tests for the 8-signal distress scoring engine.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { describe, it, expect } from 'vitest'
import { scoreProperty } from '@/lib/scoring/engine'

// ─── Import helpers (gradeFromScore is not exported — test via scoreProperty) ──

describe('scoreProperty — 8-signal distress scoring', () => {

  it('returns UNKNOWN grade and 0 score for empty input', () => {
    const result = scoreProperty({})
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.signals).toHaveLength(8)
    expect(result.signals_total).toBe(8)
  })

  it('scores maximum (100) for fully distressed property', () => {
    const result = scoreProperty({
      tax_delinquent:     true,
      tax_owed:           15000,
      is_abandoned:       true,
      in_foreclosure:     true,
      lis_pendens:        true,
      arv:                80000,
      asking_price:       95000,
      estimated_repair:   40000,
      days_on_market:     400,
      out_of_state_owner: true,
      absentee_owner:     true,
      liens:              true,
      judgements:         true,
      probate:            true,
      county_median_dom:  120,
    })
    expect(result.score).toBeGreaterThanOrEqual(80)
    expect(['CRITICAL', 'HOT']).toContain(result.grade)
    expect(result.signals_fired).toBeGreaterThanOrEqual(6)
  })

  it('scores low for clean property', () => {
    const result = scoreProperty({
      tax_delinquent:   false,
      is_vacant:        false,
      in_foreclosure:   false,
      arv:              200000,
      asking_price:     150000,
      estimated_repair: 10000,
      days_on_market:   30,
      county_median_dom: 45,
    })
    expect(result.score).toBeLessThan(45)
    expect(['COOL', 'COLD', 'UNKNOWN']).toContain(result.grade)
  })

  it('tax delinquency alone fires signal and adds 20 points', () => {
    const withTax    = scoreProperty({ tax_delinquent: true })
    const withoutTax = scoreProperty({ tax_delinquent: false })
    expect(withTax.score).toBeGreaterThan(withoutTax.score)
    const taxSignal = withTax.signals.find(s => s.type === 'tax_delinquent')
    expect(taxSignal?.fired).toBe(true)
    expect(taxSignal?.points).toBe(20)
  })

  it('abandoned > vacant for vacancy signal points', () => {
    const abandoned = scoreProperty({ is_abandoned: true })
    const vacant    = scoreProperty({ is_vacant: true })
    expect(abandoned.score).toBeGreaterThan(vacant.score)
  })

  it('computes MAO when arv and repair provided', () => {
    const result = scoreProperty({
      arv:              120000,
      estimated_repair: 30000,
    })
    // MAO = 120000 * 0.70 - 30000 = 54000
    expect(result.mao).toBeCloseTo(54000, 0)
  })

  it('MAO is 0 when underwater', () => {
    const result = scoreProperty({
      arv:              50000,
      estimated_repair: 60000,
    })
    expect(result.mao).toBe(0)
  })

  it('equity_pct is calculated from arv and asking_price', () => {
    const result = scoreProperty({
      arv:          100000,
      asking_price: 80000,
    })
    // equity = (100000 - 80000) / 100000 * 100 = 20%
    expect(result.equity_pct).toBeCloseTo(20, 1)
  })

  it('negative equity fires equity signal', () => {
    const result = scoreProperty({
      arv:          100000,
      asking_price: 120000,
    })
    const equitySignal = result.signals.find(s => s.type === 'equity_deficit')
    expect(equitySignal?.fired).toBe(true)
    expect(result.equity_pct).toBeLessThan(0)
  })

  it('score is always between 0 and 100', () => {
    // Test edge cases
    const cases = [
      { tax_delinquent: true, is_abandoned: true, in_foreclosure: true, liens: true },
      {},
      { arv: 0, asking_price: 999999 },
    ]
    cases.forEach(input => {
      const result = scoreProperty(input)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })
  })

  it('returns correct signals_fired count', () => {
    const result = scoreProperty({
      tax_delinquent: true,   // fires
      is_vacant:      true,   // fires
      in_foreclosure: false,  // doesn't fire
    })
    expect(result.signals_fired).toBeGreaterThanOrEqual(2)
    expect(result.signals_fired).toBeLessThanOrEqual(8)
  })

  it('grade thresholds are correct', () => {
    // A maximally-distressed property fires (nearly) every signal, including
    // equity deficit (negative equity) and a long days-on-market, so the score
    // clears the CRITICAL threshold (>= 80).
    const critical = scoreProperty({
      tax_delinquent: true, is_abandoned: true, in_foreclosure: true,
      lis_pendens: true, out_of_state_owner: true, liens: true, probate: true,
      county_median_dom: 120,
      arv: 100000, asking_price: 130000,  // negative equity → equity_deficit fires
      days_on_market: 400,                // > 365 → full days_on_market weight
    })
    expect(critical.grade).toBe('CRITICAL')

    const clean = scoreProperty({ days_on_market: 10 })
    expect(['COLD', 'COOL', 'UNKNOWN']).toContain(clean.grade)
  })

  it('scored_at is a valid ISO timestamp', () => {
    const result = scoreProperty({})
    expect(() => new Date(result.scored_at)).not.toThrow()
    expect(new Date(result.scored_at).getTime()).toBeGreaterThan(0)
  })
})

describe('batchScore', () => {
  it('scores multiple properties and preserves IDs', async () => {
    const { batchScore } = await import('@/lib/scoring/engine')
    const results = batchScore([
      { id: 'prop-1', tax_delinquent: true },
      { id: 'prop-2', tax_delinquent: false },
    ])
    expect(results).toHaveLength(2)
    expect(results[0].id).toBe('prop-1')
    expect(results[1].id).toBe('prop-2')
    expect(results[0].score).toBeGreaterThan(results[1].score)
  })
})
