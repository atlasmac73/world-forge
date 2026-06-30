'use client'

/**
 * ATLAS v67 — Launch Readiness Client
 * Inspired by ATLAS_LAUNCH_COMMAND.html
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, ExternalLink } from 'lucide-react'
import { LaunchChecklist, type LaunchCheck } from '@/components/launch/LaunchChecklist'
import { clsx } from 'clsx'

export function LaunchReadinessClient() {
  const [checks, setChecks] = useState<LaunchCheck[]>([])
  const [summary, setSummary] = useState<{
    total: number; pass: number; fail: number; pending: number
    required_failing: number; launch_status: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchChecks = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/launch-readiness')
      const data = await res.json()
      if (data.ok) {
        setChecks(data.data.checks)
        setSummary(data.data.summary)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  const runFreshChecks = useCallback(async () => {
    setRefreshing(true)
    await fetch('/api/admin/launch-readiness', { method: 'POST' })
    await fetchChecks()
    setRefreshing(false)
  }, [fetchChecks])

  useEffect(() => { fetchChecks() }, [fetchChecks])

  return (
    <div className="min-h-screen bg-atlas-dark text-atlas-text p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-mono text-atlas-gold tracking-widest mb-1">
            ATLAS v67 · LAUNCH COMMAND
          </div>
          <h1 className="text-xl font-bold">Launch Readiness</h1>
          <p className="text-xs text-atlas-muted mt-0.5">Private Beta → Production Readiness Gate</p>
        </div>
        <button
          onClick={runFreshChecks}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-atlas-accent/15 text-atlas-accent border border-atlas-accent/30 hover:bg-atlas-accent/25 transition-all text-sm disabled:opacity-50"
        >
          <RefreshCw size={13} className={clsx(refreshing && 'animate-spin')} />
          Run Checks
        </button>
      </div>

      {/* Summary bar */}
      {summary && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Passing', value: summary.pass, color: 'text-atlas-green' },
            { label: 'Failing',  value: summary.fail, color: 'text-atlas-coral' },
            { label: 'Pending', value: summary.pending, color: 'text-atlas-gold' },
            { label: 'Req Failing', value: summary.required_failing, color: summary.required_failing > 0 ? 'text-atlas-coral' : 'text-atlas-muted' },
          ].map(m => (
            <div key={m.label} className="rounded-xl border border-atlas-border bg-atlas-panel p-4 text-center">
              <div className={clsx('text-2xl font-mono font-bold', m.color)}>{m.value}</div>
              <div className="text-[10px] text-atlas-muted mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Checklist */}
      {loading ? (
        <div className="rounded-xl border border-atlas-border bg-atlas-panel p-8 text-center">
          <div className="text-atlas-muted text-sm">Loading launch checks...</div>
        </div>
      ) : (
        <div className="rounded-xl border border-atlas-border bg-atlas-panel p-5">
          <LaunchChecklist checks={checks.length > 0 ? checks : undefined} onRefresh={fetchChecks} />
        </div>
      )}

      {/* Domino Sequence */}
      <div className="rounded-xl border border-atlas-border bg-atlas-panel p-5">
        <h3 className="text-sm font-bold text-atlas-text mb-4">Deployment Domino Sequence</h3>
        <div className="space-y-2">
          {[
            { n: '01', label: 'Rotate API keys (Anthropic + Supabase) before first git push', done: false, required: true },
            { n: '02', label: 'Push to private GitHub repo', done: false, required: true },
            { n: '03', label: 'Set all required env vars in Vercel', done: false, required: true },
            { n: '04', label: 'Run schema_v67_master.sql in Supabase SQL Editor', done: false, required: true },
            { n: '05', label: 'Run seed_owner.sql after first sign-in', done: false, required: true },
            { n: '06', label: 'Configure Supabase Auth magic link + redirect URL', done: false, required: true },
            { n: '07', label: 'Verify /api/health returns 200', done: false, required: true },
            { n: '08', label: 'Test invite flow — invite one tester', done: false, required: false },
            { n: '09', label: 'Create Stripe products + add price IDs to Vercel', done: false, required: false },
            { n: '10', label: 'Promote Vercel preview → production', done: false, required: true },
          ].map(step => (
            <div key={step.n} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <span className="text-[10px] font-mono text-atlas-muted w-6">{step.n}</span>
              <span className={clsx('flex-1 text-xs', step.done ? 'line-through text-atlas-muted' : 'text-atlas-text')}>
                {step.label}
              </span>
              {step.required && <span className="text-[9px] text-atlas-coral font-bold">REQ</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Footer links */}
      <div className="flex flex-wrap gap-3 text-xs">
        <a href="/admin/integrations" className="flex items-center gap-1 text-atlas-accent hover:underline">
          <ExternalLink size={11} /> Integrations
        </a>
        <a href="/admin/system-health" className="flex items-center gap-1 text-atlas-accent hover:underline">
          <ExternalLink size={11} /> System Health
        </a>
        <a href="/admin/godview" className="flex items-center gap-1 text-atlas-accent hover:underline">
          <ExternalLink size={11} /> GodView
        </a>
        <a href="/admin/command-center" className="flex items-center gap-1 text-atlas-accent hover:underline">
          <ExternalLink size={11} /> Command Center
        </a>
      </div>
    </div>
  )
}
