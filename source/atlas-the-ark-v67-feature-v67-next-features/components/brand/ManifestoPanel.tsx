'use client'

/**
 * ATLAS Design System — ManifestoPanel
 * Brand canon / founder story section.
 * Inspired by ATLAS_GENESIS_MATRIX_MANIFESTO.html
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { clsx } from 'clsx'

interface ManifestoPanelProps {
  section?: 'full' | 'brief' | 'principles' | 'ip'
  className?: string
}

const PRINCIPLES = [
  { n: '01', title: 'Sovereignty First',      body: 'Every operator deserves intelligence that is theirs — not rented, not surveilled, not sold.' },
  { n: '02', title: 'Real Data, Real Stakes',  body: 'ATLAS does not simulate markets. It surfaces real distress, real equity, and real opportunity.' },
  { n: '03', title: 'The God Mode Doctrine',   body: 'Four agents acting in concert — Investigator, Underwriter, Copywriter, Orchestrator — produce what no single model can.' },
  { n: '04', title: 'Human in the Loop',       body: 'No autonomous action without human approval. The system proposes. The founder decides. The market responds.' },
  { n: '05', title: 'Appalachian Intelligence', body: 'Built for WV first. Not Silicon Valley cosplay. Distress is real here. Equity is real here. The data must be too.' },
  { n: '06', title: 'Patent or Perish',        body: 'OMNIFOLD™ P001–P100. The invention is documented. The moat is dug. The filing deadline is March 29, 2027.' },
]

export function ManifestoPanel({ section = 'full', className }: ManifestoPanelProps) {
  if (section === 'principles') {
    return (
      <div className={clsx('grid grid-cols-1 sm:grid-cols-2 gap-4', className)}>
        {PRINCIPLES.map(p => (
          <div key={p.n} className="rounded-xl border border-atlas-border bg-atlas-panel p-4 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-atlas-gold">{p.n}</span>
              <span className="text-sm font-semibold text-atlas-text">{p.title}</span>
            </div>
            <p className="text-xs text-atlas-muted leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>
    )
  }

  if (section === 'ip') {
    return (
      <div className={clsx('rounded-xl border border-atlas-gold/25 bg-atlas-gold/5 p-5 space-y-3', className)}>
        <h3 className="text-sm font-bold text-atlas-gold">IP Declaration</h3>
        <div className="space-y-1 text-xs text-atlas-muted leading-relaxed">
          <p>All intellectual property, architecture, and inventions within ATLAS OS / THE ARK / Atlas Genesis Matrix are the sole property of:</p>
          <p className="text-atlas-text font-semibold mt-2">Isaac Brandon Burdette</p>
          <p>Atlas Genesis Matrix LLC · Saint Albans, West Virginia</p>
          <p className="mt-2">Patent portfolio: OMNIFOLD™ P001–P100</p>
          <p>Non-provisional filing deadline: March 29, 2027</p>
          <p>Priority patents: P001 (Genesis Cycle) · P003 (SPECTER) · P019 (Base Reality Recording™)</p>
        </div>
      </div>
    )
  }

  if (section === 'brief') {
    return (
      <div className={clsx('rounded-xl border border-atlas-border bg-atlas-panel p-5', className)}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-atlas-gold">ATLAS GENESIS MATRIX</span>
          </div>
          <p className="text-sm text-atlas-text leading-relaxed">
            Real estate intelligence OS for the WV/Appalachian market. Built by a single founder.
            Designed to give every independent operator access to institutional-grade deal intelligence.
          </p>
          <p className="text-xs text-atlas-muted">
            Isaac Brandon Burdette · Sole Founder & Inventor · Saint Albans, WV
          </p>
        </div>
      </div>
    )
  }

  // Full manifesto
  return (
    <div className={clsx('space-y-8', className)}>
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-block">
          <span className="text-[10px] font-mono tracking-[0.3em] text-atlas-gold uppercase">
            Atlas Genesis Matrix · Est. 2024 · Saint Albans WV
          </span>
        </div>
        <h1 className="text-3xl font-bold text-atlas-text">
          Intelligence is the Last <span className="text-atlas-gold">Unfair Advantage</span>
        </h1>
        <p className="text-atlas-muted max-w-2xl mx-auto leading-relaxed">
          ATLAS was built for one reason: because the deals are real, the distress is real,
          and the people losing them to institutional capital deserve better tools than a spreadsheet.
        </p>
      </div>

      {/* Founder */}
      <div className="rounded-2xl border border-atlas-gold/20 bg-atlas-gold/5 p-6 space-y-2">
        <p className="text-xs font-mono text-atlas-gold tracking-widest">FOUNDER</p>
        <p className="text-lg font-bold text-atlas-text">Isaac Brandon Burdette</p>
        <p className="text-sm text-atlas-muted">
          Sole inventor. Atlas Genesis Matrix LLC. Real estate operator, builder, and developer
          from Saint Albans, West Virginia. Not a tech company. A real estate intelligence company
          that happens to build its own technology.
        </p>
      </div>

      {/* Principles */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-atlas-text tracking-wider uppercase">Sovereign Principles</h2>
        <ManifestoPanel section="principles" />
      </div>

      {/* IP */}
      <ManifestoPanel section="ip" />
    </div>
  )
}
