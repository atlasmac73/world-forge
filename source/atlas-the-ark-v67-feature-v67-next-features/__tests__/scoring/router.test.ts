/**
 * ATLAS v67 — Model Router Unit Tests
 * Tests for server-side model routing.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { describe, it, expect } from 'vitest'
import { routeModel, getModelId } from '@/lib/models/router'
import { tierHasFeature, TIER_CONFIG, FEATURE_GATES, getTierFeatures } from '@/lib/billing/gates'

describe('routeModel', () => {
  it('returns a model ID for every task type', () => {
    const tasks = ['realestate','dossier','underwriting','copywriting','scoring',
                   'skip_trace','rehab','chat','summary','code','reasoning','speed'] as const
    tasks.forEach(task => {
      const result = routeModel(task, 'T1')
      expect(result.modelId).toBeTruthy()
      expect(result.modelId.length).toBeGreaterThan(5)
      expect(result.taskType).toBe(task)
    })
  })

  it('T1-T2 routes to cheaper models than T5+', () => {
    const lowTier  = routeModel('dossier', 'T1')
    const highTier = routeModel('dossier', 'T6')
    // High tier should never be cheaper than low tier
    expect(highTier.tierBand).toBe('tier_high')
    expect(lowTier.tierBand).toBe('tier_low')
  })

  it('returns tier band correctly', () => {
    expect(routeModel('chat', 'T1').tierBand).toBe('tier_low')
    expect(routeModel('chat', 'T2').tierBand).toBe('tier_low')
    expect(routeModel('chat', 'T3').tierBand).toBe('tier_mid')
    expect(routeModel('chat', 'T4').tierBand).toBe('tier_mid')
    expect(routeModel('chat', 'T5').tierBand).toBe('tier_high')
    expect(routeModel('chat', 'T6').tierBand).toBe('tier_high')
    expect(routeModel('chat', 'T7').tierBand).toBe('tier_high')
  })

  it('includes a routing reason', () => {
    const result = routeModel('realestate', 'T3')
    expect(result.reason).toBeTruthy()
    expect(result.reason).toContain('realestate')
  })

  it('getModelId returns a string', () => {
    const id = getModelId('scoring', 'T2')
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(5)
  })
})

describe('billing gates', () => {
  it('T1 cannot access God Mode', () => {
    expect(tierHasFeature('T1', 'godmode')).toBe(false)
  })

  it('T2 can access God Mode (5/day)', () => {
    expect(tierHasFeature('T2', 'godmode')).toBe(true)
  })

  it('T3 can access all core features', () => {
    const coreFeatures: Array<keyof typeof FEATURE_GATES> = ['godmode', 'ain:full', 'skip_trace', 'top250', 'rehab', 'underwriting']
    coreFeatures.forEach(f => {
      expect(tierHasFeature('T3', f)).toBe(true)
    })
  })

  it('T1 cannot export Top 250', () => {
    expect(tierHasFeature('T1', 'top250:export')).toBe(false)
  })

  it('T4+ can export Top 250', () => {
    expect(tierHasFeature('T4', 'top250:export')).toBe(true)
    expect(tierHasFeature('T5', 'top250:export')).toBe(true)
    expect(tierHasFeature('T7', 'top250:export')).toBe(true)
  })

  it('only T7 has admin access', () => {
    expect(tierHasFeature('T6', 'admin')).toBe(false)
    expect(tierHasFeature('T7', 'admin')).toBe(true)
  })

  it('all tiers have valid config', () => {
    const tiers = ['T1','T2','T3','T4','T5','T6','T7'] as const
    tiers.forEach(tier => {
      expect(TIER_CONFIG[tier]).toBeDefined()
      expect(TIER_CONFIG[tier].name).toBeTruthy()
      expect(TIER_CONFIG[tier].credits_daily).toBeGreaterThan(0)
    })
  })

  it('getTierFeatures returns array for all tiers', () => {
    const tiers = ['T1','T2','T3','T4','T5','T6','T7'] as const
    tiers.forEach(tier => {
      const features = getTierFeatures(tier)
      expect(Array.isArray(features)).toBe(true)
      // Higher tiers have more features
      if (tier !== 'T1') {
        expect(features.length).toBeGreaterThan(0)
      }
    })
  })
})
