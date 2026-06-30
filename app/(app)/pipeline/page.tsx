'use client'

/**
 * ATLAS v67 — Deal Pipeline CRM
 * Kanban pipeline board for deal management.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { useState, useEffect, useCallback } from 'react'
import { Plus, Loader2, DollarSign, Home, ArrowRight } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { SectionHeader } from '@/components/ui/index'

interface Deal {
  id: string
  address?: string
  title?: string
  stage: string
  status?: string
  arv?: number
  asking_price?: number
  estimated_repair?: number
  deal_grade?: string
  owner_name?: string
  created_at: string
}

const DEFAULT_STAGES = [
  { id: 'new',         label: 'New Lead',        color: '#718096' },
  { id: 'research',    label: 'Research',         color: '#63b3ed' },
  { id: 'contacted',   label: 'Contacted',        color: '#4fd1c5' },
  { id: 'negotiating', label: 'Negotiating',      color: '#f6ad55' },
  { id: 'contract',    label: 'Under Contract',   color: '#68d391' },
  { id: 'closed',      label: 'Closed / Won',     color: '#9f7aea' },
]

const GRADE_COLOR: Record<string, string> = {
  A: 'text-atlas-green',
  B: 'text-atlas-accent',
  C: 'text-atlas-gold',
  D: 'text-atlas-coral',
}

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [movingId, setMovingId] = useState<string | null>(null)

  const fetchDeals = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/leads?limit=100')
      const data = await res.json()
      if (data.ok || Array.isArray(data.leads)) {
        const raw = data.leads ?? data.data ?? []
        setDeals(raw.map((d: Deal & { acquisition_status?: string }) => ({
          ...d,
          stage: d.stage ?? d.acquisition_status ?? 'new',
        })))
      }
    } catch {
      // silent — show empty board
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDeals() }, [fetchDeals])

  async function moveToStage(dealId: string, newStage: string) {
    setMovingId(dealId)
    try {
      await fetch(`/api/leads/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acquisition_status: newStage }),
      }).catch(() => null)
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage } : d))
      toast.success('Deal moved')
    } finally {
      setMovingId(null)
    }
  }

  const getStageDeals = (stageId: string) =>
    deals.filter(d => (d.stage ?? 'new') === stageId)

  const totalValue = deals.reduce((sum, d) => sum + (d.arv ?? 0), 0)

  return (
    <div className="p-6 h-[calc(100vh-56px)] flex flex-col space-y-4 overflow-hidden">
      <div className="flex items-start justify-between shrink-0">
        <SectionHeader
          title="Deal Pipeline"
          subtitle={`${deals.length} deals · $${(totalValue / 1000000).toFixed(1)}M pipeline value`}
          badge="CRM"
          badgeColor="#68d391"
        />
        <button
          onClick={() => toast('Use Properties page to add new deals')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-atlas-green/15 text-atlas-green border border-atlas-green/30 hover:bg-atlas-green/25 transition-all text-xs font-medium"
        >
          <Plus size={13} /> New Deal
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-atlas-muted" />
        </div>
      ) : (
        <div className="flex-1 flex gap-3 overflow-x-auto pb-2">
          {DEFAULT_STAGES.map((stage, stageIdx) => {
            const stageDeals = getStageDeals(stage.id)
            return (
              <div
                key={stage.id}
                className="flex flex-col w-64 shrink-0 rounded-xl border border-atlas-border bg-atlas-surface"
              >
                {/* Stage Header */}
                <div className="p-3 border-b border-atlas-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                    <span className="text-xs font-semibold text-atlas-text">{stage.label}</span>
                  </div>
                  <span className="text-[10px] font-mono bg-white/8 px-1.5 py-0.5 rounded text-atlas-muted">
                    {stageDeals.length}
                  </span>
                </div>

                {/* Deal Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {stageDeals.length === 0 && (
                    <div className="py-6 text-center text-[10px] text-white/20">Empty</div>
                  )}
                  {stageDeals.map(deal => (
                    <div
                      key={deal.id}
                      className="rounded-lg border border-atlas-border bg-atlas-panel p-3 space-y-2 hover:border-atlas-accent/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-atlas-text truncate">
                            {deal.address ?? deal.title ?? 'Unnamed Deal'}
                          </p>
                          {deal.owner_name && (
                            <p className="text-[10px] text-atlas-muted truncate">{deal.owner_name}</p>
                          )}
                        </div>
                        {deal.deal_grade && (
                          <span className={clsx('text-xs font-mono font-bold shrink-0', GRADE_COLOR[deal.deal_grade] ?? 'text-atlas-muted')}>
                            {deal.deal_grade}
                          </span>
                        )}
                      </div>

                      {(deal.arv || deal.asking_price) && (
                        <div className="flex items-center gap-2 text-[10px]">
                          {deal.asking_price && (
                            <span className="flex items-center gap-0.5 text-atlas-coral">
                              <DollarSign size={9} />${(deal.asking_price / 1000).toFixed(0)}K
                            </span>
                          )}
                          {deal.arv && (
                            <span className="flex items-center gap-0.5 text-atlas-green">
                              <Home size={9} />ARV ${(deal.arv / 1000).toFixed(0)}K
                            </span>
                          )}
                        </div>
                      )}

                      {/* Move buttons */}
                      <div className="flex gap-1">
                        {stageIdx > 0 && (
                          <button
                            onClick={() => moveToStage(deal.id, DEFAULT_STAGES[stageIdx - 1].id)}
                            disabled={movingId === deal.id}
                            className="flex-1 py-1 text-[10px] rounded bg-white/5 hover:bg-white/10 text-atlas-muted transition-colors"
                          >
                            ← Back
                          </button>
                        )}
                        {stageIdx < DEFAULT_STAGES.length - 1 && (
                          <button
                            onClick={() => moveToStage(deal.id, DEFAULT_STAGES[stageIdx + 1].id)}
                            disabled={movingId === deal.id}
                            className="flex-1 py-1 text-[10px] rounded bg-atlas-accent/10 hover:bg-atlas-accent/20 text-atlas-accent flex items-center justify-center gap-0.5 transition-colors"
                          >
                            {movingId === deal.id ? <Loader2 size={9} className="animate-spin" /> : <ArrowRight size={9} />}
                            Next
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-[10px] text-atlas-muted text-center shrink-0">
        Pipeline CRM · Deals from Properties + Leads · Drag or click arrows to advance stages
      </p>
    </div>
  )
}
