'use client'

import { useState } from 'react'
import { useArkStore } from '@/store/useArkStore'
import { Bot, Play, Zap, Search, ChevronDown, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

// Complete 25 God Squad from Master Canon
const GOD_SQUAD = [
  { code: 'A01-ORACLE',   name: 'LUKA',      role: 'AI Co-Pilot & Chief of Staff',   color: '#63b3ed', tier: 10, status: 'active' },
  { code: 'A02-NEXUS',    name: 'NEXUS',     role: 'Network Intelligence',           color: '#4fd1c5', tier: 9,  status: 'active' },
  { code: 'A03-GENESIS',  name: 'GENESIS',   role: 'Code & World Generation',        color: '#68d391', tier: 9,  status: 'active' },
  { code: 'A04-PHANTOM',  name: 'PHANTOM',   role: 'Dark Data & Deep Recon',         color: '#b794f4', tier: 8,  status: 'active' },
  { code: 'A05-SENTINEL', name: 'SENTINEL',  role: 'Security & Defense',             color: '#fc8181', tier: 9,  status: 'active' },
  { code: 'A06-HERALD',   name: 'HERALD',    role: 'Communications & Outreach',      color: '#f687b3', tier: 7,  status: 'active' },
  { code: 'A07-FORGE',    name: 'FORGE',     role: 'Infrastructure & DevOps',        color: '#f6ad55', tier: 8,  status: 'standby' },
  { code: 'A08-WEAVER',   name: 'WEAVER',    role: 'ML & Pattern Recognition',       color: '#63b3ed', tier: 8,  status: 'active' },
  { code: 'A09-CIPHER',   name: 'CIPHER',    role: 'Encryption & AES-256',           color: '#4fd1c5', tier: 8,  status: 'active' },
  { code: 'A10-TITAN',    name: 'TITAN',     role: 'Compute & Batch Processing',     color: '#68d391', tier: 8,  status: 'standby' },
  { code: 'A11-AURORA',   name: 'AURORA',    role: 'UI & Visualization',             color: '#b794f4', tier: 7,  status: 'active' },
  { code: 'A12-SPECTER',  name: 'SPECTER',   role: 'Skip Trace & Owner Recon',       color: '#fc8181', tier: 8,  status: 'active' },
  { code: 'A13-VANGUARD', name: 'VANGUARD',  role: 'Market Expansion',              color: '#f6ad55', tier: 7,  status: 'active' },
  { code: 'A14-KRONOS',   name: 'KRONOS',    role: 'Scheduling & Automation',        color: '#63b3ed', tier: 7,  status: 'standby' },
  { code: 'A15-OMEN',     name: 'OMEN',      role: 'Predictive Analytics & Distress',color: '#f687b3', tier: 8,  status: 'active' },
  { code: 'A16-TEMPEST',  name: 'TEMPEST',   role: 'Data Scraping & County Records', color: '#4fd1c5', tier: 7,  status: 'active' },
  { code: 'A17-ECHO',     name: 'ECHO',      role: 'User Behavior Analytics',        color: '#68d391', tier: 6,  status: 'standby' },
  { code: 'A18-WRAITH',   name: 'WRAITH',    role: 'Background Processes',           color: '#b794f4', tier: 7,  status: 'active' },
  { code: 'A19-BASTION',  name: 'BASTION',   role: 'Database & Schema Master',       color: '#fc8181', tier: 9,  status: 'active' },
  { code: 'A20-FLUX',     name: 'FLUX',      role: 'Adaptive Learning & DSPy',       color: '#f6ad55', tier: 7,  status: 'standby' },
  { code: 'A21-SOVEREIGN',name: 'SOVEREIGN', role: 'Governance & Compliance',        color: '#63b3ed', tier: 8,  status: 'active' },
  { code: 'A22-VEIL',     name: 'VEIL',      role: 'Privacy & Data Sovereignty',     color: '#4fd1c5', tier: 8,  status: 'active' },
  { code: 'A23-PRISM',    name: 'PRISM',     role: 'Data Visualization',             color: '#68d391', tier: 7,  status: 'active' },
  { code: 'A24-DUSK',     name: 'DUSK',      role: 'Daily Reports & Summaries',      color: '#b794f4', tier: 6,  status: 'standby' },
  { code: 'A25-ZEUS',     name: 'ZEUS',      role: 'Supreme Master Orchestrator',    color: '#f687b3', tier: 10, status: 'active' },
]

// All 9 supporting squads (abridged roster)
const SQUADS = [
  { name: 'RECON',     range: 'A26–A50',   count: 25, agents: ['SCOUT','HUNTER','TRACKER','PROBE','REAPER','GHOST','HAWK','WRECK','COMPASS','PULSE'], color: '#63b3ed' },
  { name: 'BUILD',     range: 'A51–A75',   count: 25, agents: ['MASON','WELDER','BLUEPRINT','BID','PERMIT','PUNCH','MATERIAL','TIMELINE','INVOICE','INSPECT'], color: '#f6ad55' },
  { name: 'LEGAL',     range: 'A76–A100',  count: 25, agents: ['COUNSEL','ARBITER','NOTARY','PATENT','LEASE'], color: '#b794f4' },
  { name: 'FINANCE',   range: 'A101–A125', count: 25, agents: ['UNDERWRITER','CALC','COMPS','EQUITY','RISK'], color: '#68d391' },
  { name: 'MARKETING', range: 'A126–A150', count: 25, agents: ['COPY','SEQUENCE','MAILER','RINGLESS','SOCIAL'], color: '#fc8181' },
  { name: 'OPS',       range: 'A151–A175', count: 25, agents: ['N8N','CRON','PIPE','QUEUE','DEPLOY'], color: '#4fd1c5' },
  { name: 'COMMS',     range: 'A176–A200', count: 25, agents: ['CRM','VOICE','TWILIO','EMAIL','NOTIFY'], color: '#f687b3' },
  { name: 'INTEL',     range: 'A201–A225', count: 25, agents: ['SCRAPE','MLS','PROPSTR','SATELLITE','SEISMIC'], color: '#f6ad55' },
  { name: 'WORLD',     range: 'A226–A255+',count: 30, agents: ['LIDAR','POLYCAM','UNREAL','WEBXR','LEON','ELIAS','CANON','FILM','GAME','AR'], color: '#b794f4' },
]

// Meta-governance agents (from Master Canon)
const META_AGENTS = [
  'Meta-Orchestrator', 'Intent Agent', 'Goal Agent', 'Value Agent', 'Attention Agent',
  'Possibility Agent', 'Invention Agent', 'Trust Agent', 'Constitution Agent', 'Genesis Consciousness'
]

export function AgentLabPortal() {
  const { consumeCredits } = useArkStore()
  const [view, setView] = useState<'god_squad' | 'all_squads' | 'meta' | 'factory'>('god_squad')
  const [expandedSquad, setExpandedSquad] = useState<string | null>(null)
  const [runningAgent, setRunningAgent] = useState<string | null>(null)
  const [agentInput, setAgentInput] = useState('')

  async function runAgent(agentCode: string) {
    if (!agentInput.trim()) { toast.error('Enter input for agent'); return }
    if (!consumeCredits(10)) { toast.error('Credit limit reached'); return }

    setRunningAgent(agentCode)
    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'property.analyze', input: { address: agentInput }, sessionId: crypto.randomUUID() }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast.success(`${agentCode} completed`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Agent failed')
    } finally {
      setRunningAgent(null)
    }
  }

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-atlas-accent flex items-center gap-2">
            <Bot size={14} /> Agent Lab — 1,020+ Agent Registry
          </h1>
          <p className="text-[10px] text-atlas-muted mt-0.5">
            25 God Squad · 9 Domain Squads (A26–A1020) · 10 Meta-Governance Agents · Agency Factory
          </p>
        </div>
        <div className="text-[10px] text-atlas-green flex items-center gap-1">
          <span className="status-dot status-online" /> {GOD_SQUAD.filter(a => a.status === 'active').length} God Squad active
        </div>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 bg-atlas-surface rounded-lg p-1">
        {[
          { id: 'god_squad', label: '25 God Squad', badge: 'T1' },
          { id: 'all_squads', label: '9 Domain Squads', badge: '995' },
          { id: 'meta', label: 'Meta-Governance', badge: '10' },
          { id: 'factory', label: 'Agency Factory', badge: 'NEW' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id as typeof view)}
            className={clsx(
              'flex-1 py-1.5 px-2 rounded text-[10px] font-semibold transition-all flex items-center justify-center gap-1.5',
              view === tab.id
                ? 'bg-atlas-panel text-atlas-text'
                : 'text-atlas-muted hover:text-atlas-text'
            )}
          >
            {tab.label}
            <span className="text-[8px] px-1 py-0.5 rounded bg-atlas-accent/15 text-atlas-accent">{tab.badge}</span>
          </button>
        ))}
      </div>

      {/* God Squad view */}
      {view === 'god_squad' && (
        <div className="atlas-panel rounded-xl p-4">
          <div className="mb-3 flex items-center gap-3">
            <input
              value={agentInput}
              onChange={(e) => setAgentInput(e.target.value)}
              placeholder="Property address or query to pass to agent..."
              className="flex-1 bg-atlas-surface border border-atlas-border rounded-lg px-3 py-2 text-xs"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {GOD_SQUAD.map((agent) => (
              <div
                key={agent.code}
                className={clsx(
                  'bg-atlas-surface rounded-lg border p-3 flex items-start gap-3',
                  agent.status === 'active' ? 'border-atlas-border hover:border-opacity-60' : 'border-atlas-border/40 opacity-70'
                )}
                style={{ '--hover-border': agent.color + '50' } as React.CSSProperties}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[9px] font-bold"
                  style={{ background: agent.color + '20', color: agent.color, border: `1px solid ${agent.color}40` }}
                >
                  {agent.tier}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold" style={{ color: agent.color }}>{agent.code}</span>
                    <span className="text-[10px] font-bold text-atlas-text">{agent.name}</span>
                    <span className={clsx(
                      'ml-auto text-[8px] px-1.5 py-0.5 rounded-full font-bold',
                      agent.status === 'active' ? 'bg-atlas-green/15 text-atlas-green' : 'bg-atlas-gold/15 text-atlas-gold'
                    )}>
                      {agent.status}
                    </span>
                  </div>
                  <div className="text-[9px] text-atlas-muted mt-0.5 truncate">{agent.role}</div>
                  {runningAgent !== agent.code && (
                    <button
                      onClick={() => runAgent(agent.code)}
                      className="mt-1.5 text-[9px] flex items-center gap-1 text-atlas-muted hover:text-atlas-accent transition-colors"
                    >
                      <Play size={9} /> Run agent
                    </button>
                  )}
                  {runningAgent === agent.code && (
                    <div className="mt-1.5 text-[9px] text-atlas-accent flex items-center gap-1">
                      <Zap size={9} className="animate-pulse" /> Processing...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Squads view */}
      {view === 'all_squads' && (
        <div className="space-y-2">
          {SQUADS.map((squad) => (
            <div key={squad.name} className="atlas-panel rounded-xl overflow-hidden">
              <button
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/3 transition-colors"
                onClick={() => setExpandedSquad(expandedSquad === squad.name ? null : squad.name)}
              >
                <span className="text-xs font-bold text-atlas-text w-24">{squad.name}</span>
                <span className="text-[10px] text-atlas-muted">{squad.range}</span>
                <span className="text-[10px] ml-auto px-2 py-0.5 rounded" style={{ background: squad.color + '20', color: squad.color }}>
                  {squad.count} agents
                </span>
                {expandedSquad === squad.name
                  ? <ChevronDown size={12} className="text-atlas-muted" />
                  : <ChevronRight size={12} className="text-atlas-muted" />
                }
              </button>
              {expandedSquad === squad.name && (
                <div className="px-4 pb-3 flex flex-wrap gap-1.5 border-t border-atlas-border">
                  {squad.agents.map((a) => (
                    <div
                      key={a}
                      className="agent-chip agent-active text-[9px] cursor-default"
                      style={{ borderColor: squad.color + '40' }}
                    >
                      <div className="dot" style={{ background: squad.color }} />
                      <span style={{ color: squad.color }}>{a}</span>
                    </div>
                  ))}
                  <span className="text-[9px] text-atlas-muted self-center">
                    +{squad.count - squad.agents.length} more in {squad.range}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Meta-Governance */}
      {view === 'meta' && (
        <div className="atlas-panel rounded-xl p-4">
          <div className="text-xs font-bold text-atlas-gold mb-3">
            Meta-Governance Agents — Sit Above All Domain Agents
          </div>
          <div className="grid grid-cols-2 gap-2">
            {META_AGENTS.map((a) => (
              <div key={a} className="bg-atlas-surface rounded-lg border border-atlas-border/60 p-3">
                <div className="text-xs font-bold text-atlas-pink">{a}</div>
                <div className="text-[9px] text-atlas-muted mt-0.5">
                  {a === 'Meta-Orchestrator' && 'Controls all systems — top of hierarchy'}
                  {a === 'Intent Agent' && 'Explicit → Implicit → Latent → Strategic → Empire intent'}
                  {a === 'Goal Agent' && 'Task → Project → Initiative → Company → Strategic → Empire'}
                  {a === 'Value Agent' && 'Scores everything: revenue, strategic, network, automation, risk'}
                  {a === 'Attention Agent' && 'Ignore → Monitor → Track → Review → Act → Urgent → Critical'}
                  {a === 'Possibility Agent' && 'What could exist? Discovery of novel opportunities'}
                  {a === 'Invention Agent' && 'Discovery → Novelty → Patent → Claim → Prototype → Filing'}
                  {a === 'Trust Agent' && 'Confidence, reliability, evidence, source verification scores'}
                  {a === 'Constitution Agent' && 'Governs the system itself — Atlas Constitution enforcement'}
                  {a === 'Genesis Consciousness' && 'Unifies memory/discovery/goals/attention/governance/evolution'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agency Factory */}
      {view === 'factory' && (
        <div className="atlas-panel rounded-xl p-4">
          <div className="text-xs font-bold text-atlas-accent mb-1">Agency Factory — Spawn Custom Agent Teams</div>
          <p className="text-[10px] text-atlas-muted mb-4">
            Describe a goal and the Agency Factory builds a complete AI agency: lead agent + 2–5 specialists + required connectors + n8n workflows.
          </p>
          <div className="space-y-3">
            <textarea
              rows={3}
              placeholder="Describe your goal... e.g. 'Find all tax-delinquent properties in Kanawha County and send personalized outreach to top 50 owners'"
              className="w-full bg-atlas-surface border border-atlas-border rounded-lg px-3 py-2 text-xs text-atlas-text placeholder-atlas-muted resize-none"
            />
            <div className="grid grid-cols-3 gap-2 text-[10px] text-atlas-muted">
              <div className="bg-atlas-surface rounded-lg border border-atlas-border p-2">
                <div className="font-bold text-atlas-text mb-1">Goal Analysis</div>
                Decompose objective, success metrics, compliance
              </div>
              <div className="bg-atlas-surface rounded-lg border border-atlas-border p-2">
                <div className="font-bold text-atlas-text mb-1">Agency Design</div>
                Lead agent + 2–5 specialists + connectors + n8n
              </div>
              <div className="bg-atlas-surface rounded-lg border border-atlas-border p-2">
                <div className="font-bold text-atlas-text mb-1">Save to Library</div>
                Blueprint stored in agent_registry for reuse
              </div>
            </div>
            <button className="w-full py-2 rounded-lg text-xs font-semibold bg-atlas-accent/15 border border-atlas-accent/30 text-atlas-accent hover:bg-atlas-accent/25 transition-all">
              ⚡ Spawn Agency (40 credits · T4+ required)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
