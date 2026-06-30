'use client'

/**
 * ATLAS v67 — County Detail Page
 * Detailed view of a single WV county with distress data.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, TrendingUp, AlertTriangle, Zap, Target, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { SignalBadge, ScoreBar, CommandButton, AtlasCard } from '@/components/ui/index'

interface CountyData {
  id: string; name: string; fips: string | null; seat: string | null
  region: string | null; population: number | null
  score: number; grade: string
  tax_delinquent_pct: number; vacancy_pct: number; foreclosure_rate: number
  median_dom: number; median_price: number | null
  distressed_listings: number; total_listings: number
  is_demo: boolean; data_source: string
}

const GRADE_TO_SIGNAL: Record<string, 'critical' | 'hot' | 'warm' | 'cool' | 'cold'> = {
  CRITICAL: 'critical', HOT: 'hot', WARM: 'warm', COOL: 'cool', COLD: 'cold', UNKNOWN: 'cold',
}

export default function CountyPage({ params }: { params: { name: string } }) {
  const router = useRouter()
  const [county, setCounty] = useState<CountyData | null>(null)
  const [loading, setLoading] = useState(true)

  const countyName = decodeURIComponent(params.name)

  useEffect(() => {
    async function fetchCounty() {
      try {
        const res = await fetch('/api/ain/counties')
        const data = await res.json()
        if (data.ok) {
          const found = data.data.find((c: CountyData) =>
            c.name.toLowerCase() === countyName.toLowerCase()
          )
          setCounty(found ?? null)
        }
      } catch {
        toast.error('Failed to load county data')
      } finally {
        setLoading(false)
      }
    }
    fetchCounty()
  }, [countyName])

  function handleAction(action: string) {
    const msgs: Record<string, string> = {
      specter: `SPECTER trace queued for ${countyName} County`,
      top250:  `${countyName} County filter applied to Top 250`,
      godmode: `God Mode context set to ${countyName} County`,
    }
    toast.success(msgs[action] ?? 'Action queued')
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <RefreshCw size={20} className="animate-spin text-atlas-muted" />
      </div>
    )
  }

  if (!county) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-atlas-muted hover:text-atlas-text">
          <ArrowLeft size={13} /> Back to AIN
        </button>
        <AtlasCard className="text-center py-12">
          <MapPin size={32} className="text-atlas-muted mx-auto mb-3" />
          <p className="text-sm text-atlas-text">County not found: {countyName}</p>
        </AtlasCard>
      </div>
    )
  }

  const signalLevel = GRADE_TO_SIGNAL[county.grade] ?? 'cold'

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Back nav */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-atlas-muted hover:text-atlas-text transition-colors">
        <ArrowLeft size={13} /> Back to AIN Heat Map
      </button>

      {/* County Hero */}
      <div className={clsx('rounded-2xl border p-6', {
        'border-atlas-coral/40 bg-[rgba(252,129,129,0.06)]': county.grade === 'CRITICAL',
        'border-atlas-gold/40 bg-[rgba(246,173,85,0.06)]':   county.grade === 'HOT',
        'border-atlas-accent/30 bg-[rgba(99,179,237,0.05)]': county.grade === 'WARM',
        'border-atlas-teal/30 bg-[rgba(79,209,197,0.05)]':   county.grade === 'COOL',
        'border-white/10 bg-white/3':                         !['CRITICAL','HOT','WARM','COOL'].includes(county.grade),
      })}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-white">{county.name} County</h1>
              <SignalBadge level={signalLevel} label={county.grade} />
              {county.is_demo && (
                <span className="text-[9px] bg-atlas-purple/20 text-atlas-purple px-1.5 py-0.5 rounded font-bold">DEMO</span>
              )}
            </div>
            <p className="text-xs text-atlas-muted">
              {county.seat && `County Seat: ${county.seat}`}
              {county.region && ` · Region: ${county.region}`}
              {county.fips && ` · FIPS: ${county.fips}`}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className={clsx('text-5xl font-mono font-bold', {
              'text-atlas-coral':  county.grade === 'CRITICAL',
              'text-atlas-gold':   county.grade === 'HOT',
              'text-atlas-accent': county.grade === 'WARM',
              'text-atlas-teal':   county.grade === 'COOL',
              'text-atlas-muted':  !['CRITICAL','HOT','WARM','COOL'].includes(county.grade),
            })}>
              {county.score}
            </div>
            <div className="text-xs text-atlas-muted">Distress Score</div>
          </div>
        </div>
        <ScoreBar score={county.score} showValue={false} height="lg" />
        <div className="mt-2 text-[10px] text-atlas-muted">Source: {county.data_source}</div>
      </div>

      {/* Signal Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tax Delinquent',  value: `${county.tax_delinquent_pct?.toFixed(1)}%`, hot: (county.tax_delinquent_pct ?? 0) > 8 },
          { label: 'Vacancy Rate',    value: `${county.vacancy_pct?.toFixed(1)}%`,          hot: (county.vacancy_pct ?? 0) > 12 },
          { label: 'Foreclosure',     value: `${county.foreclosure_rate?.toFixed(1)}%`,      hot: (county.foreclosure_rate ?? 0) > 4 },
          { label: 'Median DOM',      value: `${county.median_dom}d`,                        hot: (county.median_dom ?? 0) > 90 },
        ].map(m => (
          <AtlasCard key={m.label} padding="sm" className="text-center">
            <div className={clsx('text-xl font-mono font-bold', m.hot ? 'text-atlas-coral' : 'text-atlas-text')}>
              {m.value}
            </div>
            <div className="text-[10px] text-atlas-muted mt-0.5">{m.label}</div>
          </AtlasCard>
        ))}
      </div>

      {/* Listings */}
      <div className="grid grid-cols-2 gap-3">
        <AtlasCard>
          <div className="text-xs text-atlas-muted mb-1">Distressed Listings</div>
          <div className="text-3xl font-mono font-bold text-atlas-coral">{county.distressed_listings}</div>
          <div className="text-xs text-atlas-muted mt-1">of {county.total_listings} total</div>
          {county.total_listings > 0 && (
            <div className="mt-2">
              <ScoreBar
                score={Math.round((county.distressed_listings / county.total_listings) * 100)}
                showValue={false}
                height="sm"
              />
            </div>
          )}
        </AtlasCard>
        <AtlasCard>
          <div className="text-xs text-atlas-muted mb-1">Median Price</div>
          <div className="text-3xl font-mono font-bold text-atlas-green">
            {county.median_price ? `$${(county.median_price / 1000).toFixed(0)}K` : '—'}
          </div>
          <div className="text-xs text-atlas-muted mt-1">
            {county.population ? `Pop: ${county.population.toLocaleString()}` : 'Population data unavailable'}
          </div>
        </AtlasCard>
      </div>

      {/* Actions */}
      <AtlasCard>
        <h3 className="text-xs font-bold text-atlas-text mb-3">Intelligence Actions</h3>
        <div className="flex flex-wrap gap-2">
          <CommandButton onClick={() => handleAction('specter')} icon={<Zap size={12} />} variant="danger" size="sm">
            SPECTER Trace
          </CommandButton>
          <CommandButton onClick={() => handleAction('top250')} icon={<Target size={12} />} variant="gold" size="sm">
            Add to Top 250
          </CommandButton>
          <CommandButton onClick={() => handleAction('godmode')} icon={<TrendingUp size={12} />} size="sm">
            Run God Mode
          </CommandButton>
        </div>
      </AtlasCard>

      {county.is_demo && (
        <div className="rounded-xl border border-atlas-purple/30 bg-atlas-purple/8 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={13} className="text-atlas-purple mt-0.5 shrink-0" />
            <p className="text-xs text-atlas-muted">
              <strong className="text-atlas-purple">Demo Data</strong> — Scores are estimated for demonstration.
              Import live data in <a href="/admin/integrations" className="text-atlas-accent underline">Admin → Integrations</a> or via <a href="/admin/source-map" className="text-atlas-accent underline">Admin → Source Map</a>.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
