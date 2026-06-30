'use client'

/**
 * ATLAS Design System — MetricCard
 * Metric tile with label, value, trend, and icon.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { clsx } from 'clsx'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { type ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  subvalue?: string
  trend?: 'up' | 'down' | 'flat'
  trendValue?: string
  icon?: ReactNode
  color?: 'cyan' | 'gold' | 'green' | 'red' | 'purple' | 'teal' | 'pink'
  loading?: boolean
  className?: string
}

const colorMap = {
  cyan:   'text-atlas-accent',
  gold:   'text-atlas-gold',
  green:  'text-atlas-green',
  red:    'text-atlas-coral',
  purple: 'text-atlas-purple',
  teal:   'text-atlas-teal',
  pink:   'text-atlas-pink',
}

const bgColorMap = {
  cyan:   'bg-[rgba(99,179,237,0.08)]',
  gold:   'bg-[rgba(246,173,85,0.08)]',
  green:  'bg-[rgba(104,211,145,0.08)]',
  red:    'bg-[rgba(252,129,129,0.08)]',
  purple: 'bg-[rgba(183,148,244,0.08)]',
  teal:   'bg-[rgba(79,209,197,0.08)]',
  pink:   'bg-[rgba(246,135,179,0.08)]',
}

export function MetricCard({
  label,
  value,
  subvalue,
  trend,
  trendValue,
  icon,
  color = 'cyan',
  loading = false,
  className,
}: MetricCardProps) {
  return (
    <div className={clsx(
      'rounded-xl border border-atlas-border bg-atlas-panel p-4 space-y-2',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-atlas-muted uppercase tracking-wider">{label}</span>
        {icon && (
          <div className={clsx('p-1.5 rounded-lg', bgColorMap[color])}>
            <span className={clsx('block', colorMap[color])}>{icon}</span>
          </div>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div className="h-7 w-24 rounded bg-white/5 animate-pulse" />
      ) : (
        <div className={clsx('text-2xl font-bold font-mono', colorMap[color])}>
          {value}
        </div>
      )}

      {/* Subvalue + Trend */}
      <div className="flex items-center justify-between">
        {subvalue && (
          <span className="text-xs text-atlas-muted">{subvalue}</span>
        )}
        {trend && trendValue && (
          <div className={clsx(
            'flex items-center gap-1 text-xs font-medium',
            trend === 'up' ? 'text-atlas-green' : trend === 'down' ? 'text-atlas-coral' : 'text-atlas-muted'
          )}>
            {trend === 'up' ? <TrendingUp size={11} /> : trend === 'down' ? <TrendingDown size={11} /> : <Minus size={11} />}
            {trendValue}
          </div>
        )}
      </div>
    </div>
  )
}
