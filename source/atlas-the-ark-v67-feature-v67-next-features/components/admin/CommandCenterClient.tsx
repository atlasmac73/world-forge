'use client'

import { useState, useEffect } from 'react'
import {
  Zap, Target, Building2, Swords, Wrench, Brain, Rocket, Shield,
  Globe, Bot, Lock, RefreshCw, CheckCircle, XCircle, Clock,
  AlertTriangle, TrendingUp, ChevronRight, Eye, Check, X
} from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { KillSwitchWidget } from '@/components/KillSwitchWidget'

// ─── Types ────────────────────────────────────────────────────────────────

interface Blueprint {
  id: string
  title: string
  description: string | null
  proposed_by: string
  status: string
  blueprint_type: string | null
  confidence_score: number | null
  simulation_result: {
    tournament_id?: string
    rank?: number | null
    score?: number | null
  } | null
  risk_level: string | null
  review_notes: string | null
  created_at: string
}

interface Sprint {
  sprint_number: number
  name: string
  status: string
  completion_pct: number
  tasks_total: number
  tasks_done: number
  ai_tasks: number
  owner_tasks: number
  notes: string | null
}

interface SystemMetrics {
  totalAgentRuns: number
  activeBlueprints: number
  pendingApprovals: number
  genesisCycles: number
}

// ─── Tab config ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'status',     icon: <Zap size={13} />,       label: '⚡ God Mode Status' },
  { id: 'blueprints', icon: <Target size={13} />,     label: '🧬 Blueprint Queue' },
  { id: 'sprints',    icon: <Wrench size={13} />,     label: '🛠 Sprint Roadmap' },
  { id: 'portals',    icon: <Building2 size={13} />,  label: '🏛 Portal Status' },
  { id: 'agents',     icon: <Bot size={13} />,        label: '🤖 Agent Roster' },
  { id: 'skills',     icon: <Brain size={13} />,      label: '🧠 Skills Matrix' },
  { id: 'expansion',  icon: <Rocket size={13} />,     label: '🚀 Expansion Plan' },
  { id: 'security',   icon: <Shield size={13} />,     label: '🔒 Security Checklist' },
  { id: 'patents',    icon: <Globe size={13} />,      label: '📜 Patent Registry' },
  { id: 'tasks',      icon: <Swords size={13} />,     label: '⚔ You vs AI Tasks' },
  { id: 'deploy',     icon: <Lock size={13} />,       label: '🚦 Deploy Readiness' },
]

// ─── Component ───────────────────────────────────────────────────────────

interface CommandCenterClientProps {
  userId: string
  userRole: string
  userTier: string
}

export function CommandCenterClient({ userId, userRole, userTier }: CommandCenterClientProps) {
  const [activeTab, setActiveTab] = useState('status')
  const [blueprints, setBlueprints] = useState<Blueprint[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loadingBlueprints, setLoadingBlueprints] = useState(false)
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  // Load data when tabs are opened
  useEffect(() => {
    if (activeTab === 'status') fetchMetrics()
    if (activeTab === 'blueprints') fetchBlueprints()
    if (activeTab === 'sprints') fetchSprints()
  }, [activeTab])

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/health')
      const data = await res.json()
      setMetrics({
        totalAgentRuns: data.agent_runs ?? 0,
        activeBlueprints: data.blueprints ?? 0,
        pendingApprovals: data.pending_approvals ?? 0,
        genesisCycles: data.genesis_cycles ?? 0,
      })
    } catch {
      setMetrics({ totalAgentRuns: 0, activeBlueprints: 0, pendingApprovals: 0, genesisCycles: 0 })
    }
  }

  const fetchBlueprints = async () => {
    setLoadingBlueprints(true)
    try {
      const res = await fetch('/api/genesis/blueprints?limit=50')
      const data = await res.json()
      setBlueprints(data.blueprints ?? [])
    } catch {
      toast.error('Failed to load blueprints')
    } finally {
      setLoadingBlueprints(false)
    }
  }

  const fetchSprints = async () => {
    try {
      const res = await fetch('/api/health?include=sprints')
      const data = await res.json()
      setSprints(data.sprints ?? FALLBACK_SPRINTS)
    } catch {
      setSprints(FALLBACK_SPRINTS)
    }
  }

  const reviewBlueprint = async (id: string, action: 'approve' | 'reject' | 'start_review', notes?: string) => {
    setReviewingId(id)
    try {
      const res = await fetch('/api/genesis/blueprints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, review_notes: notes }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(action === 'approve' ? 'Blueprint approved ✓' : action === 'reject' ? 'Blueprint rejected ✗' : 'Blueprint marked under review')
      fetchBlueprints()
    } catch {
      toast.error('Review failed')
    } finally {
      setReviewingId(null)
    }
  }

  return (
    <div className="flex flex-col h-full bg-atlas-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-atlas-border bg-atlas-surface/50">
        <div>
          <div className="text-sm font-bold text-atlas-accent tracking-widest uppercase">
            ATLAS Command Center
          </div>
          <div className="text-[10px] text-atlas-muted">
            v67 Autopoietic Fusion · {userRole.toUpperCase()} · Fleet Dashboard
          </div>
        </div>
        <div className="flex items-center gap-3">
          <KillSwitchWidget variant="full" className="w-48" />
          <button onClick={fetchMetrics} className="text-atlas-muted hover:text-atlas-text" title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-0 border-b border-atlas-border overflow-x-auto scrollbar-hide bg-atlas-surface/30">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-semibold whitespace-nowrap border-b-2 transition-all',
              activeTab === tab.id
                ? 'border-atlas-accent text-atlas-accent bg-atlas-accent/5'
                : 'border-transparent text-atlas-muted hover:text-atlas-text hover:bg-atlas-surface/50'
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">

        {/* ── STATUS TAB ── */}
        {activeTab === 'status' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Platform Version', value: 'v67', color: 'text-atlas-accent', sub: 'Autopoietic Fusion' },
                { label: 'Agent Runs', value: metrics?.totalAgentRuns?.toLocaleString() ?? '—', color: 'text-atlas-gold', sub: 'All time' },
                { label: 'Pending Approvals', value: metrics?.pendingApprovals ?? '—', color: metrics?.pendingApprovals ? 'text-orange-400' : 'text-atlas-muted', sub: 'Blueprints' },
                { label: 'Genesis Cycles', value: metrics?.genesisCycles ?? '—', color: 'text-green-400', sub: 'Total' },
              ].map(stat => (
                <div key={stat.label} className="atlas-panel rounded-xl p-4 text-center">
                  <div className={clsx('text-2xl font-bold', stat.color)}>{stat.value}</div>
                  <div className="text-[9px] text-atlas-muted mt-1 uppercase tracking-wider">{stat.label}</div>
                  <div className="text-[9px] text-atlas-muted">{stat.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* System health */}
              <div className="atlas-panel rounded-xl p-4">
                <div className="text-xs font-bold text-atlas-text mb-3 flex items-center gap-2">
                  <CheckCircle size={13} className="text-green-400" /> System Health
                </div>
                {[
                  { label: 'v66 Base Build', status: 'PASS', color: 'text-green-400' },
                  { label: 'TypeScript (0 errors)', status: 'PASS', color: 'text-green-400' },
                  { label: 'ESLint (0 warnings)', status: 'PASS', color: 'text-green-400' },
                  { label: '22/22 Unit Tests', status: 'PASS', color: 'text-green-400' },
                  { label: 'Kill Switch', status: 'LIVE', color: 'text-green-400' },
                  { label: 'Portal 15 SuperLLM', status: 'LIVE', color: 'text-green-400' },
                  { label: 'Blueprint Queue', status: 'LIVE', color: 'text-green-400' },
                  { label: 'Stripe Billing', status: 'NEEDS KEYS', color: 'text-orange-400' },
                  { label: 'Twilio SMS', status: 'NEEDS A2P', color: 'text-orange-400' },
                  { label: 'Sentry Error Tracking', status: 'NOT SET UP', color: 'text-atlas-muted' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-1 border-b border-atlas-border/30 last:border-0">
                    <span className="text-[11px] text-atlas-muted">{item.label}</span>
                    <span className={clsx('text-[10px] font-semibold', item.color)}>{item.status}</span>
                  </div>
                ))}
              </div>

              {/* Your action items */}
              <div className="atlas-panel rounded-xl p-4">
                <div className="text-xs font-bold text-atlas-text mb-3 flex items-center gap-2">
                  <AlertTriangle size={13} className="text-orange-400" /> Your Action Items
                </div>
                {[
                  { task: 'Rotate Anthropic API key before pushing to GitHub', urgent: true },
                  { task: 'Rotate Supabase service role key', urgent: true },
                  { task: 'Run Supabase migration: supabase/migrations/20260620_autopoietic_schema.sql', urgent: true },
                  { task: 'Run seed_owner.sql after first login', urgent: true },
                  { task: 'Register Twilio A2P 10DLC (2-4 weeks)', urgent: true },
                  { task: 'Create Stripe products for all tiers', urgent: false },
                  { task: 'Add BatchSkipTracing API key to Vercel env', urgent: false },
                  { task: 'Set up Sentry account + DSN', urgent: false },
                  { task: 'Create GitHub personal access token (for ZEUS PRs)', urgent: false },
                ].map(item => (
                  <div key={item.task} className="flex items-start gap-2 py-1 border-b border-atlas-border/30 last:border-0">
                    <div className={clsx('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', item.urgent ? 'bg-red-500' : 'bg-atlas-muted')} />
                    <span className="text-[10px] text-atlas-muted leading-relaxed">{item.task}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── BLUEPRINT QUEUE TAB ── */}
        {activeTab === 'blueprints' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-atlas-text">Blueprint Queue</div>
                <div className="text-[10px] text-atlas-muted mt-0.5">
                  Genesis Cycle proposals awaiting your review. Approve to generate GitHub PR. Reject to dismiss.
                </div>
              </div>
              <button onClick={fetchBlueprints} disabled={loadingBlueprints} className="text-atlas-muted hover:text-atlas-text">
                <RefreshCw size={13} className={clsx(loadingBlueprints && 'animate-spin')} />
              </button>
            </div>

            {blueprints.length === 0 && !loadingBlueprints && (
              <div className="atlas-panel rounded-xl p-8 text-center">
                <div className="text-3xl mb-2">🧬</div>
                <div className="text-xs font-semibold text-atlas-text">No blueprints yet</div>
                <div className="text-[10px] text-atlas-muted mt-1">
                  Run a Genesis Cycle to generate improvement proposals
                </div>
              </div>
            )}

            {blueprints.map(bp => (
              <div key={bp.id} className="atlas-panel rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-atlas-text">{bp.title}</span>
                      <StatusBadge status={bp.status} />
                      {bp.risk_level && <RiskBadge level={bp.risk_level} />}
                    </div>
                    {bp.description && (
                      <div className="text-[10px] text-atlas-muted mt-1 leading-relaxed">{bp.description}</div>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[9px] text-atlas-muted">By: {bp.proposed_by}</span>
                      {bp.blueprint_type && <span className="text-[9px] text-atlas-muted">Type: {bp.blueprint_type}</span>}
                      {bp.confidence_score != null && (
                        <span className="text-[9px] text-atlas-muted">
                          Confidence: <span className={clsx(
                            'font-semibold',
                            bp.confidence_score >= 80 ? 'text-green-400' : bp.confidence_score >= 60 ? 'text-yellow-400' : 'text-red-400'
                          )}>{bp.confidence_score}/100</span>
                        </span>
                      )}
                      {bp.simulation_result?.tournament_id && bp.simulation_result.rank != null && (
                        <span className="text-[9px] text-atlas-gold font-semibold">
                          🏆 SIMULATE rank #{bp.simulation_result.rank}
                          {bp.simulation_result.score != null && ` · ${bp.simulation_result.score}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {bp.status === 'PROPOSED' && (
                  <div className="flex items-center gap-2 pt-3 border-t border-atlas-border">
                    <button
                      onClick={() => reviewBlueprint(bp.id, 'approve')}
                      disabled={reviewingId === bp.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 text-[10px] font-semibold hover:bg-green-500/25 transition-colors disabled:opacity-50"
                    >
                      <Check size={11} /> Approve
                    </button>
                    <button
                      onClick={() => reviewBlueprint(bp.id, 'reject')}
                      disabled={reviewingId === bp.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-[10px] font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      <X size={11} /> Reject
                    </button>
                    <button
                      onClick={() => reviewBlueprint(bp.id, 'start_review')}
                      disabled={reviewingId === bp.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-atlas-surface border border-atlas-border text-atlas-muted text-[10px] hover:text-atlas-text transition-colors disabled:opacity-50"
                    >
                      <Eye size={11} /> Mark Under Review
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── SPRINTS TAB ── */}
        {activeTab === 'sprints' && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-atlas-text mb-4">Sprint Roadmap — v67 Autopoietic Fusion</div>
            {(sprints.length ? sprints : FALLBACK_SPRINTS).map(sprint => (
              <div key={sprint.sprint_number} className="atlas-panel rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-atlas-muted">S{sprint.sprint_number.toString().padStart(2, '0')}</span>
                    <span className="text-xs font-semibold text-atlas-text">{sprint.name}</span>
                    <SprintStatusBadge status={sprint.status} />
                  </div>
                  <span className="text-sm font-bold text-atlas-accent">{sprint.completion_pct}%</span>
                </div>
                <div className="w-full bg-atlas-border rounded-full h-1.5 mb-2">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: `${sprint.completion_pct}%`,
                      backgroundColor: sprint.status === 'COMPLETE' ? '#34d399' : sprint.status === 'IN_PROGRESS' ? '#fbbf24' : '#334155',
                    }}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[9px] text-atlas-muted">
                    AI Tasks: <span className="text-atlas-text">{sprint.ai_tasks}</span>
                  </span>
                  <span className="text-[9px] text-atlas-muted">
                    Your Tasks: <span className="text-orange-400">{sprint.owner_tasks}</span>
                  </span>
                  {sprint.notes && (
                    <span className="text-[9px] text-atlas-muted truncate flex-1">{sprint.notes}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PORTALS STATUS TAB ── */}
        {activeTab === 'portals' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PORTAL_STATUS.map(portal => (
              <div key={portal.id} className="atlas-panel rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-atlas-text">{portal.name}</span>
                  <span className={clsx(
                    'text-[9px] font-bold px-2 py-0.5 rounded-full',
                    portal.status === 'LIVE' ? 'bg-green-500/15 text-green-400' :
                    portal.status === 'STUB' ? 'bg-yellow-500/15 text-yellow-400' :
                    'bg-atlas-border text-atlas-muted'
                  )}>{portal.status}</span>
                </div>
                <div className="w-full bg-atlas-border rounded-full h-1 mb-1">
                  <div className="h-1 rounded-full bg-atlas-accent" style={{ width: `${portal.pct}%` }} />
                </div>
                <span className="text-[9px] text-atlas-muted">{portal.pct}% complete · {portal.note}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── DEPLOY READINESS TAB ── */}
        {activeTab === 'deploy' && (
          <div className="space-y-4">
            <div className="atlas-panel rounded-xl p-5">
              <div className="text-xs font-bold text-atlas-text mb-4">🚦 Deploy Readiness Checklist</div>
              {DEPLOY_CHECKLIST.map(item => (
                <div key={item.label} className="flex items-start gap-3 py-2 border-b border-atlas-border/30 last:border-0">
                  <div className={clsx(
                    'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                    item.done ? 'bg-green-500/20 text-green-400' :
                    item.urgent ? 'bg-red-500/20 text-red-400' :
                    'bg-atlas-surface text-atlas-muted'
                  )}>
                    {item.done ? <Check size={10} /> : item.urgent ? <AlertTriangle size={9} /> : <Clock size={9} />}
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] text-atlas-text font-medium">{item.label}</div>
                    {item.note && <div className="text-[9px] text-atlas-muted mt-0.5">{item.note}</div>}
                  </div>
                  {item.who && (
                    <span className={clsx(
                      'text-[9px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0',
                      item.who === 'YOU' ? 'bg-red-500/15 text-red-400' : 'bg-atlas-accent/15 text-atlas-accent'
                    )}>{item.who}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── OTHER TABS (placeholder content with clear labels) ── */}
        {['agents', 'skills', 'expansion', 'security', 'patents', 'tasks'].includes(activeTab) && (
          <div className="atlas-panel rounded-xl p-8 text-center">
            <div className="text-3xl mb-3">
              {activeTab === 'agents' && '🤖'}
              {activeTab === 'skills' && '🧠'}
              {activeTab === 'expansion' && '🚀'}
              {activeTab === 'security' && '🔒'}
              {activeTab === 'patents' && '📜'}
              {activeTab === 'tasks' && '⚔'}
            </div>
            <div className="text-sm font-bold text-atlas-text mb-2">
              {TABS.find(t => t.id === activeTab)?.label} — Sprint 6 Feature
            </div>
            <div className="text-xs text-atlas-muted max-w-sm mx-auto">
              This tab connects to live Supabase data in Sprint 6.
              {activeTab === 'agents' && ' Agent roster from registry/agents.yml (1,020 agents defined).'}
              {activeTab === 'skills' && ' Skills Matrix from the Skills portal component.'}
              {activeTab === 'security' && ' 100-point security framework checklist.'}
              {activeTab === 'patents' && ' Patent registry from the patents table.'}
              {activeTab === 'tasks' && ' Human approval queue from agent_tasks table.'}
              {activeTab === 'expansion' && ' National expansion roadmap and scale projections.'}
            </div>
            <button
              className="mt-4 flex items-center gap-1 mx-auto text-[10px] text-atlas-accent hover:underline"
              onClick={() => setActiveTab('sprints')}
            >
              <ChevronRight size={11} /> See Sprint Roadmap
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string }> = {
    PROPOSED: { color: 'text-atlas-gold', bg: 'bg-atlas-gold/10 border-atlas-gold/25' },
    UNDER_REVIEW: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/25' },
    APPROVED: { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/25' },
    REJECTED: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/25' },
    DEPLOYED: { color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/25' },
    FAILED: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/25' },
  }
  const c = config[status] ?? { color: 'text-atlas-muted', bg: 'bg-atlas-surface border-atlas-border' }
  return (
    <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded border', c.color, c.bg)}>
      {status}
    </span>
  )
}

function RiskBadge({ level }: { level: string }) {
  const config: Record<string, string> = {
    LOW: 'text-green-400 bg-green-500/10 border-green-500/25',
    MEDIUM: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25',
    HIGH: 'text-orange-400 bg-orange-500/10 border-orange-500/25',
    CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/25',
  }
  return (
    <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded border', config[level] ?? 'text-atlas-muted bg-atlas-surface border-atlas-border')}>
      {level} RISK
    </span>
  )
}

function SprintStatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    COMPLETE: 'text-green-400',
    IN_PROGRESS: 'text-yellow-400',
    PENDING: 'text-atlas-muted',
    BLOCKED: 'text-red-400',
  }
  return <span className={clsx('text-[9px] font-semibold', config[status] ?? 'text-atlas-muted')}>{status}</span>
}

// ─── Static data ──────────────────────────────────────────────────────────

const FALLBACK_SPRINTS: Sprint[] = [
  { sprint_number: 1, name: 'Foundation Merge + Kill Switch', status: 'IN_PROGRESS', completion_pct: 60, tasks_total: 8, tasks_done: 5, ai_tasks: 6, owner_tasks: 2, notes: 'Kill switch live. Schema merged.' },
  { sprint_number: 2, name: 'Portal 15 SuperLLM', status: 'IN_PROGRESS', completion_pct: 40, tasks_total: 10, tasks_done: 4, ai_tasks: 8, owner_tasks: 2, notes: 'Chat mode + Genesis mode live.' },
  { sprint_number: 3, name: 'Model Router + Agent Factory UI', status: 'PENDING', completion_pct: 0, tasks_total: 9, tasks_done: 0, ai_tasks: 7, owner_tasks: 2, notes: null },
  { sprint_number: 4, name: 'Self-Build Engine + Blueprint Queue', status: 'PENDING', completion_pct: 0, tasks_total: 12, tasks_done: 0, ai_tasks: 9, owner_tasks: 3, notes: null },
  { sprint_number: 5, name: 'Stripe Billing + Access Control', status: 'PENDING', completion_pct: 0, tasks_total: 8, tasks_done: 0, ai_tasks: 5, owner_tasks: 3, notes: 'Needs Stripe product setup first.' },
  { sprint_number: 6, name: 'Command Center + Observability', status: 'PENDING', completion_pct: 0, tasks_total: 10, tasks_done: 0, ai_tasks: 8, owner_tasks: 2, notes: null },
  { sprint_number: 7, name: 'Skip Trace + AIN Heatmap', status: 'PENDING', completion_pct: 0, tasks_total: 8, tasks_done: 0, ai_tasks: 6, owner_tasks: 2, notes: 'Needs BatchSkipTracing + Mapbox keys.' },
  { sprint_number: 8, name: 'PWA + Connectors + SMS', status: 'PENDING', completion_pct: 0, tasks_total: 10, tasks_done: 0, ai_tasks: 7, owner_tasks: 3, notes: 'Needs A2P 10DLC (2-4 weeks).' },
]

const PORTAL_STATUS = [
  { id: 'dashboard', name: 'Empire Dashboard', status: 'LIVE', pct: 75, note: 'Real metrics wired' },
  { id: 'deals', name: 'Deal Navigator', status: 'LIVE', pct: 72, note: 'D4D + pipeline active' },
  { id: 'war-room', name: 'Investor War Room', status: 'LIVE', pct: 68, note: 'Analysis tools live' },
  { id: 'skip-trace', name: 'Skip Trace (A12-SPECTER)', status: 'STUB', pct: 45, note: 'Needs BatchSkipTracing API' },
  { id: 'agents', name: 'Agent Lab (255 agents)', status: 'LIVE', pct: 70, note: 'Registry wired' },
  { id: 'genesis', name: 'Genesis Engine', status: 'LIVE', pct: 80, note: '6-phase cycle running' },
  { id: 'superllm', name: 'Portal 15 SuperLLM', status: 'LIVE', pct: 60, note: 'v67 Sprint 2' },
  { id: 'comms', name: 'Comms Hub', status: 'STUB', pct: 40, note: 'Needs Twilio A2P' },
  { id: 'contractors', name: 'Contractor Portal', status: 'LIVE', pct: 65, note: 'Full portal active' },
  { id: 'autopoietic', name: 'Autopoietic Console', status: 'LIVE', pct: 55, note: 'v67 Sprint 2' },
  { id: 'living-graph', name: 'Living Graph', status: 'LIVE', pct: 70, note: 'API wired' },
  { id: 'ain', name: 'AIN Heatmap', status: 'STUB', pct: 30, note: 'Needs Mapbox token' },
]

const DEPLOY_CHECKLIST = [
  { label: 'npm ci → typecheck → lint → test → build', done: true, urgent: false, who: 'DONE', note: '22/22 tests pass. 0 TS errors.' },
  { label: 'Rotate ANTHROPIC_API_KEY (new key from Console)', done: false, urgent: true, who: 'YOU', note: 'Old key may be in local env files' },
  { label: 'Rotate SUPABASE_SERVICE_ROLE_KEY', done: false, urgent: true, who: 'YOU', note: 'Rotate before any GitHub push' },
  { label: 'Add NEXT_PUBLIC_SUPABASE_URL to Vercel env', done: false, urgent: true, who: 'YOU', note: 'Project: kjfwanpwzgcscgsdgekm' },
  { label: 'Add NEXT_PUBLIC_SUPABASE_ANON_KEY to Vercel env', done: false, urgent: true, who: 'YOU', note: null },
  { label: 'Add SUPABASE_SERVICE_ROLE_KEY to Vercel env', done: false, urgent: true, who: 'YOU', note: 'Server-side only. Never expose to client.' },
  { label: 'Add CRON_SECRET to Vercel env', done: false, urgent: true, who: 'YOU', note: 'Generates internally: openssl rand -hex 32' },
  { label: 'Apply DB migrations (auth reconcile, autopoietic, tournament/research, hardening)', done: true, urgent: false, who: 'DONE', note: 'Applied 2026-06-25 to kjfwanpwzgcscgsdgekm. Kill switch, blueprints, models, tournament + research tables live.' },
  { label: 'Sign up as atlasmac73@gmail.com (trigger auto-provisions you as owner)', done: false, urgent: true, who: 'YOU', note: 'auth.users is empty — until you sign up, /admin/* authorizes nobody. handle_new_user() sets role=owner.' },
  { label: 'git push to private repo → Vercel auto-deploys', done: false, urgent: false, who: 'AI', note: 'Claude Code can handle this step' },
  { label: 'Verify /api/health returns 200', done: false, urgent: false, who: 'AI', note: null },
  { label: 'Verify /login and invite flow work', done: false, urgent: false, who: 'YOU', note: null },
]
