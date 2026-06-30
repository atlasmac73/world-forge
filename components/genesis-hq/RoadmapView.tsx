'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { ChevronDown, ChevronRight as ChevronRightIcon, CheckCircle2, Circle } from 'lucide-react'
import type { GenesisHqPhase } from '@/lib/genesis-hq/types'
import { PriorityBadge } from './atoms'

export function RoadmapView({
  phases,
  isOwner,
  onToggleTask,
}: {
  phases: GenesisHqPhase[]
  isOwner: boolean
  onToggleTask: (taskId: string, done: boolean) => void
}) {
  if (phases.length === 0) {
    return (
      <div className="text-center py-16 text-slate-600">
        <div className="font-mono text-sm">No roadmap data yet</div>
        <div className="text-[11px] mt-1">Seed Genesis HQ from the Admin tab to load the roadmap</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {phases.map((phase) => (
        <RoadmapPhaseCard key={phase.id} phase={phase} isOwner={isOwner} onToggleTask={onToggleTask} />
      ))}
    </div>
  )
}

function RoadmapPhaseCard({
  phase,
  isOwner,
  onToggleTask,
}: {
  phase: GenesisHqPhase
  isOwner: boolean
  onToggleTask: (taskId: string, done: boolean) => void
}) {
  const [expanded, setExpanded] = useState(phase.status === 'active')
  const tasks = phase.areas?.flatMap((a) => a.tasks ?? []) ?? []
  const done = tasks.filter((t) => t.done).length
  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0

  return (
    <div className="atlas-panel rounded-lg border border-white/10 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/3 transition-all"
      >
        {expanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRightIcon size={14} className="text-slate-500" />}
        <span
          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
          style={{ background: `${phase.color}20`, color: phase.color }}
        >
          {phase.label}
        </span>
        <div className="flex-1">
          <div className="text-sm font-bold text-white">{phase.title}</div>
          <div className="text-[10px] text-slate-500">{phase.eta ?? 'No ETA set'}</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono font-bold" style={{ color: phase.color }}>{pct}%</div>
          <div className="text-[9px] text-slate-500">{done}/{tasks.length} tasks</div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/5 p-3 space-y-3">
          {(phase.areas ?? []).map((area) => (
            <div key={area.id}>
              <div className="text-[11px] font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span>{area.icon}</span>
                <span>{area.title}</span>
              </div>
              <div className="space-y-1">
                {(area.tasks ?? []).map((task) => (
                  <div key={task.id} className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-white/3 group">
                    <button
                      disabled={!isOwner}
                      onClick={() => onToggleTask(task.id, !task.done)}
                      className={clsx('mt-0.5 shrink-0', isOwner ? 'cursor-pointer' : 'cursor-default opacity-60')}
                    >
                      {task.done ? (
                        <CheckCircle2 size={14} className="text-green-400" />
                      ) : (
                        <Circle size={14} className="text-slate-600 group-hover:text-slate-400" />
                      )}
                    </button>
                    <span className={clsx('flex-1 text-[11px]', task.done ? 'text-slate-600 line-through' : 'text-slate-300')}>
                      {task.text}
                    </span>
                    <PriorityBadge priority={task.priority} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
