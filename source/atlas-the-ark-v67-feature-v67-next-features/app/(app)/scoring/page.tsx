'use client'

/**
 * ATLAS v67 — Distress Scoring Page
 * Signal Stack · 8-signal property distress scorer
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { useState } from 'react'
import { Zap, CheckCircle2, XCircle, Loader2, Save, BarChart3 } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { ScoreBar, SignalBadge, CommandButton, SectionHeader } from '@/components/ui/index'

type Grade = 'CRITICAL' | 'HOT' | 'WARM' | 'COOL' | 'COLD' | 'UNKNOWN'

interface ScoredSignal { type: string; label: string; weight: number; points: number; fired: boolean; detail: string }
interface ScoreResult { score: number; grade: Grade; signals: ScoredSignal[]; signals_fired: number; mao?: number; score_id?: string }

const GRADE_TO_SIGNAL: Record<Grade, 'critical' | 'hot' | 'warm' | 'cool' | 'cold'> = {
  CRITICAL: 'critical', HOT: 'hot', WARM: 'warm', COOL: 'cool', COLD: 'cold', UNKNOWN: 'cold',
}

function InputToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={clsx(
        'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all',
        checked
          ? 'bg-atlas-coral/15 border-atlas-coral/40 text-atlas-coral'
          : 'bg-white/5 border-white/10 text-atlas-muted hover:border-white/20'
      )}
    >
      {checked ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
      {label}
    </button>
  )
}

function NumInput({ label, value, onChange, prefix, suffix }: { label: string; value: string; onChange: (v: string) => void; prefix?: string; suffix?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-atlas-muted">{label}</label>
      <div className="flex items-center gap-1">
        {prefix && <span className="text-xs text-atlas-muted">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-atlas-border text-xs text-atlas-text focus:outline-none focus:border-atlas-accent/50 w-full"
          placeholder="0"
        />
        {suffix && <span className="text-xs text-atlas-muted">{suffix}</span>}
      </div>
    </div>
  )
}

export default function ScoringPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScoreResult | null>(null)

  // Signal inputs
  const [taxDelinquent, setTaxDelinquent] = useState(false)
  const [taxOwed, setTaxOwed] = useState('')
  const [isVacant, setIsVacant] = useState(false)
  const [isAbandoned, setIsAbandoned] = useState(false)
  const [inForeclosure, setInForeclosure] = useState(false)
  const [lisPendens, setLisPendens] = useState(false)
  const [reo, setReo] = useState(false)
  const [arv, setArv] = useState('')
  const [askingPrice, setAskingPrice] = useState('')
  const [repairCost, setRepairCost] = useState('')
  const [dom, setDom] = useState('')
  const [absenteeOwner, setAbsenteeOwner] = useState(false)
  const [outOfState, setOutOfState] = useState(false)
  const [liens, setLiens] = useState(false)
  const [probate, setProbate] = useState(false)
  const [countyDom, setCountyDom] = useState('')

  async function runScore() {
    setLoading(true)
    try {
      const res = await fetch('/api/scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tax_delinquent:    taxDelinquent,
          tax_owed:          taxOwed ? Number(taxOwed) : undefined,
          is_vacant:         isVacant,
          is_abandoned:      isAbandoned,
          in_foreclosure:    inForeclosure,
          lis_pendens:       lisPendens,
          reo,
          arv:               arv ? Number(arv) : undefined,
          asking_price:      askingPrice ? Number(askingPrice) : undefined,
          estimated_repair:  repairCost ? Number(repairCost) : undefined,
          days_on_market:    dom ? Number(dom) : undefined,
          absentee_owner:    absenteeOwner,
          out_of_state_owner: outOfState,
          liens,
          probate,
          county_median_dom: countyDom ? Number(countyDom) : undefined,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setResult(data.data)
        toast.success(`Score computed: ${data.data.score} — ${data.data.grade}`)
      } else {
        toast.error('Scoring failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <SectionHeader
        title="Distress Scoring"
        subtitle="8-signal property distress analysis — score any WV property"
        badge="SIGNAL STACK"
        badgeColor="#63b3ed"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INPUT PANEL */}
        <div className="rounded-xl border border-atlas-border bg-atlas-panel p-5 space-y-5">
          <h3 className="text-xs font-bold text-atlas-text uppercase tracking-wider">Signal Inputs</h3>

          {/* Tax */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-atlas-muted uppercase tracking-wider">Tax · 20pts</p>
            <InputToggle label="Tax Delinquent" checked={taxDelinquent} onChange={setTaxDelinquent} />
            {taxDelinquent && <NumInput label="Amount Owed" value={taxOwed} onChange={setTaxOwed} prefix="$" />}
          </div>

          {/* Vacancy */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-atlas-muted uppercase tracking-wider">Vacancy · 18pts</p>
            <div className="flex gap-2">
              <InputToggle label="Vacant" checked={isVacant} onChange={setIsVacant} />
              <InputToggle label="Abandoned" checked={isAbandoned} onChange={setIsAbandoned} />
            </div>
          </div>

          {/* Foreclosure */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-atlas-muted uppercase tracking-wider">Foreclosure · 18pts</p>
            <div className="flex flex-wrap gap-2">
              <InputToggle label="Active Foreclosure" checked={inForeclosure} onChange={setInForeclosure} />
              <InputToggle label="Lis Pendens" checked={lisPendens} onChange={setLisPendens} />
              <InputToggle label="REO / Bank-Owned" checked={reo} onChange={setReo} />
            </div>
          </div>

          {/* Equity */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-atlas-muted uppercase tracking-wider">Equity · 15pts</p>
            <div className="grid grid-cols-3 gap-2">
              <NumInput label="ARV" value={arv} onChange={setArv} prefix="$" />
              <NumInput label="Asking Price" value={askingPrice} onChange={setAskingPrice} prefix="$" />
              <NumInput label="Repair Cost" value={repairCost} onChange={setRepairCost} prefix="$" />
            </div>
          </div>

          {/* DOM */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-atlas-muted uppercase tracking-wider">Days on Market · 12pts</p>
            <div className="grid grid-cols-2 gap-2">
              <NumInput label="Property DOM" value={dom} onChange={setDom} suffix="days" />
              <NumInput label="County Median DOM" value={countyDom} onChange={setCountyDom} suffix="days" />
            </div>
          </div>

          {/* Owner */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-atlas-muted uppercase tracking-wider">Owner · 10pts</p>
            <div className="flex gap-2">
              <InputToggle label="Absentee Owner" checked={absenteeOwner} onChange={setAbsenteeOwner} />
              <InputToggle label="Out-of-State" checked={outOfState} onChange={setOutOfState} />
            </div>
          </div>

          {/* Court */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-atlas-muted uppercase tracking-wider">Court / Legal · 7pts</p>
            <div className="flex gap-2">
              <InputToggle label="Liens" checked={liens} onChange={setLiens} />
              <InputToggle label="Probate" checked={probate} onChange={setProbate} />
            </div>
          </div>

          <CommandButton onClick={runScore} loading={loading} icon={<Zap size={13} />} size="lg" className="w-full justify-center">
            Run Signal Analysis
          </CommandButton>
        </div>

        {/* RESULT PANEL */}
        <div className="space-y-4">
          {!result ? (
            <div className="rounded-xl border border-atlas-border bg-atlas-panel p-8 h-full flex items-center justify-center">
              <div className="text-center space-y-2">
                <BarChart3 size={32} className="text-atlas-muted mx-auto" />
                <p className="text-sm text-atlas-muted">Configure signals and run analysis</p>
              </div>
            </div>
          ) : (
            <>
              {/* Score Hero */}
              <div className={clsx('rounded-xl border p-5', {
                'border-atlas-coral/40 bg-[rgba(252,129,129,0.08)]': result.grade === 'CRITICAL',
                'border-atlas-gold/40 bg-[rgba(246,173,85,0.08)]':   result.grade === 'HOT',
                'border-atlas-accent/40 bg-[rgba(99,179,237,0.08)]': result.grade === 'WARM',
                'border-atlas-teal/40 bg-[rgba(79,209,197,0.08)]':   result.grade === 'COOL',
                'border-white/10 bg-white/4':                         result.grade === 'COLD',
              })}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <SignalBadge level={GRADE_TO_SIGNAL[result.grade]} label={result.grade} />
                    <div className="text-xs text-atlas-muted mt-2">{result.signals_fired} of 8 signals fired</div>
                  </div>
                  <div className="text-5xl font-mono font-bold text-atlas-text">{result.score}</div>
                </div>
                <ScoreBar score={result.score} showValue={false} height="lg" />
                {result.mao && (
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-atlas-muted">MAO (70% rule):</span>
                    <span className="text-sm font-mono font-bold text-atlas-green">${result.mao.toLocaleString()}</span>
                  </div>
                )}
                {result.score_id && (
                  <div className="mt-2 text-[10px] text-atlas-muted flex items-center gap-1">
                    <Save size={9} /> Saved to database
                  </div>
                )}
              </div>

              {/* Signal Breakdown */}
              <div className="rounded-xl border border-atlas-border bg-atlas-panel p-5">
                <h3 className="text-xs font-bold text-atlas-text mb-3">Signal Breakdown</h3>
                <div className="space-y-2">
                  {result.signals.map(sig => (
                    <div key={sig.type} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                      <div className={clsx('mt-0.5', sig.fired ? 'text-atlas-coral' : 'text-white/20')}>
                        {sig.fired ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-atlas-text">{sig.label}</span>
                          <span className="text-xs font-mono font-bold text-atlas-muted">{sig.points}/{sig.weight}pts</span>
                        </div>
                        <p className="text-[10px] text-atlas-muted mt-0.5">{sig.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
