'use client'

/**
 * ATLAS v67 — Rehab Estimator
 * AI-powered room-by-room rehab cost estimation.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { useState } from 'react'
import { Wrench, Zap, Save, Loader2, AlertTriangle, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { SectionHeader, CommandButton, AtlasCard } from '@/components/ui/index'

interface LineItem {
  category: string; description: string
  low: number; high: number
  priority: 'critical' | 'high' | 'medium' | 'low'; notes: string
}

interface RehabResult {
  summary: string
  total_low: number; total_high: number; recommended_budget: number
  contingency_pct: number; timeline_weeks: number
  line_items: LineItem[]; key_risks: string[]; wv_market_notes: string
  artifact_id: string | null
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: 'text-atlas-coral',
  high:     'text-atlas-gold',
  medium:   'text-atlas-accent',
  low:      'text-atlas-muted',
}

const CONDITION_OPTIONS = [
  { v: 'gut',     l: 'Gut (Complete Demo)' },
  { v: 'poor',    l: 'Poor (Major Work)' },
  { v: 'fair',    l: 'Fair (Standard Rehab)' },
  { v: 'average', l: 'Average (Light Work)' },
  { v: 'good',    l: 'Good (Cosmetic Only)' },
]

const REHAB_LEVELS = [
  { v: 'cosmetic', l: 'Cosmetic' },
  { v: 'light',    l: 'Light Rehab' },
  { v: 'full',     l: 'Full Rehab' },
  { v: 'heavy',    l: 'Heavy / Gut' },
]

export default function RehabPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RehabResult | null>(null)
  const [address, setAddress] = useState('')
  const [sqFt, setSqFt] = useState('')
  const [yearBuilt, setYearBuilt] = useState('')
  const [beds, setBeds] = useState('')
  const [baths, setBaths] = useState('')
  const [condition, setCondition] = useState('fair')
  const [rehabLevel, setRehabLevel] = useState('light')
  const [scopeNotes, setScopeNotes] = useState('')

  async function runEstimate() {
    if (!address) { toast.error('Property address required'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/ai/rehab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          sq_footage:   sqFt ? Number(sqFt) : undefined,
          year_built:   yearBuilt ? Number(yearBuilt) : undefined,
          bedrooms:     beds ? Number(beds) : undefined,
          bathrooms:    baths ? Number(baths) : undefined,
          condition,
          rehab_level:  rehabLevel,
          scope_notes:  scopeNotes || undefined,
          target_market: 'retail',
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setResult(data.data)
        toast.success(`Estimate: $${data.data.recommended_budget.toLocaleString()} recommended budget`)
      } else {
        toast.error('Estimation failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <SectionHeader
        title="Rehab Estimator"
        subtitle="AI room-by-room cost estimation with WV contractor pricing"
        badge="A07-REHAB"
        badgeColor="#4fd1c5"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input */}
        <AtlasCard className="space-y-4">
          <h3 className="text-xs font-bold text-atlas-text uppercase tracking-wider flex items-center gap-2">
            <Wrench size={13} className="text-atlas-teal" /> Property Details
          </h3>

          <div className="space-y-1">
            <label className="text-[10px] text-atlas-muted">Property Address</label>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="412 Elm St, Charleston WV 25301"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-atlas-border text-xs text-atlas-text placeholder-atlas-muted focus:outline-none focus:border-atlas-teal/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-atlas-muted">Condition</label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-atlas-border text-xs text-atlas-text focus:outline-none"
              >
                {CONDITION_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-atlas-muted">Rehab Level</label>
              <select
                value={rehabLevel}
                onChange={e => setRehabLevel(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-atlas-border text-xs text-atlas-text focus:outline-none"
              >
                {REHAB_LEVELS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { l: 'Sq Ft', v: sqFt, s: setSqFt },
              { l: 'Yr Built', v: yearBuilt, s: setYearBuilt },
              { l: 'Beds', v: beds, s: setBeds },
              { l: 'Baths', v: baths, s: setBaths },
            ].map(f => (
              <div key={f.l} className="space-y-1">
                <label className="text-[10px] text-atlas-muted">{f.l}</label>
                <input
                  type="number"
                  value={f.v}
                  onChange={e => f.s(e.target.value)}
                  placeholder="—"
                  className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-atlas-border text-xs text-atlas-text focus:outline-none text-center"
                />
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-atlas-muted">Scope Notes (optional)</label>
            <textarea
              value={scopeNotes}
              onChange={e => setScopeNotes(e.target.value)}
              placeholder="e.g. Roof is 3 years old. Needs full kitchen. HVAC works..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-atlas-border text-xs text-atlas-text placeholder-atlas-muted focus:outline-none resize-none"
            />
          </div>

          <CommandButton onClick={runEstimate} loading={loading} icon={<Zap size={13} />} size="lg" className="w-full justify-center" variant="secondary">
            Generate Rehab Estimate
          </CommandButton>

          <p className="text-[9px] text-atlas-muted text-center">
            AI uses WV contractor pricing (15-25% below national avg) · Always verify with local contractors
          </p>
        </AtlasCard>

        {/* Results */}
        <div className="space-y-4">
          {!result ? (
            <AtlasCard className="h-full flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <Wrench size={32} className="text-atlas-muted mx-auto" />
                <p className="text-sm text-atlas-muted">Enter property details to generate estimate</p>
              </div>
            </AtlasCard>
          ) : (
            <>
              {/* Budget Banner */}
              <div className="rounded-xl border border-atlas-teal/35 bg-atlas-teal/8 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-atlas-muted mb-1">Recommended Budget</p>
                    <p className="text-3xl font-mono font-bold text-atlas-teal">${result.recommended_budget.toLocaleString()}</p>
                    <p className="text-[10px] text-atlas-muted mt-1">
                      Range: ${result.total_low.toLocaleString()} – ${result.total_high.toLocaleString()}
                      · +{result.contingency_pct}% contingency · {result.timeline_weeks}w timeline
                    </p>
                  </div>
                  {result.artifact_id && (
                    <span className="flex items-center gap-1 text-[9px] text-atlas-muted">
                      <Save size={9} /> Saved
                    </span>
                  )}
                </div>
                <p className="text-xs text-atlas-muted">{result.summary}</p>
              </div>

              {/* Line Items */}
              <AtlasCard>
                <h3 className="text-xs font-bold text-atlas-text mb-3">Line Items</h3>
                <div className="space-y-1.5">
                  {result.line_items.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 py-1.5 border-b border-white/5 last:border-0">
                      <ChevronRight size={11} className={clsx('mt-0.5 shrink-0', PRIORITY_COLOR[item.priority])} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-atlas-text">{item.description}</span>
                          <span className="text-xs font-mono text-atlas-teal shrink-0 ml-2">
                            ${item.low.toLocaleString()}–${item.high.toLocaleString()}
                          </span>
                        </div>
                        {item.notes && <p className="text-[9px] text-atlas-muted mt-0.5">{item.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </AtlasCard>

              {/* Risks + WV Notes */}
              {(result.key_risks?.length > 0 || result.wv_market_notes) && (
                <AtlasCard>
                  {result.key_risks?.length > 0 && (
                    <div className="mb-3">
                      <h3 className="text-xs font-bold text-atlas-text mb-2 flex items-center gap-1.5">
                        <AlertTriangle size={11} className="text-atlas-gold" /> Key Risks
                      </h3>
                      <ul className="space-y-1">
                        {result.key_risks.map((r, i) => (
                          <li key={i} className="text-xs text-atlas-muted flex items-start gap-1.5">
                            <span className="text-atlas-gold mt-0.5">·</span> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.wv_market_notes && (
                    <div className="pt-3 border-t border-white/5">
                      <p className="text-[10px] font-bold text-atlas-muted uppercase tracking-wider mb-1">WV Market Notes</p>
                      <p className="text-xs text-atlas-muted">{result.wv_market_notes}</p>
                    </div>
                  )}
                </AtlasCard>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
