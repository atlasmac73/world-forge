'use client'
/**
 * NASDROP Portal — Owner Intelligence Dashboard
 * T7-only. The real command layer Isaac sees.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC · v66
 */

import { useState, useEffect } from 'react'
import { useArkStore } from '@/store/useArkStore'
import { createClient } from '@/lib/supabase/client'
import {
  Zap, TrendingUp, AlertTriangle, Eye, Target, DollarSign,
  MapPin, Phone, Mail, Clock, ChevronRight, Star, Flame,
  Activity, BarChart2, Lock
} from 'lucide-react'
import toast from 'react-hot-toast'

interface HotProperty {
  id: string
  address: string
  city: string
  state: string
  distress_score?: number
  deal_grade?: string
  equity_pct: number
  arv: number
  asking_price?: number
  owner_name?: string
  owner_phone?: string
  owner_email?: string
  tax_delinquent: boolean
  status: string
  created_at: string
}

interface DealStat {
  label: string
  value: string | number
  sub?: string
  color: string
  icon: React.ReactNode
}

const GRADE_COLORS: Record<string, string> = {
  'A+': '#00d48a', 'A': '#00d48a', 'B': '#18c8e8',
  'C': '#f0a000', 'D': '#ff3050', 'F': '#4a5268'
}

export function NasdropPortal() {
  const { subscription, setActivePortal } = useArkStore()
  const supabase = createClient()

  const [properties, setProperties] = useState<HotProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<HotProperty | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<string>('')
  const [analyzing, setAnalyzing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'hot' | 'tax_delinquent' | 'high_equity'>('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('distress_score', { ascending: false })
        .limit(50)
      if (error) {
        toast.error('Failed to load properties')
      } else {
        setProperties(data ?? [])
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  const filtered = properties.filter(p => {
    if (filter === 'hot') return p.status === 'hot' || (p.distress_score ?? 0) >= 70
    if (filter === 'tax_delinquent') return p.tax_delinquent
    if (filter === 'high_equity') return p.equity_pct >= 40
    return true
  })

  const stats: DealStat[] = [
    { label: 'Total Properties', value: properties.length, color: '#e8eaf0', icon: <MapPin size={14} /> },
    { label: 'Hot Leads',        value: properties.filter(p => p.status === 'hot').length, color: '#ff3050', icon: <Flame size={14} /> },
    { label: 'Tax Delinquent',   value: properties.filter(p => p.tax_delinquent).length, color: '#f0a000', icon: <AlertTriangle size={14} /> },
    { label: 'Avg Equity',       value: properties.length ? Math.round(properties.reduce((s,p) => s + p.equity_pct, 0) / properties.length) + '%' : '—', color: '#00d48a', icon: <TrendingUp size={14} /> },
    { label: 'Pipeline Value',   value: properties.length ? '$' + (properties.reduce((s,p) => s + (p.arv || 0), 0) / 1000000).toFixed(1) + 'M' : '—', color: '#9b87fa', icon: <DollarSign size={14} /> },
    { label: 'A/B Grade Deals',  value: properties.filter(p => p.deal_grade && ['A+','A','B'].includes(p.deal_grade)).length, color: '#18c8e8', icon: <Star size={14} /> },
  ]

  const runAI = async (p: HotProperty) => {
    setAnalyzing(true)
    setAiAnalysis('')
    try {
      const res = await fetch('/api/agents/distress-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: p.address, city: p.city, state: p.state, arv: p.arv, asking_price: p.asking_price, equity_pct: p.equity_pct, tax_delinquent: p.tax_delinquent }),
      })
      const data = await res.json()
      setAiAnalysis(data.analysis || data.output || 'Analysis complete.')
    } catch {
      setAiAnalysis('AI analysis unavailable — check ANTHROPIC_API_KEY.')
    }
    setAnalyzing(false)
  }

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="atlas-panel rounded-xl p-5" style={{ borderColor: 'rgba(155,135,250,.3)', background: 'linear-gradient(135deg,rgba(155,135,250,.06),rgba(6,8,16,.9))' }}>
        <div className="flex items-center gap-3 mb-1">
          <Zap size={16} style={{ color: '#9b87fa' }} />
          <span style={{ fontSize: 10, color: '#9b87fa', letterSpacing: '.2em', fontFamily: 'var(--font-mono)' }}>
            ⬡ NASDROP · OWNER INTELLIGENCE · T7 CLEARANCE
          </span>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-sans)', letterSpacing: '-.02em', marginBottom: 4 }}>
          Command Intelligence
        </h1>
        <p className="text-xs text-atlas-muted">
          Real-time distress pipeline · owner recon · deal heat map. All properties ranked by A12-SPECTER.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {stats.map(s => (
          <div key={s.label} className="atlas-panel rounded-lg p-3 text-center">
            <div style={{ color: s.color, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
            <div style={{ fontSize: 9, color: '#4a5268', marginTop: 3, letterSpacing: '.08em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {(['all','hot','tax_delinquent','high_equity'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              fontSize: 10, padding: '4px 12px', borderRadius: 100, cursor: 'pointer',
              fontFamily: 'var(--font-mono)', letterSpacing: '.05em',
              background: filter === f ? 'rgba(155,135,250,.2)' : 'rgba(255,255,255,.04)',
              border: `1px solid ${filter === f ? 'rgba(155,135,250,.4)' : 'rgba(255,255,255,.08)'}`,
              color: filter === f ? '#9b87fa' : '#4a5268',
            }}
          >
            {f === 'all' ? 'ALL' : f === 'hot' ? '🔥 HOT' : f === 'tax_delinquent' ? '⚠ TAX DQ' : '💎 HIGH EQ'}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#4a5268', fontFamily: 'var(--font-mono)' }}>
          {filtered.length} properties
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 12 }}>
        {/* Property table */}
        <div className="atlas-panel rounded-xl overflow-hidden">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#4a5268', fontSize: 12 }}>
              <Activity size={20} style={{ marginBottom: 8, opacity: .4 }} /><div>Loading pipeline…</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#4a5268', fontSize: 12 }}>
              <MapPin size={20} style={{ marginBottom: 8, opacity: .4 }} />
              <div>No properties yet.</div>
              <div style={{ marginTop: 6, fontSize: 10 }}>Run: <code style={{ color: '#18c8e8' }}>npm run seed:demo</code> to load demo data.</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,.02)' }}>
                  {['Score','Address','Grade','Equity','ARV','Status',''].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 9, color: '#4a5268', letterSpacing: '.1em', borderBottom: '1px solid rgba(255,255,255,.05)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(selected?.id === p.id ? null : p)}
                    style={{
                      cursor: 'pointer',
                      background: selected?.id === p.id ? 'rgba(155,135,250,.08)' : 'transparent',
                      borderLeft: selected?.id === p.id ? '2px solid #9b87fa' : '2px solid transparent',
                    }}
                  >
                    <td style={{ padding: '9px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {p.distress_score != null && (
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)',
                            background: (p.distress_score >= 70) ? 'rgba(255,48,80,.15)' : (p.distress_score >= 40) ? 'rgba(240,160,0,.15)' : 'rgba(0,212,138,.1)',
                            color: (p.distress_score >= 70) ? '#ff3050' : (p.distress_score >= 40) ? '#f0a000' : '#00d48a',
                          }}>
                            {p.distress_score}
                          </div>
                        )}
                        {p.tax_delinquent && <AlertTriangle size={10} color="#f0a000" />}
                      </div>
                    </td>
                    <td style={{ padding: '9px 12px', color: '#e8eaf0' }}>
                      <div style={{ fontWeight: 600 }}>{p.address}</div>
                      <div style={{ fontSize: 10, color: '#4a5268' }}>{p.city}, {p.state}</div>
                    </td>
                    <td style={{ padding: '9px 12px' }}>
                      {p.deal_grade && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: GRADE_COLORS[p.deal_grade] ?? '#8892b0' }}>{p.deal_grade}</span>
                      )}
                    </td>
                    <td style={{ padding: '9px 12px', color: '#00d48a', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      {p.equity_pct}%
                    </td>
                    <td style={{ padding: '9px 12px', color: '#8892b0', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      ${(p.arv / 1000).toFixed(0)}k
                    </td>
                    <td style={{ padding: '9px 12px' }}>
                      <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 100, background: p.status === 'hot' ? 'rgba(255,48,80,.12)' : 'rgba(255,255,255,.05)', color: p.status === 'hot' ? '#ff3050' : '#4a5268', border: `1px solid ${p.status === 'hot' ? 'rgba(255,48,80,.3)' : 'rgba(255,255,255,.08)'}` }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '9px 12px' }}>
                      <ChevronRight size={12} color="#4a5268" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="atlas-panel rounded-xl p-4 space-y-4" style={{ borderColor: 'rgba(155,135,250,.25)' }}>
            <div>
              <div style={{ fontSize: 10, color: '#9b87fa', letterSpacing: '.15em', marginBottom: 4 }}>PROPERTY INTEL</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{selected.address}</div>
              <div style={{ fontSize: 11, color: '#8892b0' }}>{selected.city}, {selected.state}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'ARV',         value: '$' + (selected.arv / 1000).toFixed(0) + 'k',  color: '#e8eaf0' },
                { label: 'Asking',      value: selected.asking_price ? '$' + (selected.asking_price / 1000).toFixed(0) + 'k' : '—', color: '#8892b0' },
                { label: 'Equity',      value: selected.equity_pct + '%', color: '#00d48a' },
                { label: 'Deal Grade',  value: selected.deal_grade ?? '—', color: GRADE_COLORS[selected.deal_grade ?? ''] ?? '#8892b0' },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,.03)', borderRadius: 7, padding: '8px 10px' }}>
                  <div style={{ fontSize: 9, color: '#4a5268', letterSpacing: '.1em', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
                </div>
              ))}
            </div>

            {(selected.owner_name || selected.owner_phone || selected.owner_email) && (
              <div style={{ background: 'rgba(24,200,232,.06)', border: '1px solid rgba(24,200,232,.15)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 9, color: '#18c8e8', letterSpacing: '.1em', marginBottom: 6 }}>OWNER RECON</div>
                {selected.owner_name  && <div style={{ fontSize: 11, color: '#e8eaf0', marginBottom: 3 }}>{selected.owner_name}</div>}
                {selected.owner_phone && <div style={{ fontSize: 10, color: '#8892b0', display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={9} />{selected.owner_phone}</div>}
                {selected.owner_email && <div style={{ fontSize: 10, color: '#8892b0', display: 'flex', alignItems: 'center', gap: 5 }}><Mail size={9} />{selected.owner_email}</div>}
              </div>
            )}

            <button
              onClick={() => runAI(selected)}
              disabled={analyzing}
              style={{ width: '100%', background: 'rgba(155,135,250,.15)', border: '1px solid rgba(155,135,250,.3)', borderRadius: 8, color: '#9b87fa', fontSize: 11, padding: '9px', cursor: analyzing ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-mono)', opacity: analyzing ? .6 : 1 }}
            >
              {analyzing ? '⟳ A15-OMEN analyzing…' : '⚡ Run A15-OMEN Distress Analysis'}
            </button>

            {aiAnalysis && (
              <div style={{ background: 'rgba(155,135,250,.06)', border: '1px solid rgba(155,135,250,.2)', borderRadius: 8, padding: '10px 12px', fontSize: 11, color: '#c4b5fd', lineHeight: 1.65, maxHeight: 200, overflowY: 'auto' }}>
                {aiAnalysis}
              </div>
            )}

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setActivePortal('loi')}
                style={{ flex: 1, background: 'rgba(0,212,138,.1)', border: '1px solid rgba(0,212,138,.25)', borderRadius: 6, color: '#00d48a', fontSize: 10, padding: '7px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
              >
                Generate LOI →
              </button>
              <button
                onClick={() => setActivePortal('deals')}
                style={{ flex: 1, background: 'rgba(24,200,232,.08)', border: '1px solid rgba(24,200,232,.2)', borderRadius: 6, color: '#18c8e8', fontSize: 10, padding: '7px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
              >
                Open in Deals →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
