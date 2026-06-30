'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { clsx } from 'clsx'
import type { GenesisHqIdea, GenesisHqIdeaCategory } from '@/lib/genesis-hq/types'
import { GENESIS_HQ_IDEA_CATEGORIES, GENESIS_HQ_CATEGORY_COLORS } from '@/lib/genesis-hq/constants'
import { CategoryBadge } from './atoms'

export function IdeaLibraryView({
  ideas,
  total,
  category,
  setCategory,
  search,
  setSearch,
}: {
  ideas: GenesisHqIdea[]
  total: number
  category: GenesisHqIdeaCategory | 'ALL'
  setCategory: (c: GenesisHqIdeaCategory | 'ALL') => void
  search: string
  setSearch: (s: string) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-atlas-panel border border-white/10">
          <Search size={12} className="text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search 100 ideas..."
            className="flex-1 bg-transparent text-[11px] text-slate-300 outline-none placeholder:text-slate-600"
          />
        </div>
        <span className="text-[10px] text-slate-500 font-mono">{total} ideas</span>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {GENESIS_HQ_IDEA_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={clsx(
              'px-2 py-1 rounded text-[10px] font-mono font-bold transition-all',
              category === c ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            )}
            style={category === c && c !== 'ALL' ? { background: `${GENESIS_HQ_CATEGORY_COLORS[c as GenesisHqIdeaCategory]}25`, color: GENESIS_HQ_CATEGORY_COLORS[c as GenesisHqIdeaCategory] } : category === c ? { background: 'rgba(255,255,255,0.15)' } : undefined}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} />)}
      </div>

      {ideas.length === 0 && (
        <div className="text-center py-12 text-slate-600">
          <div className="font-mono text-sm">No ideas match</div>
        </div>
      )}
    </div>
  )
}

function IdeaCard({ idea }: { idea: GenesisHqIdea }) {
  return (
    <div className="atlas-panel rounded-lg border border-white/10 p-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-slate-600 font-mono">#{idea.source_number}</span>
        <CategoryBadge category={idea.category} />
      </div>
      <div className="text-[12px] font-bold text-white">{idea.title}</div>
      <div className="text-[10px] text-slate-400 leading-relaxed">{idea.description}</div>
      <div className="text-[9px] text-slate-600 italic border-t border-white/5 pt-1.5">{idea.patent_direction}</div>
    </div>
  )
}
