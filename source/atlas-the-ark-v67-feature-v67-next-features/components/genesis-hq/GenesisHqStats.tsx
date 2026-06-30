'use client'

import { ListChecks, Lightbulb, Layers, Columns3 } from 'lucide-react'
import type { GenesisHqStats as Stats } from '@/lib/genesis-hq/types'

export function GenesisHqStats({ stats }: { stats: Stats }) {
  const items = [
    { label: 'Roadmap Progress', value: `${stats.progressPct}%`, sub: `${stats.doneTasks}/${stats.totalTasks} tasks`, icon: <ListChecks size={14} />, color: '#00f5c4' },
    { label: 'Ideas Logged', value: stats.totalIdeas, sub: '100-idea library', icon: <Lightbulb size={14} />, color: '#facc15' },
    { label: 'Phases / Areas', value: `${stats.totalPhases} / ${stats.totalAreas}`, sub: 'Roadmap structure', icon: <Layers size={14} />, color: '#a855f7' },
    { label: 'Kanban', value: stats.kanbanCards, sub: `${stats.kanbanColumns} columns`, icon: <Columns3 size={14} />, color: '#3b82f6' },
  ]

  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map((item) => (
        <div key={item.label} className="atlas-panel p-3 rounded-lg border border-white/10">
          <div className="flex items-center gap-1.5 mb-2" style={{ color: item.color }}>
            {item.icon}
            <span className="text-[9px] font-mono text-slate-400">{item.label}</span>
          </div>
          <div className="text-xl font-bold font-mono" style={{ color: item.color }}>{item.value}</div>
          <div className="text-[9px] text-slate-500 mt-0.5">{item.sub}</div>
        </div>
      ))}
    </div>
  )
}
