'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, Activity, Link2, Bot, CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface TrustEvent {
  id: string
  event_type: string
  resource_type?: string
  resource_id?: string
  description?: string
  metadata?: Record<string, unknown>
  created_at: string
}

interface Connector {
  id: string
  provider: string
  status: string
  connected_at: string
  last_used?: string
}

interface AgentRun {
  id: string
  tool_name: string
  status: string
  created_at: string
  cost_credits?: number
}

export function TrustDashboardPortal() {
  const [trustEvents, setTrustEvents] = useState<TrustEvent[]>([])
  const [connectors, setConnectors] = useState<Connector[]>([])
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function loadTrustData() {
      setLoading(true)
      const [eventsRes, connectorsRes, runsRes] = await Promise.all([
        supabase.from('trust_events').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('connector_accounts').select('*').order('connected_at', { ascending: false }),
        supabase.from('agent_runs').select('*').order('created_at', { ascending: false }).limit(30),
      ])
      setTrustEvents(eventsRes.data ?? [])
      setConnectors(connectorsRes.data ?? [])
      setAgentRuns(runsRes.data ?? [])
      setLoading(false)
    }

    loadTrustData()

    // Log dashboard view (fire-and-forget)
    void supabase.from('trust_events').insert({
      event_type: 'trust_dashboard_viewed',
      description: 'User opened Trust Dashboard',
    })
  }, [])

  const EVENT_ICON: Record<string, React.ReactNode> = {
    agent_run_completed: <Bot size={11} className="text-atlas-accent" />,
    trust_dashboard_viewed: <Shield size={11} className="text-atlas-gold" />,
    default: <Activity size={11} className="text-atlas-muted" />,
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="atlas-panel rounded-xl p-5">
        <div className="flex items-center gap-3 mb-1">
          <Shield size={16} className="text-atlas-accent" />
          <h1 className="text-sm font-bold text-atlas-accent">Trust Dashboard</h1>
          <span className="text-[10px] bg-green-900/30 text-green-400 border border-green-800/40 px-2 py-0.5 rounded-full font-medium">
            LIVE
          </span>
        </div>
        <p className="text-[11px] text-atlas-muted">
          Immutable audit trail · Connector health · Agent run history
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stats */}
        <div className="atlas-panel rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-atlas-accent">{trustEvents.length}</div>
          <div className="text-[10px] text-atlas-muted mt-1">Audit Events</div>
        </div>
        <div className="atlas-panel rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-atlas-gold">{connectors.length}</div>
          <div className="text-[10px] text-atlas-muted mt-1">Connectors</div>
        </div>
        <div className="atlas-panel rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-atlas-purple">{agentRuns.length}</div>
          <div className="text-[10px] text-atlas-muted mt-1">Agent Runs</div>
        </div>
      </div>

      {/* Audit log */}
      <div className="atlas-panel rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-atlas-border">
          <h3 className="text-white text-sm font-semibold flex items-center gap-2">
            <Activity size={13} className="text-atlas-accent" /> Audit Log
          </h3>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-atlas-muted text-sm">Loading...</div>
        ) : trustEvents.length === 0 ? (
          <div className="px-5 py-8 text-center text-atlas-muted text-sm">
            No events yet — your activity will appear here
          </div>
        ) : (
          <div className="divide-y divide-atlas-border">
            {trustEvents.slice(0, 20).map(evt => (
              <div key={evt.id} className="px-5 py-2.5 flex items-center gap-3">
                <span className="shrink-0">
                  {EVENT_ICON[evt.event_type] ?? EVENT_ICON.default}
                </span>
                <span className="text-xs text-atlas-text flex-1 truncate">
                  {evt.description ?? evt.event_type}
                </span>
                <span className="text-[10px] text-atlas-muted shrink-0 flex items-center gap-1">
                  <Clock size={9} />
                  {new Date(evt.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connectors */}
      <div className="atlas-panel rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-atlas-border">
          <h3 className="text-white text-sm font-semibold flex items-center gap-2">
            <Link2 size={13} className="text-atlas-gold" /> Connected Services
          </h3>
        </div>
        {connectors.length === 0 ? (
          <div className="px-5 py-6 text-center text-atlas-muted text-xs">
            No connectors yet — coming in v66
          </div>
        ) : (
          <div className="divide-y divide-atlas-border">
            {connectors.map(c => (
              <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                <span className="text-xs text-atlas-text font-medium">{c.provider}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  c.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                }`}>
                  {c.status === 'active' ? <CheckCircle size={10} className="inline mr-1" /> : <AlertCircle size={10} className="inline mr-1" />}
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
