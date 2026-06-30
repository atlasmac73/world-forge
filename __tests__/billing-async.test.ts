/**
 * THE ARK — Async Billing Gate Tests
 * Tests for requireFeature, getUserTier, checkCredits, deductCredits.
 * These complement the sync billing-gates.test.ts by covering all DB-touching paths.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Supabase ────────────────────────────────────────────────────────────
const mockSingleTier    = vi.fn()
const mockSingleProfile = vi.fn()
const mockSingleSub     = vi.fn()
const mockUpdate        = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'subscriptions') {
        return {
          select:  vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingleSub }) }),
          update:  vi.fn().mockReturnValue({ eq: mockUpdate }),
        }
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingleProfile }) }),
        }
      }
      return {
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingleTier }) }),
      }
    }),
  })),
  createClient: vi.fn(),
  createAuthenticatedClient: vi.fn(),
}))

import {
  getUserTier,
  requireFeature,
  checkCredits,
  deductCredits,
  type TierCode,
} from '@/lib/billing/gates'

// ─── getUserTier ──────────────────────────────────────────────────────────────

describe('getUserTier', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns tier from DB when subscription exists', async () => {
    mockSingleSub.mockResolvedValue({ data: { tier_code: 'T3' }, error: null })
    const tier = await getUserTier('user-1')
    expect(tier).toBe('T3')
  })

  it('returns T1 when subscription row is missing', async () => {
    mockSingleSub.mockResolvedValue({ data: null, error: { message: 'Not found' } })
    const tier = await getUserTier('user-ghost')
    expect(tier).toBe('T1')
  })

  it('returns T1 when tier_code is null/undefined', async () => {
    mockSingleSub.mockResolvedValue({ data: { tier_code: null }, error: null })
    const tier = await getUserTier('user-bad')
    expect(tier).toBe('T1')
  })

  it('returns T7 for founder tier', async () => {
    mockSingleSub.mockResolvedValue({ data: { tier_code: 'T7' }, error: null })
    const tier = await getUserTier('isaac')
    expect(tier).toBe('T7')
  })

  it('returns correct tier for each valid code', async () => {
    const tiers: TierCode[] = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    for (const expected of tiers) {
      mockSingleSub.mockResolvedValue({ data: { tier_code: expected }, error: null })
      const result = await getUserTier('any-user')
      expect(result).toBe(expected)
    }
  })
})

// ─── requireFeature ──────────────────────────────────────────────────────────

describe('requireFeature', () => {
  beforeEach(() => vi.clearAllMocks())

  it('grants access when tier includes the feature', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'beta_tester' }, error: null })
    mockSingleSub.mockResolvedValue({ data: { tier_code: 'T3' }, error: null })

    const result = await requireFeature('user-1', 'skip_trace')
    expect(result.error).toBeNull()
    expect(result.tier).toBe('T3')
  })

  it('returns 402 when tier does not include the feature', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'beta_tester' }, error: null })
    mockSingleSub.mockResolvedValue({ data: { tier_code: 'T1' }, error: null })

    const result = await requireFeature('user-1', 'skip_trace')
    expect(result.tier).toBeNull()
    expect(result.error).not.toBeNull()
    expect((result.error as Response).status).toBe(402)
  })

  it('402 response body includes UPGRADE_REQUIRED code', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'viewer' }, error: null })
    mockSingleSub.mockResolvedValue({ data: { tier_code: 'T1' }, error: null })

    const result = await requireFeature('user-1', 'admin')
    const body = await (result.error as Response).json()
    expect(body.code).toBe('UPGRADE_REQUIRED')
    expect(body.ok).toBe(false)
    expect(body.upgrade_url).toBe('/pricing')
  })

  it('owner role bypasses all tier gates and returns T7', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'owner' }, error: null })
    // Don't need to set sub mock — owner bypasses the tier check entirely
    const result = await requireFeature('isaac', 'admin')
    expect(result.error).toBeNull()
    expect(result.tier).toBe('T7')
  })

  it('owner bypass works even for premium-only features', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'owner' }, error: null })

    const premiumFeatures = ['model_select', 'white_label', 'api_access'] as const
    for (const feature of premiumFeatures) {
      const result = await requireFeature('isaac', feature)
      expect(result.error).toBeNull()
    }
  })

  it('402 response includes current_tier and required_tier', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'viewer' }, error: null })
    mockSingleSub.mockResolvedValue({ data: { tier_code: 'T2' }, error: null })

    const result = await requireFeature('user-1', 'top250:export')
    const body = await (result.error as Response).json()
    expect(body.current_tier).toBe('T2')
    expect(body.required_tier).toBeDefined()
    expect(body.feature).toBe('top250:export')
  })

  it('T7 tier has access to all features', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'beta_tester' }, error: null })
    mockSingleSub.mockResolvedValue({ data: { tier_code: 'T7' }, error: null })

    const result = await requireFeature('user-7', 'model_select')
    expect(result.error).toBeNull()
    expect(result.tier).toBe('T7')
  })
})

// ─── checkCredits ─────────────────────────────────────────────────────────────

describe('checkCredits', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns ok:true when credits are available', async () => {
    mockSingleSub.mockResolvedValue({
      data: { credits_used_today: 10, credits_limit_daily: 200 },
      error: null,
    })
    const result = await checkCredits('user-1', 1)
    expect(result.ok).toBe(true)
    expect(result.remaining).toBe(190)
  })

  it('returns ok:false when credits are exactly exhausted', async () => {
    mockSingleSub.mockResolvedValue({
      data: { credits_used_today: 200, credits_limit_daily: 200 },
      error: null,
    })
    const result = await checkCredits('user-1', 1)
    expect(result.ok).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('returns ok:false when credits are insufficient for multi-credit operation', async () => {
    mockSingleSub.mockResolvedValue({
      data: { credits_used_today: 195, credits_limit_daily: 200 },
      error: null,
    })
    const result = await checkCredits('user-1', 10)
    expect(result.ok).toBe(false)
    expect(result.remaining).toBe(5)
  })

  it('returns ok:true when exact credits remain', async () => {
    mockSingleSub.mockResolvedValue({
      data: { credits_used_today: 190, credits_limit_daily: 200 },
      error: null,
    })
    const result = await checkCredits('user-1', 10)
    expect(result.ok).toBe(true)
    expect(result.remaining).toBe(10)
  })

  it('returns ok:false when subscription row is missing', async () => {
    mockSingleSub.mockResolvedValue({ data: null, error: null })
    const result = await checkCredits('user-ghost', 1)
    expect(result.ok).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('blocked response includes 402 status', async () => {
    mockSingleSub.mockResolvedValue({
      data: { credits_used_today: 50, credits_limit_daily: 50 },
      error: null,
    })
    const result = await checkCredits('user-1', 1)
    expect(result.ok).toBe(false)
    expect((result.error as Response).status).toBe(402)
  })

  it('blocked response body includes CREDIT_LIMIT code', async () => {
    mockSingleSub.mockResolvedValue({
      data: { credits_used_today: 50, credits_limit_daily: 50 },
      error: null,
    })
    const result = await checkCredits('user-1', 1)
    const body = await (result.error as Response)?.json()
    expect(body.code).toBe('CREDIT_LIMIT')
    expect(body.ok).toBe(false)
    expect(typeof body.remaining).toBe('number')
  })

  it('T7 founder with 999999 daily limit is never blocked', async () => {
    mockSingleSub.mockResolvedValue({
      data: { credits_used_today: 10000, credits_limit_daily: 999999 },
      error: null,
    })
    const result = await checkCredits('isaac', 500)
    expect(result.ok).toBe(true)
  })
})

// ─── deductCredits ────────────────────────────────────────────────────────────

describe('deductCredits', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls update on subscriptions table after successful read', async () => {
    mockSingleSub.mockResolvedValue({
      data: { credits_used_today: 5 },
      error: null,
    })
    mockUpdate.mockResolvedValue({ data: null, error: null })

    await deductCredits('user-1', 3)

    // update should have been called with the incremented value
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('does not throw when subscription row is missing', async () => {
    mockSingleSub.mockResolvedValue({ data: null, error: null })
    mockUpdate.mockResolvedValue({ data: null, error: null })

    // Should resolve without throwing
    await expect(deductCredits('ghost-user', 1)).resolves.toBeUndefined()
  })

  it('does not throw on DB update error', async () => {
    mockSingleSub.mockResolvedValue({
      data: { credits_used_today: 0 },
      error: null,
    })
    mockUpdate.mockResolvedValue({ data: null, error: { message: 'write failed' } })

    await expect(deductCredits('user-1', 1)).resolves.toBeUndefined()
  })
})
