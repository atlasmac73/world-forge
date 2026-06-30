'use client'

import { useArkStore, type Portal } from '@/store/useArkStore'
import {
  LayoutDashboard, Map, Crosshair, Search, Activity, MessageSquare,
  Bot, Zap, BarChart3, FlaskConical, FileText, Hammer, Film,
  Globe, BookOpen, Layers, Settings, Cpu, ChevronRight, Lock,
  Shield, Radio, Phone, DollarSign, Users, Building2, Swords,
  Brain, Sparkles, Sliders, GitBranch, Rocket, ClipboardList,
  Wrench, Gauge, History, ExternalLink, ShieldCheck
} from 'lucide-react'
import { clsx } from 'clsx'

interface NavItem {
  /** Required unless `href` is set (external full-page links don't use the
   *  SPA portal switcher, so they have no Portal id to set active). */
  id?: Portal
  label: string
  icon: React.ReactNode
  badge?: string
  minTier?: string
  section?: string
  /** External full-page route, e.g. /admin/godview. Bypasses the SPA portal
   *  switcher entirely — used for App Router pages that do server-side auth
   *  (createClient() + cookies()) and so cannot be embedded client-side. */
  href?: string
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Command',
    items: [
      { id: 'dashboard' as Portal,   label: 'Empire Dashboard',    icon: <LayoutDashboard size={15} />, badge: 'LIVE' },
      { id: 'living-graph' as Portal,label: 'Living Graph',        icon: <Zap size={15} />,             badge: 'OS' },
      { id: 'war-room' as Portal,    label: 'Investor War Room',   icon: <Swords size={15} />,          badge: '🔥' },
      { id: 'agents' as Portal,      label: 'Agent Lab',           icon: <Bot size={15} />,             badge: '255' },
      { id: 'agent-runs' as Portal,  label: 'Agent Run History',   icon: <History size={15} />,         badge: 'LIVE' },
      { id: 'godmode' as Portal,     label: 'God Mode',            icon: <Crosshair size={15} />,       minTier: 'T6', badge: 'LIVE' },
      { id: 'swarm' as Portal,       label: 'Swarm Nexus',         icon: <Zap size={15} />,             minTier: 'T3' },
      { id: 'cockpit' as Portal,     label: 'Cognitive Cockpit',   icon: <Sliders size={15} />,         minTier: 'T3' },
    ]
  },
  {
    title: 'Real Estate',
    items: [
      { id: 'deals' as Portal,       label: 'Deal Navigator',      icon: <Map size={15} />,             badge: 'D4D' },
      { id: 'd4d' as Portal,         label: 'Driving for Dollars', icon: <Map size={15} />,             badge: 'LIVE' },
      { id: 'skip-trace' as Portal,  label: 'Skip Trace',          icon: <Search size={15} />,          badge: 'SOON' },
      { id: 'ain' as Portal,         label: 'AIN Heatmap',         icon: <Activity size={15} />,        minTier: 'T2', badge: 'LIVE' },
      { id: 'scoring' as Portal,     label: 'Distress Scoring',    icon: <Gauge size={15} />,           minTier: 'T2', badge: 'LIVE' },
      { id: 'top250' as Portal,      label: 'Top 250 Matrix',      icon: <BarChart3 size={15} />,       minTier: 'T2', badge: 'LIVE' },
      { label: 'Lead Pool',          icon: <Users size={15} />,           href: '/leads',                      badge: 'LIVE' },
      { id: 'pipeline' as Portal,    label: 'Deal Pipeline',       icon: <ClipboardList size={15} />,   badge: 'LIVE' },
      { id: 'underwriting' as Portal,label: 'Underwriting / MAO',  icon: <Crosshair size={15} />,       badge: 'LIVE' },
      { id: 'rehab' as Portal,       label: 'Rehab Estimator',     icon: <Wrench size={15} />,          badge: 'LIVE' },
      { id: 'market' as Portal,      label: 'Market Intel',        icon: <BarChart3 size={15} /> },
      { id: 'loi' as Portal,         label: 'LOI Generator',       icon: <FileText size={15} />,        minTier: 'T2' },
    ]
  },
  {
    title: 'Build',
    items: [
      { id: 'contractors' as Portal, label: 'Contractors',         icon: <Hammer size={15} /> },
      { id: 'build' as Portal,       label: 'ARK Build',           icon: <Building2 size={15} /> },
      { id: 'blueprint' as Portal,   label: 'Blueprint Intel',     icon: <Crosshair size={15} />,       minTier: 'T3' },
    ]
  },
  {
    title: 'Comms & Intel',
    items: [
      { id: 'comms' as Portal,       label: 'Comms Hub',           icon: <MessageSquare size={15} />,   badge: 'SMS' },
      { id: 'signals' as Portal,     label: 'Signal Stack',        icon: <Radio size={15} />,           badge: 'LIVE' },
      { id: 'voice' as Portal,       label: 'Voice Agent',         icon: <Phone size={15} />,           minTier: 'T4' },
    ]
  },
  {
    title: 'Genesis',
    items: [
      { id: 'superllm' as Portal,    label: '🔱 SuperLLM (P15)',   icon: <Sparkles size={15} />,        badge: 'NEW' },
      { id: 'genesis' as Portal,     label: 'Genesis Engine',      icon: <FlaskConical size={15} />,    minTier: 'T4', badge: 'AI' },
      { id: 'autopoietic' as Portal, label: 'Autopoietic Console', icon: <Cpu size={15} />,             minTier: 'T6', badge: 'LIVE' },
      { id: 'orchestra' as Portal,   label: 'Atlas Orchestra',     icon: <Brain size={15} />,           minTier: 'T6' },
      { id: 'genesis-hq' as Portal,  label: 'Genesis HQ',          icon: <Rocket size={15} />,          badge: 'FOUNDER' },
    ]
  },
  {
    title: 'Empire',
    items: [
      { id: 'worldforge' as Portal,  label: 'WorldForge',          icon: <Globe size={15} />,           minTier: 'T5' },
      { id: 'transmedia' as Portal,  label: 'Transmedia / Leon',   icon: <Film size={15} />,            minTier: 'T5' },
      { id: 'akashic' as Portal,     label: 'Akashic Library',     icon: <BookOpen size={15} />,        minTier: 'T4' },
      { id: 'skills' as Portal,      label: 'Skills Matrix',       icon: <Layers size={15} /> },
      { id: 'patents' as Portal,     label: 'Patent Command',      icon: <Shield size={15} />,          minTier: 'T5' },
      { id: 'expansion' as Portal,   label: 'National Expansion',  icon: <Sparkles size={15} />,        minTier: 'T5' },
    ]
  },
  {
    title: 'System',
    items: [
      { id: 'trust' as Portal,       label: 'Trust Dashboard',     icon: <Shield size={15} />,          badge: '◈' },
      { id: 'roadmap' as Portal,     label: 'Phase Roadmap',       icon: <GitBranch size={15} /> },
      { id: 'pay' as Portal,         label: 'Atlas Pay',           icon: <DollarSign size={15} /> },
      { id: 'community' as Portal,   label: 'Community Nexus',     icon: <Users size={15} /> },
      { id: 'vault' as Portal,       label: 'ARK Vault',           icon: <Lock size={15} />,            minTier: 'T5' },
      { id: 'franchise' as Portal,   label: 'Franchise Studio',    icon: <Film size={15} />,            minTier: 'T6' },
    ]
  },
  {
    // Two parallel admin systems exist (see 06_AUDIT/D §3, J §1) — AdminPortal
    // (invites/feedback/flags/audit, lives inside this SPA shell) and the newer
    // /admin/* page cluster (GodView/Command Center/Launch Readiness/etc, full
    // server-rendered pages with their own auth — cannot be embedded client-side).
    // Both get an entry point rather than picking a winner.
    title: 'Admin',
    items: [
      { id: 'admin' as Portal,       label: 'Admin Panel',         icon: <Shield size={15} />,          badge: 'OWNER' },
      {
        label: 'Founder Console',
        icon: <ExternalLink size={15} />,
        badge: 'OWNER',
        href: '/admin/godview',
      },
      {
        label: 'Research Arena',
        icon: <ExternalLink size={15} />,
        badge: 'OWNER',
        href: '/admin/research-arena',
      },
      {
        label: 'Site Capture',
        icon: <ExternalLink size={15} />,
        badge: 'OWNER',
        href: '/admin/site-capture',
      },
      {
        label: 'Security & Audit',
        icon: <ShieldCheck size={15} />,
        badge: 'OWNER',
        href: '/admin/audit-logs',
      },
    ]
  },
]

const TIER_ORDER: Record<string, number> = {
  T1: 1, T2: 2, T3: 3, T4: 4, T5: 5, T6: 6, T7: 7
}

export function Sidebar() {
  const { activePortal, setActivePortal, subscription, nasdrop } = useArkStore()

  const userTierLevel = TIER_ORDER[subscription.tier_code] ?? 1
  const creditPct = (subscription.credits_used_today / subscription.credits_limit_daily) * 100

  function isLocked(minTier?: string) {
    if (!minTier) return false
    return (TIER_ORDER[minTier] ?? 1) > userTierLevel
  }

  return (
    <aside className="w-56 flex flex-col bg-atlas-surface border-r border-atlas-border h-screen shrink-0 overflow-hidden">
      {/* Logo */}
      <div className="p-4 border-b border-atlas-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-atlas-accent to-atlas-purple flex items-center justify-center">
            <Zap size={15} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-tight tracking-wide">◈ THE ARK</div>
            <div className="text-[9px] text-atlas-muted font-mono tracking-widest">ATLAS GENESIS v65</div>
          </div>
        </div>
        {/* Live status */}
        <div className="mt-2 flex items-center gap-1.5">
          <span className="status-dot status-online" />
          <span className="text-[10px] text-atlas-green">
            Supabase ACTIVE · {nasdrop.unlocked ? '🔱 NASDROP' : `${subscription.tier_code}`}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 overflow-y-auto space-y-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <div className="text-[9px] font-semibold text-atlas-muted tracking-[2px] uppercase px-2 py-1">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const locked = isLocked(item.minTier)
                const active = !item.href && activePortal === item.id

                // External full-page links (e.g. /admin/godview) exit the SPA
                // shell entirely — rendered as a real <a>, not the portal switcher.
                if (item.href) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all duration-100 text-left text-atlas-muted hover:bg-white/5 hover:text-atlas-text"
                    >
                      <span>{item.icon}</span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-atlas-accent/15 text-atlas-accent flex-shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </a>
                  )
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => !locked && item.id && setActivePortal(item.id)}
                    disabled={locked}
                    title={locked ? `Requires ${item.minTier}` : item.label}
                    className={clsx(
                      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all duration-100 text-left',
                      active
                        ? 'bg-atlas-accent/10 text-atlas-accent border border-atlas-accent/30'
                        : locked
                          ? 'text-atlas-muted/40 cursor-not-allowed'
                          : 'text-atlas-muted hover:bg-white/5 hover:text-atlas-text'
                    )}
                  >
                    <span className={active ? 'text-atlas-accent' : locked ? 'text-atlas-muted/30' : ''}>
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {locked && <Lock size={10} className="text-atlas-muted/30 flex-shrink-0" />}
                    {!locked && item.badge && (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-atlas-accent/15 text-atlas-accent flex-shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* NASDROP hint (T7 only, subtle) */}
        {subscription.tier_code === 'T7' && !nasdrop.unlocked && (
          <div className="px-2 py-1">
            <div className="text-[9px] text-atlas-muted/40 italic">
              Type the sequence to unlock...
            </div>
          </div>
        )}
      </nav>

      {/* Credit bar + user */}
      <div className="p-3 border-t border-atlas-border flex-shrink-0">
        <div className="bg-atlas-panel rounded-lg p-2.5 space-y-1.5">
          <div className="flex justify-between text-[10px]">
            <span className="text-atlas-muted">Credits</span>
            <span className="text-atlas-accent font-mono">
              {subscription.credits_used_today}/{subscription.credits_limit_daily}
            </span>
          </div>
          <div className="progress-track">
            <div
              className={clsx(
                'progress-fill',
                creditPct > 90 ? 'bg-atlas-coral' : creditPct > 70 ? 'bg-atlas-gold' : 'bg-atlas-accent'
              )}
              style={{ width: `${Math.min(creditPct, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className={clsx('text-[8px] font-bold px-1.5 py-0.5 rounded uppercase',
              `tier-${subscription.tier_code}`
            )}>
              {subscription.tier_code}
            </span>
            <Settings
              size={12}
              className="text-atlas-muted hover:text-atlas-text cursor-pointer transition-colors"
              onClick={() => setActivePortal('vault')}
            />
          </div>
        </div>
        {/* Isaac */}
        <div className="mt-2 flex items-center gap-2 px-1">
          <div className="w-6 h-6 rounded-full bg-atlas-purple/20 flex items-center justify-center text-[9px] font-bold text-atlas-purple">
            IB
          </div>
          <div>
            <div className="text-[10px] font-semibold text-atlas-text">Isaac B. Burdette</div>
            <div className="text-[8px] text-atlas-muted">Founder · Sole Inventor</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
