'use client'

/**
 * ATLAS v67 — Agent Registry & Run History Page
 * Standalone page for /agents route.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { useState, useEffect, useCallback } from 'react'
import { Bot, Zap, Clock, CheckCircle, XCircle, RefreshCw, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { SectionHeader, AgentBadge, StatusBadge } from '@/components/ui/index'

interface AgentRun {
  id: string
  agent_code: string
  tool_name: string
  status: 'running' | 'completed' | 'failed' | 'queued'
  credits_consumed: number
  duration_ms: number | null
  created_at: string
  completed_at: string | null
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  completed: <CheckCircle size={13} className="text-atlas-green" />,
  failed:    <XCircle    size={13} className="text-atlas-coral" />,
  running:   <RefreshCw  size={13} className="text-atlas-accent animate-spin" />,
  queued:    <Clock      size={13} className="text-atlas-gold" />,
}

const GOD_SQUAD = [
  { code: 'A01', name: 'ORACLE',       role: 'Orchestrator',    color: '#f6ad55' },
  { code: 'A02', name: 'UNDERWRITER',  role: 'Deal Analysis',   color: '#68d391' },
  { code: 'A03', name: 'GENESIS',      role: 'Self-Build',      color: '#b794f4' },
  { code: 'A06', name: 'HERALD',       role: 'Copywriter',      color: '#63b3ed' },
  { code: 'A08', name: 'INVESTIGATOR', role: 'Due Diligence',   color: '#4fd1c5' },
  { code: 'A12', name: 'SPECTER',      role: 'Skip Trace',      color: '#fc8181' },
  { code: 'A15', name: 'OMEN',         role: 'Underwriter',     color: '#f687b3' },
]

export default function AgentsPage() {
  const [runs, setRuns] = useState<AgentRun[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRuns = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/agents/run?limit=30')
      const data = await res.json()
      setRuns(data.runs ?? data.data ?? [])
    } catch {
      setRuns([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRuns() }, [fetchRuns])

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <SectionHeader
        title="Agent Registry"
        subtitle="25-agent God Squad · Run history · Status monitoring"
        badge="GOD SQUAD"
        badgeColor="#f6ad55"
      />

      {/* Agent Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {GOD_SQUAD.map(agent => (
          <div
            key={agent.code}
            className="rounded-xl border border-atlas-border bg-atlas-panel p-4 hover:border-white/20 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0"
                style={{ background: `${agent.color}20`, color: agent.color, border: `1px solid ${agent.color}30` }}
              >
                {agent.code}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-atlas-text">{agent.name}</span>
                  <StatusBadge status="standby" label="STANDBY" />
                </div>
                <p className="text-xs text-atlas-muted">{agent.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Run History */}
      <div className="rounded-xl border border-atlas-border bg-atlas-panel overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-atlas-border">
          <h3 className="text-xs font-bold text-atlas-text uppercase tracking-wider">Recent Runs</h3>
          <button onClick={fetchRuns} className="p-1 rounded hover:bg-white/5 text-atlas-muted">
            <RefreshCw size={12} className={clsx(loading && 'animate-spin')} />
          </button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-atlas-muted text-xs">Loading run history...</div>
        ) : runs.length === 0 ? (
          <div className="p-8 text-center">
            <Bot size={28} className="text-atlas-muted mx-auto mb-3" />
            <p className="text-sm text-atlas-muted">No agent runs yet.</p>
            <p className="text-xs text-atlas-muted mt-1">Run God Mode or a scoring job to see history here.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {runs.map(run => (
              <div key={run.id} className="flex items-center gap-3 px-4 py-3">
                {STATUS_ICON[run.status] ?? <Clock size={13} className="text-atlas-muted" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-atlas-muted">{run.agent_code}</span>
                    <span className="text-xs text-atlas-text">{run.tool_name}</span>
                  </div>
                  <span className="text-[10px] text-atlas-muted">
                    {new Date(run.created_at).toLocaleString()}
                    {run.duration_ms ? ` · ${(run.duration_ms / 1000).toFixed(1)}s` : ''}
                    {run.credits_consumed ? ` · ${run.credits_consumed} credits` : ''}
                  </span>
                </div>
                <ChevronRight size={12} className="text-atlas-muted shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
