'use client'

import { useState, useEffect, useCallback } from 'react'
import { Database, RefreshCw, Filter } from 'lucide-react'
import { clsx } from 'clsx'

interface AuditLog {
  id: string; user_id: string; action: string; resource_type: string | null
  resource_id: string | null; metadata: Record<string, unknown> | null; created_at: string
}

const ACTION_COLORS: Record<string, string> = {
  KILL_SWITCH_ARMED:    'text-atlas-coral',
  KILL_SWITCH_DISARMED: 'text-atlas-green',
  BLUEPRINT_APPROVED:   'text-atlas-green',
  BLUEPRINT_REJECTED:   'text-atlas-coral',
  loi_generated:        'text-atlas-accent',
  skip_trace:           'text-atlas-purple',
  distress_score:       'text-atlas-teal',
  underwriting:         'text-atlas-gold',
  rehab_estimate:       'text-atlas-teal',
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/audit')
      const data = await res.json()
      setLogs(data.logs ?? data.data ?? [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const filtered = actionFilter
    ? logs.filter(l => l.action.toLowerCase().includes(actionFilter.toLowerCase()))
    : logs

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-atlas-text">Audit Logs</h1>
          <p className="text-xs text-atlas-muted mt-0.5">All system events and AI actions</p>
        </div>
        <button onClick={fetchLogs} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 text-atlas-muted border border-white/10 hover:border-white/20 text-xs transition-all">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Filter size={13} className="text-atlas-muted" />
        <input
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          placeholder="Filter by action..."
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-atlas-border text-xs text-atlas-text placeholder-atlas-muted focus:outline-none focus:border-atlas-accent/50 w-48"
        />
        <span className="text-xs text-atlas-muted">{filtered.length} events</span>
      </div>

      <div className="rounded-xl border border-atlas-border bg-atlas-panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-atlas-muted text-sm">Loading audit logs...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Database size={28} className="text-atlas-muted mx-auto mb-2" />
            <p className="text-sm text-atlas-muted">No audit events yet. Events are logged as users interact with the platform.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-atlas-border">
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-atlas-muted uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-atlas-muted uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-atlas-muted uppercase">Resource</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-atlas-muted uppercase">User</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/3">
                    <td className="px-4 py-2.5 text-atlas-muted font-mono whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={clsx('font-medium', ACTION_COLORS[log.action] ?? 'text-atlas-text')}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-atlas-muted">
                      {log.resource_type && (
                        <span>{log.resource_type}{log.resource_id ? ` · ${log.resource_id.slice(0, 8)}…` : ''}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-atlas-muted font-mono text-[10px]">
                      {log.user_id?.slice(0, 8)}…
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
