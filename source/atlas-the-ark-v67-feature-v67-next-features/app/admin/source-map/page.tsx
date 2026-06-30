'use client'

/**
 * ATLAS v67 — Source Map / Version Archive
 * History of ATLAS versions v1 → v67
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { Archive, ChevronRight, Star } from 'lucide-react'

const VERSION_ERAS = [
  {
    era: 'v1 – v6', label: 'Genesis Era', dates: '2024 Q1',
    color: '#718096', desc: 'Single HTML file. WV distressed property prototype. First 5-portal concept.',
    canonical: false, strength: 1,
  },
  {
    era: 'v7 – v12', label: 'God Mode Era', dates: '2024 Q1–Q2',
    color: '#63b3ed', desc: 'GodMode v12 — 8-signal scoring engine, 4-agent pod, model router, periodic table concept, T1-T7 tiers.',
    canonical: false, strength: 3,
  },
  {
    era: 'v13 – v19', label: 'Expansion Era', dates: '2024 Q2–Q3',
    color: '#4fd1c5', desc: 'Multi-portal expansion. AIN prototype. Skip trace. LOI generator. First Next.js migration attempts.',
    canonical: false, strength: 2,
  },
  {
    era: 'v20 – v25', label: 'Autopoietic Era ★', dates: '2024 Q3–Q4',
    color: '#f6ad55', desc: 'ATLAS_V20_AUTOPOIETIC — strongest old code base. Full Next.js. 3-agent dossier chain. Autopoietic console. Genesis heartbeat. WarRoom, SignalStack.',
    canonical: false, strength: 5,
  },
  {
    era: 'v26 – v40', label: 'God Squad Era', dates: '2024 Q4',
    color: '#b794f4', desc: '25-agent God Squad named. 53+ portals architected. T7 God Mode. NASDROP. Full skill/agent registry in Supabase.',
    canonical: false, strength: 4,
  },
  {
    era: 'v41 – v60', label: 'Production Hardening', dates: '2025 Q1',
    color: '#68d391', desc: 'Supabase full seeding (61 portals, 255 agents, 2,015 skills, 105 patents). Vercel deployments. Middleware hardening. RBAC. Rate limiting.',
    canonical: false, strength: 4,
  },
  {
    era: 'v61 – v65', label: 'Sprint Era', dates: '2025 Q1–Q2',
    color: '#fc8181', desc: 'Multi-phase hardening sprints. Next.js 14→15 upgrade. Zod validation. Kill switch. TypeScript strict. 63 tests passing.',
    canonical: false, strength: 4,
  },
  {
    era: 'v66', label: 'Patch & Clean', dates: '2026 June',
    color: '#63b3ed', desc: 'Phase 0 cleanup. Removed mock fallbacks. Fixed RBAC bug. Twilio HMAC webhook. Clean build/typecheck/lint/test.',
    canonical: false, strength: 4,
  },
  {
    era: 'v67', label: 'Master Merge ← CURRENT', dates: '2026 June',
    color: '#f6ad55', desc: 'Canonical production base. Kill switch. Blueprint Queue. Portal 15 SuperLLM. Command Center. Schema master merge. AIN 55 counties. Distress scoring engine. Underwriting AI. Rehab AI. GodView. Launch readiness.',
    canonical: true, strength: 5,
  },
]

const SOURCE_PACKAGES = [
  { name: 'v67 repo', role: 'Canonical Production Base', status: 'ACTIVE' },
  { name: 'ATLAS_V20_AUTOPOIETIC.zip', role: 'Code Recovery — agent pipeline, autopoietic', status: 'MERGED' },
  { name: 'atlas-godmode-v12-port.zip', role: 'GodMode/scoring/model-router seed', status: 'MERGED' },
  { name: 'ATLAS_GodMode_v12.html', role: 'Full product spec reference', status: 'REFERENCE' },
  { name: 'ATLAS REIP v7 Blueprint.docx', role: 'Implementation checklist', status: 'REFERENCE' },
  { name: 'AIN_HEAT_MAP_55_COUNTIES.html', role: 'MVP county intelligence module', status: 'MERGED' },
  { name: 'ATLAS_GODVIEW_FINAL.html', role: 'Founder/admin UX inspiration', status: 'MERGED' },
  { name: 'ATLAS_LAUNCH_COMMAND.html', role: 'Launch readiness module', status: 'MERGED' },
  { name: 'ATLAS_GENESIS_MATRIX_MANIFESTO.html', role: 'Brand canon / IP doctrine', status: 'MERGED' },
  { name: 'ATLAS_OS_v22_Stakeholder_Deck', role: 'Pitch language / pricing framing', status: 'REFERENCE' },
  { name: 'files (66).zip', role: 'Security/schema/deploy reference', status: 'REFERENCE' },
  { name: 'BidHub / Omega', role: 'Contractor module — future v68+', status: 'DEFERRED' },
  { name: 'Omniverse / BlackHole', role: 'Long-term empire roadmap only', status: 'DEFERRED' },
]

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:    'text-atlas-gold bg-atlas-gold/10 border-atlas-gold/30',
  MERGED:    'text-atlas-green bg-atlas-green/10 border-atlas-green/30',
  REFERENCE: 'text-atlas-accent bg-atlas-accent/10 border-atlas-accent/30',
  DEFERRED:  'text-atlas-muted bg-white/5 border-white/10',
}

export default function SourceMapPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-atlas-text">Source Map</h1>
        <p className="text-xs text-atlas-muted mt-0.5">ATLAS version history v1 → v67 · Atlas Genesis Matrix LLC</p>
      </div>

      {/* Version timeline */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-atlas-text">Version Era Timeline</h2>
        {VERSION_ERAS.map((era) => (
          <div
            key={era.era}
            className={`rounded-xl border p-4 ${era.canonical ? 'border-atlas-gold/40 bg-atlas-gold/6' : 'border-atlas-border bg-atlas-panel'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <ChevronRight size={14} style={{ color: era.color }} className="mt-0.5 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold" style={{ color: era.color }}>{era.era}</span>
                    <span className="text-xs font-medium text-atlas-text">{era.label}</span>
                    {era.canonical && <Star size={12} className="text-atlas-gold" />}
                  </div>
                  <p className="text-[10px] text-atlas-muted mt-0.5">{era.dates}</p>
                  <p className="text-xs text-atlas-muted mt-1">{era.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                {[1,2,3,4,5].map(n => (
                  <div key={n} className="w-2 h-2 rounded-sm" style={{ background: n <= era.strength ? era.color : 'rgba(255,255,255,0.08)' }} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Source packages */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-atlas-text">Source Package Map</h2>
        <div className="rounded-xl border border-atlas-border bg-atlas-panel overflow-hidden">
          {SOURCE_PACKAGES.map((pkg, i) => (
            <div key={i} className="flex items-start justify-between gap-4 px-4 py-3 border-b border-white/5 last:border-0">
              <div className="min-w-0">
                <p className="text-xs font-medium text-atlas-text font-mono">{pkg.name}</p>
                <p className="text-[10px] text-atlas-muted mt-0.5">{pkg.role}</p>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${STATUS_COLOR[pkg.status]}`}>
                {pkg.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-atlas-border bg-atlas-panel p-4 text-xs text-atlas-muted">
        <strong className="text-atlas-text">Attribution:</strong> All intellectual property across all versions — Isaac Brandon Burdette, sole founder and inventor, Atlas Genesis Matrix LLC. Patent pending P001–P100.
      </div>
    </div>
  )
}
