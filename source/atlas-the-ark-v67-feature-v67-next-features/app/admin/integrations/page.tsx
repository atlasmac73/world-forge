'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

interface Integration {
  integration_id: string; name: string; category: string
  status: string; detail: string | null; config_keys: string[]; last_check_at: string | null
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  connected:      <CheckCircle size={14} className="text-atlas-green" />,
  degraded:       <AlertTriangle size={14} className="text-yellow-400" />,
  not_configured: <Clock size={14} className="text-atlas-muted" />,
  error:          <XCircle size={14} className="text-atlas-coral" />,
  pending:        <Clock size={14} className="text-atlas-gold" />,
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [summary, setSummary] = useState<{ total: number; connected: number; critical_down: number; system_status: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/integrations')
      const data = await res.json()
      if (data.ok) { setIntegrations(data.data.integrations); setSummary(data.data.summary) }
    } finally { setLoading(false) }
  }, [])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    await fetch('/api/admin/integrations', { method: 'POST' })
    await fetch_()
    setRefreshing(false)
    toast.success('Integrations refreshed')
  }, [fetch_])

  useEffect(() => { fetch_() }, [fetch_])

  const categories = [...new Set(integrations.map(i => i.category))]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-atlas-text">Integrations</h1>
          <p className="text-xs text-atlas-muted mt-0.5">Connected services and API status</p>
        </div>
        <button onClick={refresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-atlas-accent/15 text-atlas-accent border border-atlas-accent/30 hover:bg-atlas-accent/25 text-sm transition-all disabled:opacity-50">
          <RefreshCw size={13} className={clsx(refreshing && 'animate-spin')} /> Refresh All
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-atlas-border bg-atlas-panel p-4 text-center">
            <div className="text-2xl font-mono font-bold text-atlas-green">{summary.connected}</div>
            <div className="text-[10px] text-atlas-muted">Connected</div>
          </div>
          <div className="rounded-xl border border-atlas-border bg-atlas-panel p-4 text-center">
            <div className="text-2xl font-mono font-bold text-atlas-muted">{summary.total - summary.connected}</div>
            <div className="text-[10px] text-atlas-muted">Pending / Not Configured</div>
          </div>
          <div className="rounded-xl border border-atlas-border bg-atlas-panel p-4 text-center">
            <div className={clsx('text-2xl font-mono font-bold', summary.system_status === 'operational' ? 'text-atlas-green' : 'text-atlas-coral')}>
              {summary.system_status.toUpperCase()}
            </div>
            <div className="text-[10px] text-atlas-muted">System Status</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-atlas-muted text-sm">Loading integrations...</div>
      ) : (
        categories.map(cat => (
          <div key={cat} className="rounded-xl border border-atlas-border bg-atlas-panel overflow-hidden">
            <div className="px-4 py-3 border-b border-atlas-border bg-white/3">
              <h3 className="text-xs font-bold text-atlas-text uppercase tracking-wider">{cat}</h3>
            </div>
            <div className="divide-y divide-white/5">
              {integrations.filter(i => i.category === cat).map(intg => (
                <div key={intg.integration_id} className="flex items-start gap-4 px-4 py-3.5">
                  <div className="mt-0.5">{STATUS_ICON[intg.status] ?? <Clock size={14} className="text-atlas-muted" />}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-atlas-text">{intg.name}</span>
                      <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded-full border', {
                        'text-atlas-green border-atlas-green/30 bg-atlas-green/10': intg.status === 'connected',
                        'text-atlas-gold border-atlas-gold/30 bg-atlas-gold/10':    intg.status === 'pending',
                        'text-atlas-muted border-white/10 bg-white/5':              intg.status === 'not_configured',
                        'text-atlas-coral border-atlas-coral/30 bg-atlas-coral/10': intg.status === 'error',
                        'text-yellow-400 border-yellow-400/30 bg-yellow-400/10':    intg.status === 'degraded',
                      })}>
                        {intg.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    {intg.detail && <p className="text-xs text-atlas-muted mt-0.5">{intg.detail}</p>}
                    {intg.status === 'not_configured' && intg.config_keys.length > 0 && (
                      <p className="text-[10px] text-atlas-muted mt-1">
                        Requires: {intg.config_keys.map(k => (
                          <code key={k} className="text-atlas-teal bg-white/8 px-1 py-0.5 rounded mx-0.5 text-[9px]">{k}</code>
                        ))}
                      </p>
                    )}
                  </div>
                  {intg.last_check_at && (
                    <span className="text-[9px] text-white/20 shrink-0">{new Date(intg.last_check_at).toLocaleTimeString()}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <div className="rounded-xl border border-atlas-border bg-atlas-panel p-4 text-xs text-atlas-muted">
        <strong className="text-atlas-text">Adding integrations:</strong> Set environment variables in Vercel Dashboard → Settings → Environment Variables, then redeploy. Secrets are never stored in the browser or database.
      </div>
    </div>
  )
}
