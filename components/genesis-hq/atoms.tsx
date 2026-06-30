'use client'

import { GENESIS_HQ_PRIORITY_COLORS, GENESIS_HQ_CATEGORY_COLORS, GENESIS_HQ_PHASE_COLORS } from '@/lib/genesis-hq/constants'
import type { GenesisHqPriority, GenesisHqIdeaCategory } from '@/lib/genesis-hq/types'

export function PriorityBadge({ priority }: { priority: GenesisHqPriority }) {
  const color = GENESIS_HQ_PRIORITY_COLORS[priority]
  return (
    <span
      className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded font-mono"
      style={{ background: `${color}20`, color }}
    >
      {priority}
    </span>
  )
}

export function CategoryBadge({ category }: { category: GenesisHqIdeaCategory }) {
  const color = GENESIS_HQ_CATEGORY_COLORS[category]
  return (
    <span
      className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded font-mono"
      style={{ background: `${color}20`, color }}
    >
      {category}
    </span>
  )
}

export function PhaseTag({ slug, label }: { slug: string; label: string }) {
  const color = GENESIS_HQ_PHASE_COLORS[slug] ?? '#64748b'
  return (
    <span
      className="text-[9px] font-bold px-1.5 py-0.5 rounded font-mono"
      style={{ background: `${color}20`, color }}
    >
      {label}
    </span>
  )
}

export function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 mb-2">
      {icon}
      <span>{children}</span>
    </div>
  )
}
