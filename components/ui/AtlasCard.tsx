'use client'

/**
 * ATLAS Design System — AtlasCard
 * Base card component with Atlas dark theme.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { clsx } from 'clsx'
import { type ReactNode } from 'react'

interface AtlasCardProps {
  children: ReactNode
  className?: string
  glow?: 'none' | 'cyan' | 'gold' | 'green' | 'red' | 'purple'
  onClick?: () => void
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const glowMap = {
  none:   '',
  cyan:   'shadow-[0_0_20px_rgba(99,179,237,0.12)] hover:shadow-[0_0_30px_rgba(99,179,237,0.22)]',
  gold:   'shadow-[0_0_20px_rgba(246,173,85,0.12)] hover:shadow-[0_0_30px_rgba(246,173,85,0.22)]',
  green:  'shadow-[0_0_20px_rgba(104,211,145,0.12)] hover:shadow-[0_0_30px_rgba(104,211,145,0.22)]',
  red:    'shadow-[0_0_20px_rgba(252,129,129,0.12)] hover:shadow-[0_0_30px_rgba(252,129,129,0.22)]',
  purple: 'shadow-[0_0_20px_rgba(183,148,244,0.12)] hover:shadow-[0_0_30px_rgba(183,148,244,0.22)]',
}

const padMap = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-7',
}

export function AtlasCard({
  children,
  className,
  glow = 'none',
  onClick,
  hover = false,
  padding = 'md',
}: AtlasCardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-xl border border-atlas-border bg-atlas-panel transition-all duration-200',
        glowMap[glow],
        padMap[padding],
        hover && 'hover:border-atlas-border-active hover:bg-opacity-80 cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}
