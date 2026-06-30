'use client'

/**
 * ATLAS v67 — AIN County Heat Map Page
 * All 55 WV counties with distress scoring.
 * Inspired by AIN_HEAT_MAP_55_COUNTIES.html
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { useState, useEffect, useCallback } from 'react'
import { Map, Filter, RefreshCw, AlertTriangle, Search, ChevronRight, Zap, Target, Eye } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { SignalBadge } from '@/components/ui/index'

type Grade = 'CRITICAL' | 'HOT' | 'WARM' | 'COOL' | 'COLD' | 'UNKNOWN'

interface County {
  id: string
  name: string
  fips: string | null
  seat: string | null
  region: string | null
  score: number
  grade: Grade
  tax_delinquent_pct: number
  vacancy_pct: number
  foreclosure_rate: number
  median_dom: number
  median_price: number | null
  distressed_listings: number
  total_listings: number
  is_demo: boolean
  data_source: string
}

const GRADE_CONFIG: Record<Grade, { bg: string; border: string; text: string; dot: string }> = {
  CRITICAL: { bg: 'bg-[rgba(252,129,129,0.12)]', border: 'border-atlas-coral/40',   text: 'text-atlas-coral',   dot: 'bg-atlas-coral' },
  HOT:      { bg: 'bg-[rgba(246,173,85,0.12)]',  border: 'border-atlas-gold/40',    text: 'text-atlas-gold',    dot: 'bg-atlas-gold' },
  WARM:     { bg: 'bg-[rgba(99,179,237,0.10)]',  border: 'border-atlas-accent/40',  text: 'text-atlas-accent',  dot: 'bg-atlas-accent' },
  COOL:     { bg: 'bg-[rgba(79,209,197,0.10)]',  border: 'border-atlas-teal/40',    text: 'text-atlas-teal',    dot: 'bg-atlas-teal' },
  COLD:     { bg: 'bg-white/4',                   border: 'border-white/10',          text: 'text-atlas-muted',   dot: 'bg-atlas-muted' },
  UNKNOWN:  { bg: 'bg-white/3',                   border: 'border-white/8',           text: 'text-atlas-muted',   dot: 'bg-atlas-muted' },
}

const GRADE_TO_SIGNAL: Record<Grade, 'critical' | 'hot' | 'warm' | 'cool' | 'cold'> = {
  CRITICAL: 'critical', HOT: 'hot', WARM: 'warm', COOL: 'cool', COLD: 'cold', UNKNOWN: 'cold',
}

export default function AINPage() {
  const [counties, setCounties] = useState<County[]>([])
  const [filtered, setFiltered] = useState<County[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<County | null>(null)
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState<string>('all')
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [isDemoData, setIsDemoData] = useState(false)

  const fetchCounties = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ain/counties')
      const data = await res.json()
      if (data.ok) {
        setCounties(data.data)
        setFiltered(data.data)
        setIsDemoData(data.meta?.has_demo_data ?? false)
        // Default select Kanawha
        const kanawha = data.data.find((c: County) => c.name === 'Kanawha')
        if (kanawha) setSelected(kanawha)
      }
    } catch {
      toast.error('Failed to load county data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCounties() }, [fetchCounties])

  useEffect(() => {
    let result = counties
    if (search) result = result.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    if (gradeFilter !== 'all') result = result.filter(c => c.grade === gradeFilter)
    if (regionFilter !== 'all') result = result.filter(c => c.region === regionFilter)
    setFiltered(result)
  }, [counties, search, gradeFilter, regionFilter])

  const gradeCounts = Object.fromEntries(
    (['CRITICAL', 'HOT', 'WARM', 'COOL', 'COLD'] as Grade[]).map(g => [
      g, counties.filter(c => c.grade === g).length
    ])
  )

  function handleAction(action: 'specter' | 'top250' | 'warroom', county: County) {
    const msgs = {
      specter:  `SPECTER trace queued for ${county.name} County — check Agent Lab`,
      top250:   `${county.name} County context added to Top 250 filter`,
      warroom:  `${county.name} County added to War Room intelligence`,
    }
    toast.success(msgs[action])
  }

  return (
    <div className="flex h-[calc(100vh-56px)] bg-atlas-dark text-atlas-text overflow-hidden">

      {/* LEFT — County List */}
      <div className="w-72 shrink-0 border-r border-atlas-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-atlas-border">
          <div className="flex items-center gap-2 mb-3">
            <Map size={14} className="text-atlas-accent" />
            <h2 className="text-sm font-bold">AIN — 55 Counties</h2>
            {isDemoData && (
              <span className="ml-auto text-[9px] bg-atlas-purple/20 text-atlas-purple px-1.5 py-0.5 rounded font-bold">DEMO</span>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-atlas-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search county..."
              className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg bg-white/5 border border-atlas-border text-atlas-text placeholder-atlas-muted focus:outline-none focus:border-atlas-accent/50"
            />
          </div>

          {/* Grade filter pills */}
          <div className="flex flex-wrap gap-1">
            <button onClick={() => setGradeFilter('all')} className={clsx('px-2 py-0.5 rounded text-[9px] font-bold transition-all', gradeFilter === 'all' ? 'bg-white/15 text-white' : 'text-atlas-muted hover:text-white')}>ALL</button>
            {(['CRITICAL','HOT','WARM','COOL','COLD'] as Grade[]).map(g => (
              <button key={g} onClick={() => setGradeFilter(g === gradeFilter ? 'all' : g)} className={clsx('px-2 py-0.5 rounded text-[9px] font-bold transition-all', GRADE_CONFIG[g].text, gradeFilter === g ? GRADE_CONFIG[g].bg + ' border ' + GRADE_CONFIG[g].border : 'opacity-50 hover:opacity-100')}>
                {g} ({gradeCounts[g] ?? 0})
              </button>
            ))}
          </div>
        </div>

        {/* County List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-xs text-atlas-muted">Loading 55 counties...</div>
          ) : (
            filtered.map(county => {
              const cfg = GRADE_CONFIG[county.grade]
              const isSelected = selected?.id === county.id
              return (
                <button
                  key={county.id}
                  onClick={() => setSelected(county)}
                  className={clsx(
                    'w-full text-left px-3 py-2.5 border-b border-white/5 transition-all flex items-center gap-2.5',
                    isSelected ? 'bg-atlas-accent/10 border-l-2 border-l-atlas-accent' : 'hover:bg-white/4'
                  )}
                >
                  <span className={clsx('w-2 h-2 rounded-full shrink-0', cfg.dot)} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-atlas-text">{county.name}</div>
                    <div className="text-[9px] text-atlas-muted">{county.seat} · Score: {county.score}</div>
                  </div>
                  <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded', cfg.bg, cfg.text)}>{county.grade}</span>
                </button>
              )
            })
          )}
        </div>

        {/* Legend */}
        <div className="p-3 border-t border-atlas-border">
          <div className="flex justify-between text-[9px] text-atlas-muted">
            <span>{filtered.length} of 55 counties</span>
            <button onClick={fetchCounties} className="flex items-center gap-1 hover:text-atlas-accent">
              <RefreshCw size={9} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT — County Detail */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selected ? (
          <div className="h-full flex items-center justify-center text-atlas-muted text-sm">
            Select a county to view intelligence
          </div>
        ) : (
          <div className="max-w-3xl space-y-5">
            {/* County Header */}
            <div className={clsx('rounded-2xl border p-6', GRADE_CONFIG[selected.grade].bg, GRADE_CONFIG[selected.grade].border)}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl font-bold text-white">{selected.name} County</h1>
                    <SignalBadge level={GRADE_TO_SIGNAL[selected.grade]} label={selected.grade} />
                  </div>
                  <p className="text-sm text-atlas-muted">
                    County Seat: {selected.seat ?? '—'} · Region: {selected.region ?? '—'}
                    {selected.is_demo && (
                      <span className="ml-2 text-[9px] bg-atlas-purple/20 text-atlas-purple px-1.5 py-0.5 rounded font-bold">DEMO DATA</span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <div className={clsx('text-5xl font-mono font-bold', GRADE_CONFIG[selected.grade].text)}>
                    {selected.score}
                  </div>
                  <div className="text-xs text-atlas-muted">Distress Score</div>
                </div>
              </div>

              {/* Score bar */}
              <div className="w-full h-2 rounded-full bg-white/10 mb-1">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${selected.score}%`, background: GRADE_CONFIG[selected.grade].dot.replace('bg-', '') === 'bg-atlas-coral' ? '#fc8181' : '#f6ad55' }}
                />
              </div>
            </div>

            {/* Signal Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Tax Delinquent', value: `${selected.tax_delinquent_pct}%`, color: selected.tax_delinquent_pct > 8 ? 'text-atlas-coral' : 'text-atlas-text' },
                { label: 'Vacancy Rate',   value: `${selected.vacancy_pct}%`,          color: selected.vacancy_pct > 12 ? 'text-atlas-coral' : 'text-atlas-text' },
                { label: 'Foreclosure',    value: `${selected.foreclosure_rate}%`,      color: selected.foreclosure_rate > 4 ? 'text-atlas-coral' : 'text-atlas-text' },
                { label: 'Median DOM',     value: `${selected.median_dom}d`,            color: selected.median_dom > 90 ? 'text-atlas-gold' : 'text-atlas-text' },
              ].map(m => (
                <div key={m.label} className="rounded-xl border border-atlas-border bg-atlas-panel p-3 text-center">
                  <div className={clsx('text-lg font-mono font-bold', m.color)}>{m.value}</div>
                  <div className="text-[10px] text-atlas-muted mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>

            {/* Listings */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-atlas-border bg-atlas-panel p-4">
                <div className="text-xs text-atlas-muted mb-1">Distressed Listings</div>
                <div className="text-2xl font-mono font-bold text-atlas-coral">{selected.distressed_listings}</div>
                <div className="text-xs text-atlas-muted mt-1">of {selected.total_listings} total</div>
                {selected.total_listings > 0 && (
                  <div className="mt-2 w-full h-1.5 rounded-full bg-white/5">
                    <div className="h-1.5 rounded-full bg-atlas-coral" style={{ width: `${(selected.distressed_listings / selected.total_listings) * 100}%` }} />
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-atlas-border bg-atlas-panel p-4">
                <div className="text-xs text-atlas-muted mb-1">Median Price</div>
                <div className="text-2xl font-mono font-bold text-atlas-green">
                  {selected.median_price ? `$${(selected.median_price / 1000).toFixed(0)}K` : '—'}
                </div>
                <div className="text-xs text-atlas-muted mt-1">Data: {selected.data_source}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="rounded-xl border border-atlas-border bg-atlas-panel p-4">
              <h3 className="text-xs font-bold text-atlas-text mb-3">Intelligence Actions</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleAction('specter', selected)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-atlas-coral/15 text-atlas-coral border border-atlas-coral/30 hover:bg-atlas-coral/25 transition-all text-xs font-medium"
                >
                  <Zap size={12} /> SPECTER Trace
                </button>
                <button
                  onClick={() => handleAction('top250', selected)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-atlas-gold/15 text-atlas-gold border border-atlas-gold/30 hover:bg-atlas-gold/25 transition-all text-xs font-medium"
                >
                  <Target size={12} /> Add to Top 250
                </button>
                <button
                  onClick={() => handleAction('warroom', selected)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-atlas-purple/15 text-atlas-purple border border-atlas-purple/30 hover:bg-atlas-purple/25 transition-all text-xs font-medium"
                >
                  <Eye size={12} /> War Room
                </button>
                <a
                  href={`/counties/${encodeURIComponent(selected.name)}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-atlas-teal/15 text-atlas-teal border border-atlas-teal/30 hover:bg-atlas-teal/25 transition-all text-xs font-medium"
                >
                  <ChevronRight size={12} /> Full County Report
                </a>
              </div>
            </div>

            {isDemoData && (
              <div className="rounded-xl border border-atlas-purple/30 bg-atlas-purple/8 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-atlas-purple shrink-0 mt-0.5" />
                  <div className="text-xs text-atlas-muted">
                    <strong className="text-atlas-purple">Demo Data</strong> — County scores are estimated for demonstration. Connect live county data sources (PropStream, county GIS, court records) in{' '}
                    <a href="/admin/integrations" className="text-atlas-accent underline">Admin → Integrations</a>.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
