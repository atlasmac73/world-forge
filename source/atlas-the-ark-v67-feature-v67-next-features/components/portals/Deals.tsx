'use client'

import { useState } from 'react'
import { useArkStore } from '@/store/useArkStore'
import { Search, MapPin, TrendingUp, FileText, Loader2, AlertTriangle, CheckCircle2, DollarSign, Home } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

interface Dossier {
  address: string
  owner_name: string
  equity_pct: number
  arv: number
  assessed_value: number
  estimated_repair: number
  recommended_offer: number
  net_profit_potential: number
  distress_score: number
  deal_grade: string
  tax_delinquent: boolean
  occupancy: string
  liens: string[]
  risk_factors: string[]
  investment_thesis: string
  sms_1: string
  voicemail: string
  talking_points: string[]
  agents_used: string[]
  duration_ms: number
}

const QUICK_ADDRESSES = [
  '412 Elm St, Charleston WV 25301',
  '1847 Bridge Rd, South Charleston WV 25303',
  '234 Oak Ave, Nitro WV 25143',
  '89 Pine Hill Rd, St. Albans WV 25177',
]

export function DealsPortal() {
  const { consumeCredits, addAgentRun, subscription, setActivePortal } = useArkStore()
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [dossier, setDossier] = useState<Dossier | null>(null)
  const [activeTab, setActiveTab] = useState<'analysis' | 'outreach' | 'raw'>('analysis')

  async function runDossier(addr?: string) {
    const target = addr ?? address.trim()
    if (!target) { toast.error('Enter a WV property address'); return }

    if (!consumeCredits(25)) {
      toast.error(`Daily credit limit hit (${subscription.credits_limit_daily}). Upgrade tier for more.`)
      return
    }

    setAddress(target)
    setLoading(true)
    setDossier(null)

    try {
      const res = await fetch('/api/agents/dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: target }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDossier(data)
      toast.success('Dossier complete — A12-SPECTER → A15-OMEN → A06-HERALD')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Pipeline failed. Check API key.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl space-y-4">
      {/* Search bar */}
      <div className="atlas-panel rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={14} className="text-atlas-gold" />
          <span className="text-xs font-bold text-atlas-text">Deal Navigator — 3-Agent Dossier Pipeline</span>
          <span className="text-[9px] text-atlas-muted ml-auto">A12-SPECTER → A15-OMEN → A06-HERALD · 25 credits</span>
        </div>
        <div className="flex gap-2">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runDossier()}
            placeholder="Enter WV property address... e.g. 412 Elm St, Charleston WV 25301"
            className="flex-1 bg-atlas-surface border border-atlas-border rounded-lg px-3 py-2.5 text-sm text-atlas-text placeholder-atlas-muted"
          />
          <button
            onClick={() => runDossier()}
            disabled={loading || !address.trim()}
            className={clsx(
              'px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2',
              loading || !address.trim()
                ? 'bg-atlas-panel border border-atlas-border text-atlas-muted cursor-not-allowed'
                : 'bg-atlas-accent/15 border border-atlas-accent/40 text-atlas-accent hover:bg-atlas-accent/25'
            )}
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Analyzing...</> : <><Search size={14} /> Run Dossier</>}
          </button>
        </div>
        {/* Quick addresses */}
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {QUICK_ADDRESSES.map((a) => (
            <button
              key={a}
              onClick={() => runDossier(a)}
              className="text-[10px] text-atlas-muted hover:text-atlas-accent px-2 py-1 rounded border border-atlas-border hover:border-atlas-accent/30 transition-all bg-atlas-surface"
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Dossier result */}
      {dossier && (
        <div className="atlas-panel rounded-xl overflow-hidden">
          {/* Header bar */}
          <div className={clsx(
            'px-4 py-3 border-b border-atlas-border flex items-center justify-between',
            dossier.distress_score >= 70 ? 'bg-atlas-coral/10' : dossier.distress_score >= 50 ? 'bg-atlas-gold/10' : 'bg-atlas-panel'
          )}>
            <div>
              <div className="text-sm font-bold text-atlas-text">{dossier.address}</div>
              <div className="text-xs text-atlas-muted mt-0.5">Owner: {dossier.owner_name} · {dossier.occupancy}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className={clsx('text-2xl font-bold', dossier.distress_score >= 70 ? 'text-atlas-coral' : dossier.distress_score >= 50 ? 'text-atlas-gold' : 'text-atlas-muted')}>
                  {dossier.distress_score}
                </div>
                <div className="text-[9px] text-atlas-muted">DISTRESS</div>
              </div>
              <div className={clsx(
                'text-xl font-bold px-3 py-1.5 rounded-lg',
                dossier.deal_grade === 'A' ? 'bg-atlas-green/20 text-atlas-green' :
                dossier.deal_grade === 'B' ? 'bg-atlas-gold/20 text-atlas-gold' :
                'bg-atlas-muted/20 text-atlas-muted'
              )}>
                {dossier.deal_grade}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0.5 px-4 pt-3">
            {(['analysis', 'outreach', 'raw'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={clsx('px-3 py-1.5 text-xs rounded-t capitalize transition-all',
                  activeTab === t
                    ? 'bg-atlas-panel border border-atlas-border border-b-atlas-panel text-atlas-accent'
                    : 'text-atlas-muted hover:text-atlas-text'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* Analysis Tab */}
            {activeTab === 'analysis' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'ARV', value: `$${dossier.arv?.toLocaleString()}`, color: 'text-atlas-accent' },
                    { label: 'Max Offer (MAO)', value: `$${dossier.recommended_offer?.toLocaleString()}`, color: 'text-atlas-gold' },
                    { label: 'Est. Repair', value: `$${dossier.estimated_repair?.toLocaleString()}`, color: 'text-atlas-coral' },
                    { label: 'Net Profit', value: `$${dossier.net_profit_potential?.toLocaleString()}`, color: 'text-atlas-green' },
                  ].map((m, i) => (
                    <div key={i} className="bg-atlas-surface rounded-lg p-3 text-center border border-atlas-border">
                      <div className={clsx('text-lg font-bold', m.color)}>{m.value}</div>
                      <div className="text-[9px] text-atlas-muted mt-0.5 uppercase">{m.label}</div>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-atlas-muted bg-atlas-surface rounded-lg px-3 py-2 border border-atlas-border font-mono">
                  MAO = (ARV ${dossier.arv?.toLocaleString()} × 0.70) − Repairs ${dossier.estimated_repair?.toLocaleString()} = <span className="text-atlas-gold font-bold">${dossier.recommended_offer?.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] text-atlas-muted uppercase tracking-wide mb-1.5">Risk Factors</div>
                    {(dossier.risk_factors ?? []).map((r, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-atlas-text mb-1">
                        <AlertTriangle size={10} className="text-atlas-coral mt-0.5 flex-shrink-0" />
                        {r}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-[10px] text-atlas-muted uppercase tracking-wide mb-1.5">Investment Thesis</div>
                    <p className="text-xs text-atlas-text leading-relaxed">{dossier.investment_thesis}</p>
                    {dossier.tax_delinquent && (
                      <div className="mt-2 text-[10px] text-atlas-gold flex items-center gap-1">
                        <AlertTriangle size={10} /> Tax delinquent — cash can clear all balances
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-atlas-muted flex items-center gap-2">
                  {(dossier.agents_used ?? []).map((a, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-atlas-panel border border-atlas-border">{a}</span>
                  ))}
                  <span className="ml-auto">{dossier.duration_ms}ms</span>
                </div>
              </div>
            )}

            {/* Outreach Tab */}
            {activeTab === 'outreach' && (
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] text-atlas-muted uppercase tracking-wide mb-1.5">SMS Touch 1 (TCPA Compliant)</div>
                  <div className="bg-atlas-surface rounded-lg p-3 border border-atlas-border">
                    <p className="text-xs text-atlas-text">{dossier.sms_1}</p>
                    <div className="text-[9px] text-atlas-muted mt-1">{(dossier.sms_1 ?? '').length}/160 chars</div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-atlas-muted uppercase tracking-wide mb-1.5">Voicemail Script</div>
                  <div className="bg-atlas-surface rounded-lg p-3 border border-atlas-border">
                    <p className="text-xs text-atlas-text leading-relaxed">{dossier.voicemail}</p>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-atlas-muted uppercase tracking-wide mb-1.5">Talking Points</div>
                  {(dossier.talking_points ?? []).map((tp, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-atlas-text mb-1.5">
                      <CheckCircle2 size={10} className="text-atlas-green mt-0.5 flex-shrink-0" />
                      {tp}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setActivePortal && setActivePortal('loi')}
                  className="w-full py-2 rounded-lg text-xs font-semibold bg-atlas-gold/10 border border-atlas-gold/30 text-atlas-gold hover:bg-atlas-gold/20 transition-all"
                >
                  → Generate Full LOI for ${dossier.recommended_offer?.toLocaleString()} offer
                </button>
              </div>
            )}

            {/* Raw Tab */}
            {activeTab === 'raw' && (
              <pre className="text-[9px] text-atlas-green bg-atlas-surface rounded-lg p-3 overflow-x-auto font-mono leading-relaxed border border-atlas-border max-h-80">
                {JSON.stringify(dossier, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}



