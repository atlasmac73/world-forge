'use client'

import { useArkStore } from '@/store/useArkStore'
import { Search, Bell, Zap, ChevronRight, Wifi, WifiOff, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { clsx } from 'clsx'
import { KillSwitchWidget } from '@/components/KillSwitchWidget'
import { useState, useEffect } from 'react'

const PORTAL_TITLES: Record<string, string> = {
  'dashboard': 'Empire Dashboard',
  'deals': 'Deal Navigator',
  'war-room': 'Investor War Room',
  'skip-trace': 'Skip Trace (A12-SPECTER)',
  'ain': 'AIN Heatmap',
  'comms': 'Comms Hub',
  'agents': 'Agent Lab — 255 Agents',
  'swarm': 'Swarm Nexus',
  'market': 'Market Intelligence',
  'genesis': 'Genesis Engine',
  'signals': 'Signal Stack',
  'voice': 'Neural Call Assist',
  'loi': 'LOI Generator',
  'contractors': 'Contractor Portal',
  'pm': 'Property Manager',
  'legal': 'Legal & Patents',
  'transmedia': 'Transmedia / Leon Therano',
  'worldforge': 'WorldForge — Reality Engine',
  'akashic': 'Akashic Library',
  'skills': 'Skills Matrix',
  'pay': 'Atlas Pay',
  'community': 'Community Nexus',
  'blueprint': 'Blueprint Intelligence',
  'build': 'ARK Build',
  'expansion': 'National Expansion',
  'orchestra': 'Atlas Orchestra',
  'autopoietic': 'Autopoietic Console',
  'admin': 'Admin',
  'franchise': 'Franchise Studio',
  'vault': 'ARK Vault',
  'patents': 'Patent Command',
  'onboarding': 'Onboarding',
  'superllm': '🔱 Portal 15 — SuperLLM',
  'nasdrop': '🔱 NASDROP GOD MODE',
  'scoring': 'Distress Scoring — Signal Stack',
  'top250': 'Top 250 Matrix',
  'pipeline': 'Deal Pipeline CRM',
  'd4d': 'Driving for Dollars',
  'underwriting': 'Underwriting / MAO Calculator',
  'rehab': 'Rehab Estimator',
  'godmode': 'God Mode — 4-Agent Pod',
  'agent-runs': 'Agent Run History',
}

export function TopBar() {
  const { activePortal, setCommandOpen, subscription, agentRuns, toggleCopilot, nasdrop } = useArkStore()
  const [online, setOnline] = useState(true)
  const [time, setTime] = useState(new Date())

  const activeRunsCount = agentRuns.filter(r => r.status === 'running').length

  useEffect(() => {
    setOnline(navigator.onLine)
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    const timer = setInterval(() => setTime(new Date()), 60000)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      clearInterval(timer)
    }
  }, [])

  const title = PORTAL_TITLES[activePortal] ?? activePortal
  const isNasdrop = activePortal === 'nasdrop'

  return (
    <header className={clsx(
      'h-12 flex items-center justify-between px-4 border-b flex-shrink-0',
      isNasdrop
        ? 'bg-atlas-pink/10 border-atlas-pink/30'
        : 'bg-atlas-surface border-atlas-border'
    )}>
      {/* Left — breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-atlas-muted text-xs hidden sm:block">THE ARK</span>
        <ChevronRight size={12} className="text-atlas-muted hidden sm:block" />
        <span className={clsx(
          'text-sm font-semibold truncate',
          isNasdrop ? 'text-atlas-pink' : 'text-atlas-text'
        )}>
          {title}
        </span>
        {activeRunsCount > 0 && (
          <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-atlas-accent/20 text-atlas-accent animate-pulse">
            {activeRunsCount} running
          </span>
        )}
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Online/offline indicator */}
        <div className={clsx(
          'flex items-center gap-1 text-[10px]',
          online ? 'text-atlas-green' : 'text-atlas-gold'
        )}>
          {online
            ? <><Wifi size={11} /> <span className="hidden md:block">Supabase Live</span></>
            : <><WifiOff size={11} /> <span className="hidden md:block">Offline</span></>
          }
        </div>

        {/* Time */}
        <span className="text-[10px] text-atlas-muted font-mono hidden lg:block">
          {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>

        {/* Search */}
        <button
          onClick={() => setCommandOpen(true)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-atlas-panel border border-atlas-border text-atlas-muted text-xs hover:border-atlas-accent/40 hover:text-atlas-text transition-all"
        >
          <Search size={12} />
          <span className="hidden md:block">Search</span>
          <span className="hidden md:block text-[9px] px-1 py-0.5 rounded bg-atlas-surface border border-atlas-border font-mono">⌘K</span>
        </button>

        {/* Copilot toggle */}
        <button
          onClick={toggleCopilot}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-atlas-accent/10 border border-atlas-accent/30 text-atlas-accent text-xs hover:bg-atlas-accent/20 transition-all"
        >
          <Zap size={12} />
          <span className="hidden md:block">LUKA</span>
        </button>

        {/* Notifications */}
        <button className="relative w-7 h-7 rounded-md bg-atlas-panel border border-atlas-border flex items-center justify-center hover:border-atlas-accent/40 transition-all">
          <Bell size={13} className="text-atlas-muted" />
        </button>

        {/* Kill switch — visible to GOD tier (T7) and NASDROP users only */}
        {(subscription.tier_code === 'T7' || nasdrop.unlocked) && (
          <KillSwitchWidget variant="mini" />
        )}

        {/* Logout */}
        <button
          onClick={async () => {
            const supabase = createClient()
            await supabase.auth.signOut()
            window.location.href = '/login'
          }}
          className="w-7 h-7 rounded-md bg-atlas-panel border border-atlas-border flex items-center justify-center hover:border-red-500/40 hover:text-red-400 text-atlas-muted transition-all"
          title="Sign out"
        >
          <LogOut size={12} />
        </button>

        {/* Credits indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md bg-atlas-panel border border-atlas-border">
          <span className="text-[9px] text-atlas-muted">Credits</span>
          <span className="text-[10px] font-mono text-atlas-accent">
            {subscription.credits_limit_daily - subscription.credits_used_today}
          </span>
        </div>
      </div>
    </header>
  )
}
