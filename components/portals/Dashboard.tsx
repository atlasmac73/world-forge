'use client'

import { useEffect, useState } from 'react'
import { useArkStore } from '@/store/useArkStore'
import { Zap, Bot, Layers, Shield, Activity, BarChart3, Globe, FlaskConical, Radio, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { clsx } from 'clsx'

const EMPIRE_METRICS = [
  { label: 'Versions Built',     value: '65',    color: 'text-atlas-accent',  icon: <Zap size={16} /> },
  { label: 'Active Agents',      value: '1,020', color: 'text-atlas-green',   icon: <Bot size={16} /> },
  { label: 'Skills Catalogued',  value: '10,000',color: 'text-atlas-purple',  icon: <Layers size={16} /> },
  { label: 'Patents Filed',      value: 'P001–P100', color: 'text-atlas-gold', icon: <Shield size={16} /> },
  { label: 'Portals',            value: '53+',   color: 'text-atlas-teal',    icon: <Globe size={16} /> },
  { label: 'Categories',         value: '200',   color: 'text-atlas-coral',   icon: <BarChart3 size={16} /> },
  { label: 'DB Status',          value: 'LIVE',  color: 'text-atlas-green',   icon: <Activity size={16} /> },
  { label: 'Vercel',             value: '⚠ DEPLOY', color: 'text-atlas-gold', icon: <AlertTriangle size={16} /> },
]

const EIGHT_LAYERS = [
  { n: 8, name: 'GOVERNANCE & GENESIS CORE', desc: 'Goals · Attention · Trust · Constitution · Possibility', color: 'border-atlas-pink/40 bg-atlas-pink/5' },
  { n: 7, name: 'EVOLUTION',      desc: 'Skill Factory · Agent Factory · Research Lab · Genesis Cycle', color: 'border-atlas-coral/40 bg-atlas-coral/5' },
  { n: 6, name: 'SIMULATION & REALITY', desc: 'Forecasting · WorldForge · Omniverse · Digital Twins', color: 'border-atlas-purple/40 bg-atlas-purple/5' },
  { n: 5, name: 'EXECUTION',      desc: 'Kanban · Automation Engine · Workflows · Atlas Pay', color: 'border-atlas-teal/40 bg-atlas-teal/5' },
  { n: 4, name: 'REASONING',      desc: 'AI Tournament · Model Router · 1,020 Agents · Control Cockpit', color: 'border-atlas-accent/40 bg-atlas-accent/5' },
  { n: 3, name: 'DISCOVERY',      desc: 'Emergence Agents · Living Graph · Next-Best-Action', color: 'border-atlas-green/40 bg-atlas-green/5' },
  { n: 2, name: 'KNOWLEDGE',      desc: 'Knowledge Graph · Memory Engine · Ontology · GIS', color: 'border-atlas-gold/40 bg-atlas-gold/5' },
  { n: 1, name: 'DATA FABRIC',    desc: 'Identity · Permissions · Connectors · Vaults · Object Engine', color: 'border-atlas-accent/30 bg-atlas-accent/3' },
]

const PRIORITIES = [
  { label: 'Vercel Deployment', status: 'CRITICAL', desc: 'Zero active deployments — #1 revenue blocker', color: 'text-atlas-coral', bg: 'bg-atlas-coral/10 border-atlas-coral/30' },
  { label: 'Stripe Price IDs', status: 'BLOCKED', desc: 'All 7 tiers have null stripe_price_id — no billing possible', color: 'text-atlas-gold', bg: 'bg-atlas-gold/10 border-atlas-gold/30' },
  { label: 'Twilio A2P 10DLC', status: 'START NOW', desc: '2-4 week carrier approval — clock starts at submission', color: 'text-atlas-gold', bg: 'bg-atlas-gold/10 border-atlas-gold/30' },
  { label: 'Patent Deadline', status: 'MARCH 2027', desc: 'P001-P100 non-provisionals due March 29, 2027', color: 'text-atlas-accent', bg: 'bg-atlas-accent/10 border-atlas-accent/30' },
  { label: 'ARK Realty', status: '~72% READY', desc: 'Highest-ready build track — push to production', color: 'text-atlas-green', bg: 'bg-atlas-green/10 border-atlas-green/30' },
]

const GOD_SQUAD_PREVIEW = [
  { code: 'A01', name: 'LUKA/ORACLE', color: '#63b3ed' },
  { code: 'A03', name: 'GENESIS', color: '#68d391' },
  { code: 'A06', name: 'HERALD', color: '#f687b3' },
  { code: 'A12', name: 'SPECTER', color: '#fc8181' },
  { code: 'A15', name: 'OMEN', color: '#f687b3' },
  { code: 'A25', name: 'ZEUS', color: '#f687b3' },
]

export function DashboardPortal() {
  const { subscription, agentRuns, setActivePortal } = useArkStore()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const activeRuns = agentRuns.filter(r => r.status === 'running').length

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-atlas-text flex items-center gap-2">
            <span className="text-atlas-gold">◈</span> THE ARK — Empire Dashboard
          </h1>
          <p className="text-xs text-atlas-muted mt-0.5">
            Atlas Genesis Matrix LLC · Isaac Brandon Burdette, Sole Founder &amp; Inventor · v65
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono text-atlas-accent">{time.toLocaleString()}</div>
          <div className="text-[10px] text-atlas-muted mt-0.5 flex items-center gap-1 justify-end">
            <span className="status-dot status-online" />
            Supabase ACTIVE_HEALTHY
          </div>
        </div>
      </div>

      {/* Critical blockers */}
      {PRIORITIES.slice(0,3).map((p, i) => (
        <div key={i} className={clsx('rounded-lg border px-4 py-3 flex items-center justify-between', p.bg)}>
          <div className="flex items-center gap-3">
            <AlertTriangle size={14} className={p.color} />
            <span className={clsx('text-xs font-bold', p.color)}>{p.label}</span>
            <span className="text-xs text-atlas-muted">{p.desc}</span>
          </div>
          <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded', p.color, p.bg)}>
            {p.status}
          </span>
        </div>
      ))}

      {/* Empire metrics */}
      <div className="grid grid-cols-4 gap-3 xl:grid-cols-8">
        {EMPIRE_METRICS.map((m, i) => (
          <div key={i} className="atlas-panel rounded-lg p-3 text-center">
            <div className={clsx('text-lg font-bold leading-tight', m.color)}>{m.value}</div>
            <div className="text-[9px] text-atlas-muted mt-1 uppercase tracking-wide">{m.label}</div>
          </div>
        ))}
      </div>

      {/* 8 Super-Layers */}
      <div className="atlas-panel rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-atlas-accent uppercase tracking-widest">
            The 8 Super-Layers — Master Architecture
          </h2>
          <span className="text-[9px] text-atlas-muted">Canonical Spec v1.0</span>
        </div>
        <div className="space-y-1.5">
          {EIGHT_LAYERS.map((layer) => (
            <div key={layer.n} className={clsx('rounded-lg border px-3 py-2 flex items-center gap-3', layer.color)}>
              <span className="text-[10px] font-bold text-atlas-muted w-6 text-right">{layer.n}</span>
              <span className="text-xs font-bold text-atlas-text w-48 flex-shrink-0">{layer.name}</span>
              <span className="text-[10px] text-atlas-muted">{layer.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* God Squad Preview */}
        <div className="atlas-panel rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-atlas-accent uppercase tracking-widest">
              God Squad — 25 Elite Agents
            </h2>
            <button
              onClick={() => setActivePortal('agents')}
              className="text-[10px] text-atlas-muted hover:text-atlas-accent transition-colors"
            >
              View All 1,020 →
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {GOD_SQUAD_PREVIEW.map((a) => (
              <div
                key={a.code}
                className="agent-chip agent-active"
                style={{ borderColor: a.color + '50' }}
              >
                <div className="dot" style={{ background: a.color, boxShadow: `0 0 4px ${a.color}` }} />
                <span className="text-[10px]" style={{ color: a.color }}>{a.code}</span>
                <span className="text-[10px] text-atlas-muted">{a.name}</span>
              </div>
            ))}
            <div className="agent-chip agent-idle" style={{ borderColor: 'rgba(246,173,85,0.3)' }}>
              <div className="dot" />
              <span className="text-[10px] text-atlas-gold">+19 more active</span>
            </div>
          </div>
          {activeRuns > 0 && (
            <div className="mt-2 text-[10px] text-atlas-accent flex items-center gap-1">
              <span className="animate-pulse">●</span> {activeRuns} agents running now
            </div>
          )}
        </div>

        {/* North Star */}
        <div className="atlas-panel rounded-xl p-4">
          <h2 className="text-xs font-bold text-atlas-gold uppercase tracking-widest mb-3">
            The North Star
          </h2>
          <p className="text-xs text-atlas-text leading-relaxed">
            <span className="text-atlas-accent font-semibold">ATLAS</span> turns any word, file, address, idea, image, voice note, or command into an expandable intelligence graph that can become a portal action, agent, workflow, prompt pack, connector, software feature, marketplace product, or full autonomous build plan — while keeping the user in control of their data, models, permissions, and privacy.
          </p>
          <div className="mt-3 pt-3 border-t border-atlas-border">
            <div className="text-[9px] text-atlas-muted mb-1.5">FIRST PRINCIPLES</div>
            <div className="flex flex-wrap gap-1">
              {['User owns identity', 'User controls permissions', 'Atlas manages context', 'Atlas remembers', 'Atlas discovers', 'Atlas recommends', 'Atlas executes', 'Atlas learns'].map(p => (
                <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-atlas-panel border border-atlas-border text-atlas-muted">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Atlas Constitution preview */}
      <div className="atlas-panel rounded-xl p-4">
        <h2 className="text-xs font-bold text-atlas-green uppercase tracking-widest mb-2">
          Atlas Constitution — 10 Core Clauses
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            'Atlas cannot sell user data.',
            'Atlas cannot secretly train on user data.',
            'Atlas cannot bypass user permissions.',
            'Atlas cannot revoke user ownership.',
            'Atlas cannot create hidden surveillance.',
            'ATLAS seeks stewardship, never ownership.',
            'Administrators do not have unrestricted access.',
            'Founder approval for irreversible changes.',
            'Private data NEVER crosses users.',
            '"If the user saw this, would they be glad Atlas did it?"'
          ].map((clause, i) => (
            <div key={i} className="flex items-start gap-2 text-[10px] text-atlas-muted">
              <span className="text-atlas-green mt-0.5 flex-shrink-0">✓</span>
              {clause}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
