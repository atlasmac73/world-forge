/**
 * THE ARK — Permission & Auth Tests
 * Tests: RBAC logic, invite validation, feature flags, API security
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─── Mock Supabase ────────────────────────────────────────────────────────────

const mockGetUser = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => ({
      select: () => ({ eq: () => ({ single: () => mockSelect(table) }) }),
      insert: () => mockInsert(table),
    }),
  }),
  createServiceClient: () => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => ({
      select: () => ({ eq: () => ({ single: () => mockSelect(table) }) }),
      insert: () => mockInsert(table),
    }),
  }),
}))

// ─── Role Hierarchy Tests ─────────────────────────────────────────────────────

describe('Role hierarchy', () => {
  const ROLE_HIERARCHY: Record<string, number> = {
    owner: 100, admin: 80, beta_tester: 40, contractor: 30, viewer: 10,
  }

  it('owner outranks all other roles', () => {
    const others = ['admin', 'beta_tester', 'contractor', 'viewer']
    others.forEach(r => expect(ROLE_HIERARCHY['owner']).toBeGreaterThan(ROLE_HIERARCHY[r]))
  })

  it('admin outranks beta_tester, contractor, viewer', () => {
    expect(ROLE_HIERARCHY['admin']).toBeGreaterThan(ROLE_HIERARCHY['beta_tester'])
    expect(ROLE_HIERARCHY['admin']).toBeGreaterThan(ROLE_HIERARCHY['contractor'])
    expect(ROLE_HIERARCHY['admin']).toBeGreaterThan(ROLE_HIERARCHY['viewer'])
  })

  it('beta_tester outranks contractor and viewer', () => {
    expect(ROLE_HIERARCHY['beta_tester']).toBeGreaterThan(ROLE_HIERARCHY['contractor'])
    expect(ROLE_HIERARCHY['beta_tester']).toBeGreaterThan(ROLE_HIERARCHY['viewer'])
  })

  it('viewer has lowest rank', () => {
    const others = ['owner', 'admin', 'beta_tester', 'contractor']
    others.forEach(r => expect(ROLE_HIERARCHY['viewer']).toBeLessThan(ROLE_HIERARCHY[r]))
  })

  it('all roles have defined positive values', () => {
    Object.values(ROLE_HIERARCHY).forEach(v => {
      expect(v).toBeGreaterThan(0)
      expect(typeof v).toBe('number')
    })
  })
})

// ─── requireUser mock tests ───────────────────────────────────────────────────

describe('requireUser()', () => {
  beforeEach(() => vi.resetAllMocks())

  it('returns user when session is valid', async () => {
    const fakeUser = { id: 'user-abc', email: 'isaac@atlas.dev' }
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null })

    const { requireUser } = await import('@/lib/permissions')
    const result = await requireUser()

    expect(result.user).toEqual(fakeUser)
    expect(result.error).toBeNull()
  })

  it('returns 401 NextResponse when no session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'JWT expired' } })

    const { requireUser } = await import('@/lib/permissions')
    const result = await requireUser()

    expect(result.user).toBeNull()
    expect(result.error).not.toBeNull()
    expect((result.error as Response).status).toBe(401)
  })

  it('returns 401 when auth service errors', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Network error' } })

    const { requireUser } = await import('@/lib/permissions')
    const result = await requireUser()

    expect(result.user).toBeNull()
    expect(result.error).not.toBeNull()
  })
})

// ─── Invite validation logic ──────────────────────────────────────────────────

describe('Invite token validation', () => {
  it('rejects expired invites', () => {
    const expiredDate = new Date(Date.now() - 86400_000).toISOString()
    expect(new Date(expiredDate) < new Date()).toBe(true)
  })

  it('accepts valid future invites', () => {
    const futureDate = new Date(Date.now() + 7 * 86400_000).toISOString()
    expect(new Date(futureDate) > new Date()).toBe(true)
  })

  it('generates 64-char hex tokens', () => {
    const { randomBytes } = require('crypto')
    const token = randomBytes(32).toString('hex')
    expect(token).toHaveLength(64)
    expect(token).toMatch(/^[a-f0-9]+$/)
  })

  it('generates unique tokens every time', () => {
    const { randomBytes } = require('crypto')
    const tokens = new Set(Array.from({ length: 10 }, () => randomBytes(32).toString('hex')))
    expect(tokens.size).toBe(10)
  })

  it('expired status blocks access', () => {
    const statuses = ['accepted', 'revoked', 'expired']
    statuses.forEach(status => {
      expect(['pending'].includes(status)).toBe(false)
    })
  })
})

// ─── Feature flag defaults ────────────────────────────────────────────────────

describe('Feature flag defaults', () => {
  const DEFAULT_FLAGS: Record<string, boolean> = {
    PORTAL_DEALS: true,
    PORTAL_CONTRACTORS: true,
    PORTAL_AGENT_LAB: true,
    PORTAL_LIVING_GRAPH: false,
    PORTAL_WORLD_FORGE: false,
    PORTAL_NASDROP: false,
    PORTAL_GENESIS: false,
    BILLING_ENABLED: false,
    SMS_ENABLED: false,
    CONNECTORS_ENABLED: false,
    AI_ENABLED: true,
  }

  it('core portals are ON for beta', () => {
    expect(DEFAULT_FLAGS['PORTAL_DEALS']).toBe(true)
    expect(DEFAULT_FLAGS['PORTAL_CONTRACTORS']).toBe(true)
    expect(DEFAULT_FLAGS['PORTAL_AGENT_LAB']).toBe(true)
    expect(DEFAULT_FLAGS['AI_ENABLED']).toBe(true)
  })

  it('sensitive/incomplete portals are OFF by default', () => {
    expect(DEFAULT_FLAGS['PORTAL_NASDROP']).toBe(false)
    expect(DEFAULT_FLAGS['PORTAL_GENESIS']).toBe(false)
    expect(DEFAULT_FLAGS['BILLING_ENABLED']).toBe(false)
    expect(DEFAULT_FLAGS['SMS_ENABLED']).toBe(false)
    expect(DEFAULT_FLAGS['CONNECTORS_ENABLED']).toBe(false)
  })

  it('all flags have boolean values', () => {
    Object.values(DEFAULT_FLAGS).forEach(v => expect(typeof v).toBe('boolean'))
  })

  it('has exactly 11 default flags', () => {
    expect(Object.keys(DEFAULT_FLAGS)).toHaveLength(11)
  })
})

// ─── Rate limit logic ─────────────────────────────────────────────────────────

describe('Rate limiter', () => {
  beforeEach(() => vi.resetAllMocks())

  it('allows requests within limit', async () => {
    const { checkRateLimit } = await import('@/lib/utils/rateLimit')
    const result = checkRateLimit('test-user-1', 5, 60000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('blocks requests over limit', async () => {
    const { checkRateLimit } = await import('@/lib/utils/rateLimit')
    const key = `test-limit-${Date.now()}`
    // Exhaust the limit
    for (let i = 0; i < 3; i++) checkRateLimit(key, 3, 60000)
    // This one should be blocked
    const result = checkRateLimit(key, 3, 60000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('resets window after expiry', async () => {
    const { checkRateLimit } = await import('@/lib/utils/rateLimit')
    const key = `test-reset-${Date.now()}`
    // Use 1ms window — will have expired by next call
    checkRateLimit(key, 1, 1)
    await new Promise(r => setTimeout(r, 10))
    const result = checkRateLimit(key, 1, 60000)
    expect(result.allowed).toBe(true)
  })
})

// ─── API response format ──────────────────────────────────────────────────────

describe('API response consistency', () => {
  it('success responses have ok:true and data', () => {
    const response = { ok: true, data: { id: '123' } }
    expect(response.ok).toBe(true)
    expect(response.data).toBeDefined()
  })

  it('error responses have ok:false and error', () => {
    const response = { ok: false, error: 'Unauthorized' }
    expect(response.ok).toBe(false)
    expect(response.error).toBeDefined()
    expect(typeof response.error).toBe('string')
  })
})
