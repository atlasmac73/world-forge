'use client'

/**
 * ATLAS v67 — Deal Pipeline CRM
 * Kanban pipeline board over the deals schema (/api/deals).
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { useState, useEffect, useCallback } from 'react'
import { Loader2, DollarSign, Home, MapPin, ArrowRight } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { SectionHeader } from '@/components/ui/index'

interface Deal {
  id: string
  deal_name: string
  deal_type?: string
  status: string
  purchase_price?: number | null
  arv?: number | null
  rehab_estimate?: number | null
  max_allowable_offer?: number | null
  projected_profit?: number | null
  created_at: string
  properties?: { address?: string | null; distress_score?: number | null } | null
}

// Stages mirror the deals.status enum (supabase/schema.sql).
const STAGES = [
  { id: 'prospect',       label: 'Prospect',        color: '#718096' },
  { id: 'analyzing',      label: 'Analyzing',       color: '#63b3ed' },
  { id: 'offer_made',     label: 'Offer Made',      color: '#f6ad55' },
  { id: 'under_contract', label: 'Under Contract',  color: '#68d391' },
  { id: 'closed_won',     label: 'Closed · Won',    color: '#9f7aea' },
  { id: 'closed_lost',    label: 'Closed · Lost',   color: '#fc8181' },
]

const money = (n?: number | null) => (n != null ? `$${(n / 1000).toFixed(0)}K` : null)

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [movingId, setMovingId] = useState<string | null>(null)

  const fetchDeals = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/deals')
      const data = await res.json()
      const rows: Deal[] = Array.isArray(data) ? data : (data.data ?? data.deals ?? [])
      setDeals(rows)
    } catch {
      setDeals([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDeals() }, [fetchDeals])

  async function moveToStage(dealId: string, newStatus: string) {
    const prev = deals
    setMovingId(dealId)
    // optimistic update
    setDeals(p => p.map(d => d.id === dealId ? { ...d, status: newStatus } : d))
    try {
      const res = await fetch('/api/deals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dealId, status: newStatus }),
      })
      if (!res.ok) throw new Error('move failed')
      toast.success('Deal moved')
    } catch {
      setDeals(prev) // rollback so the UI reflects real persistence
      toast.error('Could not move deal')
    } finally {
      setMovingId(null)
    }
  }

  const stageDeals = (stageId: string) => deals.filter(d => (d.status ?? 'prospect') === stageId)
  const pipelineValue = deals
    .filter(d => d.status !== 'closed_lost')
    .reduce((sum, d) => sum + (d.arv ?? d.purchase_price ?? 0), 0)

  return (
    <div className="p-6 h-[calc(100vh-56px)] flex flex-col space-y-4 overflow-hidden">
      <div className="flex items-start justify-between shrink-0">
        <SectionHeader
          title="Deal Pipeline"
          subtitle={`${deals.length} deal${deals.length === 1 ? '' : 's'} · $${(pipelineValue / 1000000).toFixed(1)}M active pipeline value`}
          badge="CRM"
          badgeColor="#68d391"
        />
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-atlas-muted" />
        </div>
      ) : (
        <div className="flex-1 flex gap-3 overflow-x-auto pb-2">
          {STAGES.map((stage, stageIdx) => {
            const cards = stageDeals(stage.id)
            return (
              <div
                key={stage.id}
                className="flex flex-col w-64 shrink-0 rounded-xl border border-atlas-border bg-atlas-surface"
              >
                <div className="p-3 border-b border-atlas-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                    <span className="text-xs font-semibold text-atlas-text">{stage.label}</span>
                  </div>
                  <span className="text-[10px] font-mono bg-white/8 px-1.5 py-0.5 rounded text-atlas-muted">
                    {cards.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {cards.length === 0 && (
                    <div className="py-6 text-center text-[10px] text-white/20">Empty</div>
                  )}
                  {cards.map(deal => (
                    <div
                      key={deal.id}
                      className="rounded-lg border border-atlas-border bg-atlas-panel p-3 space-y-2 hover:border-atlas-accent/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-atlas-text truncate">
                          {deal.deal_name || 'Untitled Deal'}
                        </p>
                        {deal.properties?.address && (
                          <p className="flex items-center gap-1 text-[10px] text-atlas-muted truncate">
                            <MapPin size={9} className="shrink-0" />{deal.properties.address}
                          </p>
                        )}
                      </div>

                      {(deal.purchase_price != null || deal.arv != null) && (
                        <div className="flex items-center gap-2 text-[10px]">
                          {deal.purchase_price != null && (
                            <span className="flex items-center gap-0.5 text-atlas-coral">
                              <DollarSign size={9} />{money(deal.purchase_price)}
                            </span>
                          )}
                          {deal.arv != null && (
                            <span className="flex items-center gap-0.5 text-atlas-green">
                              <Home size={9} />ARV {money(deal.arv)}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex gap-1">
                        {stageIdx > 0 && (
                          <button
                            onClick={() => moveToStage(deal.id, STAGES[stageIdx - 1].id)}
                            disabled={movingId === deal.id}
                            className="flex-1 py-1 text-[10px] rounded bg-white/5 hover:bg-white/10 text-atlas-muted transition-colors disabled:opacity-50"
                          >
                            ← Back
                          </button>
                        )}
                        {stageIdx < STAGES.length - 1 && (
                          <button
                            onClick={() => moveToStage(deal.id, STAGES[stageIdx + 1].id)}
                            disabled={movingId === deal.id}
                            className="flex-1 py-1 text-[10px] rounded bg-atlas-accent/10 hover:bg-atlas-accent/20 text-atlas-accent flex items-center justify-center gap-0.5 transition-colors disabled:opacity-50"
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
        Pipeline CRM · deals from /api/deals · click arrows to advance acquisition stages
      </p>
    </div>
  )
}
