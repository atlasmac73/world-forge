'use client'

/**
 * ATLAS v67 — Lead Pool
 * Lead-list table over the existing /api/leads endpoint with status filters.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Phone, Mail, MapPin, Gauge } from 'lucide-react'
import { clsx } from 'clsx'
import { SectionHeader } from '@/components/ui/index'

interface Lead {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  status: string
  touch_sequence?: number
  source?: string | null
  last_contact?: string | null
  created_at: string
  properties?: {
    address?: string | null
    distress_score?: number | null
    status?: string | null
  } | null
}

const STATUS_FILTERS = [
  { id: 'all',         label: 'All' },
  { id: 'new',         label: 'New' },
  { id: 'contacted',   label: 'Contacted' },
  { id: 'negotiating', label: 'Negotiating' },
  { id: 'closed',      label: 'Closed' },
  { id: 'dead',        label: 'Dead' },
]

const STATUS_COLOR: Record<string, string> = {
  new:         '#63b3ed',
  contacted:   '#4fd1c5',
  negotiating: '#f6ad55',
  closed:      '#68d391',
  dead:        '#718096',
}

function scoreColor(score?: number | null): string {
  if (score == null) return 'text-atlas-muted'
  if (score >= 80) return 'text-atlas-coral'
  if (score >= 65) return 'text-atlas-gold'
  if (score >= 45) return 'text-atlas-accent'
  return 'text-atlas-muted'
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const fetchLeads = useCallback(async (status: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leads?status=${status}`)
      const data = await res.json()
      // GET /api/leads returns a bare array; tolerate wrapped shapes too.
      const rows: Lead[] = Array.isArray(data) ? data : (data.data ?? data.leads ?? [])
      setLeads(rows)
    } catch {
      setLeads([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLeads(filter) }, [fetchLeads, filter])

  return (
    <div className="p-6 h-[calc(100vh-56px)] flex flex-col space-y-4 overflow-hidden">
      <div className="shrink-0">
        <SectionHeader
          title="Lead Pool"
          subtitle={`${leads.length} lead${leads.length === 1 ? '' : 's'}${filter !== 'all' ? ` · ${filter}` : ''}`}
          badge="LEADS"
          badgeColor="#63b3ed"
        />
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5 shrink-0 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              filter === f.id
                ? 'bg-atlas-accent/15 text-atlas-accent border border-atlas-accent/30'
                : 'bg-white/4 text-atlas-muted hover:bg-white/8 hover:text-atlas-text'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-atlas-muted" />
        </div>
      ) : leads.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <MapPin size={24} className="text-atlas-muted mx-auto" />
            <p className="text-xs text-atlas-muted">
              No leads{filter !== 'all' ? ` with status “${filter}”` : ''} yet.
            </p>
            <p className="text-[10px] text-white/30">
              Leads are created from Driving for Dollars and property scoring.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto rounded-xl border border-atlas-border bg-atlas-surface">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-atlas-surface border-b border-atlas-border">
              <tr className="text-[10px] uppercase tracking-wide text-atlas-muted">
                <th className="px-4 py-2.5 font-medium">Lead</th>
                <th className="px-4 py-2.5 font-medium">Property</th>
                <th className="px-4 py-2.5 font-medium">Score</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Contact</th>
                <th className="px-4 py-2.5 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-white/4 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-atlas-text truncate max-w-[180px]">
                      {lead.name || 'Unnamed'}
                    </p>
                    {lead.touch_sequence != null && lead.touch_sequence > 0 && (
                      <p className="text-[10px] text-atlas-muted">{lead.touch_sequence} touches</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs text-atlas-muted truncate max-w-[200px]">
                      <MapPin size={11} className="shrink-0" />
                      {lead.properties?.address ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {lead.properties?.distress_score != null ? (
                      <span className={clsx('flex items-center gap-1 text-xs font-mono font-bold', scoreColor(lead.properties.distress_score))}>
                        <Gauge size={11} />{lead.properties.distress_score}
                      </span>
                    ) : (
                      <span className="text-xs text-white/25">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full capitalize"
                      style={{
                        background: `${STATUS_COLOR[lead.status] ?? '#718096'}22`,
                        color: STATUS_COLOR[lead.status] ?? '#718096',
                      }}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-atlas-muted">
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} title={lead.phone} className="hover:text-atlas-accent">
                          <Phone size={12} />
                        </a>
                      )}
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} title={lead.email} className="hover:text-atlas-accent">
                          <Mail size={12} />
                        </a>
                      )}
                      {!lead.phone && !lead.email && <span className="text-xs text-white/25">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] text-atlas-muted uppercase">{lead.source ?? '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[10px] text-atlas-muted text-center shrink-0">
        Lead Pool · sourced from /api/leads · move leads through stages in Deal Pipeline
      </p>
    </div>
  )
}
