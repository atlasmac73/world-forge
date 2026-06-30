'use client'

/**
 * ATLAS v67 — Underwriting / MAO Calculator
 * AI-enhanced deal underwriting with 70% rule MAO.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { useState } from 'react'
import { Calculator, Zap, Save, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { SectionHeader, CommandButton, AtlasCard } from '@/components/ui/index'
import ReactMarkdown from 'react-markdown'

interface UnderwriteResult {
  mao: number
  equity_pct: number | null
  spread: number | null
  deal_grade: string
  target_margin: number
  analysis: string
  artifact_id: string | null
}

const DEAL_TYPE_OPTIONS = [
  { v: 'wholesale',  l: 'Wholesale' },
  { v: 'fix_flip',   l: 'Fix & Flip' },
  { v: 'rental',     l: 'Rental' },
  { v: 'subject_to', l: 'Subject-To' },
  { v: 'creative',   l: 'Creative Finance' },
]

const GRADE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  A: { color: 'text-atlas-green',  bg: 'bg-atlas-green/15 border-atlas-green/30',  label: 'Strong Deal — Move Now' },
  B: { color: 'text-atlas-accent', bg: 'bg-atlas-accent/15 border-atlas-accent/30', label: 'Good Deal — Negotiate' },
  C: { color: 'text-atlas-gold',   bg: 'bg-atlas-gold/15 border-atlas-gold/30',    label: 'Marginal — Verify More' },
  D: { color: 'text-atlas-coral',  bg: 'bg-atlas-coral/15 border-atlas-coral/30',  label: 'Weak Deal — Pass or Counter' },
}

export default function UnderwritingPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UnderwriteResult | null>(null)

  const [address, setAddress] = useState('')
  const [arv, setArv] = useState('')
  const [repair, setRepair] = useState('')
  const [asking, setAsking] = useState('')
  const [margin, setMargin] = useState('70')
  const [closing, setClosing] = useState('3000')
  const [dealType, setDealType] = useState('wholesale')
  const [marketNotes, setMarketNotes] = useState('')

  async function runUnderwrite() {
    if (!address || !arv || !repair) {
      toast.error('Address, ARV, and repair cost are required')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/ai/underwrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          arv: Number(arv),
          estimated_repair: Number(repair),
          asking_price: asking ? Number(asking) : undefined,
          target_margin: Number(margin) / 100,
          closing_costs: Number(closing),
          deal_type: dealType,
          market_notes: marketNotes || undefined,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setResult(data.data)
        toast.success(`Grade ${data.data.deal_grade} · MAO $${data.data.mao.toLocaleString()}`)
      } else {
        toast.error('Underwriting failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  const maoPreview = arv && repair ? Math.max(0, Number(arv) * (Number(margin) / 100) - Number(repair) - Number(closing)) : null

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <SectionHeader
        title="Underwriting / MAO Calculator"
        subtitle="AI-enhanced deal analysis with WV market context"
        badge="A02-UNDERWRITER"
        badgeColor="#68d391"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input Form */}
        <AtlasCard className="space-y-4">
          <h3 className="text-xs font-bold text-atlas-text uppercase tracking-wider flex items-center gap-2">
            <Calculator size={13} className="text-atlas-accent" /> Deal Parameters
          </h3>

          <div className="space-y-1">
            <label className="text-[10px] text-atlas-muted">Property Address</label>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="412 Elm St, Charleston WV 25301"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-atlas-border text-xs text-atlas-text placeholder-atlas-muted focus:outline-none focus:border-atlas-accent/50"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'ARV', value: arv, set: setArv, help: 'After Repair Value' },
              { label: 'Repair Cost', value: repair, set: setRepair, help: 'Estimated total repairs' },
              { label: 'Asking Price', value: asking, set: setAsking, help: 'Current list/ask price' },
            ].map(f => (
              <div key={f.label} className="space-y-1">
                <label className="text-[10px] text-atlas-muted">{f.label}</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-atlas-muted">$</span>
                  <input
                    type="number"
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    placeholder="0"
                    className="w-full pl-5 pr-2 py-1.5 rounded-lg bg-white/5 border border-atlas-border text-xs text-atlas-text focus:outline-none focus:border-atlas-accent/50"
                  />
                </div>
                <p className="text-[9px] text-white/25">{f.help}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-atlas-muted">Target Margin (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range" min="50" max="85" step="5"
                  value={margin} onChange={e => setMargin(e.target.value)}
                  className="flex-1"
                />
                <span className="text-xs font-mono text-atlas-accent w-8">{margin}%</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-atlas-muted">Deal Type</label>
              <select
                value={dealType}
                onChange={e => setDealType(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-atlas-border text-xs text-atlas-text focus:outline-none"
              >
                {DEAL_TYPE_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-atlas-muted">Market Notes (optional)</label>
            <textarea
              value={marketNotes}
              onChange={e => setMarketNotes(e.target.value)}
              placeholder="Any context about the property, seller, or local market..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-atlas-border text-xs text-atlas-text placeholder-atlas-muted focus:outline-none focus:border-atlas-accent/50 resize-none"
            />
          </div>

          {/* Live MAO preview */}
          {maoPreview !== null && (
            <div className="rounded-lg bg-atlas-green/10 border border-atlas-green/25 p-3 flex items-center justify-between">
              <span className="text-xs text-atlas-muted">Estimated MAO ({margin}% rule)</span>
              <span className="text-sm font-mono font-bold text-atlas-green">${maoPreview.toLocaleString()}</span>
            </div>
          )}

          <CommandButton onClick={runUnderwrite} loading={loading} icon={<Zap size={13} />} size="lg" className="w-full justify-center">
            Run AI Underwriting
          </CommandButton>
        </AtlasCard>

        {/* Result Panel */}
        <div className="space-y-4">
          {!result ? (
            <AtlasCard className="h-full flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <TrendingUp size={32} className="text-atlas-muted mx-auto" />
                <p className="text-sm text-atlas-muted">Enter deal parameters and run analysis</p>
              </div>
            </AtlasCard>
          ) : (
            <>
              {/* Grade Banner */}
              <div className={clsx('rounded-xl border p-5', GRADE_CONFIG[result.deal_grade]?.bg ?? 'bg-white/5 border-white/10')}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={clsx('text-3xl font-mono font-bold', GRADE_CONFIG[result.deal_grade]?.color)}>
                        GRADE {result.deal_grade}
                      </span>
                    </div>
                    <p className="text-xs text-atlas-muted">{GRADE_CONFIG[result.deal_grade]?.label}</p>
                  </div>
                  {result.artifact_id && (
                    <div className="flex items-center gap-1 text-[9px] text-atlas-muted">
                      <Save size={9} /> Saved
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-lg font-mono font-bold text-atlas-green">${result.mao.toLocaleString()}</div>
                    <div className="text-[9px] text-atlas-muted">MAO</div>
                  </div>
                  <div>
                    <div className={clsx('text-lg font-mono font-bold', result.equity_pct && result.equity_pct > 20 ? 'text-atlas-green' : 'text-atlas-coral')}>
                      {result.equity_pct !== null ? `${result.equity_pct.toFixed(1)}%` : '—'}
                    </div>
                    <div className="text-[9px] text-atlas-muted">Equity</div>
                  </div>
                  <div>
                    <div className={clsx('text-lg font-mono font-bold', result.spread && result.spread <= 0 ? 'text-atlas-green' : 'text-atlas-coral')}>
                      {result.spread !== null ? `$${result.spread.toLocaleString()}` : '—'}
                    </div>
                    <div className="text-[9px] text-atlas-muted">Spread vs MAO</div>
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              <AtlasCard>
                <h3 className="text-xs font-bold text-atlas-text mb-3 flex items-center gap-2">
                  <Zap size={12} className="text-atlas-accent" /> AI Analysis
                </h3>
                <div className="prose prose-invert prose-xs max-w-none text-atlas-muted text-xs leading-relaxed">
                  <ReactMarkdown>{result.analysis}</ReactMarkdown>
                </div>
              </AtlasCard>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
