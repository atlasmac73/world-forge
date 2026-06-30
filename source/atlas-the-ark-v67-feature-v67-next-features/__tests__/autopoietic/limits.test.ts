/**
 * ATLAS v67 — Autopoietic safety-limit tests
 * Guards the no-auto-deploy contract: requiresHumanApproval is the gate that
 * forces human review for risky/sensitive Genesis blueprints. If it regresses,
 * the safety contract breaks silently. (Reviewer-suggested Priority 1.)
 */
import { describe, it, expect } from 'vitest'
import { AUTOPOIETIC_LIMITS, requiresHumanApproval, isWithinRateLimit } from '@/lib/autopoietic/limits'

describe('requiresHumanApproval', () => {
  it('requires approval for HIGH and CRITICAL risk regardless of type', () => {
    expect(requiresHumanApproval('HIGH', 'code_change')).toBe(true)
    expect(requiresHumanApproval('CRITICAL', 'config_change')).toBe(true)
  })
  it('does not require approval for LOW/MEDIUM non-sensitive types', () => {
    expect(requiresHumanApproval('LOW', 'config_change')).toBe(false)
    expect(requiresHumanApproval('MEDIUM', 'code_change')).toBe(false)
  })
  it('always requires approval for sensitive blueprint types regardless of risk', () => {
    expect(requiresHumanApproval('LOW', 'schema_change')).toBe(true)
    expect(requiresHumanApproval('LOW', 'security')).toBe(true)
    expect(requiresHumanApproval('LOW', 'agent_update')).toBe(true)
  })
})

describe('isWithinRateLimit', () => {
  it('allows the first run (no prior cycle)', () => {
    expect(isWithinRateLimit(null)).toBe(true)
  })
  it('blocks a cycle that ran too recently', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000)
    expect(isWithinRateLimit(fiveMinAgo, 15)).toBe(false)
  })
  it('allows once enough time has elapsed', () => {
    const twentyMinAgo = new Date(Date.now() - 20 * 60_000)
    expect(isWithinRateLimit(twentyMinAgo, 15)).toBe(true)
  })
  it('allows exactly at the interval boundary', () => {
    const exactlyFifteen = new Date(Date.now() - 15 * 60_000)
    expect(isWithinRateLimit(exactlyFifteen, 15)).toBe(true)
  })
})

describe('AUTOPOIETIC_LIMITS constants', () => {
  it('caps blueprints per cycle at 3', () => {
    expect(AUTOPOIETIC_LIMITS.MAX_BLUEPRINTS_PER_CYCLE).toBe(3)
  })
  it('lists HIGH and CRITICAL as approval-required risks', () => {
    expect(AUTOPOIETIC_LIMITS.HUMAN_APPROVAL_REQUIRED_RISK).toEqual(
      expect.arrayContaining(['HIGH', 'CRITICAL'])
    )
  })
  it('lists schema_change/security/agent_update as approval-required types', () => {
    expect(AUTOPOIETIC_LIMITS.HUMAN_APPROVAL_REQUIRED_TYPES).toEqual(
      expect.arrayContaining(['schema_change', 'security', 'agent_update'])
    )
  })
})
