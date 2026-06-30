'use client'
/**
 * Market Intel Portal — County Data + Trends
 * Real data from county_economic_data (20 rows live in kjfwanpwz)
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC · v66
 */

import { useState, useEffect } from 'react'
import { useArkStore } from '@/store/useArkStore'
import { createClient } from '@/lib/supabase/client'
import { BarChart2, TrendingUp, TrendingDown, MapPin, DollarSign, Activity, Search, ChevronDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import toast from 'react-hot-toast'

interface CountyData {
  id: string
  county_name: string
  state: string
  median_home_price?: number
  avg_days_on_market?: number
  foreclosure_rate?: number
  unemployment_rate?: number
  population?: number
  price_change_yoy?: number
  distressed_pct?: number
  investor_activity?: string
  updated_at?: string
}

const CUSTOM_TOOLTIP = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0a0d18', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '8px 12px', fontSize: 11, fontFamily: 'Space Mono, monospace' }}>
      <div style={{ color: '#e8eaf0', marginBottom: 4, fontWeight: 700 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  )
}

export function MarketPortal() {
  const supabase = createClient()
  const [counties, setCounties] = useState<CountyData[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState<CountyData | null>(null)
  const [metric, setMetric]     = useState<'median_home_price' | 'foreclosure_rate' | 'avg_days_on_market' | 'distressed_pct'>('median_home_price')
  const [aiInsight, setAiInsight] = useState('')
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('county_economic_data')
        .select('*')
        .order('median_home_price', { ascending: false })
      if (error) {
        // Table might not be named exactly this — try alternative
        const { data: d2 } = await supabase.from('ain_data').select('*').limit(20)
        setCounties(d2 ?? [])
        if (!d2?.length) toast.error('No county data found — run seed:demo')
      } else {
        setCounties(data ?? [])
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  const filtered = counties.filter(c =>
    c.county_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.state?.toLowerCase().includes(search.toLowerCase())
  )

  const chartData = filtered.slice(0, 12).map(c => ({
    name: c.county_name?.replace(' County','').slice(0,10) ?? '?',
    value: c[metric] ?? 0,
    county: c,
  }))

  const METRIC_CONFIG = {
    median_home_price:   { label: 'Median Home Price', color: '#18c8e8', format: (v: number) => '$' + (v/1000).toFixed(0) + 'k' },
    foreclosure_rate:    { label: 'Foreclosure Rate',  color: '#ff3050', format: (v: number) => v.toFixed(2) + '%' },
    avg_days_on_market:  { label: 'Avg Days on Market',color: '#f0a000', format: (v: number) => v.toFixed(0) + 'd' },
    distressed_pct:      { label: 'Distressed %',      color: '#9b87fa', format: (v: number) => v.toFixed(1) + '%' },
  }

  const runAI = async (county: CountyData) => {
    setAnalyzing(true)
    setAiInsight('')
    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_code: 'A15-OMEN',
          tool_name: 'market-analysis',
          input: {
            county: county.county_name,
            state: county.state,
            median_price: county.median_home_price,
            foreclosure_rate: county.foreclosure_rate,
            days_on_market: county.avg_days_on_market,
            price_change_yoy: county.price_change_yoy,
          }
        }),
      })
      const data = await res.json()
      setAiInsight(data.output || data.analysis || 'Market analysis complete.')
    } catch {
      setAiInsight('AI analysis unavailable — check ANTHROPIC_API_KEY in Vercel env.')
    }
    setAnalyzing(false)
  }

  const mc = METRIC_CONFIG[metric]

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="atlas-panel rounded-xl p-5" style={{ borderColor: 'rgba(24,200,232,.25)', background: 'linear-gradient(135deg,rgba(24,200,232,.05),rgba(6,8,16,.9))' }}>
        <div style={{ fontSize: 10, color: '#18c8e8', letterSpacing: '.18em', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
          ⬡ MARKET INTEL · A15-OMEN · COUNTY INTELLIGENCE
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-sans)', letterSpacing: '-.02em', marginBottom: 4 }}>
          Market Intelligence
        </h1>
        <p className="text-xs text-atlas-muted">
          Live county economic data · foreclosure rates · distress signals · AIN overlay.
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#4a5268' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search county or state…"
            style={{ width: '100%', background: '#0a0d18', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, color: '#e8eaf0', fontSize: 11, padding: '7px 10px 7px 28px', fontFamily: 'var(--font-mono)', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {Object.entries(METRIC_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setMetric(key as typeof metric)}
              style={{
                fontSize: 9, padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                background: metric === key ? `${cfg.color}20` : 'rgba(255,255,255,.04)',
                border: `1px solid ${metric === key ? cfg.color + '50' : 'rgba(255,255,255,.08)'}`,
                color: metric === key ? cfg.color : '#4a5268',
              }}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap: 12 }}>
        <div className="space-y-4">
          {/* Chart */}
          {!loading && chartData.length > 0 && (
            <div className="atlas-panel rounded-xl p-4">
              <div style={{ fontSize: 10, color: mc.color, letterSpacing: '.12em', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
                {mc.label.toUpperCase()} BY COUNTY
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                  <XAxis dataKey="name" tick={{ fill: '#4a5268', fontSize: 9, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#4a5268', fontSize: 9, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <Bar dataKey="value" name={mc.label} fill={mc.color} radius={[3,3,0,0]} fillOpacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* County table */}
          <div className="atlas-panel rounded-xl overflow-hidden">
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#4a5268', fontSize: 11 }}>
                <Activity size={18} style={{ marginBottom: 8, opacity: .4 }} /><div>Loading county data…</div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#4a5268', fontSize: 11 }}>
                <MapPin size={18} style={{ marginBottom: 8, opacity: .4 }} />
                <div>No county data. Run <code style={{ color: '#18c8e8' }}>npm run seed:demo</code> to load 20 WV counties.</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,.02)' }}>
                    {['County','State','Med. Price','Forecl.%','DOM','Distress','YoY',''].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 9, color: '#4a5268', letterSpacing: '.08em', borderBottom: '1px solid rgba(255,255,255,.05)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => {
                    const yoy = c.price_change_yoy ?? 0
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelected(selected?.id === c.id ? null : c)}
                        style={{ cursor: 'pointer', background: selected?.id === c.id ? 'rgba(24,200,232,.06)' : 'transparent', borderLeft: selected?.id === c.id ? '2px solid #18c8e8' : '2px solid transparent' }}
                      >
                        <td style={{ padding: '9px 12px', color: '#e8eaf0', fontWeight: 600 }}>{c.county_name}</td>
                        <td style={{ padding: '9px 12px', color: '#4a5268' }}>{c.state}</td>
                        <td style={{ padding: '9px 12px', color: '#18c8e8', fontFamily: 'var(--font-mono)' }}>
                          {c.median_home_price ? '$' + (c.median_home_price/1000).toFixed(0) + 'k' : '—'}
                        </td>
                        <td style={{ padding: '9px 12px', color: (c.foreclosure_rate ?? 0) > 2 ? '#ff3050' : '#8892b0', fontFamily: 'var(--font-mono)' }}>
                          {c.foreclosure_rate?.toFixed(2) ?? '—'}%
                        </td>
                        <td style={{ padding: '9px 12px', color: '#8892b0', fontFamily: 'var(--font-mono)' }}>
                          {c.avg_days_on_market?.toFixed(0) ?? '—'}d
                        </td>
                        <td style={{ padding: '9px 12px', color: (c.distressed_pct ?? 0) > 10 ? '#f0a000' : '#4a5268', fontFamily: 'var(--font-mono)' }}>
                          {c.distressed_pct?.toFixed(1) ?? '—'}%
                        </td>
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)' }}>
                          <span style={{ color: yoy >= 0 ? '#00d48a' : '#ff3050', display: 'flex', alignItems: 'center', gap: 3 }}>
                            {yoy >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {Math.abs(yoy).toFixed(1)}%
                          </span>
                        </td>
                        <td style={{ padding: '9px 12px', color: '#4a5268' }}>›</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* County detail + AI panel */}
        {selected && (
          <div className="atlas-panel rounded-xl p-4 space-y-4" style={{ borderColor: 'rgba(24,200,232,.2)', alignSelf: 'start' }}>
            <div>
              <div style={{ fontSize: 9, color: '#18c8e8', letterSpacing: '.15em', marginBottom: 4 }}>COUNTY DEEP DIVE</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{selected.county_name}</div>
              <div style={{ fontSize: 11, color: '#8892b0' }}>{selected.state}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { l: 'Median Price', v: selected.median_home_price ? '$' + (selected.median_home_price/1000).toFixed(0) + 'k' : '—', c: '#18c8e8' },
                { l: 'Foreclosure', v: selected.foreclosure_rate != null ? selected.foreclosure_rate.toFixed(2) + '%' : '—', c: '#ff3050' },
                { l: 'Days on Market', v: selected.avg_days_on_market != null ? selected.avg_days_on_market.toFixed(0) + 'd' : '—', c: '#f0a000' },
                { l: 'Distressed', v: selected.distressed_pct != null ? selected.distressed_pct.toFixed(1) + '%' : '—', c: '#9b87fa' },
                { l: 'YoY Change', v: (selected.price_change_yoy ?? 0) >= 0 ? '+' + selected.price_change_yoy?.toFixed(1) + '%' : selected.price_change_yoy?.toFixed(1) + '%', c: (selected.price_change_yoy ?? 0) >= 0 ? '#00d48a' : '#ff3050' },
                { l: 'Population', v: selected.population?.toLocaleString() ?? '—', c: '#e8eaf0' },
              ].map(s => (
                <div key={s.l} style={{ background: 'rgba(255,255,255,.03)', borderRadius: 7, padding: '8px 10px' }}>
                  <div style={{ fontSize: 8, color: '#4a5268', letterSpacing: '.1em', marginBottom: 2 }}>{s.l}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: s.c, fontFamily: 'var(--font-mono)' }}>{s.v}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => runAI(selected)}
              disabled={analyzing}
              style={{ width: '100%', background: 'rgba(24,200,232,.12)', border: '1px solid rgba(24,200,232,.3)', borderRadius: 8, color: '#18c8e8', fontSize: 11, padding: '9px', cursor: analyzing ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-mono)', opacity: analyzing ? .6 : 1 }}
            >
              {analyzing ? '⟳ A15-OMEN analyzing…' : '⚡ AI Market Analysis'}
            </button>

            {aiInsight && (
              <div style={{ background: 'rgba(24,200,232,.05)', border: '1px solid rgba(24,200,232,.15)', borderRadius: 8, padding: '10px 12px', fontSize: 11, color: '#93c5fd', lineHeight: 1.65, maxHeight: 200, overflowY: 'auto' }}>
                {aiInsight}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
