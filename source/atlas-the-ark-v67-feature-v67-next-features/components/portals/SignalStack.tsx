'use client'

import { useCallback, useEffect, useState } from 'react'
import { useArkStore } from '@/store/useArkStore'
import {
  Target, Zap, Activity, DollarSign, Home, AlertTriangle, Calendar,
  Users, Gavel, TrendingDown, Clock, CheckCircle, XCircle,
} from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import type { ScoringInput, ScoredSignal, DistressGrade } from '@/lib/scoring/engine'

const GRADE_COLOR: Record<DistressGrade, string> = {
  CRITICAL: 'text-red-400 bg-red-900/20 border-red-800/40',
  HOT: 'text-orange-400 bg-orange-900/20 border-orange-800/40',
  WARM: 'text-atlas-gold bg-atlas-gold/15 border-atlas-gold/30',
  COOL: 'text-atlas-accent bg-atlas-accent/15 border-atlas-accent/30',
  COLD: 'text-atlas-muted bg-white/5 border-atlas-border',
  UNKNOWN: 'text-atlas-muted bg-white/5 border-atlas-border',
}

interface ScoreResult {
  score: number
  grade: DistressGrade
  signals: ScoredSignal[]
  signals_fired: number
  signals_total: number
  mao?: number
  equity_pct?: number
  score_id: string | null
}

interface HistoryRow {
  id: string
  score: number
  grade: string
  created_at: string
}

export function SignalStackPortal() {
  const { consumeCredits } = useArkStore()
  const [address, setAddress] = useState('')
  const [input, setInput] = useState<ScoringInput>({})
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<ScoreResult | null>(null)
  const [history, setHistory] = useState<HistoryRow[]>([])

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/scoring')
      const json = await res.json()
      if (json.ok) setHistory(json.data ?? [])
    } catch {
      // non-fatal
    }
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  function toggle(key: keyof ScoringInput) {
    setInput((s) => ({ ...s, [key]: !s[key] }))
    setResult(null)
  }

  function setNumber(key: keyof ScoringInput, value: string) {
    const n = value === '' ? undefined : Number(value)
    setInput((s) => ({ ...s, [key]: n }))
    setResult(null)
  }

  async function runScoring() {
    if (!address.trim()) {
      toast.error('Enter a property address')
      return
    }
    if (!consumeCredits(5)) {
      toast.error('Credit limit reached')
      return
    }

    setRunning(true)
    try {
      const res = await fetch('/api/scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? 'Scoring failed')
        return
      }
      setResult(json.data)
      toast.success(`Scored ${json.data.score}/100 — ${json.data.grade}`)
      loadHistory()
    } catch {
      toast.error('Failed to reach scoring engine')
    } finally {
      setRunning(false)
    }
  }

  const enabledCount = Object.values(input).filter((v) => v === true).length +
    Object.entries(input).filter(([, v]) => typeof v === 'number' && v !== undefined).length

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div className="atlas-panel p-4 rounded-xl border border-atlas-purple/20 bg-gradient-to-r from-atlas-purple/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-atlas-purple/20 flex items-center justify-center">
            <Target size={20} className="text-atlas-purple" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Signal Stack Engine</h2>
            <p className="text-xs text-atlas-muted">8-Signal distress scoring · live, persisted to property_distress_scores</p>
          </div>
        </div>
      </div>

      {/* Address input + run */}
      <div className="atlas-panel p-4 rounded-xl">
        <div className="flex gap-3">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter property address (e.g., 412 Elm St, Charleston, WV 25301)"
            className="flex-1 bg-atlas-dark border border-atlas-border rounded-lg px-4 py-2.5 text-sm text-atlas-text placeholder-atlas-muted focus:outline-none focus:border-atlas-accent"
          />
          <button
            onClick={runScoring}
            disabled={running}
            className="px-5 py-2.5 rounded-lg bg-atlas-purple text-white font-semibold text-sm hover:bg-atlas-purple/80 disabled:opacity-50 transition-all flex items-center gap-2 shrink-0"
          >
            {running ? (
              <><Activity size={16} className="animate-spin" /> Scoring...</>
            ) : (
              <><Zap size={16} /> Run Stack (5 cr)</>
            )}
          </button>
        </div>
      </div>

      {/* Signal inputs grouped by category */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SignalCategory title="Tax" icon={<DollarSign size={13} />} color="text-red-400">
          <ToggleRow active={!!input.tax_delinquent} label="Tax Delinquent" onClick={() => toggle('tax_delinquent')} />
          <NumberRow label="Tax Owed ($)" value={input.tax_owed} onChange={(v) => setNumber('tax_owed', v)} />
        </SignalCategory>

        <SignalCategory title="Vacancy" icon={<Home size={13} />} color="text-orange-400">
          <ToggleRow active={!!input.is_vacant} label="Vacant" onClick={() => toggle('is_vacant')} />
          <ToggleRow active={!!input.is_abandoned} label="Abandoned" onClick={() => toggle('is_abandoned')} />
        </SignalCategory>

        <SignalCategory title="Foreclosure" icon={<AlertTriangle size={13} />} color="text-atlas-coral">
          <ToggleRow active={!!input.in_foreclosure} label="In Foreclosure" onClick={() => toggle('in_foreclosure')} />
          <ToggleRow active={!!input.lis_pendens} label="Lis Pendens" onClick={() => toggle('lis_pendens')} />
          <ToggleRow active={!!input.reo} label="REO (Bank-Owned)" onClick={() => toggle('reo')} />
        </SignalCategory>

        <SignalCategory title="Equity" icon={<TrendingDown size={13} />} color="text-atlas-green">
          <NumberRow label="ARV ($)" value={input.arv} onChange={(v) => setNumber('arv', v)} />
          <NumberRow label="Asking Price ($)" value={input.asking_price} onChange={(v) => setNumber('asking_price', v)} />
          <NumberRow label="Est. Repair ($)" value={input.estimated_repair} onChange={(v) => setNumber('estimated_repair', v)} />
        </SignalCategory>

        <SignalCategory title="Market Timing" icon={<Calendar size={13} />} color="text-atlas-gold">
          <NumberRow label="Days on Market" value={input.days_on_market} onChange={(v) => setNumber('days_on_market', v)} />
        </SignalCategory>

        <SignalCategory title="Owner Distress" icon={<Users size={13} />} color="text-atlas-purple">
          <ToggleRow active={!!input.absentee_owner} label="Absentee Owner" onClick={() => toggle('absentee_owner')} />
          <ToggleRow active={!!input.out_of_state_owner} label="Out-of-State Owner" onClick={() => toggle('out_of_state_owner')} />
        </SignalCategory>

        <SignalCategory title="Court / Legal" icon={<Gavel size={13} />} color="text-atlas-accent">
          <ToggleRow active={!!input.liens} label="Liens" onClick={() => toggle('liens')} />
          <ToggleRow active={!!input.judgements} label="Judgements" onClick={() => toggle('judgements')} />
          <ToggleRow active={!!input.probate} label="Probate" onClick={() => toggle('probate')} />
          <ToggleRow active={!!input.divorce} label="Divorce Filing" onClick={() => toggle('divorce')} />
        </SignalCategory>

        <SignalCategory title="Market Velocity" icon={<Clock size={13} />} color="text-atlas-muted">
          <NumberRow label="County Median DOM" value={input.county_median_dom} onChange={(v) => setNumber('county_median_dom', v)} />
        </SignalCategory>
      </div>

      {/* Score display */}
      <div className="atlas-panel p-6 rounded-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-atlas-muted uppercase tracking-wider mb-1">
              {result ? 'Computed Score' : 'Live Preview'}
            </div>
            <div className="flex items-baseline gap-3">
              <span className={clsx(
                'text-5xl font-bold font-mono',
                !result ? 'text-atlas-muted' :
                result.score >= 65 ? 'text-red-400' :
                result.score >= 45 ? 'text-atlas-gold' :
                result.score >= 25 ? 'text-atlas-accent' : 'text-atlas-muted'
              )}>
                {result ? result.score : '—'}
              </span>
              <span className="text-atlas-muted">/100</span>
              {result && (
                <span className={clsx('text-xs font-bold px-2 py-1 rounded-lg border', GRADE_COLOR[result.grade])}>
                  {result.grade}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-atlas-muted mb-1">
              {result ? `${result.signals_fired}/${result.signals_total} signals fired` : `${enabledCount} input(s) set`}
            </div>
            {result?.mao != null && (
              <div className="text-xs text-atlas-green font-mono">MAO: ${result.mao.toLocaleString()}</div>
            )}
            {result?.equity_pct != null && (
              <div className="text-xs text-atlas-muted font-mono">Equity: {Math.round(result.equity_pct)}%</div>
            )}
          </div>
        </div>
      </div>

      {/* Signal breakdown */}
      {result && (
        <div className="atlas-panel rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-atlas-border">
            <h3 className="text-white text-sm font-semibold">Signal Breakdown</h3>
          </div>
          <div className="divide-y divide-atlas-border">
            {result.signals.map((s) => (
              <div key={s.type} className="px-5 py-2.5 flex items-center gap-3">
                {s.fired ? <CheckCircle size={13} className="text-atlas-green shrink-0" /> : <XCircle size={13} className="text-atlas-muted/40 shrink-0" />}
                <span className="text-xs text-atlas-text flex-1">{s.label}</span>
                <span className="text-[11px] text-atlas-muted flex-1 truncate">{s.detail}</span>
                <span className={clsx('text-xs font-mono shrink-0', s.fired ? 'text-atlas-accent' : 'text-atlas-muted/40')}>
                  +{s.points}/{s.weight}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="atlas-panel rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-atlas-border">
            <h3 className="text-white text-sm font-semibold">Recent Scores</h3>
          </div>
          <div className="divide-y divide-atlas-border">
            {history.slice(0, 10).map((h) => (
              <div key={h.id} className="px-5 py-2 flex items-center justify-between text-xs">
                <span className="text-atlas-text font-mono">{h.score}/100</span>
                <span className="text-atlas-muted">{h.grade}</span>
                <span className="text-atlas-muted/70">{new Date(h.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SignalCategory({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <div className="atlas-panel p-4 rounded-xl">
      <div className={clsx('flex items-center gap-2 mb-3 text-xs font-bold uppercase', color)}>
        {icon} {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function ToggleRow({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] transition-all text-left border',
        active
          ? 'bg-atlas-accent/15 border-atlas-accent/30 text-atlas-accent'
          : 'bg-atlas-dark border-atlas-border text-atlas-muted hover:text-atlas-text'
      )}
    >
      <span>{label}</span>
      {active ? <CheckCircle size={11} /> : null}
    </button>
  )
}

function NumberRow({ label, value, onChange }: { label: string; value?: number; onChange: (v: string) => void }) {
  return (
    <div className="space-y-0.5">
      <label className="text-[10px] text-atlas-muted">{label}</label>
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-atlas-dark border border-atlas-border rounded-lg px-2 py-1 text-[11px] text-atlas-text focus:outline-none focus:border-atlas-accent"
      />
    </div>
  )
}
