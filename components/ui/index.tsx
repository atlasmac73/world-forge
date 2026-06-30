'use client'

/**
 * ATLAS Design System — UI Primitives Index
 * StatusBadge, ScoreBar, SignalBadge, AgentBadge, LaunchCheckItem,
 * GlassPanel, CommandButton, SectionHeader
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { clsx } from 'clsx'
import { CheckCircle, XCircle, Clock, AlertTriangle, Loader2, type LucideIcon } from 'lucide-react'
import { type ReactNode } from 'react'

export { AtlasCard } from './AtlasCard'
export { MetricCard } from './MetricCard'

// ─── StatusBadge ─────────────────────────────────────────────────────────────

type StatusType = 'active' | 'inactive' | 'pending' | 'error' | 'warning' | 'live' | 'demo' | 'beta' | 'locked' | 'standby'

interface StatusBadgeProps {
  status: StatusType
  label?: string
  pulse?: boolean
  className?: string
}

const statusConfig: Record<StatusType, { color: string; dot: string; label: string }> = {
  active:   { color: 'text-atlas-green border-atlas-green/30 bg-atlas-green/10',   dot: 'bg-atlas-green',   label: 'Active' },
  inactive: { color: 'text-atlas-muted  border-white/10      bg-white/5',            dot: 'bg-atlas-muted',   label: 'Inactive' },
  pending:  { color: 'text-atlas-gold   border-atlas-gold/30  bg-atlas-gold/10',    dot: 'bg-atlas-gold',    label: 'Pending' },
  error:    { color: 'text-atlas-coral  border-atlas-coral/30 bg-atlas-coral/10',   dot: 'bg-atlas-coral',   label: 'Error' },
  warning:  { color: 'text-yellow-400   border-yellow-400/30  bg-yellow-400/10',     dot: 'bg-yellow-400',    label: 'Warning' },
  live:     { color: 'text-atlas-teal   border-atlas-teal/30  bg-atlas-teal/10',    dot: 'bg-atlas-teal',    label: 'Live' },
  demo:     { color: 'text-atlas-purple border-atlas-purple/30 bg-atlas-purple/10', dot: 'bg-atlas-purple',  label: 'Demo' },
  beta:     { color: 'text-atlas-accent border-atlas-accent/30 bg-atlas-accent/10', dot: 'bg-atlas-accent',  label: 'Beta' },
  locked:   { color: 'text-atlas-muted  border-white/10        bg-white/5',          dot: 'bg-atlas-muted',   label: 'Locked' },
  standby:  { color: 'text-atlas-muted  border-white/10        bg-white/5',          dot: 'bg-atlas-muted',   label: 'Standby' },
}

export function StatusBadge({ status, label, pulse = false, className }: StatusBadgeProps) {
  const cfg = statusConfig[status]
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
      cfg.color, className
    )}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot, pulse && 'animate-pulse')} />
      {label ?? cfg.label}
    </span>
  )
}

// ─── ScoreBar ─────────────────────────────────────────────────────────────────

interface ScoreBarProps {
  score: number        // 0–100
  label?: string
  showValue?: boolean
  height?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ScoreBar({ score, label, showValue = true, height = 'md', className }: ScoreBarProps) {
  const pct = Math.max(0, Math.min(100, score))
  const color = pct >= 80 ? '#fc8181' : pct >= 60 ? '#f6ad55' : pct >= 40 ? '#63b3ed' : '#68d391'
  const hMap = { sm: 'h-1', md: 'h-2', lg: 'h-3' }

  return (
    <div className={clsx('space-y-1', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="text-atlas-muted">{label}</span>}
          {showValue && <span className="font-mono font-bold" style={{ color }}>{pct}</span>}
        </div>
      )}
      <div className={clsx('w-full rounded-full bg-white/5', hMap[height])}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ─── SignalBadge ──────────────────────────────────────────────────────────────

type SignalLevel = 'critical' | 'hot' | 'warm' | 'cool' | 'cold'

interface SignalBadgeProps {
  level: SignalLevel
  label?: string
  compact?: boolean
  className?: string
}

const signalConfig: Record<SignalLevel, { color: string; bg: string; bars: number }> = {
  critical: { color: '#fc8181', bg: 'rgba(252,129,129,0.15)', bars: 5 },
  hot:      { color: '#f6ad55', bg: 'rgba(246,173,85,0.15)',  bars: 4 },
  warm:     { color: '#63b3ed', bg: 'rgba(99,179,237,0.15)',  bars: 3 },
  cool:     { color: '#4fd1c5', bg: 'rgba(79,209,197,0.15)',  bars: 2 },
  cold:     { color: '#718096', bg: 'rgba(113,128,150,0.15)', bars: 1 },
}

export function SignalBadge({ level, label, compact = false, className }: SignalBadgeProps) {
  const cfg = signalConfig[level]
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-lg font-medium text-xs',
        compact ? 'px-2 py-0.5' : 'px-3 py-1',
        className
      )}
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <span className="flex items-end gap-0.5">
        {[1, 2, 3, 4, 5].map((b) => (
          <span
            key={b}
            className="rounded-sm transition-all"
            style={{
              width: compact ? 2 : 3,
              height: (b * (compact ? 4 : 5)),
              background: b <= cfg.bars ? cfg.color : 'rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </span>
      {!compact && (label ?? level.toUpperCase())}
    </span>
  )
}

// ─── AgentBadge ──────────────────────────────────────────────────────────────

type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'standby'

interface AgentBadgeProps {
  code: string           // e.g. "A01"
  name: string           // e.g. "ORACLE"
  status: AgentStatus
  compact?: boolean
  className?: string
}

const agentStatusColor: Record<AgentStatus, string> = {
  idle:      '#718096',
  running:   '#63b3ed',
  completed: '#68d391',
  failed:    '#fc8181',
  standby:   '#f6ad55',
}

export function AgentBadge({ code, name, status, compact = false, className }: AgentBadgeProps) {
  const color = agentStatusColor[status]
  const isRunning = status === 'running'
  return (
    <div className={clsx(
      'inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5',
      compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
      className
    )}>
      <span
        className={clsx('w-2 h-2 rounded-full', isRunning && 'animate-pulse')}
        style={{ background: color }}
      />
      <span className="font-mono font-bold text-atlas-muted">{code}</span>
      {!compact && <span className="font-medium text-atlas-text">{name}</span>}
    </div>
  )
}

// ─── LaunchCheckItem ──────────────────────────────────────────────────────────

type CheckStatus = 'pass' | 'fail' | 'pending' | 'warning' | 'skipped'

interface LaunchCheckItemProps {
  label: string
  status: CheckStatus
  detail?: string
  required?: boolean
  className?: string
}

const checkIcons: Record<CheckStatus, { icon: LucideIcon; color: string }> = {
  pass:    { icon: CheckCircle,    color: 'text-atlas-green' },
  fail:    { icon: XCircle,        color: 'text-atlas-coral' },
  pending: { icon: Clock,          color: 'text-atlas-gold' },
  warning: { icon: AlertTriangle,  color: 'text-yellow-400' },
  skipped: { icon: Clock,           color: 'text-atlas-muted' },
}


export function LaunchCheckItem({ label, status, detail, required = false, className }: LaunchCheckItemProps) {
  const cfg = checkIcons[status]
  const Icon = cfg.icon
  return (
    <div className={clsx('flex items-start gap-3 py-2 border-b border-white/5 last:border-0', className)}>
      <Icon size={16} className={clsx('mt-0.5 shrink-0', cfg.color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-atlas-text">{label}</span>
          {required && <span className="text-[10px] text-atlas-coral font-medium">REQUIRED</span>}
        </div>
        {detail && <p className="text-xs text-atlas-muted mt-0.5">{detail}</p>}
      </div>
    </div>
  )
}

// ─── GlassPanel ──────────────────────────────────────────────────────────────

interface GlassPanelProps {
  children: ReactNode
  title?: string
  subtitle?: string
  action?: ReactNode
  className?: string
  glowColor?: string
}

export function GlassPanel({ children, title, subtitle, action, className, glowColor }: GlassPanelProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-white/10 backdrop-blur-sm bg-[rgba(15,21,37,0.8)]',
        className
      )}
      style={glowColor ? {
        boxShadow: `0 0 40px ${glowColor}20, inset 0 0 40px ${glowColor}05`,
        borderColor: `${glowColor}30`,
      } : undefined}
    >
      {(title || action) && (
        <div className="flex items-start justify-between p-5 border-b border-white/8">
          <div>
            {title && <h3 className="text-sm font-semibold text-atlas-text">{title}</h3>}
            {subtitle && <p className="text-xs text-atlas-muted mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}

// ─── CommandButton ────────────────────────────────────────────────────────────

interface CommandButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gold'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: ReactNode
  className?: string
}

const btnVariant = {
  primary:   'bg-atlas-accent/20 hover:bg-atlas-accent/30 text-atlas-accent border border-atlas-accent/30 hover:border-atlas-accent/60',
  secondary: 'bg-white/5 hover:bg-white/10 text-atlas-text border border-white/10 hover:border-white/20',
  danger:    'bg-atlas-coral/20 hover:bg-atlas-coral/30 text-atlas-coral border border-atlas-coral/30 hover:border-atlas-coral/60',
  ghost:     'bg-transparent hover:bg-white/5 text-atlas-muted hover:text-atlas-text border border-transparent',
  gold:      'bg-atlas-gold/20 hover:bg-atlas-gold/30 text-atlas-gold border border-atlas-gold/30 hover:border-atlas-gold/60',
}

const btnSize = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
}

export function CommandButton({
  children, onClick, variant = 'primary', size = 'md',
  disabled, loading, icon, className
}: CommandButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center gap-2 font-medium transition-all duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        btnVariant[variant], btnSize[size], className
      )}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string
  subtitle?: string
  badge?: string
  badgeColor?: string
  action?: ReactNode
  className?: string
}

export function SectionHeader({ title, subtitle, badge, badgeColor, action, className }: SectionHeaderProps) {
  return (
    <div className={clsx('flex items-start justify-between gap-4', className)}>
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-atlas-text">{title}</h2>
          {badge && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${badgeColor ?? '#63b3ed'}20`, color: badgeColor ?? '#63b3ed' }}
            >
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-atlas-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
