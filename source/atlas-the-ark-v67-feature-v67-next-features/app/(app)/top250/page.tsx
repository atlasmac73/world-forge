'use client'

/**
 * ATLAS v67 — Top 250 Matrix
 * Ranked distress leaderboard for deal prioritization.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { useState, useEffect, useCallback } from 'react'
import { Trophy, RefreshCw, Download, Zap, Target, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { SignalBadge, SectionHeader, CommandButton } from '@/components/ui/index'

type Grade = 'CRITICAL' | 'HOT' | 'WARM' | 'COOL' | 'COLD' | 'UNKNOWN'

interface TopProperty {
  id: string
  address: string
  city: string
  county: string | null
  computed_score: number
  latest_grade: Grade
  mao: number | null
  arv: number | null
  asking_price: number | null
  owner_name: string | null
  tax_delinquent: boolean
  status: string
}

const GRADE_TO_SIGNAL: Record<Grade, 'critical' | 'hot' | 'warm' | 'cool' | 'cold'> = {
  CRITICAL: 'critical', HOT: 'hot', WARM: 'warm', COOL: 'cool', COLD: 'cold', UNKNOWN: 'cold',
}

export default function Top250Page() {
  const [properties, setProperties] = useState<TopProperty[]>([])
  const [meta, setMeta] = useState<{ total: number; top_score: number; avg_score: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [gradeFilter, setGradeFilter] = useState<string>('all')

  const fetchTop250 = useCallback(async () => {
    setLoading(true)
    try {
      const url = gradeFilter !== 'all' ? `/api/top250?grade=${gradeFilter}` : '/api/top250'
      const res = await fetch(url)
      const data = await res.json()
      if (data.ok) {
        setProperties(data.data)
        setMeta(data.meta)
      }
    } catch {
      toast.error('Failed to load Top 250')
    } finally {
      setLoading(false)
    }
  }, [gradeFilter])

  useEffect(() => { fetchTop250() }, [fetchTop250])

  async function saveSnapshot() {
    setSaving(true)
    try {
      const res = await fetch('/api/top250', { method: 'POST' })
      const data = await res.json()
      if (data.ok) toast.success('Top 250 snapshot saved')
      else toast.error('Failed to save snapshot')
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const filtered = gradeFilter === 'all' ? properties : properties.filter(p => p.latest_grade === gradeFilter)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <SectionHeader
          title="Top 250 Matrix"
          subtitle="Highest-distress properties ranked by 8-signal score"
          badge="DEAL INTELLIGENCE"
          badgeColor="#f6ad55"
        />
        <div className="flex items-center gap-2">
          <CommandButton onClick={saveSnapshot} loading={saving} icon={<Download size={13} />} variant="secondary" size="sm">
            Save Snapshot
          </CommandButton>
          <CommandButton onClick={fetchTop250} loading={loading} icon={<RefreshCw size={13} />} variant="ghost" size="sm">
            Refresh
          </CommandButton>
        </div>
      </div>

      {/* Meta stats */}
      {meta && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-atlas-border bg-atlas-panel p-4 text-center">
            <div className="text-2xl font-mono font-bold text-atlas-gold">{meta.total}</div>
            <div className="text-[10px] text-atlas-muted">Scored Properties</div>
          </div>
          <div className="rounded-xl border border-atlas-border bg-atlas-panel p-4 text-center">
            <div className="text-2xl font-mono font-bold text-atlas-coral">{meta.top_score}</div>
            <div className="text-[10px] text-atlas-muted">Top Score</div>
          </div>
          <div className="rounded-xl border border-atlas-border bg-atlas-panel p-4 text-center">
            <div className="text-2xl font-mono font-bold text-atlas-accent">{meta.avg_score}</div>
            <div className="text-[10px] text-atlas-muted">Avg Score</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'CRITICAL', 'HOT', 'WARM', 'COOL', 'COLD'].map(g => (
          <button
            key={g}
            onClick={() => setGradeFilter(g)}
            className={clsx(
              'px-3 py-1 rounded-full text-xs font-medium transition-all border',
              gradeFilter === g
                ? 'bg-atlas-accent/20 text-atlas-accent border-atlas-accent/30'
                : 'bg-white/5 text-atlas-muted border-white/10 hover:border-white/20'
            )}
          >
            {g === 'all' ? 'All Grades' : g}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-atlas-border bg-atlas-panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 size={24} className="animate-spin text-atlas-muted mx-auto mb-2" />
            <p className="text-sm text-atlas-muted">Loading Top 250...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy size={32} className="text-atlas-muted mx-auto mb-3" />
            <p className="text-sm text-atlas-muted">No scored properties yet.</p>
            <p className="text-xs text-atlas-muted mt-1">Add properties and run distress scoring to populate the Top 250.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-atlas-border">
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-atlas-muted uppercase tracking-wider w-10">#</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-atlas-muted uppercase tracking-wider">Property</th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-atlas-muted uppercase tracking-wider">Grade</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-atlas-muted uppercase tracking-wider">Score</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-atlas-muted uppercase tracking-wider">MAO</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-atlas-muted uppercase tracking-wider">ARV</th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-atlas-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'text-xs font-mono font-bold',
                        i === 0 ? 'text-atlas-gold' : i < 3 ? 'text-atlas-accent' : 'text-atlas-muted'
                      )}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-atlas-text">{p.address}</div>
                      <div className="text-[10px] text-atlas-muted">{p.city} · {p.county ?? 'WV'}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <SignalBadge level={GRADE_TO_SIGNAL[p.latest_grade]} label={p.latest_grade} compact />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={clsx(
                        'text-sm font-mono font-bold',
                        p.computed_score >= 80 ? 'text-atlas-coral' :
                        p.computed_score >= 65 ? 'text-atlas-gold' :
                        p.computed_score >= 45 ? 'text-atlas-accent' : 'text-atlas-muted'
                      )}>
                        {p.computed_score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono text-atlas-green">
                      {p.mao ? `$${(p.mao / 1000).toFixed(0)}K` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono text-atlas-muted">
                      {p.arv ? `$${(p.arv / 1000).toFixed(0)}K` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button className="p-1.5 rounded hover:bg-atlas-accent/15 text-atlas-muted hover:text-atlas-accent transition-colors" title="Run God Mode">
                          <Zap size={11} />
                        </button>
                        <button className="p-1.5 rounded hover:bg-atlas-gold/15 text-atlas-muted hover:text-atlas-gold transition-colors" title="Score">
                          <Target size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[10px] text-atlas-muted text-center">
        Top 250 ranks by computed distress score · Add properties and run scoring to populate · Snapshot saves your current ranking
      </p>
    </div>
  )
}
