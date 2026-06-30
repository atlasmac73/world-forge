// lib/genesis-hq/constants.ts
// ATLAS v22 — Genesis HQ — UI Constants

import type { GenesisHqIdeaCategory, GenesisHqKanbanColumnKey, GenesisHqPriority } from './types'

export const GENESIS_HQ_CATEGORY_COLORS: Record<GenesisHqIdeaCategory, string> = {
  CAPTURE: '#00f5c4',
  GENERATE: '#ff6b35',
  PRIVACY: '#a855f7',
  CONNECT: '#3b82f6',
  PATENT: '#facc15',
}

export const GENESIS_HQ_PRIORITY_COLORS: Record<GenesisHqPriority, string> = {
  critical: '#ff4444',
  high: '#ff6b35',
  medium: '#facc15',
  low: '#888888',
}

export const GENESIS_HQ_KANBAN_COLUMN_COLORS: Record<GenesisHqKanbanColumnKey, string> = {
  backlog: '#444444',
  inprogress: '#3b82f6',
  review: '#facc15',
  done: '#00f5c4',
}

export const GENESIS_HQ_PHASE_COLORS: Record<string, string> = {
  p1: '#00f5c4',
  p2: '#ff6b35',
  p3: '#a855f7',
  p4: '#facc15',
  p5: '#ec4899',
}

export const GENESIS_HQ_VIEWS = [
  { id: 'roadmap', label: 'ROADMAP', emoji: '🗺' },
  { id: 'kanban', label: 'KANBAN', emoji: '📋' },
  { id: 'mindmap', label: 'MIND MAP', emoji: '🧠' },
  { id: 'ideas', label: '100 IDEAS', emoji: '💡' },
  { id: 'moat', label: 'PATENT MOAT', emoji: '🛡' },
] as const

export const GENESIS_HQ_IDEA_CATEGORIES = [
  'ALL',
  'CAPTURE',
  'GENERATE',
  'PRIVACY',
  'CONNECT',
  'PATENT',
] as const

export const GENESIS_HQ_IP_DISCLAIMER =
  '⚠️ Internal Strategy Content Only — This section contains founder-level IP strategy notes for internal review. This is NOT legal advice. Consult a qualified IP attorney before filing or relying on any IP strategy.'

export const GENESIS_HQ_RESET_CONFIRMATION_TEXT = 'RESET GENESIS HQ'

export const GENESIS_HQ_IDEA_PAGE_SIZE = 20

export const GENESIS_HQ_AUDIT_PAGE_SIZE = 100

export const GENESIS_HQ_COLORS = {
  bgDeep: '#060810',
  bgCard: '#0d1224',
  bgHover: '#111827',
  borderPrimary: '#00f5c440',
  borderSubtle: '#ffffff10',
  textPrimary: '#e0e8ff',
  textSecondary: '#aaaaaa',
  textMuted: '#666666',
  accentCyan: '#00f5c4',
} as const
