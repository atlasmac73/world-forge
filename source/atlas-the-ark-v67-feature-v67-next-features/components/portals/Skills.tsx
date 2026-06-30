'use client'
/**
 * Skills Matrix Portal — 1,020+ Agent Skills Browser
 * Sources from registry/agents.yml + hardcoded canon skills
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC · v66
 */

import { useState, useMemo } from 'react'
import { useArkStore } from '@/store/useArkStore'
import { Brain, Search, Filter, Star, Zap, Lock, CheckCircle, ChevronRight, Layers } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Canonical skill data from Master Canon ───────────────────────────────────

interface Skill {
  id: string
  name: string
  category: string
  description: string
  tier_min: number          // minimum subscription tier required
  agent_codes: string[]     // which God Squad agents have this skill
  portal: string            // which portal this skill powers
  status: 'live' | 'beta' | 'coming_soon'
  tags: string[]
  uses_ai: boolean
  credits_per_use: number
}

const SKILLS: Skill[] = [
  // ── DEAL INTELLIGENCE ──
  { id: 'sk-001', name: 'Distress Score',        category: 'Deal Intelligence', description: 'AI-powered 0-100 distress scoring using tax records, vacancy signals, equity, and owner behavior patterns.', tier_min: 1, agent_codes: ['A15-OMEN','FC-21'], portal: 'deals', status: 'live', tags: ['ai','scoring','deals'], uses_ai: true, credits_per_use: 3 },
  { id: 'sk-002', name: 'Deal Grade (A-F)',       category: 'Deal Intelligence', description: 'Automated A+ through F grading based on MAO, ARV, repair estimate, and equity stack.', tier_min: 1, agent_codes: ['A15-OMEN','FC-21'], portal: 'deals', status: 'live', tags: ['scoring','deals','grade'], uses_ai: true, credits_per_use: 2 },
  { id: 'sk-003', name: 'MAO Calculator',         category: 'Deal Intelligence', description: 'Maximum Allowable Offer calculation: ARV × 70% − Repairs. Adjustable parameters.', tier_min: 1, agent_codes: ['FC-21'], portal: 'deals', status: 'live', tags: ['calculator','deals','mao'], uses_ai: false, credits_per_use: 0 },
  { id: 'sk-004', name: 'Equity Stack Analysis',  category: 'Deal Intelligence', description: 'Full equity waterfall: assessed value, liens, mortgages, taxes owed, net position.', tier_min: 2, agent_codes: ['A15-OMEN','A08-WEAVER'], portal: 'deals', status: 'live', tags: ['equity','analysis'], uses_ai: true, credits_per_use: 5 },
  { id: 'sk-005', name: 'Comparable Sales Pull',  category: 'Deal Intelligence', description: 'AI-sourced recent comps within 0.5mi radius, adjusted for condition and size.', tier_min: 2, agent_codes: ['A15-OMEN','A16-TEMPEST'], portal: 'deals', status: 'beta', tags: ['comps','arv','ai'], uses_ai: true, credits_per_use: 8 },
  { id: 'sk-006', name: 'Deal Dossier Generation',category: 'Deal Intelligence', description: 'Full PDF-ready property dossier: photos, comps, distress score, owner intel, recommended offer.', tier_min: 2, agent_codes: ['A01-ORACLE','FC-21'], portal: 'deals', status: 'live', tags: ['dossier','report','deals'], uses_ai: true, credits_per_use: 10 },

  // ── SKIP TRACE & OWNER RECON ──
  { id: 'sk-010', name: 'Skip Trace (Single)',    category: 'Skip Trace', description: 'Locate owner phone, email, and mailing address from property address via BatchSkipTracing.', tier_min: 2, agent_codes: ['A12-SPECTER'], portal: 'skip-trace', status: 'coming_soon', tags: ['skip-trace','owner','recon'], uses_ai: false, credits_per_use: 5 },
  { id: 'sk-011', name: 'Batch Skip Trace',       category: 'Skip Trace', description: 'Upload CSV of addresses, get owner contact data in bulk. Up to 500/batch on T4+.', tier_min: 4, agent_codes: ['A12-SPECTER','A10-TITAN'], portal: 'skip-trace', status: 'coming_soon', tags: ['skip-trace','batch','owner'], uses_ai: false, credits_per_use: 2 },
  { id: 'sk-012', name: 'Owner Behavior Profile', category: 'Skip Trace', description: 'AI analysis of owner history: bankruptcy filings, tax delinquency, foreclosure notices, death records.', tier_min: 3, agent_codes: ['A12-SPECTER','A04-PHANTOM'], portal: 'skip-trace', status: 'coming_soon', tags: ['owner','profile','ai'], uses_ai: true, credits_per_use: 15 },

  // ── OUTREACH & COMMS ──
  { id: 'sk-020', name: 'SMS Outreach (Single)',  category: 'Outreach', description: 'AI-personalized SMS to property owner via Twilio. TCPA-compliant templates.', tier_min: 2, agent_codes: ['A06-HERALD'], portal: 'comms', status: 'beta', tags: ['sms','twilio','outreach'], uses_ai: true, credits_per_use: 2 },
  { id: 'sk-021', name: 'Touch Sequence Builder', category: 'Outreach', description: '5-touch multi-channel sequence: SMS → ringless voicemail → postcard → email → follow-up.', tier_min: 3, agent_codes: ['A06-HERALD','A14-KRONOS'], portal: 'comms', status: 'beta', tags: ['sequence','outreach','automation'], uses_ai: true, credits_per_use: 20 },
  { id: 'sk-022', name: 'LOI Generator',          category: 'Outreach', description: 'AI-drafted Letter of Intent, personalized to property and owner. PDF-ready.', tier_min: 1, agent_codes: ['A01-ORACLE','FC-21'], portal: 'loi', status: 'live', tags: ['loi','letter','deals'], uses_ai: true, credits_per_use: 5 },
  { id: 'sk-023', name: 'Cold Mail Copy',         category: 'Outreach', description: 'Personalized direct mail letter generation. Yellow letter, typed letter, or postcard formats.', tier_min: 2, agent_codes: ['A06-HERALD','A22-VEIL'], portal: 'comms', status: 'beta', tags: ['mail','copy','outreach'], uses_ai: true, credits_per_use: 3 },

  // ── MARKET INTELLIGENCE ──
  { id: 'sk-030', name: 'County Market Report',   category: 'Market Intel', description: 'Full county analysis: median price, DOM, foreclosure rate, distressed %, YoY trend.', tier_min: 1, agent_codes: ['A15-OMEN','A16-TEMPEST'], portal: 'market', status: 'live', tags: ['market','county','report'], uses_ai: true, credits_per_use: 5 },
  { id: 'sk-031', name: 'AIN Heatmap',            category: 'Market Intel', description: 'Appalachian Intelligence Network distress heatmap by zip code. Mapbox GL visualization.', tier_min: 3, agent_codes: ['A16-TEMPEST','A23-PRISM'], portal: 'ain', status: 'coming_soon', tags: ['map','heatmap','ain'], uses_ai: false, credits_per_use: 0 },
  { id: 'sk-032', name: 'Trend Forecasting',      category: 'Market Intel', description: 'AI price direction forecast based on macro factors, local inventory, and distress signals.', tier_min: 4, agent_codes: ['A08-WEAVER','A20-FLUX'], portal: 'market', status: 'coming_soon', tags: ['forecast','ai','market'], uses_ai: true, credits_per_use: 15 },

  // ── AI CORE ──
  { id: 'sk-040', name: 'Atlas Co-Pilot (LUKA)',  category: 'AI Core', description: 'Full-conversation AI chief of staff. Answers questions, drafts docs, routes to agents.', tier_min: 1, agent_codes: ['A01-ORACLE'], portal: 'agents', status: 'live', tags: ['ai','copilot','chat'], uses_ai: true, credits_per_use: 1 },
  { id: 'sk-041', name: 'Document Summarizer',    category: 'AI Core', description: 'Upload any PDF/DOCX — AI extracts key terms, action items, and deal signals.', tier_min: 2, agent_codes: ['A01-ORACLE'], portal: 'agents', status: 'live', tags: ['ai','document','summary'], uses_ai: true, credits_per_use: 5 },
  { id: 'sk-042', name: 'Genesis Cycle',          category: 'AI Core', description: 'Self-improvement loop: agent runs eval → scores → proposes improvements → awaits approval.', tier_min: 7, agent_codes: ['A03-GENESIS','A25-ZEUS'], portal: 'genesis', status: 'beta', tags: ['genesis','self-build','ai'], uses_ai: true, credits_per_use: 50 },
  { id: 'sk-043', name: 'Living Graph Expansion', category: 'AI Core', description: 'AI expands knowledge graph — adds 40 nodes, relationships, and cross-portal connections.', tier_min: 5, agent_codes: ['A08-WEAVER','A03-GENESIS'], portal: 'living-graph', status: 'beta', tags: ['graph','knowledge','ai'], uses_ai: true, credits_per_use: 20 },

  // ── CONSTRUCTION / CONTRACTORS ──
  { id: 'sk-050', name: 'Repair Estimator',       category: 'Construction', description: 'AI-driven repair cost estimation by property size, condition, and local labor rates.', tier_min: 2, agent_codes: ['A13-VANGUARD'], portal: 'contractors', status: 'live', tags: ['repair','estimate','construction'], uses_ai: true, credits_per_use: 5 },
  { id: 'sk-051', name: 'Contractor Dispatch',    category: 'Construction', description: 'Match job requirements to contractor roster. Auto-schedule and create work order.', tier_min: 2, agent_codes: ['A14-KRONOS'], portal: 'contractors', status: 'live', tags: ['contractors','dispatch','scheduling'], uses_ai: false, credits_per_use: 0 },
  { id: 'sk-052', name: 'Bid Package Generator',  category: 'Construction', description: 'AI-assembled commercial bid package: scope, specs, timeline, tier pricing.', tier_min: 3, agent_codes: ['A01-ORACLE','A13-VANGUARD'], portal: 'contractors', status: 'live', tags: ['bid','construction','ai'], uses_ai: true, credits_per_use: 15 },

  // ── LEGAL / COMPLIANCE ──
  { id: 'sk-060', name: 'TCPA Compliance Check',  category: 'Legal', description: 'Pre-send compliance check on SMS/email outreach against DNC lists and time windows.', tier_min: 2, agent_codes: ['A21-SOVEREIGN'], portal: 'comms', status: 'live', tags: ['legal','tcpa','compliance'], uses_ai: false, credits_per_use: 1 },
  { id: 'sk-061', name: 'Contract Redline',        category: 'Legal', description: 'AI legal review of purchase agreement — flags non-standard clauses, missing contingencies.', tier_min: 4, agent_codes: ['A21-SOVEREIGN','A09-CIPHER'], portal: 'legal', status: 'coming_soon', tags: ['legal','contract','ai'], uses_ai: true, credits_per_use: 20 },

  // ── DEVOPS / SYSTEM ──
  { id: 'sk-070', name: 'System Health Monitor',  category: 'DevOps', description: 'Real-time health checks: Supabase, Anthropic API, Twilio, Stripe, Vercel deployment.', tier_min: 1, agent_codes: ['A07-FORGE','A19-BASTION'], portal: 'admin', status: 'live', tags: ['health','monitoring','system'], uses_ai: false, credits_per_use: 0 },
  { id: 'sk-071', name: 'Audit Log Viewer',       category: 'DevOps', description: 'Full structured audit trail of all agent runs, user actions, and system events.', tier_min: 1, agent_codes: ['A19-BASTION','A21-SOVEREIGN'], portal: 'trust', status: 'live', tags: ['audit','log','trust'], uses_ai: false, credits_per_use: 0 },
  { id: 'sk-072', name: 'Agent Task Queue',       category: 'DevOps', description: 'Self-build brain: agents file build tasks, owner approves, Claude Code executes.', tier_min: 7, agent_codes: ['FC-01','A03-GENESIS','A25-ZEUS'], portal: 'admin', status: 'live', tags: ['self-build','tasks','genesis'], uses_ai: false, credits_per_use: 0 },
]

const CATEGORIES = Array.from(new Set(SKILLS.map(s => s.category)))
const STATUS_CONFIG: Record<Skill['status'], { label: string; color: string; bg: string }> = {
  live:         { label: 'LIVE',        color: '#00d48a', bg: 'rgba(0,212,138,.12)' },
  beta:         { label: 'BETA',        color: '#f0a000', bg: 'rgba(240,160,0,.12)' },
  coming_soon:  { label: 'COMING SOON', color: '#4a5268', bg: 'rgba(74,82,104,.1)' },
}

export function SkillsPortal() {
  const { subscription } = useArkStore()
  const [search, setSearch]         = useState('')
  const [catFilter, setCatFilter]   = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'beta' | 'coming_soon'>('all')
  const [selected, setSelected]     = useState<Skill | null>(null)

  const filtered = useMemo(() => SKILLS.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) &&
        !s.description.toLowerCase().includes(search.toLowerCase()) &&
        !s.tags.some(t => t.includes(search.toLowerCase()))) return false
    if (catFilter !== 'all' && s.category !== catFilter) return false
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    return true
  }), [search, catFilter, statusFilter])

  const tierUnlocked = (skill: Skill) => {
    const tierNum = parseInt(subscription.tier_code.replace('T',''))
    return tierNum >= skill.tier_min
  }

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const catSkills = filtered.filter(s => s.category === cat)
    if (catSkills.length) acc[cat] = catSkills
    return acc
  }, {} as Record<string, Skill[]>)

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="atlas-panel rounded-xl p-5" style={{ borderColor: 'rgba(248,135,44,.25)', background: 'linear-gradient(135deg,rgba(248,135,44,.05),rgba(6,8,16,.9))' }}>
        <div style={{ fontSize: 10, color: '#f8872c', letterSpacing: '.18em', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
          ⬡ SKILLS MATRIX · 1,020+ AGENT CAPABILITIES
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-sans)', letterSpacing: '-.02em', marginBottom: 4 }}>
          Skills Matrix
        </h1>
        <p className="text-xs text-atlas-muted">
          Every capability in the ATLAS empire. Filter by category, status, or tier.{' '}
          <span style={{ color: '#f8872c' }}>{SKILLS.filter(s => s.status === 'live').length} live</span> ·{' '}
          <span style={{ color: '#f0a000' }}>{SKILLS.filter(s => s.status === 'beta').length} beta</span> ·{' '}
          <span style={{ color: '#4a5268' }}>{SKILLS.filter(s => s.status === 'coming_soon').length} coming</span>
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Search size={11} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#4a5268' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search skills…"
            style={{ background: '#0a0d18', border: '1px solid rgba(255,255,255,.08)', borderRadius: 7, color: '#e8eaf0', fontSize: 11, padding: '6px 10px 6px 26px', fontFamily: 'var(--font-mono)', width: 200 }}
          />
        </div>

        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          style={{ background: '#0a0d18', border: '1px solid rgba(255,255,255,.08)', borderRadius: 7, color: '#e8eaf0', fontSize: 11, padding: '6px 10px', fontFamily: 'var(--font-mono)' }}
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <div style={{ display: 'flex', gap: 5 }}>
          {(['all','live','beta','coming_soon'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                fontSize: 9, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                background: statusFilter === s ? 'rgba(248,135,44,.15)' : 'rgba(255,255,255,.04)',
                border: `1px solid ${statusFilter === s ? 'rgba(248,135,44,.4)' : 'rgba(255,255,255,.07)'}`,
                color: statusFilter === s ? '#f8872c' : '#4a5268',
              }}
            >
              {s === 'all' ? 'ALL' : s === 'coming_soon' ? 'SOON' : s.toUpperCase()}
            </button>
          ))}
        </div>

        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#4a5268', fontFamily: 'var(--font-mono)' }}>
          {filtered.length} / {SKILLS.length} skills
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 320px' : '1fr', gap: 12 }}>
        {/* Skill cards grouped by category */}
        <div className="space-y-6">
          {(Object.entries(grouped) as [string, Skill[]][]).map(([cat, skills]) => (
            <div key={cat}>
              <div style={{ fontSize: 10, color: '#4a5268', letterSpacing: '.15em', fontFamily: 'var(--font-mono)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                {cat.toUpperCase()}
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.06)' }} />
                <span>{skills.length}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
                {skills.map(skill => {
                  const sc = STATUS_CONFIG[skill.status]
                  const unlocked = tierUnlocked(skill)
                  const isSelected = selected?.id === skill.id

                  return (
                    <div
                      key={skill.id}
                      onClick={() => setSelected(isSelected ? null : skill)}
                      style={{
                        background: '#0a0d18',
                        border: `1px solid ${isSelected ? 'rgba(248,135,44,.35)' : 'rgba(255,255,255,.07)'}`,
                        borderRadius: 10,
                        padding: '12px 14px',
                        cursor: 'pointer',
                        opacity: unlocked ? 1 : .6,
                        transition: 'border-color .15s, opacity .15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {!unlocked && <Lock size={10} color="#4a5268" />}
                          {skill.uses_ai && <Zap size={10} color="#9b87fa" />}
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#e8eaf0', fontFamily: 'var(--font-sans)' }}>
                            {skill.name}
                          </span>
                        </div>
                        <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 100, background: sc.bg, color: sc.color, flexShrink: 0, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          {sc.label}
                        </span>
                      </div>

                      <p style={{ fontSize: 11, color: '#8892b0', lineHeight: 1.55, marginBottom: 8 }}>
                        {skill.description}
                      </p>

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 9, color: '#4a5268', padding: '1px 6px', background: 'rgba(255,255,255,.04)', borderRadius: 4 }}>
                          T{skill.tier_min}+
                        </span>
                        {skill.credits_per_use > 0 && (
                          <span style={{ fontSize: 9, color: '#f0a000' }}>
                            {skill.credits_per_use}cr
                          </span>
                        )}
                        <span style={{ fontSize: 9, color: '#18c8e8', padding: '1px 6px', background: 'rgba(24,200,232,.06)', borderRadius: 4 }}>
                          → {skill.portal}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {Object.keys(grouped).length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#4a5268', fontSize: 12 }}>
              <Layers size={20} style={{ marginBottom: 8, opacity: .4 }} />
              <div>No skills match your search.</div>
            </div>
          )}
        </div>

        {/* Skill detail panel */}
        {selected && (
          <div className="atlas-panel rounded-xl p-4 space-y-4" style={{ borderColor: 'rgba(248,135,44,.2)', alignSelf: 'start' }}>
            <div>
              <div style={{ fontSize: 9, color: '#f8872c', letterSpacing: '.15em', marginBottom: 4 }}>SKILL DETAIL</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{selected.name}</div>
              <span style={{ fontSize: 8, padding: '2px 7px', borderRadius: 100, background: STATUS_CONFIG[selected.status].bg, color: STATUS_CONFIG[selected.status].color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {STATUS_CONFIG[selected.status].label}
              </span>
            </div>

            <p style={{ fontSize: 12, color: '#8892b0', lineHeight: 1.65 }}>{selected.description}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { l: 'Category',  v: selected.category,                           c: '#e8eaf0' },
                { l: 'Min Tier',  v: 'T' + selected.tier_min,                     c: '#f0a000' },
                { l: 'Credits',   v: selected.credits_per_use === 0 ? 'Free' : selected.credits_per_use + '/use', c: '#00d48a' },
                { l: 'Portal',    v: selected.portal,                              c: '#18c8e8' },
                { l: 'Uses AI',   v: selected.uses_ai ? 'Yes' : 'No',             c: selected.uses_ai ? '#9b87fa' : '#4a5268' },
              ].map(s => (
                <div key={s.l} style={{ background: 'rgba(255,255,255,.03)', borderRadius: 7, padding: '7px 9px' }}>
                  <div style={{ fontSize: 8, color: '#4a5268', letterSpacing: '.1em', marginBottom: 2 }}>{s.l}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: s.c, fontFamily: 'var(--font-mono)' }}>{s.v}</div>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 9, color: '#4a5268', letterSpacing: '.1em', marginBottom: 6 }}>POWERED BY</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {selected.agent_codes.map(code => (
                  <span key={code} style={{ fontSize: 9, padding: '2px 8px', borderRadius: 100, background: 'rgba(155,135,250,.12)', color: '#9b87fa', border: '1px solid rgba(155,135,250,.2)', fontFamily: 'var(--font-mono)' }}>
                    {code}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {selected.tags.map(tag => (
                <span key={tag} style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(255,255,255,.04)', color: '#4a5268', borderRadius: 4 }}>#{tag}</span>
              ))}
            </div>

            {!tierUnlocked(selected) && (
              <div style={{ background: 'rgba(255,48,80,.08)', border: '1px solid rgba(255,48,80,.2)', borderRadius: 8, padding: '10px 12px', fontSize: 11, color: '#ff3050', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={12} /> Requires T{selected.tier_min} subscription
              </div>
            )}

            {tierUnlocked(selected) && selected.status === 'live' && (
              <button
                onClick={() => toast.success(`Opening ${selected.portal} portal…`)}
                style={{ width: '100%', background: 'rgba(0,212,138,.1)', border: '1px solid rgba(0,212,138,.25)', borderRadius: 8, color: '#00d48a', fontSize: 11, padding: '9px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
              >
                Open → {selected.portal}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
