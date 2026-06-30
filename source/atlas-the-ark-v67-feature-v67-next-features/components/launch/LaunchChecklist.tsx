'use client'

/**
 * ATLAS Design System — LaunchChecklist
 * Database-backed launch readiness checklist.
 * Inspired by ATLAS_LAUNCH_COMMAND.html
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Lock, Unlock } from 'lucide-react'
import { clsx } from 'clsx'

export type CheckResult = 'pass' | 'fail' | 'pending' | 'warning' | 'skipped'

export interface LaunchCheck {
  id: string
  category: string
  label: string
  detail?: string
  status: CheckResult
  required: boolean
  auto_checked: boolean
  docs_url?: string
}

interface LaunchChecklistProps {
  checks?: LaunchCheck[]
  onRefresh?: () => Promise<void>
  className?: string
  compact?: boolean
}

const statusIcon: Record<CheckResult, React.ReactNode> = {
  pass:    <CheckCircle size={15} className="text-atlas-green shrink-0" />,
  fail:    <XCircle size={15} className="text-atlas-coral shrink-0" />,
  pending: <Clock size={15} className="text-atlas-gold shrink-0" />,
  warning: <AlertTriangle size={15} className="text-yellow-400 shrink-0" />,
  skipped: <Clock size={15} className="text-atlas-muted shrink-0" />,
}

function computeLaunchStatus(checks: LaunchCheck[]): 'locked' | 'ready' | 'partial' {
  const required = checks.filter(c => c.required)
  const allRequiredPass = required.every(c => c.status === 'pass')
  const anyFail = required.some(c => c.status === 'fail')
  if (allRequiredPass) return 'ready'
  if (anyFail) return 'locked'
  return 'partial'
}

const DEMO_CHECKS: LaunchCheck[] = [
  { id: 'supabase',        category: 'Infrastructure', label: 'Supabase connected',           status: 'pass',    required: true,  auto_checked: true },
  { id: 'rls',             category: 'Infrastructure', label: 'RLS enabled on all tables',    status: 'pass',    required: true,  auto_checked: true },
  { id: 'auth',            category: 'Infrastructure', label: 'Auth configured (magic link)',  status: 'pass',    required: true,  auto_checked: true },
  { id: 'anthropic',       category: 'AI',             label: 'Anthropic API key set',         status: 'pass',    required: true,  auto_checked: true },
  { id: 'killswitch',      category: 'Safety',         label: 'Kill switch wired',             status: 'pass',    required: true,  auto_checked: true },
  { id: 'stripe',          category: 'Billing',        label: 'Stripe configured',             status: 'pending', required: true,  auto_checked: true,  detail: 'Set STRIPE_SECRET_KEY in Vercel' },
  { id: 'stripe_webhook',  category: 'Billing',        label: 'Stripe webhook verified',       status: 'pending', required: true,  auto_checked: true,  detail: 'Register webhook in Stripe Dashboard' },
  { id: 'invite_only',     category: 'Security',       label: 'Invite-only mode enforced',     status: 'pass',    required: true,  auto_checked: true },
  { id: 'secrets',         category: 'Security',       label: 'No secrets in browser',         status: 'pass',    required: true,  auto_checked: true },
  { id: 'build_pass',      category: 'Build',          label: 'npm run build passes',          status: 'pass',    required: true,  auto_checked: false },
  { id: 'typecheck',       category: 'Build',          label: 'TypeScript clean (0 errors)',   status: 'pass',    required: true,  auto_checked: false },
  { id: 'lint',            category: 'Build',          label: 'ESLint clean',                  status: 'pass',    required: true,  auto_checked: false },
  { id: 'privacy',         category: 'Legal',          label: 'Privacy policy page live',      status: 'pending', required: true,  auto_checked: false, detail: 'Add /privacy page' },
  { id: 'terms',           category: 'Legal',          label: 'Terms of service page live',    status: 'pending', required: true,  auto_checked: false, detail: 'Add /terms page' },
  { id: 'attribution',     category: 'Legal',          label: 'IP attribution corrected',      status: 'pass',    required: true,  auto_checked: false },
  { id: 'mapbox',          category: 'Integrations',   label: 'Mapbox token set (AIN map)',    status: 'pending', required: false, auto_checked: true,  detail: 'Optional — AIN map works without it in demo mode' },
  { id: 'skip_trace',      category: 'Integrations',   label: 'BatchSkipTracing API key',      status: 'pending', required: false, auto_checked: true,  detail: 'Optional — skip trace shows queued state without it' },
  { id: 'twilio_a2p',      category: 'Integrations',   label: 'Twilio A2P 10DLC approved',     status: 'pending', required: false, auto_checked: true,  detail: 'Required for SMS — 2-4 week approval window' },
  { id: 'sentry',          category: 'Observability',  label: 'Sentry error tracking',         status: 'pending', required: false, auto_checked: true,  detail: 'Recommended before public launch' },
  { id: 'first_tester',    category: 'Beta',           label: 'First tester invited + tested', status: 'pending', required: false, auto_checked: false },
]

export function LaunchChecklist({ checks = DEMO_CHECKS, onRefresh, className, compact = false }: LaunchChecklistProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  const categories = ['all', ...Array.from(new Set(checks.map(c => c.category)))]
  const filtered = filter === 'all' ? checks : checks.filter(c => c.category === filter)
  const launchStatus = computeLaunchStatus(checks)
  const passCount = checks.filter(c => c.status === 'pass').length
  const requiredFail = checks.filter(c => c.required && c.status === 'fail').length

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await onRefresh?.()
    setTimeout(() => setRefreshing(false), 1000)
  }, [onRefresh])

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Status Banner */}
      <div className={clsx(
        'rounded-xl border p-4 flex items-center justify-between',
        launchStatus === 'ready'   && 'border-atlas-green/30 bg-atlas-green/8',
        launchStatus === 'partial' && 'border-atlas-gold/30 bg-atlas-gold/8',
        launchStatus === 'locked'  && 'border-atlas-coral/30 bg-atlas-coral/8',
      )}>
        <div className="flex items-center gap-3">
          {launchStatus === 'ready'   ? <Unlock size={20} className="text-atlas-green" /> : <Lock size={20} className={launchStatus === 'locked' ? 'text-atlas-coral' : 'text-atlas-gold'} />}
          <div>
            <div className="font-semibold text-sm text-atlas-text">
              {launchStatus === 'ready'   ? '🟢 Launch Ready' :
               launchStatus === 'partial' ? '🟡 Launch Pending' :
               '🔴 Launch Blocked'}
            </div>
            <div className="text-xs text-atlas-muted">
              {passCount}/{checks.length} checks passing
              {requiredFail > 0 && ` · ${requiredFail} required failing`}
            </div>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg hover:bg-white/5 text-atlas-muted hover:text-atlas-text transition-colors"
        >
          <RefreshCw size={14} className={clsx(refreshing && 'animate-spin')} />
        </button>
      </div>

      {/* Category Filter */}
      {!compact && (
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-medium transition-all',
                filter === cat
                  ? 'bg-atlas-accent/20 text-atlas-accent border border-atlas-accent/30'
                  : 'bg-white/5 text-atlas-muted border border-white/10 hover:border-white/20'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Check Items */}
      <div className="space-y-0">
        {filtered.map(check => (
          <div
            key={check.id}
            className={clsx(
              'flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0',
              check.status === 'fail' && check.required && 'bg-atlas-coral/5 px-2 rounded'
            )}
          >
            {statusIcon[check.status]}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-atlas-text">{check.label}</span>
                {check.required && <span className="text-[9px] font-bold text-atlas-coral bg-atlas-coral/15 px-1.5 py-0.5 rounded">REQ</span>}
                {!compact && check.auto_checked && <span className="text-[9px] text-atlas-muted">AUTO</span>}
              </div>
              {!compact && check.detail && (
                <p className="text-xs text-atlas-muted mt-0.5">{check.detail}</p>
              )}
            </div>
            {!compact && (
              <span className="text-[10px] font-mono text-atlas-muted shrink-0">{check.category}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
