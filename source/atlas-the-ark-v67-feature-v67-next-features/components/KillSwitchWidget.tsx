'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShieldOff, Shield, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

interface KillSwitchState {
  armed: boolean
  updated_at: string | null
  loading: boolean
}

interface KillSwitchWidgetProps {
  /** 'mini' = icon only for TopBar, 'full' = full button for Sidebar/admin */
  variant?: 'mini' | 'full'
  className?: string
}

export function KillSwitchWidget({ variant = 'mini', className }: KillSwitchWidgetProps) {
  const [state, setState] = useState<KillSwitchState>({
    armed: false,
    updated_at: null,
    loading: true,
  })
  const [toggling, setToggling] = useState(false)

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/system/killswitch')
      if (!res.ok) return
      const data = await res.json()
      setState(prev => ({ ...prev, armed: data.armed, updated_at: data.updated_at, loading: false }))
    } catch {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [])

  useEffect(() => {
    fetchState()
    // Poll every 30 seconds for state changes
    const interval = setInterval(fetchState, 30_000)
    return () => clearInterval(interval)
  }, [fetchState])

  const toggle = async () => {
    const newArmed = !state.armed
    const confirmed = newArmed
      ? window.confirm('⛔ ARM KILL SWITCH?\n\nThis will halt ALL AI and agent execution immediately.\n\nContinue?')
      : window.confirm('▶ DISARM KILL SWITCH?\n\nThis will resume normal AI and agent execution.\n\nContinue?')

    if (!confirmed) return

    setToggling(true)
    try {
      const res = await fetch('/api/system/killswitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ armed: newArmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Kill switch toggle failed')
        return
      }
      setState(prev => ({ ...prev, armed: newArmed, updated_at: new Date().toISOString() }))
      toast(data.message, { icon: newArmed ? '⛔' : '▶' })
    } catch {
      toast.error('Kill switch unreachable')
    } finally {
      setToggling(false)
    }
  }

  if (state.loading) {
    return (
      <div className={clsx('flex items-center justify-center', className)}>
        <Loader2 size={14} className="animate-spin text-atlas-muted" />
      </div>
    )
  }

  if (variant === 'mini') {
    return (
      <button
        onClick={toggle}
        disabled={toggling}
        title={state.armed ? 'Kill Switch ARMED — click to disarm' : 'Kill Switch OFF — click to arm'}
        className={clsx(
          'relative flex items-center justify-center w-7 h-7 rounded-md border transition-all',
          state.armed
            ? 'border-red-500/60 bg-red-500/15 text-red-400 animate-pulse'
            : 'border-atlas-border bg-atlas-surface text-atlas-muted hover:border-atlas-border2 hover:text-atlas-text',
          toggling && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        {toggling ? (
          <Loader2 size={13} className="animate-spin" />
        ) : state.armed ? (
          <ShieldOff size={13} />
        ) : (
          <Shield size={13} />
        )}
        {state.armed && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
        )}
      </button>
    )
  }

  // Full variant for sidebar / admin
  return (
    <button
      onClick={toggle}
      disabled={toggling}
      className={clsx(
        'w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all',
        state.armed
          ? 'border-red-500/60 bg-red-500/10 text-red-400 hover:bg-red-500/20'
          : 'border-atlas-border bg-atlas-surface text-atlas-muted hover:border-atlas-border2 hover:text-atlas-text',
        toggling && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {toggling ? (
        <Loader2 size={13} className="animate-spin flex-shrink-0" />
      ) : state.armed ? (
        <ShieldOff size={13} className="flex-shrink-0" />
      ) : (
        <Shield size={13} className="flex-shrink-0" />
      )}
      <span className="flex-1 text-left">
        {state.armed ? '⛔ KILL SWITCH ARMED' : 'Kill Switch (OFF)'}
      </span>
      {state.armed && (
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
      )}
    </button>
  )
}
