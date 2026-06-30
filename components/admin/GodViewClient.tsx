'use client'

/**
 * ATLAS v67 — GodView Client
 * 5-panel founder/admin executive dashboard.
 * Panel layout: AIN · Akashic · Cerebro · Genesis · Navigator
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Map, Database, Bot, Zap, Compass, Activity, Users, TrendingUp,
  AlertTriangle, CheckCircle, RefreshCw, Shield, Settings, Lock
} from 'lucide-react'
import { GodViewPanel, GodViewGrid, GodViewStatRow } from '@/components/godview/GodViewPanel'
import { MetricCard } from '@/components/ui/MetricCard'
import { StatusBadge } from '@/components/ui/index'
import { KillSwitchWidget } from '@/components/KillSwitchWidget'

interface GodViewClientProps {
  userId: string
  userEmail: string
}

interface HealthData {
  overall: string
  checks: Array<{ name: string; status: string; detail?: string; ms?: number }>
  agent_runs?: number
  blueprints?: number
  pending_approvals?: number
  genesis_cycles?: number
  sprints?: Array<{
    sprint_number: number; name: string; status: string; completion_pct: number
    tasks_total: number; ai_tasks: number; owner_tasks: number; notes: string | null
  }>
}

interface IntegrationSummary {
  total: number
  connected: number
  critical_down: number
  system_status: string
}

export function GodViewClient({ userId, userEmail }: GodViewClientProps) {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [integrations, setIntegrations] = useState<IntegrationSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [healthRes, intRes] = await Promise.all([
        fetch('/api/health?include=sprints').then(r => r.json()),
        fetch('/api/admin/integrations').then(r => r.json()),
      ])
      if (healthRes.overall) setHealth(healthRes)
      if (intRes.ok) setIntegrations(intRes.data.summary)
    } catch {
      // silent
    } finally {
      setLoading(false)
      setLastRefresh(new Date())
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const checks = health?.checks ?? []
  const passChecks = checks.filter(c => c.status === 'ok').length
  const sprints = health?.sprints ?? []
  const activeSprint = sprints.find(s => s.status === 'IN_PROGRESS')

  return (
    <div className="min-h-screen bg-atlas-dark text-atlas-text p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-mono text-atlas-gold tracking-widest mb-1">
            ATLAS GENESIS MATRIX · FOUNDER COMMAND CENTER
          </div>
          <h1 className="text-xl font-bold text-atlas-text">GOD VIEW</h1>
          <p className="text-xs text-atlas-muted mt-0.5">
            {userEmail} · {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <KillSwitchWidget variant="full" />
          <button
            onClick={fetchData}
            className="p-2 rounded-lg hover:bg-white/5 text-atlas-muted hover:text-atlas-text transition-colors"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="System Status"
          value={health?.overall === 'ok' ? 'NOMINAL' : health?.overall === 'degraded' ? 'DEGRADED' : loading ? '...' : 'UNKNOWN'}
          icon={<Activity size={14} />}
          color={health?.overall === 'ok' ? 'green' : health?.overall === 'degraded' ? 'gold' : 'cyan'}
          loading={loading}
        />
        <MetricCard
          label="Health Checks"
          value={loading ? '...' : `${passChecks}/${checks.length}`}
          icon={<CheckCircle size={14} />}
          color="green"
          loading={loading}
        />
        <MetricCard
          label="Integrations"
          value={loading ? '...' : `${integrations?.connected ?? 0}/${integrations?.total ?? 0}`}
          icon={<Compass size={14} />}
          color={integrations?.critical_down ? 'red' : 'cyan'}
          loading={loading}
        />
        <MetricCard
          label="Agent Runs"
          value={loading ? '...' : (health?.agent_runs ?? 0).toLocaleString()}
          icon={<Bot size={14} />}
          color="purple"
          loading={loading}
        />
      </div>

      {/* 5-Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Panel 1: AIN — Market Control */}
        <GodViewPanel
          type="ain"
          title="AIN · Market Control"
          subtitle="WV County Intelligence Network"
          icon={Map}
          status="online"
          badge="55 COUNTIES"
          className="row-span-1"
        >
          <div className="space-y-0.5">
            <GodViewStatRow label="WV Counties Monitored" value="55" color="#63b3ed" />
            <GodViewStatRow label="Data Freshness" value="DEMO" color="#f6ad55" sublabel="Connect live data in Integrations" />
            <GodViewStatRow label="Highest Distress" value="McDowell (94)" color="#fc8181" />
            <GodViewStatRow label="AIN Status" value="ACTIVE" color="#68d391" />
          </div>
          <div className="mt-4 pt-3 border-t border-white/5">
            <a href="/admin/integrations" className="text-xs text-atlas-accent hover:underline">
              → Connect live county data
            </a>
          </div>
        </GodViewPanel>

        {/* Panel 2: Akashic — Memory & Audit */}
        <GodViewPanel
          type="akashic"
          title="Akashic · Memory Layer"
          subtitle="Audit, Artifacts & Lineage"
          icon={Database}
          status="online"
        >
          <div className="space-y-0.5">
            <GodViewStatRow label="Blueprints Proposed" value={health?.blueprints ?? 0} color="#b794f4" />
            <GodViewStatRow label="Pending Approval" value={health?.pending_approvals ?? 0} color={health?.pending_approvals ? '#f6ad55' : '#68d391'} />
            <GodViewStatRow label="Genesis Cycles" value={health?.genesis_cycles ?? 0} color="#b794f4" />
            <GodViewStatRow label="Artifact Store" value="ACTIVE" color="#68d391" />
          </div>
          <div className="mt-4 pt-3 border-t border-white/5">
            <a href="/admin/audit-logs" className="text-xs text-atlas-purple hover:underline">
              → View audit logs
            </a>
          </div>
        </GodViewPanel>

        {/* Panel 3: Cerebro — Agent Matrix */}
        <GodViewPanel
          type="cerebro"
          title="Cerebro · Agent Matrix"
          subtitle="Active Agents & Run History"
          icon={Bot}
          status="online"
          badge="GOD SQUAD"
        >
          <div className="space-y-1.5">
            {[
              { code: 'A01', name: 'ORACLE', role: 'Orchestrator', status: 'standby' as const },
              { code: 'A02', name: 'UNDERWRITER', role: 'Deal Analysis', status: 'standby' as const },
              { code: 'A03', name: 'GENESIS', role: 'Self-Build', status: 'standby' as const },
              { code: 'A08', name: 'INVESTIGATOR', role: 'Due Diligence', status: 'standby' as const },
              { code: 'A12', name: 'SPECTER', role: 'Skip Trace', status: 'standby' as const },
            ].map(a => (
              <div key={a.code} className="flex items-center justify-between py-1 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-atlas-muted">{a.code}</span>
                  <span className="text-xs text-white">{a.name}</span>
                </div>
                <span className="text-[9px] text-atlas-muted">{a.role}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-white/5">
            <span className="text-[10px] text-atlas-muted">Total runs: </span>
            <span className="text-[10px] font-mono text-atlas-green">{health?.agent_runs ?? 0}</span>
          </div>
        </GodViewPanel>

        {/* Panel 4: Genesis — Autopoietic Status */}
        <GodViewPanel
          type="genesis"
          title="Genesis · Autopoietic"
          subtitle="Self-Build Engine Status"
          icon={Zap}
          status={health?.pending_approvals ? 'alert' : 'standby'}
          badge="APPROVAL-GATED"
        >
          {activeSprint ? (
            <div className="space-y-0.5">
              <GodViewStatRow label={`Sprint ${activeSprint.sprint_number}`} value={`${activeSprint.completion_pct}%`} color="#f6ad55" />
              <GodViewStatRow label="Sprint Name" value={activeSprint.name} color="#e2e8f0" />
              <GodViewStatRow label="AI Tasks" value={activeSprint.ai_tasks} color="#b794f4" />
              <GodViewStatRow label="Your Tasks" value={activeSprint.owner_tasks} color="#68d391" />
            </div>
          ) : (
            <p className="text-xs text-atlas-muted">No active sprint. Schema_v67.sql required.</p>
          )}
          <div className="mt-4 pt-3 border-t border-white/5 space-y-1">
            <div className="flex items-center gap-1.5">
              <Lock size={10} className="text-atlas-gold" />
              <span className="text-[10px] text-atlas-muted">Human approval required at PROMOTE phase</span>
            </div>
            <a href="/admin/command-center" className="text-xs text-atlas-gold hover:underline block">
              → Command Center
            </a>
          </div>
        </GodViewPanel>

        {/* Panel 5: Navigator — Portal + System Map */}
        <GodViewPanel
          type="navigator"
          title="Navigator · Portal Map"
          subtitle="System Health & Checks"
          icon={Compass}
          status={health?.overall === 'ok' ? 'online' : 'alert'}
          className="col-span-1 lg:col-span-2"
        >
          <div className="grid grid-cols-2 gap-x-6 gap-y-0">
            {checks.slice(0, 10).map(check => (
              <div key={check.name} className="flex items-center gap-2 py-1.5 border-b border-white/5">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  check.status === 'ok' ? 'bg-atlas-green' :
                  check.status === 'degraded' ? 'bg-atlas-gold animate-pulse' :
                  'bg-atlas-coral'
                }`} />
                <span className="text-[10px] text-atlas-muted truncate">{check.name}</span>
                {check.ms && <span className="text-[9px] text-white/20 ml-auto">{check.ms}ms</span>}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <a href="/admin/launch-readiness" className="text-xs text-atlas-teal hover:underline">
              → Launch Readiness Checklist
            </a>
            <a href="/admin/system-health" className="text-xs text-atlas-teal hover:underline">
              → System Health
            </a>
            <a href="/admin/agent-tasks" className="text-xs text-atlas-teal hover:underline">
              → Agent Tasks (Self-Build)
            </a>
            <a href="/admin/billing" className="text-xs text-atlas-teal hover:underline">
              → Billing Dashboard
            </a>
            <a href="/admin/source-map" className="text-xs text-atlas-teal hover:underline">
              → Source Map / Version Archive
            </a>
            <a href="/admin/research-arena" className="text-xs text-atlas-teal hover:underline">
              → Research Arena (Tournament + Notebook)
            </a>
            <a href="/admin/site-capture" className="text-xs text-atlas-teal hover:underline">
              → Site Capture (Photo → Measurement)
            </a>
          </div>
        </GodViewPanel>
      </div>

      {/* Sprint Roadmap Summary */}
      {sprints.length > 0 && (
        <div className="rounded-xl border border-atlas-border bg-atlas-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-atlas-text">Sprint Roadmap</h3>
            <a href="/admin/command-center" className="text-xs text-atlas-accent">View full →</a>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {sprints.slice(0, 8).map(s => (
              <div key={s.sprint_number} className="rounded-lg border border-white/8 bg-white/3 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-mono text-atlas-muted">S{s.sprint_number}</span>
                  <StatusBadge
                    status={s.status === 'IN_PROGRESS' ? 'active' : s.status === 'COMPLETE' ? 'live' : s.status === 'BLOCKED' ? 'error' : 'pending'}
                    label={s.status}
                    pulse={s.status === 'IN_PROGRESS'}
                    className="text-[8px]"
                  />
                </div>
                <p className="text-[10px] text-atlas-text leading-tight">{s.name}</p>
                <div className="mt-2 w-full h-1 rounded-full bg-white/5">
                  <div
                    className="h-1 rounded-full bg-atlas-accent transition-all"
                    style={{ width: `${s.completion_pct}%` }}
                  />
                </div>
                <span className="text-[9px] text-atlas-muted mt-1 block">{s.completion_pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-[9px] font-mono text-white/15 pb-4">
        ATLAS GENESIS MATRIX · ISAAC BRANDON BURDETTE · SOLE FOUNDER & INVENTOR · PATENT PENDING P001-P100
      </div>
    </div>
  )
}
