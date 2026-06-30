'use client'

import { AlertTriangle } from 'lucide-react'
import type { GenesisHqMoatSection } from '@/lib/genesis-hq/types'
import { GENESIS_HQ_IP_DISCLAIMER } from '@/lib/genesis-hq/constants'

export function PatentMoatView({ sections }: { sections: GenesisHqMoatSection[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-400/5 border border-yellow-400/20 text-[10px] text-yellow-300/80 leading-relaxed">
        <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
        <span>{GENESIS_HQ_IP_DISCLAIMER}</span>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-12 text-slate-600">
          <div className="font-mono text-sm">No moat data yet</div>
          <div className="text-[11px] mt-1">Seed Genesis HQ from the Admin tab to load this section</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {sections.map((section) => (
            <div key={section.id} className="atlas-panel rounded-lg border p-3" style={{ borderColor: `${section.color}30` }}>
              <div className="flex items-center gap-2 mb-2">
                <span>{section.icon}</span>
                <span className="text-[11px] font-mono font-bold" style={{ color: section.color }}>{section.title}</span>
              </div>
              <ul className="space-y-1">
                {(section.items ?? []).map((item) => (
                  <li key={item.id} className="text-[10px] text-slate-400 flex items-start gap-1.5">
                    <span style={{ color: section.color }}>•</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
