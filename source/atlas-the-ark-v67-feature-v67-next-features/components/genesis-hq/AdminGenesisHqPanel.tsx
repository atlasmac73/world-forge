'use client'

import { useState, useEffect, useCallback } from 'react'
import { Database, RotateCcw, ShieldAlert, History } from 'lucide-react'
import { clsx } from 'clsx'
import type { GenesisHqAdminStatus, GenesisHqAuditEvent } from '@/lib/genesis-hq/types'
import { GENESIS_HQ_RESET_CONFIRMATION_TEXT } from '@/lib/genesis-hq/constants'

export function AdminGenesisHqPanel({
  status,
  onRefresh,
}: {
  status: GenesisHqAdminStatus | null
  onRefresh: () => void
}) {
  const [seeding, setSeeding] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [audit, setAudit] = useState<GenesisHqAuditEvent[]>([])
  const [message, setMessage] = useState<string | null>(null)

  const loadAudit = useCallback(async () => {
    const res = await fetch('/api/admin/genesis-hq/audit')
    if (res.ok) {
      const data = await res.json()
      setAudit(data.events ?? [])
    }
  }, [])

  useEffect(() => {
    if (status?.isOwner) loadAudit()
  }, [status?.isOwner, loadAudit])

  if (!status) return null

  if (!status.isOwner) {
    return (
      <div className="text-center py-12 text-slate-600">
        <ShieldAlert size={32} className="mx-auto mb-3 opacity-30" />
        <div className="font-mono text-sm">Owner access required</div>
        <div className="text-[11px] mt-1">Genesis HQ admin controls are restricted to the founder account.</div>
      </div>
    )
  }

  const handleSeed = async () => {
    setSeeding(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/genesis-hq/seed', { method: 'POST' })
      const data = await res.json()
      setMessage(res.ok ? `Seeded: ${data.tasks} tasks, ${data.ideas} ideas, ${data.moatSections} moat sections` : data.error)
      onRefresh()
      loadAudit()
    } finally {
      setSeeding(false)
    }
  }

  const handleReset = async () => {
    if (confirmText !== GENESIS_HQ_RESET_CONFIRMATION_TEXT) return
    setResetting(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/genesis-hq/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: confirmText }),
      })
      const data = await res.json()
      setMessage(res.ok ? `Reset complete — ${data.tablesCleared} tables cleared` : data.error)
      setShowResetConfirm(false)
      setConfirmText('')
      onRefresh()
      loadAudit()
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="text-[11px] px-3 py-2 rounded bg-atlas-accent/10 text-atlas-accent border border-atlas-accent/20">
          {message}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 text-[10px]">
        {[
          { label: 'Phases', value: status.phaseCount },
          { label: 'Areas', value: status.areaCount },
          { label: 'Tasks', value: status.taskCount },
          { label: 'Kanban Cards', value: status.kanbanCardCount },
          { label: 'Ideas', value: status.ideaCount },
          { label: 'Moat Items', value: status.moatItemCount },
        ].map((s) => (
          <div key={s.label} className="atlas-panel p-2 rounded border border-white/10">
            <div className="text-slate-500">{s.label}</div>
            <div className="text-base font-mono font-bold text-white">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="atlas-panel p-4 rounded-lg border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-atlas-accent" />
          <div>
            <div className="text-sm font-bold text-white">Seed Content</div>
            <div className="text-[10px] text-slate-500">Idempotent — safe to run multiple times</div>
          </div>
        </div>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-atlas-accent/20 text-atlas-accent border border-atlas-accent/30 hover:bg-atlas-accent/30 disabled:opacity-50 transition-all"
        >
          {seeding ? 'Seeding...' : status.isSeeded ? 'Re-seed' : 'Seed Now'}
        </button>
      </div>

      <div className="atlas-panel p-4 rounded-lg border border-red-500/20">
        <div className="flex items-center gap-2 mb-2">
          <RotateCcw size={16} className="text-red-400" />
          <div className="text-sm font-bold text-red-400">Reset Genesis HQ</div>
        </div>
        <div className="text-[10px] text-slate-500 mb-3">
          Permanently deletes all phases, areas, tasks, kanban cards, ideas, mind map nodes, and moat content. Audit log is preserved.
        </div>

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
          >
            Reset Genesis HQ
          </button>
        ) : (
          <div className="space-y-2">
            <div className="text-[10px] text-slate-400">
              Type <span className="font-mono font-bold text-red-400">{GENESIS_HQ_RESET_CONFIRMATION_TEXT}</span> to confirm:
            </div>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-2 py-1.5 rounded bg-atlas-dark border border-white/10 text-xs font-mono text-white outline-none focus:border-red-500/50"
              placeholder={GENESIS_HQ_RESET_CONFIRMATION_TEXT}
            />
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                disabled={resetting || confirmText !== GENESIS_HQ_RESET_CONFIRMATION_TEXT}
                className={clsx(
                  'flex-1 py-1.5 rounded text-[10px] font-bold transition-all',
                  confirmText === GENESIS_HQ_RESET_CONFIRMATION_TEXT
                    ? 'bg-red-500/30 text-red-300 border border-red-500/40 hover:bg-red-500/40'
                    : 'bg-white/5 text-slate-600 border border-white/10 cursor-not-allowed'
                )}
              >
                {resetting ? 'Resetting...' : 'Confirm Reset'}
              </button>
              <button
                onClick={() => { setShowResetConfirm(false); setConfirmText('') }}
                className="flex-1 py-1.5 rounded text-[10px] font-bold bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="atlas-panel p-4 rounded-lg border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <History size={14} className="text-slate-400" />
          <span className="text-xs font-mono font-bold text-slate-400">AUDIT LOG</span>
        </div>
        {audit.length === 0 ? (
          <div className="text-[10px] text-slate-600">No admin actions logged yet</div>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {audit.map((event) => (
              <div key={event.id} className="flex items-center justify-between text-[10px] px-2 py-1.5 rounded bg-white/3">
                <span className="text-slate-300 font-mono">{event.action}</span>
                <span className="text-slate-600">{new Date(event.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
