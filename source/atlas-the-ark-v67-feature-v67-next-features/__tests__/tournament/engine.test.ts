/**
 * ATLAS v67 — Tournament lib unit tests (pure logic, no network)
 */
import { describe, it, expect, beforeAll } from 'vitest'
import {
  resolveApiModelId,
  estimateCostCents,
  isProviderAvailable,
} from '@/lib/tournament/providers'
import { DEFAULT_CRITERIA } from '@/lib/tournament/judge'
import { AGENT_PERSONAS } from '@/lib/tournament/engine'

describe('providers.resolveApiModelId', () => {
  beforeAll(() => {
    process.env.ANTHROPIC_MODEL_POWER = 'test-opus'
    process.env.ANTHROPIC_MODEL_FAST = 'test-haiku'
    process.env.ANTHROPIC_MODEL_DEFAULT = 'test-sonnet'
  })

  it('routes Anthropic ids to the right env-pinned tier', () => {
    expect(resolveApiModelId('claude-opus-4-6', 'Anthropic')).toBe('test-opus')
    expect(resolveApiModelId('claude-haiku-4-5', 'Anthropic')).toBe('test-haiku')
    expect(resolveApiModelId('claude-sonnet-4-6', 'Anthropic')).toBe('test-sonnet')
  })

  it('passes OpenAI ids through unchanged', () => {
    expect(resolveApiModelId('gpt-4o', 'OpenAI')).toBe('gpt-4o')
    expect(resolveApiModelId('gpt-4o-mini', 'OpenAI')).toBe('gpt-4o-mini')
  })
})

describe('providers.estimateCostCents', () => {
  it('is zero for zero tokens and a non-negative integer otherwise', () => {
    expect(estimateCostCents('Anthropic', 0, 0)).toBe(0)
    const c = estimateCostCents('OpenAI', 100_000, 50_000)
    expect(c).toBeGreaterThan(0)
    expect(Number.isInteger(c)).toBe(true)
  })

  it('grows with token count', () => {
    const small = estimateCostCents('Anthropic', 1000, 1000)
    const large = estimateCostCents('Anthropic', 100_000, 100_000)
    expect(large).toBeGreaterThan(small)
  })
})

describe('providers.isProviderAvailable', () => {
  it('returns false for providers with no adapter', () => {
    expect(isProviderAvailable('Google')).toBe(false)
    expect(isProviderAvailable('DefinitelyNotAProvider')).toBe(false)
  })
})

describe('judge.DEFAULT_CRITERIA', () => {
  it('has weights that sum to 1.0', () => {
    const sum = DEFAULT_CRITERIA.reduce((s, c) => s + c.weight, 0)
    expect(sum).toBeCloseTo(1.0, 5)
  })
})

describe('engine.AGENT_PERSONAS', () => {
  it('exposes the real implemented ATLAS agents', () => {
    expect(Object.keys(AGENT_PERSONAS)).toEqual(
      expect.arrayContaining(['A01-ORACLE', 'A12-SPECTER', 'A15-OMEN', 'A06-HERALD'])
    )
  })
})
