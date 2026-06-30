'use client'

/**
 * ATLAS v67 — Genesis HQ Portal
 * Thin wrapper so the portal map in components/app/TheArkApp.tsx stays
 * consistent with the other portals. All logic lives in components/genesis-hq/*.
 * Unrelated to the existing Genesis Cycle self-improvement engine
 * (components/portals/Genesis.tsx, lib/autopoietic/heartbeat.ts).
 */

import { GenesisHqCommandCenter } from '@/components/genesis-hq/GenesisHqCommandCenter'

export function GenesisHQPortal() {
  return <GenesisHqCommandCenter />
}
