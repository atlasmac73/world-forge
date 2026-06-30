/**
 * THE ARK — RBAC Function Tests
 * Tests for requireRole, requireAdmin, requireOwner, getUserRole, isAdmin, isOwner.
 * These are the server-side enforcement gates used across all protected routes.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Supabase ────────────────────────────────────────────────────────────
const mockGetUser = vi.fn()
const mockSingleProfile = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
  createServiceClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingleProfile,
    })),
  })),
  createAuthenticatedClient: vi.fn(),
}))

import {
  requireRole,
  requireAdmin,
  requireOwner,
  getUserRole,
  isAdmin,
  isOwner,
} from '@/lib/permissions'

// ─── getUserRole ──────────────────────────────────────────────────────────────

describe('getUserRole', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns role when profile exists', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'admin' }, error: null })
    const role = await getUserRole('user-1')
    expect(role).toBe('admin')
  })

  it('returns owner role correctly', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'owner' }, error: null })
    const role = await getUserRole('owner-1')
    expect(role).toBe('owner')
  })

  it('returns viewer role correctly', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'viewer' }, error: null })
    const role = await getUserRole('viewer-1')
    expect(role).toBe('viewer')
  })

  it('returns null when profile does not exist', async () => {
    mockSingleProfile.mockResolvedValue({ data: null, error: { message: 'Not found' } })
    const role = await getUserRole('ghost-user')
    expect(role).toBeNull()
  })

  it('returns null when data has no role field', async () => {
    mockSingleProfile.mockResolvedValue({ data: {}, error: null })
    const role = await getUserRole('partial-user')
    expect(role).toBeNull()
  })
})

// ─── requireRole ─────────────────────────────────────────────────────────────

describe('requireRole', () => {
  beforeEach(() => vi.clearAllMocks())

  it('grants access when user role meets minimum', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'admin' }, error: null })
    const result = await requireRole('user-1', 'admin')
    expect(result.error).toBeNull()
    expect(result.role).toBe('admin')
  })

  it('grants access when user role exceeds minimum (owner satisfies admin req)', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'owner' }, error: null })
    const result = await requireRole('user-1', 'admin')
    expect(result.error).toBeNull()
    expect(result.role).toBe('owner')
  })

  it('returns 403 when role is below minimum', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'viewer' }, error: null })
    const result = await requireRole('user-1', 'admin')
    expect(result.role).toBeNull()
    expect(result.error).not.toBeNull()
    expect((result.error as Response).status).toBe(403)
  })

  it('returns 403 when contractor tries to access admin route', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'contractor' }, error: null })
    const result = await requireRole('user-1', 'admin')
    expect(result.role).toBeNull()
    expect((result.error as Response).status).toBe(403)
  })

  it('returns 403 when profile is not found', async () => {
    mockSingleProfile.mockResolvedValue({ data: null, error: { message: 'No row' } })
    const result = await requireRole('ghost-user', 'viewer')
    expect(result.role).toBeNull()
    expect((result.error as Response).status).toBe(403)
  })

  it('beta_tester satisfies contractor minimum', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'beta_tester' }, error: null })
    const result = await requireRole('user-1', 'contractor')
    expect(result.error).toBeNull()
    expect(result.role).toBe('beta_tester')
  })

  it('contractor does NOT satisfy beta_tester minimum', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'contractor' }, error: null })
    const result = await requireRole('user-1', 'beta_tester')
    expect(result.role).toBeNull()
    expect((result.error as Response).status).toBe(403)
  })

  it('error response body is JSON with ok:false', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'viewer' }, error: null })
    const result = await requireRole('user-1', 'admin')
    const body = await (result.error as Response).json()
    expect(body.ok).toBe(false)
    expect(typeof body.error).toBe('string')
  })
})

// ─── requireAdmin ────────────────────────────────────────────────────────────

describe('requireAdmin', () => {
  beforeEach(() => vi.clearAllMocks())

  it('grants access to admin role', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'admin' }, error: null })
    const result = await requireAdmin('admin-user')
    expect(result.error).toBeNull()
    expect(result.role).toBe('admin')
  })

  it('grants access to owner (outranks admin)', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'owner' }, error: null })
    const result = await requireAdmin('owner-user')
    expect(result.error).toBeNull()
  })

  it('blocks beta_tester from admin routes', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'beta_tester' }, error: null })
    const result = await requireAdmin('beta-user')
    expect(result.role).toBeNull()
    expect((result.error as Response).status).toBe(403)
  })

  it('blocks viewer from admin routes', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'viewer' }, error: null })
    const result = await requireAdmin('viewer-user')
    expect((result.error as Response).status).toBe(403)
  })
})

// ─── requireOwner ────────────────────────────────────────────────────────────

describe('requireOwner', () => {
  beforeEach(() => vi.clearAllMocks())

  it('grants access to owner', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'owner' }, error: null })
    const result = await requireOwner('isaac')
    expect(result.error).toBeNull()
    expect(result.role).toBe('owner')
  })

  it('blocks admin from owner-only routes', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'admin' }, error: null })
    const result = await requireOwner('admin-user')
    expect(result.role).toBeNull()
    expect((result.error as Response).status).toBe(403)
  })

  it('blocks every non-owner role', async () => {
    const nonOwner = ['admin', 'beta_tester', 'contractor', 'viewer'] as const
    for (const role of nonOwner) {
      mockSingleProfile.mockResolvedValue({ data: { role }, error: null })
      const result = await requireOwner('user-x')
      expect(result.role).toBeNull()
    }
  })
})

// ─── isAdmin ─────────────────────────────────────────────────────────────────

describe('isAdmin', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns true for admin', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'admin' }, error: null })
    expect(await isAdmin('user-1')).toBe(true)
  })

  it('returns true for owner (above admin threshold)', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'owner' }, error: null })
    expect(await isAdmin('user-1')).toBe(true)
  })

  it('returns false for beta_tester', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'beta_tester' }, error: null })
    expect(await isAdmin('user-1')).toBe(false)
  })

  it('returns false for viewer', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'viewer' }, error: null })
    expect(await isAdmin('user-1')).toBe(false)
  })

  it('returns false when profile not found', async () => {
    mockSingleProfile.mockResolvedValue({ data: null, error: { message: 'not found' } })
    expect(await isAdmin('ghost-user')).toBe(false)
  })
})

// ─── isOwner ─────────────────────────────────────────────────────────────────

describe('isOwner', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns true only for owner role', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'owner' }, error: null })
    expect(await isOwner('isaac')).toBe(true)
  })

  it('returns false for admin (strict equality)', async () => {
    mockSingleProfile.mockResolvedValue({ data: { role: 'admin' }, error: null })
    expect(await isOwner('admin-user')).toBe(false)
  })

  it('returns false for all non-owner roles', async () => {
    const roles = ['admin', 'beta_tester', 'contractor', 'viewer'] as const
    for (const role of roles) {
      mockSingleProfile.mockResolvedValue({ data: { role }, error: null })
      expect(await isOwner('user-x')).toBe(false)
    }
  })

  it('returns false when profile not found', async () => {
    mockSingleProfile.mockResolvedValue({ data: null, error: null })
    expect(await isOwner('ghost')).toBe(false)
  })
})
