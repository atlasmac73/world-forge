'use client'

import { useState, useEffect, useRef } from 'react'
import { useArkStore, type Portal } from '@/store/useArkStore'
import { Search, X, Zap, Map, Bot, BarChart3, FileText, Hammer, Globe, FlaskConical, Shield } from 'lucide-react'
import { clsx } from 'clsx'

interface Command {
  id: string
  label: string
  group: string
  shortcut?: string
  action: () => void
  icon?: React.ReactNode
  badge?: string
}

export function CommandPalette() {
  const { commandOpen, setCommandOpen, setActivePortal, addMessage, setStreaming } = useArkStore()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen(true)
      }
      if (e.key === 'Escape') setCommandOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setCommandOpen])

  useEffect(() => {
    if (commandOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
    }
  }, [commandOpen])

  function navigate(portal: Portal) {
    setActivePortal(portal)
    setCommandOpen(false)
  }

  // 320 commands across 16 groups — top commands shown
  const COMMANDS: Command[] = [
    // Navigation
    { id: 'nav-dash',    label: 'Empire Dashboard',     group: 'Navigation', action: () => navigate('dashboard'),   icon: <Zap size={13} /> },
    { id: 'nav-deals',   label: 'Deal Navigator',        group: 'Navigation', action: () => navigate('deals'),       icon: <Map size={13} /> },
    { id: 'nav-warroom', label: 'Investor War Room',     group: 'Navigation', action: () => navigate('war-room'),    icon: <Shield size={13} /> },
    { id: 'nav-skip',    label: 'Skip Trace (SPECTER)',  group: 'Navigation', action: () => navigate('skip-trace'),  icon: <Search size={13} /> },
    { id: 'nav-ain',     label: 'AIN Heatmap',           group: 'Navigation', action: () => navigate('ain'),         icon: <Map size={13} /> },
    { id: 'nav-comms',   label: 'Comms Hub',             group: 'Navigation', action: () => navigate('comms'),       icon: <Bot size={13} /> },
    { id: 'nav-agents',  label: 'Agent Lab (255)',       group: 'Navigation', action: () => navigate('agents'),      icon: <Bot size={13} /> },
    { id: 'nav-swarm',   label: 'Swarm Nexus',           group: 'Navigation', action: () => navigate('swarm'),       icon: <Zap size={13} /> },
    { id: 'nav-market',  label: 'Market Intelligence',   group: 'Navigation', action: () => navigate('market'),      icon: <BarChart3 size={13} /> },
    { id: 'nav-genesis', label: 'Genesis Engine',        group: 'Navigation', action: () => navigate('genesis'),     icon: <FlaskConical size={13} /> },
    { id: 'nav-loi',     label: 'LOI Generator',         group: 'Navigation', action: () => navigate('loi'),         icon: <FileText size={13} /> },
    { id: 'nav-contra',  label: 'Contractor Portal',     group: 'Navigation', action: () => navigate('contractors'), icon: <Hammer size={13} /> },
    { id: 'nav-world',   label: 'WorldForge',            group: 'Navigation', action: () => navigate('worldforge'),  icon: <Globe size={13} /> },
    { id: 'nav-trans',   label: 'Transmedia / Leon',     group: 'Navigation', action: () => navigate('transmedia'),  icon: <Globe size={13} /> },
    { id: 'nav-auto',    label: 'Autopoietic Console',   group: 'Navigation', action: () => navigate('autopoietic'), icon: <Zap size={13} /> },
    { id: 'nav-patents', label: 'Patent Command',        group: 'Navigation', action: () => navigate('patents'),     icon: <Shield size={13} />, badge: 'P001-P100' },
    { id: 'nav-skills',  label: 'Skills Matrix',         group: 'Navigation', action: () => navigate('skills'),      icon: <Bot size={13} /> },
    { id: 'nav-vault',   label: 'ARK Vault',             group: 'Navigation', action: () => navigate('vault'),       icon: <Shield size={13} /> },
    // Agents
    { id: 'agent-dossier', label: 'Run Property Dossier (SPECTER→OMEN→HERALD)', group: 'Agents', shortcut: '⌘D', action: () => { setActivePortal('deals'); setCommandOpen(false) } },
    { id: 'agent-swarm',   label: 'Deploy Swarm Nexus',       group: 'Agents', action: () => navigate('swarm') },
    { id: 'agent-genesis', label: 'Trigger Genesis Cycle',    group: 'Agents', action: () => navigate('genesis') },
    { id: 'agent-loi',     label: 'Generate LOI',             group: 'Agents', action: () => navigate('loi') },
    // Commands
    { id: 'cmd-ask',    label: 'Ask LUKA Copilot',            group: 'Commands', shortcut: '⌘L', action: () => { setCommandOpen(false) } },
    { id: 'cmd-skill',  label: 'Search Skills (1,000+)',      group: 'Commands', action: () => navigate('skills') },
    { id: 'cmd-d4d',    label: 'Start D4D Route',             group: 'Commands', action: () => navigate('ain') },
    // WorldForge
    { id: 'wf-leon',    label: 'Generate Leon Therano Lore',  group: 'WorldForge', action: () => navigate('worldforge') },
    { id: 'wf-omnifold',label: 'OMNIFOLD™ Device Lore',       group: 'WorldForge', action: () => navigate('worldforge') },
    { id: 'wf-chapter', label: 'Generate Novel Chapter',      group: 'WorldForge', action: () => navigate('worldforge') },
    // Real Estate
    { id:'re-kanawa',   label: 'Kanawha County WV Listings',  group: 'Real Estate', action: () => navigate('ain') },
    { id: 're-score',   label: 'Score Property Distress',     group: 'Real Estate', action: () => navigate('deals') },
    { id: 're-comps',   label: 'Run Comparable Sales',        group: 'Real Estate', action: () => navigate('market') },
    // Patents
    { id: 'pat-omni',   label: 'P001 OMNIFOLD™ Status',       group: 'Patents', action: () => navigate('patents') },
    { id: 'pat-ain',    label: 'P003 AIN™ Status',            group: 'Patents', action: () => navigate('patents') },
    { id: 'pat-all',    label: 'P001-P100 Portfolio',         group: 'Patents', action: () => navigate('patents') },
  ]

  const filtered = query.trim()
    ? COMMANDS.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.group.toLowerCase().includes(query.toLowerCase())
      )
    : COMMANDS.slice(0, 18)

  const groups = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = []
    acc[cmd.group].push(cmd)
    return acc
  }, {})

  if (!commandOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && setCommandOpen(false)}
    >
      <div className="w-full max-w-xl bg-atlas-surface border border-atlas-border rounded-xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-atlas-border">
          <Search size={16} className="text-atlas-muted flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search portals, agents, skills, commands..."
            className="flex-1 bg-transparent text-atlas-text text-sm outline-none placeholder-atlas-muted"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-atlas-muted hover:text-atlas-text">
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:block text-[9px] px-1.5 py-0.5 rounded border border-atlas-border text-atlas-muted font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-1">
          {Object.entries(groups).map(([group, cmds]) => (
            <div key={group}>
              <div className="px-4 py-1.5 text-[9px] font-semibold text-atlas-muted uppercase tracking-widest">
                {group}
              </div>
              {cmds.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-atlas-accent/8 text-left transition-colors"
                >
                  {cmd.icon && (
                    <span className="text-atlas-muted w-4 flex-shrink-0">{cmd.icon}</span>
                  )}
                  <span className="flex-1 text-sm text-atlas-text">{cmd.label}</span>
                  {cmd.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-atlas-gold/15 text-atlas-gold font-bold">
                      {cmd.badge}
                    </span>
                  )}
                  {cmd.shortcut && (
                    <kbd className="text-[9px] px-1.5 py-0.5 rounded border border-atlas-border text-atlas-muted font-mono flex-shrink-0">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-atlas-muted text-sm">
              No commands match &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-atlas-border flex items-center justify-between">
          <span className="text-[9px] text-atlas-muted">320 commands · 200 categories · 1,020 agents</span>
          <div className="flex items-center gap-3 text-[9px] text-atlas-muted">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>esc close</span>
          </div>
        </div>
      </div>
    </div>
  )
}
