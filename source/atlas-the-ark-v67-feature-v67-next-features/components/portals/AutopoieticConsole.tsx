'use client'

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Cpu, Zap, RefreshCw, ChevronDown, ChevronRight,
  CheckCircle, XCircle, AlertTriangle, Clock, ShieldAlert, Trophy,
} from 'lucide-react'
import { KillSwitchWidget } from '@/components/KillSwitchWidget'

// ─── Types ────────────────────────────────────────────────────────────────────

type GenesisPhase = 'SENSE' | 'INTERPRET' | 'MUTATE' | 'SIMULATE' | 'PROMOTE' | 'LEARN'
type CycleStatus = 'running' | 'complete' | 'failed'
type BlueprintStatus = 'PROPOSED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'

interface GenesisCycle {
  id: string
  cycle_number: number
  phase: GenesisPhase | null
  status: CycleStatus
  triggered_by: string | null
  sense_data: Record<string, unknown> | null
  interpret_data: Record<string, unknown> | null
  mutate_data: Record<string, unknown> | null
  simulate_data: Record<string, unknown> | null
  promote_data: Record<string, unknown> | null
  error_log: string | null
  started_at: string
  completed_at: string | null
}

interface SimulationResult {
  tournament_id?: string
  rank?: number | null
  score?: number | null
  breakdown?: Record<string, number> | null
  judged_at?: string
}

interface Blueprint {
  id: string
  title: string
  description: string | null
  blueprint_type: string | null
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null
  confidence_score: number | null
  simulation_result: SimulationResult | null
  status: BlueprintStatus
  proposed_by: string | null
  cycle_id: string | null
  created_at: string
}

interface StatusResponse {
  ok: boolean
  kill_switch_armed: boolean
  rate_limit: {
    can_trigger_now: boolean
    min_interval_minutes: number
    next_eligible_at: string | null
  }
  cycles: GenesisCycle[]
  pending_blueprints: Blueprint[]
  pending_blueprint_count: number
}

const RISK_COLOR: Record<string, string> = {
  LOW: 'bg-green-900/30 text-green-400 border-green-800/40',
  MEDIUM: 'bg-atlas-gold/15 text-atlas-gold border-atlas-gold/30',
  HIGH: 'bg-orange-900/30 text-orange-400 border-orange-800/40',
  CRITICAL: 'bg-red-900/30 text-red-400 border-red-800/40',
}

const STATUS_COLOR: Record<string, string> = {
  running: 'bg-atlas-accent/15 text-atlas-accent border-atlas-accent/30',
  complete: 'bg-green-900/30 text-green-400 border-green-800/40',
  failed: 'bg-red-900/30 text-red-400 border-red-800/40',
}

export function AutopoieticConsolePortal() {
  const [data, setData] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)
  const [actingOn, setActingOn] = useState<string | null>(null)
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/autopoietic/status')
      const json = await res.json()
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? 'Failed to load Autopoietic status')
        return
      }
      setData(json)
    } catch {
      toast.error('Failed to reach Autopoietic engine')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleTrigger() {
    setTriggering(true)
    try {
      const res = await fetch('/api/autopoietic/trigger', { method: 'POST' })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        toast.error(json.blocked_reason ?? json.error ?? 'Cycle blocked')
      } else {
        toast.success(`Genesis Cycle complete — ${json.blueprints_proposed} blueprint(s) proposed`)
      }
      await load()
    } catch {
      toast.error('Failed to trigger Genesis Cycle')
    } finally {
      setTriggering(false)
    }
  }

  async function handleApproval(blueprintId: string, action: 'approve' | 'reject') {
    setActingOn(blueprintId)
    try {
      const res = await fetch('/api/heartbeat/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprint_id: blueprintId, action }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? 'Failed to update blueprint')
      } else {
        toast.success(json.message ?? 'Blueprint updated')
      }
      await load()
    } catch {
      toast.error('Failed to reach approval API')
    } finally {
      setActingOn(null)
    }
  }

  if (loading && !data) {
    return (
      <div className="atlas-panel rounded-xl p-8 text-center text-atlas-muted text-sm max-w-5xl">
        Loading Autopoietic Console...
      </div>
    )
  }

  if (!data) {
    return (
      <div className="atlas-panel rounded-xl p-8 text-center text-atlas-coral text-sm max-w-5xl">
        Failed to load Autopoietic Console — owner/admin access required.
      </div>
    )
  }

  const armed = data.kill_switch_armed
  const canTrigger = data.rate_limit.can_trigger_now && !triggering

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="atlas-panel rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Cpu size={16} className="text-atlas-accent" />
              <h1 className="text-sm font-bold text-atlas-accent">Autopoietic Console</h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                armed ? STATUS_COLOR.failed : STATUS_COLOR.complete
              }`}>
                {armed ? 'KILL SWITCH ARMED' : 'SYSTEM ACTIVE'}
              </span>
            </div>
            <p className="text-[11px] text-atlas-muted">
              Genesis Cycle engine — SENSE → INTERPRET → MUTATE → SIMULATE → PROMOTE → LEARN.
              No code is ever auto-deployed; every blueprint waits for human approval.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load()}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-atlas-border text-atlas-muted hover:text-atlas-text hover:border-atlas-accent/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <KillSwitchWidget variant="full" className="w-48" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="atlas-panel rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-atlas-accent">{data.pending_blueprint_count}</div>
          <div className="text-[10px] text-atlas-muted mt-1">Pending Blueprints</div>
        </div>
        <div className="atlas-panel rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-atlas-gold">{data.cycles[0]?.phase ?? '—'}</div>
          <div className="text-[10px] text-atlas-muted mt-1">Last Cycle Phase</div>
        </div>
        <div className="atlas-panel rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-atlas-purple">
            {data.rate_limit.can_trigger_now ? 'Ready' : 'Cooling Down'}
          </div>
          <div className="text-[10px] text-atlas-muted mt-1">
            {data.rate_limit.can_trigger_now
              ? `Min ${data.rate_limit.min_interval_minutes}m between cycles`
              : `Next eligible ${data.rate_limit.next_eligible_at ? new Date(data.rate_limit.next_eligible_at).toLocaleTimeString() : '—'}`}
          </div>
        </div>
      </div>

      {/* Trigger */}
      <div className="atlas-panel rounded-xl p-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs text-atlas-muted">
          <Zap size={13} className="text-atlas-accent" />
          Manually run one Genesis Cycle tick now (subject to kill switch + rate limit).
        </div>
        <button
          onClick={handleTrigger}
          disabled={!canTrigger}
          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-atlas-accent/15 text-atlas-accent border border-atlas-accent/30 hover:bg-atlas-accent/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Zap size={13} /> {triggering ? 'Running Cycle...' : 'Run Genesis Cycle Now'}
        </button>
      </div>

      {/* Pending blueprints */}
      <div className="atlas-panel rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-atlas-border">
          <h3 className="text-white text-sm font-semibold flex items-center gap-2">
            <ShieldAlert size={13} className="text-atlas-gold" /> Pending Blueprint Approvals
          </h3>
        </div>
        {data.pending_blueprints.length === 0 ? (
          <div className="px-5 py-8 text-center text-atlas-muted text-sm">
            No blueprints awaiting review.
          </div>
        ) : (
          <div className="divide-y divide-atlas-border">
            {data.pending_blueprints.map((bp) => (
              <div key={bp.id} className="px-5 py-3 space-y-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-atlas-text font-medium truncate">{bp.title}</span>
                    {bp.simulation_result?.rank === 1 && (
                      <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 bg-atlas-gold/15 text-atlas-gold border-atlas-gold/30">
                        <Trophy size={9} /> TOP PICK
                      </span>
                    )}
                    {bp.risk_level && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${RISK_COLOR[bp.risk_level]}`}>
                        {bp.risk_level}
                      </span>
                    )}
                    {bp.blueprint_type && (
                      <span className="text-[9px] text-atlas-muted px-1.5 py-0.5 rounded bg-white/5 shrink-0">
                        {bp.blueprint_type}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApproval(bp.id, 'approve')}
                      disabled={actingOn === bp.id}
                      className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-green-900/30 text-green-400 border border-green-800/40 hover:bg-green-900/50 transition-colors disabled:opacity-40"
                    >
                      <CheckCircle size={10} /> Approve
                    </button>
                    <button
                      onClick={() => handleApproval(bp.id, 'reject')}
                      disabled={actingOn === bp.id}
                      className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-red-900/30 text-red-400 border border-red-800/40 hover:bg-red-900/50 transition-colors disabled:opacity-40"
                    >
                      <XCircle size={10} /> Reject
                    </button>
                  </div>
                </div>
                {bp.description && (
                  <p className="text-[11px] text-atlas-muted">{bp.description}</p>
                )}
                {bp.simulation_result?.tournament_id && (
                  <div className="flex items-center flex-wrap gap-2 text-[10px] rounded-lg bg-atlas-gold/5 border border-atlas-gold/20 px-2.5 py-1.5">
                    <span className="flex items-center gap-1 text-atlas-gold font-semibold">
                      <Trophy size={10} /> SIMULATE eval
                    </span>
                    {bp.simulation_result.rank != null && (
                      <span className="text-atlas-text">Rank #{bp.simulation_result.rank}</span>
                    )}
                    {bp.simulation_result.score != null && (
                      <span className="text-atlas-text">Score {bp.simulation_result.score}</span>
                    )}
                    {bp.simulation_result.breakdown && Object.keys(bp.simulation_result.breakdown).length > 0 && (
                      <span className="text-atlas-muted">
                        {Object.entries(bp.simulation_result.breakdown)
                          .map(([k, v]) => `${k} ${v}`)
                          .join(' · ')}
                      </span>
                    )}
                    <a
                      href="/admin/research-arena"
                      className="text-atlas-accent hover:underline ml-auto"
                    >
                      view arena →
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-3 text-[10px] text-atlas-muted/70">
                  {bp.confidence_score != null && <span>Confidence: {bp.confidence_score}%</span>}
                  <span className="flex items-center gap-1"><Clock size={9} /> {new Date(bp.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cycle history */}
      <div className="atlas-panel rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-atlas-border">
          <h3 className="text-white text-sm font-semibold flex items-center gap-2">
            <Cpu size={13} className="text-atlas-accent" /> Cycle History
          </h3>
        </div>
        {data.cycles.length === 0 ? (
          <div className="px-5 py-8 text-center text-atlas-muted text-sm">
            No Genesis Cycles have run yet.
          </div>
        ) : (
          <div className="divide-y divide-atlas-border">
            {data.cycles.map((cycle) => {
              const isOpen = expandedCycle === cycle.id
              return (
                <div key={cycle.id}>
                  <button
                    onClick={() => setExpandedCycle(isOpen ? null : cycle.id)}
                    className="w-full px-5 py-2.5 flex items-center gap-3 text-left hover:bg-white/5 transition-colors"
                  >
                    {isOpen ? <ChevronDown size={12} className="text-atlas-muted shrink-0" /> : <ChevronRight size={12} className="text-atlas-muted shrink-0" />}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${STATUS_COLOR[cycle.status]}`}>
                      {cycle.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-atlas-text flex-1 truncate">
                      Cycle #{cycle.cycle_number} · {cycle.phase ?? '—'}
                      {cycle.triggered_by ? ` · ${cycle.triggered_by}` : ''}
                    </span>
                    {cycle.error_log && <AlertTriangle size={11} className="text-red-400 shrink-0" />}
                    <span className="text-[10px] text-atlas-muted shrink-0 flex items-center gap-1">
                      <Clock size={9} /> {new Date(cycle.started_at).toLocaleString()}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pl-10 space-y-2">
                      {cycle.error_log && (
                        <div className="text-[11px] text-red-400 bg-red-900/10 border border-red-800/30 rounded-lg p-2">
                          {cycle.error_log}
                        </div>
                      )}
                      {([
                        ['SENSE', cycle.sense_data],
                        ['INTERPRET', cycle.interpret_data],
                        ['MUTATE', cycle.mutate_data],
                        ['SIMULATE', cycle.simulate_data],
                        ['PROMOTE', cycle.promote_data],
                      ] as const).map(([label, value]) => (
                        value ? (
                          <div key={label} className="text-[10px]">
                            <span className="text-atlas-muted/70 font-semibold">{label}</span>
                            <pre className="mt-1 text-atlas-muted bg-black/20 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          </div>
                        ) : null
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
