import Link from 'next/link'
import { ManifestoPanel } from '@/components/brand/ManifestoPanel'

/**
 * ATLAS v67 — Marketing Landing Page
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-atlas-dark text-atlas-text">
      {/* Nav */}
      <nav className="border-b border-atlas-border px-6 py-4 flex items-center justify-between">
        <div className="text-sm font-mono font-bold text-atlas-gold">ATLAS GENESIS MATRIX</div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-xs text-atlas-muted hover:text-atlas-text transition-colors">Sign In</Link>
          <Link href="/invite" className="text-xs px-3 py-1.5 rounded-lg bg-atlas-accent/20 text-atlas-accent border border-atlas-accent/30 hover:bg-atlas-accent/30 transition-all">
            Request Access
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 py-20 text-center space-y-6">
        <div className="inline-block">
          <span className="text-[10px] font-mono tracking-[0.3em] text-atlas-gold uppercase">
            Private Beta · Invite Only · WV/Appalachian Market
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
          Real Estate Intelligence<br />
          <span className="text-atlas-accent">Built Different</span>
        </h1>
        <p className="text-lg text-atlas-muted max-w-2xl mx-auto leading-relaxed">
          ATLAS Deal Pro — AI-powered deal sourcing, distress scoring, and pipeline management
          for WV/Appalachian real estate investors. God Mode included.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/invite" className="px-6 py-3 rounded-xl bg-atlas-accent/20 text-atlas-accent border border-atlas-accent/30 hover:bg-atlas-accent/30 transition-all text-sm font-medium">
            Request Beta Access →
          </Link>
          <Link href="/manifesto" className="px-6 py-3 rounded-xl bg-white/5 text-atlas-text border border-white/10 hover:border-white/20 transition-all text-sm">
            Read the Manifesto
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
          {[
            { title: 'AIN — 55 County Intel', desc: 'All 55 WV counties scored for distress. Critical/Hot/Warm/Cool/Cold heat map. Real data, not guesses.' },
            { title: 'God Mode — 4 Agents', desc: 'ORACLE → INVESTIGATOR → UNDERWRITER → COPYWRITER. Full property dossier in one run.' },
            { title: 'Distress Scoring', desc: '8-signal analysis: tax delinquency, vacancy, foreclosure, equity, DOM, owner, court, velocity.' },
          ].map(f => (
            <div key={f.title} className="rounded-xl border border-atlas-border bg-atlas-panel p-5">
              <h3 className="text-sm font-bold text-atlas-text mb-2">{f.title}</h3>
              <p className="text-xs text-atlas-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <ManifestoPanel section="brief" />
      </div>

      {/* Footer */}
      <footer className="border-t border-atlas-border px-6 py-8 text-center">
        <p className="text-[10px] font-mono text-white/20">
          ATLAS GENESIS MATRIX LLC · ISAAC BRANDON BURDETTE · SOLE FOUNDER & INVENTOR · PATENT PENDING P001-P100 · SAINT ALBANS WV
        </p>
      </footer>
    </div>
  )
}
