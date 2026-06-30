'use client'

/**
 * ATLAS v22 — Genesis HQ Command Center
 * Founder's product roadmap / kanban / idea-library / mind-map / patent-moat
 * tracker. Unrelated to the existing Genesis Cycle self-improvement engine
 * (GodMode / lib/genesis/cycle.ts) — namespaced "genesis-hq" throughout to
 * avoid any collision.
 */

import { useState, useEffect, useCallback } from 'react'
import { Rocket, Map, Columns3, Brain, Lightbulb, Shield, Settings2 } from 'lucide-react'
import { clsx } from 'clsx'
import type { GenesisHqOverview, GenesisHqAdminStatus, GenesisHqIdeaCategory } from '@/lib/genesis-hq/types'
import { GenesisHqStats } from './GenesisHqStats'
import { RoadmapView } from './RoadmapView'
import { KanbanBoard } from './KanbanBoard'
import { IdeaLibraryView } from './IdeaLibraryView'
import { MindMapView } from './MindMapView'
import { PatentMoatView } from './PatentMoatView'
import { AdminGenesisHqPanel } from './AdminGenesisHqPanel'

type GenesisHqTab = 'roadmap' | 'kanban' | 'mindmap' | 'ideas' | 'moat' | 'admin'

const TABS: { id: GenesisHqTab; label: string; icon: React.ReactNode }[] = [
  { id: 'roadmap', label: 'Roadmap', icon: <Map size={14} /> },
  { id: 'kanban', label: 'Kanban', icon: <Columns3 size={14} /> },
  { id: 'mindmap', label: 'Mind Map', icon: <Brain size={14} /> },
  { id: 'ideas', label: '100 Ideas', icon: <Lightbulb size={14} /> },
  { id: 'moat', label: 'Patent Moat', icon: <Shield size={14} /> },
  { id: 'admin', label: 'Admin', icon: <Settings2 size={14} /> },
]

export function GenesisHqCommandCenter() {
  const [activeTab, setActiveTab] = useState<GenesisHqTab>('roadmap')
  const [overview, setOverview] = useState<GenesisHqOverview | null>(null)
  const [status, setStatus] = useState<GenesisHqAdminStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<GenesisHqIdeaCategory | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [ideasResult, setIdeasResult] = useState<{ ideas: GenesisHqOverview['ideas']; total: number }>({ ideas: [], total: 0 })

  const loadOverview = useCallback(async () => {
    const [overviewRes, statusRes] = await Promise.all([
      fetch('/api/genesis-hq'),
      fetch('/api/admin/genesis-hq/status'),
    ])
    if (overviewRes.ok) setOverview(await overviewRes.json())
    if (statusRes.ok) setStatus(await statusRes.json())
    setLoading(false)
  }, [])

  useEffect(() => { loadOverview() }, [loadOverview])

  useEffect(() => {
    if (activeTab !== 'ideas') return
    const params = new URLSearchParams()
    if (category !== 'ALL') params.set('category', category)
    if (search) params.set('q', search)
    params.set('limit', '40')
    fetch(`/api/genesis-hq/ideas?${params}`)
      .then((r) => r.json())
      .then((data) => setIdeasResult({ ideas: data.ideas ?? [], total: data.total ?? 0 }))
  }, [activeTab, category, search])

  const handleToggleTask = useCallback(async (taskId: string, done: boolean) => {
    const res = await fetch(`/api/genesis-hq/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done }),
    })
    if (res.ok) loadOverview()
  }, [loadOverview])

  const handleMoveCard = useCallback(async (cardId: string, columnKey: string) => {
    const res = await fetch(`/api/genesis-hq/kanban/cards/${cardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column_key: columnKey }),
    })
    if (res.ok) loadOverview()
  }, [loadOverview])

  const isOwner = status?.isOwner ?? false

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-600">
        <div className="font-mono text-sm animate-pulse">Loading Genesis HQ...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col space-y-4 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-atlas-accent/30 to-atlas-purple/30 border border-atlas-accent/40 flex items-center justify-center">
            <Rocket size={20} className="text-atlas-accent" />
          </div>
          <div>
            <div className="text-xl font-bold text-atlas-accent font-mono tracking-wider">GENESIS HQ</div>
            <div className="text-[10px] text-slate-500 font-mono">Product Command Center — Roadmap · Kanban · Ideas · Moat</div>
          </div>
        </div>
        {!isOwner && (
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-white/5 text-slate-500 border border-white/10">
            VIEW ONLY
          </span>
        )}
      </div>

      {overview && <GenesisHqStats stats={overview.stats} />}

      <div className="flex gap-1 border-b border-white/10 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs font-mono transition-all',
              activeTab === tab.id ? 'text-atlas-accent border-b-2 border-atlas-accent' : 'text-slate-500 hover:text-slate-300'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'roadmap' && overview && (
          <RoadmapView phases={overview.phases} isOwner={isOwner} onToggleTask={handleToggleTask} />
        )}
        {activeTab === 'kanban' && overview && (
          <KanbanBoard columns={overview.kanban} isOwner={isOwner} onMoveCard={handleMoveCard} />
        )}
        {activeTab === 'mindmap' && overview && <MindMapView nodes={overview.mindmap} />}
        {activeTab === 'ideas' && (
          <IdeaLibraryView
            ideas={ideasResult.ideas}
            total={ideasResult.total}
            category={category}
            setCategory={setCategory}
            search={search}
            setSearch={setSearch}
          />
        )}
        {activeTab === 'moat' && overview && <PatentMoatView sections={overview.moat} />}
        {activeTab === 'admin' && <AdminGenesisHqPanel status={status} onRefresh={loadOverview} />}
      </div>
    </div>
  )
}
