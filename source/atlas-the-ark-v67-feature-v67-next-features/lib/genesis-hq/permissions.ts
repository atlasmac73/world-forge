// lib/genesis-hq/permissions.ts
// ATLAS v67 — Genesis HQ — Access Control
//
// Genesis HQ is the founder's personal product command center. Unlike the
// v22 prototype (which had no role table and gated on a single owner email
// env var), v67 already has real RBAC (profiles.role — see
// lib/permissions/index.ts). Genesis HQ write access reuses that system
// directly: requireOwner() must resolve to the 'owner' role. Any
// authenticated user may *view* Genesis HQ content; only the owner may
// seed, reset, or edit it. All checks happen here, server-side — never
// trust a client-supplied role/flag.

import { NextResponse } from 'next/server'
import { requireUser, requireOwner, isOwner } from '@/lib/permissions'

export class GenesisHqAccessError extends Error {
  status: number
  constructor(message: string, status = 403) {
    super(message)
    this.status = status
  }
}

export interface GenesisHqContext {
  userId: string
  email: string
  isOwner: boolean
}

export async function getGenesisHqContext(): Promise<GenesisHqContext> {
  const { user, error } = await requireUser()
  if (error || !user) {
    throw new GenesisHqAccessError('Not authenticated', 401)
  }
  const owner = await isOwner(user.id)
  return { userId: user.id, email: user.email ?? '', isOwner: owner }
}

/** Any authenticated user can view Genesis HQ content. */
export async function requireGenesisHqAccess(): Promise<GenesisHqContext> {
  return getGenesisHqContext()
}

/** Only profiles.role = 'owner' may seed, reset, or mutate Genesis HQ content. */
export async function requireGenesisHqOwner(): Promise<GenesisHqContext> {
  const { user, error } = await requireUser()
  if (error || !user) {
    throw new GenesisHqAccessError('Not authenticated', 401)
  }
  const { role, error: roleError } = await requireOwner(user.id)
  if (roleError || !role) {
    throw new GenesisHqAccessError('Owner access required for this action', 403)
  }
  return { userId: user.id, email: user.email ?? '', isOwner: true }
}

export function handleGenesisHqPermissionError(error: unknown): NextResponse {
  if (error instanceof GenesisHqAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  console.error('[Genesis HQ] Unexpected error:', error)
  return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
}
