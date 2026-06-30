'use client'

import { useState } from 'react'
import { CheckCircle2, Clock, Zap, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

const PHASES = [
  { n:1,  name:'Foundation Intelligence',    stage:'A_build_now', prRange:'PR-001–100', status:'in_progress', pct:45, priority:'critical',
    purpose:'Create the Atlas Core — data fabric, identity, graph, memory, connectors',
    outcome:'Atlas can understand users, data, relationships, and context',
    systems:['Identity Engine','Permission Engine','Object Engine','Knowledge Graph','Memory Engine','Event Bus','Discovery Engine','Connector Engine'] },
  { n:2,  name:'Chief of Staff Intelligence',stage:'A_build_now', prRange:'PR-101–110', status:'in_progress', pct:35, priority:'critical',
    purpose:'Create persistent executive intelligence layer — LUKA',
    outcome:'Atlas knows what matters. User asks "what do I need to know today?" and Atlas answers.',
    systems:['Persistent Chief of Staff','Goal Engine','Decision Engine','Opportunity Radar','Risk Radar','Command Center','Workflow Builder','Simulation Engine'] },
  { n:3,  name:'Execution Intelligence',     stage:'A_build_now', prRange:'PR-111–120', status:'in_progress', pct:80, priority:'high',
    purpose:'Convert recommendations into action — close the loop',
    outcome:'Atlas helps execute work, tracks outcomes, self-improves',
    systems:['Execution Engine','Outcome Tracking (PR-115)','Feedback Loop (PR-116)','Autonomous Task Drafting (PR-117)','Permissioned Execution (PR-118)','Workflow Runtime (PR-119)','Self-Improvement Queue (PR-120)'] },
  { n:4,  name:'Opportunity OS',             stage:'B_revenue',   prRange:'PR-121–160', status:'pending', pct:10, priority:'high',
    purpose:'Turn Atlas into an opportunity discovery platform',
    outcome:'Atlas identifies opportunities before users do',
    systems:['Opportunity Graph','Opportunity Scoring','Relationship Intelligence','Deal Intelligence','Leverage Engine'] },
  { n:5,  name:'Vertical Products',          stage:'B_revenue',   prRange:'PR-161–200', status:'pending', pct:25, priority:'critical',
    purpose:'Build sellable products — Contractor OS, Investor OS, Business OS',
    outcome:'First paying customers. ARK Realty (~72% ready), ARK Legal (~70% ready)',
    systems:['Contractor OS + AllTrades','Investor War Room','Deal Analysis','Property Intelligence','Acquisition Pipeline','ARK Realty','ARK Legal'] },
  { n:6,  name:'Marketplace & Knowledge',    stage:'C_scale',     prRange:'PR-201–250', status:'planned', pct:0, priority:'medium',
    purpose:'Turn systems into reusable assets others can buy',
    outcome:'Users contribute value; skills marketplace live',
    systems:['Skill Marketplace','Workflow Marketplace','Playbook Library','Knowledge Network','Agent Templates'] },
  { n:7,  name:'Community & Network',        stage:'C_scale',     prRange:'PR-251–300', status:'planned', pct:0, priority:'medium',
    purpose:'Create network effects — users help users',
    outcome:'AIN flywheel — each subscriber makes ATLAS more valuable',
    systems:['Communities','Referrals','Reputation Graph','Collaboration','Opportunity Sharing','Appalachian Network'] },
  { n:8,  name:'Platform & Agents',          stage:'D_platform',  prRange:'PR-301–400', status:'planned', pct:0, priority:'high',
    purpose:'Atlas becomes a platform others build on',
    outcome:'Others build agents, skills, connectors on THE ARK',
    systems:['Agent Runtime','Agent Registry','Workflow Factory','Connector Marketplace','Developer APIs','ATLAS Creator API'] },
  { n:9,  name:'Appalachian Opportunity',    stage:'E_regional',  prRange:'PR-401–500', status:'planned', pct:0, priority:'medium',
    purpose:'Regional infrastructure for WV/Appalachian market',
    outcome:'Atlas becomes the data layer for the entire Appalachian corridor',
    systems:['Local Opportunity Exchange','Business Network','Property Network','Capital Network','Workforce Network','55 WV Counties'] },
  { n:10, name:'Genesis Matrix',             stage:'F_vision',    prRange:'PR-501–999', status:'planned', pct:0, priority:'future',
    purpose:'Long-term self-improving federation vision',
    outcome:'Atlas evolves into large-scale intelligence and opportunity platform',
    systems:['Federation','Self-Improvement','Advanced GraphRAG','Ecosystem Coordination','Opportunity Commons','Constitutional Governance','OMNIFOLD™ Full Realization'] },
]

const PR_REGISTRY = [
  { n:115, code:'PR-115', title:'Outcome Tracking Engine',      status:'complete', phase:3 },
  { n:116, code:'PR-116', title:'Execution Feedback Loop',      status:'complete', phase:3 },
  { n:117, code:'PR-117', title:'Autonomous Task Drafting',     status:'pending',  phase:3 },
  { n:118, code:'PR-118', title:'Permissioned Execution',       status:'complete', phase:3 },
  { n:119, code:'PR-119', title:'Workflow Run Engine',          status:'complete', phase:3 },
  { n:120, code:'PR-120', title:'Self-Improvement Queue',       status:'complete', phase:3 },
]

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  A_build_now: { label: 'Build Now', color: '#fc8181' },
  B_revenue:   { label: 'Revenue',   color: '#f6ad55' },
  C_scale:     { label: 'Scale',     color: '#68d391' },
  D_platform:  { label: 'Platform',  color: '#63b3ed' },
  E_regional:  { label: 'Regional',  color: '#b794f4' },
  F_vision:    { label: 'Vision',    color: '#4fd1c5' },
}

export function PhaseRoadmapPortal() {
  const [expanded, setExpanded] = useState<number | null>(1)
  const [view, setView] = useState<'phases' | 'prs'>('phases')

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-bold text-atlas-accent flex items-center gap-2">
          <Zap size={14} /> 10-Phase Build Roadmap
        </h1>
        <div className="flex gap-1 bg-atlas-surface rounded-lg p-1">
          {(['phases', 'prs'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={clsx('px-3 py-1 rounded text-xs capitalize transition-all',
                view === v ? 'bg-atlas-panel text-atlas-text' : 'text-atlas-muted hover:text-atlas-text'
              )}
            >
              {v === 'phases' ? '10 Phases' : 'PR Registry'}
            </button>
          ))}
        </div>
      </div>

      {view === 'phases' && (
        <div className="space-y-2">
          {/* Build order summary */}
          <div className="atlas-panel rounded-xl p-3 flex flex-wrap gap-2">
            {Object.entries(STAGE_LABELS).map(([key, { label, color }]) => (
              <div key={key} className="flex items-center gap-1.5 text-[10px]">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span style={{ color }}>{label}</span>
                <span className="text-atlas-muted">
                  ({PHASES.filter(p => p.stage === key).map(p => `Ph${p.n}`).join(',')})
                </span>
              </div>
            ))}
          </div>

          {PHASES.map((phase) => {
            const stageConfig = STAGE_LABELS[phase.stage]
            return (
              <div key={phase.n} className="atlas-panel rounded-xl overflow-hidden">
                <button
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/2 transition-colors"
                  onClick={() => setExpanded(expanded === phase.n ? null : phase.n)}
                >
                  {/* Phase number */}
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: stageConfig.color + '20',
                      color: stageConfig.color,
                      border: `1px solid ${stageConfig.color}40`
                    }}>
                    {phase.n}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-xs font-bold text-atlas-text">{phase.name}</div>
                    <div className="text-[9px] text-atlas-muted mt-0.5">{phase.prRange}</div>
                  </div>
                  {/* Progress */}
                  <div className="w-24">
                    <div className="flex justify-between text-[9px] mb-1">
                      <span className="text-atlas-muted">Progress</span>
                      <span style={{ color: stageConfig.color }}>{phase.pct}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${phase.pct}%`, background: stageConfig.color }} />
                    </div>
                  </div>
                  {/* Status badge */}
                  <span className={clsx(
                    'text-[9px] px-2 py-0.5 rounded font-bold',
                    phase.status === 'in_progress' ? 'bg-atlas-accent/15 text-atlas-accent' :
                    phase.status === 'complete' ? 'bg-atlas-green/15 text-atlas-green' :
                    'bg-atlas-muted/15 text-atlas-muted'
                  )}>
                    {phase.status === 'in_progress' ? 'ACTIVE' : phase.status === 'pending' ? 'NEXT' : phase.status.toUpperCase()}
                  </span>
                  {expanded === phase.n ? <ChevronDown size={12} className="text-atlas-muted" /> : <ChevronRight size={12} className="text-atlas-muted" />}
                </button>

                {expanded === phase.n && (
                  <div className="px-4 pb-4 border-t border-atlas-border/50">
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <div className="text-[9px] text-atlas-muted uppercase tracking-wide mb-1">Purpose</div>
                        <div className="text-xs text-atlas-text">{phase.purpose}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-atlas-muted uppercase tracking-wide mb-1">Outcome</div>
                        <div className="text-xs text-atlas-text">{phase.outcome}</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-[9px] text-atlas-muted uppercase tracking-wide mb-1.5">Systems ({phase.systems.length})</div>
                      <div className="flex flex-wrap gap-1.5">
                        {phase.systems.map((s) => (
                          <span key={s} className="text-[9px] px-2 py-0.5 rounded bg-atlas-surface border border-atlas-border text-atlas-muted">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {view === 'prs' && (
        <div className="atlas-panel rounded-xl p-4">
          <div className="text-xs font-bold text-atlas-text mb-3">Phase 3 PR Registry — Execution Intelligence</div>
          <div className="space-y-2">
            {PR_REGISTRY.map((pr) => (
              <div key={pr.n} className="flex items-center gap-3 py-2.5 border-b border-atlas-border/50 last:border-0">
                <span className="text-[10px] font-mono text-atlas-accent w-14">{pr.code}</span>
                <span className="flex-1 text-xs text-atlas-text">{pr.title}</span>
                <span className={clsx(
                  'text-[9px] px-2 py-0.5 rounded font-bold',
                  pr.status === 'complete' ? 'bg-atlas-green/15 text-atlas-green' : 'bg-atlas-gold/15 text-atlas-gold'
                )}>
                  {pr.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[9px] text-atlas-muted">
            Full PR registry: PR-001 through PR-XXXX maps to the 10-phase build order.
            Each PR = a discrete buildable feature with table schema, API routes, and UI components.
          </div>
        </div>
      )}
    </div>
  )
}
