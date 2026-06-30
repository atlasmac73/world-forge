/**
 * THE ARK — RBAC Permission Helpers
 * All server-side auth + role enforcement
 * Isaac Brandon Burdette, Sole Inventor
 */

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'

export type AppRole = 'owner' | 'admin' | 'beta_tester' | 'contractor' | 'viewer'

const ROLE_HIERARCHY: Record<AppRole, number> = {
  owner: 100,
  admin: 80,
  beta_tester: 40,
  contractor: 30,
  viewer: 10,
}

// ─── requireUser ─────────────────────────────────────────────────────────────
// Use in any protected API route. Returns user or a 401 NextResponse.

export async function requireUser(): Promise<
  { user: User; error: null } | { user: null; error: NextResponse }
> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return {
      user: null,
      error: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }),
    }
  }
  return { user, error: null }
}

// ─── getUserRole ──────────────────────────────────────────────────────────────

export async function getUserRole(userId: string): Promise<AppRole | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .single()
  return (data?.role as AppRole) ?? null
}

// ─── requireRole ─────────────────────────────────────────────────────────────
// Requires user to have at least the given role level.

export async function requireRole(
  userId: string,
  minRole: AppRole
): Promise<{ role: AppRole; error: null } | { role: null; error: NextResponse }> {
  const role = await getUserRole(userId)
  if (!role) {
    return {
      role: null,
      error: NextResponse.json({ ok: false, error: 'Profile not found' }, { status: 403 }),
    }
  }
  if (ROLE_HIERARCHY[role] < ROLE_HIERARCHY[minRole]) {
    return {
      role: null,
      error: NextResponse.json(
        { ok: false, error: `Requires ${minRole} role or higher` },
        { status: 403 }
      ),
    }
  }
  return { role, error: null }
}

// ─── requireAdmin ────────────────────────────────────────────────────────────

export async function requireAdmin(
  userId: string
): Promise<{ role: AppRole; error: null } | { role: null; error: NextResponse }> {
  return requireRole(userId, 'admin')
}

// ─── requireOwner ────────────────────────────────────────────────────────────

export async function requireOwner(
  userId: string
): Promise<{ role: AppRole; error: null } | { role: null; error: NextResponse }> {
  return requireRole(userId, 'owner')
}

// ─── isAdmin / isOwner (boolean helpers for UI logic) ────────────────────────

export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId)
  return role != null && ROLE_HIERARCHY[role] >= ROLE_HIERARCHY['admin']
}

export async function isOwner(userId: string): Promise<boolean> {
  const role = await getUserRole(userId)
  return role === 'owner'
}
