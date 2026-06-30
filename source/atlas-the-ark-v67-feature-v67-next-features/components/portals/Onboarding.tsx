'use client'

import { useState } from 'react'
import { useArkStore } from '@/store/useArkStore'
import { Zap, CheckCircle2, Circle, ChevronRight, Globe, Building2, Home, TrendingUp, Wrench, GraduationCap, Palette, Settings } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

const ROLES = [
  { id: 'real_estate',           label: 'Real Estate',          icon: <Home size={20} />,         desc: 'Investor, wholesaler, agent', color: '#63b3ed' },
  { id: 'construction',          label: 'Construction',          icon: <Wrench size={20} />,       desc: 'Contractor, builder, GC',     color: '#f6ad55' },
  { id: 'investing',             label: 'Investing',             icon: <TrendingUp size={20} />,   desc: 'Portfolio, analysis, deals',  color: '#68d391' },
  { id: 'property_management',   label: 'Property Management',   icon: <Building2 size={20} />,    desc: 'Tenants, rents, vendors',     color: '#b794f4' },
  { id: 'business_operations',   label: 'Business Operations',   icon: <Settings size={20} />,     desc: 'CRM, workflows, automation',  color: '#4fd1c5' },
  { id: 'learning',              label: 'Learning',              icon: <GraduationCap size={20} />,desc: 'Skills, knowledge, growth',   color: '#fc8181' },
  { id: 'creator',               label: 'Creator',               icon: <Palette size={20} />,      desc: 'Content, transmedia, art',    color: '#f687b3' },
  { id: 'custom',                label: 'Custom',                icon: <Globe size={20} />,         desc: 'Define your own path',        color: '#63b3ed' },
]

const CONNECTORS = [
  { id: 'google',    label: 'Google',     desc: 'Drive, Gmail, Calendar, Contacts, Photos',    available: true },
  { id: 'microsoft', label: 'Microsoft',  desc: '365, OneDrive, Outlook, Teams',               available: true },
  { id: 'github',    label: 'GitHub',     desc: 'Repos, issues, CI/CD, code',                  available: true },
  { id: 'supabase',  label: 'Supabase',   desc: 'Live DB · kjfwanpwzgcscgsdgekm · ACTIVE',     available: true },
  { id: 'notion',    label: 'Notion',     desc: 'Pages, databases, tasks',                     available: false },
  { id: 'slack',     label: 'Slack',      desc: 'Messages, channels, files',                   available: true },
  { id: 'dropbox',   label: 'Dropbox',    desc: 'Files, folders, shared links',                available: false },
]

const STEPS = ['Role', 'Connect', 'Discover', 'Graph']

export function OnboardingPortal() {
  const { setActivePortal } = useArkStore()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<string | null>(null)
  const [connected, setConnected] = useState<string[]>(['supabase'])
  const [discovered, setDiscovered] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(false)
  const [bootstrapComplete, setBootstrapComplete] = useState(false)
  const [discoveredItems, setDiscoveredItems] = useState<string[]>([])

  function toggleConnector(id: string) {
    setConnected(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  async function runDiscovery() {
    setBootstrapping(true)
    await new Promise(r => setTimeout(r, 1500))
    setDiscoveredItems([
      '47 WV properties from AIN data',
      '15 skill categories in Supabase',
      '25 God Squad agents active',
      '9 deal pipeline stages',
      '7 WV legal offer templates',
      '13 Leon Therano lore entries',
      'US Census ACS5 2024 data (WV + Broomfield CO)',
      '105 patents tracked (P001-P100)',
    ])
    setDiscovered(true)
    setBootstrapping(false)
    setStep(4)
  }

  function completeOnboarding() {
    setBootstrapComplete(true)
    toast.success('User Graph v1 created! THE ARK is ready.')
    setTimeout(() => setActivePortal('dashboard'), 1500)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="text-center">
        <div className="text-3xl mb-2">◈</div>
        <h1 className="text-lg font-bold text-atlas-text">Welcome to THE ARK</h1>
        <p className="text-xs text-atlas-muted mt-1">
          Atlas Onboarding Intelligence Engine — Create your User Graph in under 15 minutes
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={clsx(
              'flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-all',
              step > i + 1 ? 'bg-atlas-green text-atlas-dark' :
              step === i + 1 ? 'bg-atlas-accent text-atlas-dark' :
              'bg-atlas-panel border border-atlas-border text-atlas-muted'
            )}>
              {step > i + 1 ? <CheckCircle2 size={12} /> : i + 1}
            </div>
            <span className={clsx('text-[10px]', step === i + 1 ? 'text-atlas-text font-semibold' : 'text-atlas-muted')}>
              {s}
            </span>
            {i < STEPS.length - 1 && <ChevronRight size={10} className="text-atlas-muted" />}
          </div>
        ))}
      </div>

      {/* Step 1: Role */}
      {step === 1 && (
        <div className="atlas-panel rounded-xl p-5">
          <h2 className="text-sm font-bold text-atlas-text mb-1">What are you trying to do?</h2>
          <p className="text-xs text-atlas-muted mb-4">Atlas uses this to personalize your graph, agents, and skills from day 1.</p>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => { setRole(r.id); setStep(2) }}
                className={clsx(
                  'flex items-start gap-3 p-3 rounded-lg border text-left transition-all',
                  role === r.id ? 'text-atlas-text' : 'border-atlas-border bg-atlas-surface hover:border-opacity-60 text-atlas-muted hover:text-atlas-text'
                )}
                style={role === r.id ? { borderColor: r.color + '50', background: r.color + '10' } : undefined}
              >
                <span style={{ color: r.color }}>{r.icon}</span>
                <div>
                  <div className="text-xs font-bold" style={{ color: role === r.id ? r.color : undefined }}>{r.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{r.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Connect sources */}
      {step === 2 && (
        <div className="atlas-panel rounded-xl p-5">
          <h2 className="text-sm font-bold text-atlas-text mb-1">Connect your sources</h2>
          <p className="text-xs text-atlas-muted mb-4">
            Atlas reads with minimum scopes, stores encrypted tokens, and you can revoke anytime.
            Read-only by default. No pressure — you can skip any.
          </p>
          <div className="space-y-2 mb-4">
            {CONNECTORS.map((c) => (
              <div
                key={c.id}
                className={clsx(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all',
                  connected.includes(c.id) ? 'border-atlas-green/40 bg-atlas-green/5' : 'border-atlas-border bg-atlas-surface'
                )}
              >
                <button
                  onClick={() => c.available && toggleConnector(c.id)}
                  disabled={!c.available}
                  className="flex-shrink-0"
                >
                  {connected.includes(c.id)
                    ? <CheckCircle2 size={16} className="text-atlas-green" />
                    : <Circle size={16} className={c.available ? 'text-atlas-muted' : 'text-atlas-muted/30'} />
                  }
                </button>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-atlas-text">{c.label}</div>
                  <div className="text-[10px] text-atlas-muted">{c.desc}</div>
                </div>
                {!c.available && (
                  <span className="text-[9px] text-atlas-muted px-1.5 py-0.5 rounded border border-atlas-border">Coming soon</span>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setStep(3)}
            className="w-full py-2 rounded-lg text-xs font-semibold bg-atlas-accent/15 border border-atlas-accent/30 text-atlas-accent hover:bg-atlas-accent/25 transition-all"
          >
            Continue with {connected.length} source{connected.length !== 1 ? 's' : ''} →
          </button>
        </div>
      )}

      {/* Step 3: Discover */}
      {step === 3 && (
        <div className="atlas-panel rounded-xl p-5 text-center">
          <h2 className="text-sm font-bold text-atlas-text mb-1">Atlas is ready to discover</h2>
          <p className="text-xs text-atlas-muted mb-4">
            Atlas will scan your connected sources to find projects, contacts, documents, properties, and goals.
            This creates your User Graph v1 — the foundation of everything.
          </p>
          <div className="bg-atlas-surface rounded-lg border border-atlas-border p-3 mb-4 text-left">
            <div className="text-[10px] text-atlas-muted mb-2">Will look for:</div>
            {['Properties', 'Contacts & Leads', 'Documents & Contracts', 'Projects & Tasks', 'Goals & Plans', 'Platform Data (Supabase ACTIVE)'].map((item) => (
              <div key={item} className="flex items-center gap-2 text-[10px] text-atlas-text mb-1">
                <span className="text-atlas-green">◈</span> {item}
              </div>
            ))}
          </div>
          <button
            onClick={runDiscovery}
            disabled={bootstrapping}
            className="w-full py-2.5 rounded-lg text-sm font-semibold bg-atlas-accent/15 border border-atlas-accent/40 text-atlas-accent hover:bg-atlas-accent/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {bootstrapping ? (
              <><Zap size={14} className="animate-pulse" /> Discovering your world...</>
            ) : (
              <><Zap size={14} /> Start Discovery</>
            )}
          </button>
        </div>
      )}

      {/* Step 4: Graph complete */}
      {step === 4 && (
        <div className="atlas-panel rounded-xl p-5">
          <div className="text-center mb-4">
            <CheckCircle2 size={32} className="text-atlas-green mx-auto mb-2" />
            <h2 className="text-sm font-bold text-atlas-text">User Graph v1 Complete!</h2>
            <p className="text-xs text-atlas-muted mt-1">Atlas found {discoveredItems.length} data categories from your sources.</p>
          </div>
          <div className="space-y-1.5 mb-4">
            {discoveredItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-atlas-text bg-atlas-surface rounded-lg px-3 py-2 border border-atlas-border">
                <CheckCircle2 size={10} className="text-atlas-green flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
          <div className="bg-atlas-accent/5 rounded-lg border border-atlas-accent/20 p-3 mb-4">
            <div className="text-[10px] text-atlas-accent font-bold mb-1">Your User Graph is live</div>
            <div className="text-[10px] text-atlas-muted">
              Every agent, skill, portal, simulation, and marketplace is now a layer on top of your personal User Graph.
              The graph is owned by you, controlled by you, portable by you.
            </div>
          </div>
          <button
            onClick={completeOnboarding}
            className="w-full py-2.5 rounded-lg text-sm font-bold bg-atlas-gold/15 border border-atlas-gold/40 text-atlas-gold hover:bg-atlas-gold/25 transition-all flex items-center justify-center gap-2"
          >
            <Zap size={14} /> Enter THE ARK →
          </button>
        </div>
      )}
    </div>
  )
}
