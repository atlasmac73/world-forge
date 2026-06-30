'use client'

/**
 * ATLAS Design System — GodView Components
 * 5-panel founder/admin executive dashboard layout.
 * Inspired by ATLAS_GODVIEW_FINAL(1).html
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { clsx } from 'clsx'
import { type ReactNode } from 'react'
import { type LucideIcon } from 'lucide-react'

// ─── GodViewPanel ────────────────────────────────────────────────────────────

export type GodPanelType = 'ain' | 'akashic' | 'cerebro' | 'genesis' | 'navigator'

interface GodViewPanelProps {
  type: GodPanelType
  title: string
  subtitle?: string
  icon: LucideIcon
  children: ReactNode
  status?: 'online' | 'standby' | 'offline' | 'alert'
  badge?: string
  className?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
}

const panelColors: Record<GodPanelType, { accent: string; glow: string; headerBg: string }> = {
  ain:       { accent: '#63b3ed', glow: 'rgba(99,179,237,0.12)',   headerBg: 'rgba(99,179,237,0.06)' },
  akashic:   { accent: '#b794f4', glow: 'rgba(183,148,244,0.12)',  headerBg: 'rgba(183,148,244,0.06)' },
  cerebro:   { accent: '#68d391', glow: 'rgba(104,211,145,0.12)',  headerBg: 'rgba(104,211,145,0.06)' },
  genesis:   { accent: '#f6ad55', glow: 'rgba(246,173,85,0.12)',   headerBg: 'rgba(246,173,85,0.06)' },
  navigator: { accent: '#4fd1c5', glow: 'rgba(79,209,197,0.12)',   headerBg: 'rgba(79,209,197,0.06)' },
}

const statusConfig = {
  online:  { color: '#68d391', label: 'ONLINE',  pulse: true },
  standby: { color: '#f6ad55', label: 'STANDBY', pulse: false },
  offline: { color: '#718096', label: 'OFFLINE', pulse: false },
  alert:   { color: '#fc8181', label: 'ALERT',   pulse: true },
}

export function GodViewPanel({
  type, title, subtitle, icon: Icon, children, status = 'online', badge, className,
}: GodViewPanelProps) {
  const colors = panelColors[type]
  const stat = status ? statusConfig[status] : null

  return (
    <div
      className={clsx('rounded-2xl border overflow-hidden flex flex-col', className)}
      style={{
        borderColor: `${colors.accent}25`,
        background: 'rgba(10,14,26,0.95)',
        boxShadow: `0 0 30px ${colors.glow}, inset 0 0 30px ${colors.glow}`,
      }}
    >
      {/* Panel Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ background: colors.headerBg, borderColor: `${colors.accent}20` }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="p-1.5 rounded-lg"
            style={{ background: `${colors.accent}20` }}
          >
            <Icon size={14} style={{ color: colors.accent }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">{title}</span>
              {badge && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: `${colors.accent}25`, color: colors.accent }}
                >
                  {badge}
                </span>
              )}
            </div>
            {subtitle && <p className="text-[10px] text-white/40">{subtitle}</p>}
          </div>
        </div>

        {/* Status indicator */}
        {stat && (
          <div className="flex items-center gap-1.5">
            <span
              className={clsx('w-1.5 h-1.5 rounded-full', stat.pulse && 'animate-pulse')}
              style={{ background: stat.color }}
            />
            <span className="text-[9px] font-mono font-bold" style={{ color: stat.color }}>
              {stat.label}
            </span>
          </div>
        )}
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10">
        {children}
      </div>
    </div>
  )
}

// ─── GodViewGrid ─────────────────────────────────────────────────────────────

interface GodViewGridProps {
  children: ReactNode
  layout?: '5-panel' | '3-panel' | '2-panel' | 'single'
  className?: string
}

export function GodViewGrid({ children, layout = '5-panel', className }: GodViewGridProps) {
  const gridClass = {
    '5-panel': 'grid grid-cols-1 xl:grid-cols-3 gap-4',
    '3-panel': 'grid grid-cols-1 lg:grid-cols-3 gap-4',
    '2-panel': 'grid grid-cols-1 lg:grid-cols-2 gap-4',
    'single':  'grid grid-cols-1 gap-4',
  }

  return (
    <div className={clsx(gridClass[layout], 'h-full', className)}>
      {children}
    </div>
  )
}

// ─── GodViewStatRow ───────────────────────────────────────────────────────────

interface GodViewStatRowProps {
  label: string
  value: string | number
  color?: string
  sublabel?: string
}

export function GodViewStatRow({ label, value, color = '#63b3ed', sublabel }: GodViewStatRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div>
        <span className="text-xs text-white/50">{label}</span>
        {sublabel && <span className="block text-[10px] text-white/30">{sublabel}</span>}
      </div>
      <span className="text-sm font-mono font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  )
}
