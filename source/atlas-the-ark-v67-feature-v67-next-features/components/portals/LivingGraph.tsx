'use client'

import { useState, useRef } from 'react'
import { useArkStore } from '@/store/useArkStore'
import { Search, Zap, Bot, GitBranch, Database, Link2, FileText, Globe, Shield, TrendingUp, Loader2, ChevronRight, X } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import Anthropic from '@anthropic-ai/sdk'

interface GraphNode {
  id: string
  label: string
  type: 'portal' | 'agent' | 'workflow' | 'connector' | 'prompt' | 'model' | 'datasource' | 'risk' | 'opportunity' | 'action'
  description: string
  creditCost?: number
  minTier?: string
  route?: string
}

const NODE_GROUP_CONFIG = {
  portal:      { label: 'Portals',       color: '#63b3ed', icon: <Globe size={10} /> },
  agent:       { label: 'Agents',        color: '#68d391', icon: <Bot size={10} /> },
  workflow:    { label: 'Workflows',     color: '#f6ad55', icon: <GitBranch size={10} /> },
  connector:   { label: 'Connectors',    color: '#b794f4', icon: <Link2 size={10} /> },
  prompt:      { label: 'Prompt Packs',  color: '#4fd1c5', icon: <FileText size={10} /> },
  model:       { label: 'AI Models',     color: '#fc8181', icon: <Zap size={10} /> },
  datasource:  { label: 'Data Sources',  color: '#f687b3', icon: <Database size={10} /> },
  risk:        { label: 'Risks',         color: '#fc8181', icon: <Shield size={10} /> },
  opportunity: { label: 'Opportunities', color: '#68d391', icon: <TrendingUp size={10} /> },
  action:      { label: 'Next Actions',  color: '#f6ad55', icon: <ChevronRight size={10} /> },
}

// Option cards A-G
const OPTION_CARDS = [
  { id: 'A', label: 'Safest',          desc: 'High confidence, proven approach',         color: '#68d391' },
  { id: 'B', label: 'Balanced',        desc: 'Best risk/reward tradeoff',                color: '#63b3ed' },
  { id: 'C', label: 'Aggressive',      desc: 'Higher upside, higher risk',               color: '#f6ad55' },
  { id: 'D', label: 'Automation',      desc: 'Let agents and workflows handle it',       color: '#b794f4' },
  { id: 'E', label: 'Innovation',      desc: 'New idea or product opportunity',          color: '#4fd1c5' },
  { id: 'F', label: 'Hidden Opp',      desc: 'From emergence layer — not obvious',      color: '#f687b3' },
  { id: 'G', label: 'God Mode',        desc: 'Maximum upside, maximum complexity',       color: '#fc8181' },
]

const EXAMPLE_SEEDS = [
  'property', 'skip trace', 'contract', 'foreclosure', 'renovation',
  'Leon Therano', 'OMNIFOLD', 'patent', 'genesis cycle', 'Kanawha County',
]

export function LivingGraphPortal() {
  const { subscription, setActivePortal } = useArkStore()
  const [seedInput, setSeedInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function expandGraph(seed?: string) {
    const input = seed ?? seedInput.trim()
    if (!input) { toast.error('Enter a word, address, or idea'); return }
    setSeedInput(input)
    setLoading(true)
    setNodes([])
    setSelectedNode(null)
    setSelectedOption(null)

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Expand the concept "${input}" into exactly 40 Atlas nodes grouped into these types: portal, agent, workflow, connector, prompt, model, datasource, risk, opportunity, action. For each node return: id (unique slug), label (short name), type (one of the 10 types), description (one sentence), creditCost (integer 0-50), minTier (T1-T7).

Return ONLY a valid JSON array. No markdown. No explanation. Example format:
[{"id":"d4d-map","label":"D4D Map","type":"portal","description":"GPS-driven property spotting portal","creditCost":0,"minTier":"T1"}]

Make them specific and actionable for the Atlas Genesis Matrix real estate / AI / transmedia platform. Include WV market context where relevant.` }],
          systemOverride: `You are the ATLAS Living Graph Expansion Engine. Your job is to expand any concept into actionable Atlas intelligence nodes. Return ONLY a JSON array, never markdown.`
        }),
      })

      if (!res.ok || !res.body) throw new Error('Stream failed')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let raw = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        raw += decoder.decode(value, { stream: true })
      }

      // Extract JSON array from stream
      const match = raw.match(/\[[\s\S]*\]/)
      if (!match) throw new Error('No valid nodes returned')
      const parsed: GraphNode[] = JSON.parse(match[0])
      setNodes(parsed)
      toast.success(`${parsed.length} nodes expanded from "${input}"`)
    } catch (err) {
      // Fallback: return static nodes if API fails
      const fallback = getStaticNodes(input)
      setNodes(fallback)
      if (fallback.length === 0) toast.error('Expansion failed — check API key')
    } finally {
      setLoading(false)
    }
  }

  function getStaticNodes(seed: string): GraphNode[] {
    const lower = seed.toLowerCase()
    if (lower.includes('property') || lower.includes('real estate') || lower.includes('deal')) {
      return [
        { id: 'p1', label: 'Deal Navigator', type: 'portal', description: 'Run full 3-agent dossier pipeline', creditCost: 25, minTier: 'T1' },
        { id: 'p2', label: 'A12-SPECTER', type: 'agent', description: 'Skip trace + owner discovery', creditCost: 10, minTier: 'T2' },
        { id: 'p3', label: 'ARV Calculator', type: 'workflow', description: 'MAO formula: (ARV×0.70) − Repairs', creditCost: 5, minTier: 'T1' },
        { id: 'p4', label: 'County Tax Records', type: 'datasource', description: 'WV 55-county delinquency data', creditCost: 0, minTier: 'T1' },
        { id: 'p5', label: 'A15-OMEN', type: 'agent', description: '8-factor distress scoring engine', creditCost: 8, minTier: 'T1' },
        { id: 'p6', label: 'LOI Generator', type: 'workflow', description: 'WV Letter of Intent templates', creditCost: 12, minTier: 'T2' },
        { id: 'p7', label: 'Investor War Room', type: 'portal', description: 'Top-250 distress matrix', creditCost: 0, minTier: 'T2' },
        { id: 'p8', label: 'Title Risk', type: 'risk', description: 'Liens, encumbrances, clouded title', creditCost: 0, minTier: 'T1' },
        { id: 'p9', label: 'Cash Flow Opportunity', type: 'opportunity', description: 'Rental income from distressed purchase', creditCost: 0, minTier: 'T1' },
        { id: 'p10', label: 'Run Dossier Now', type: 'action', description: 'Start A12→A15→A06 pipeline', creditCost: 25, minTier: 'T1' },
      ]
    }
    return []
  }

  const grouped = nodes.reduce<Record<string, GraphNode[]>>((acc, node) => {
    if (!acc[node.type]) acc[node.type] = []
    acc[node.type].push(node)
    return acc
  }, {})

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-sm font-bold text-atlas-accent flex items-center gap-2">
          <Zap size={14} /> ATLAS Living Graph — Spider Web Mind Map OS
        </h1>
        <p className="text-[10px] text-atlas-muted mt-0.5">
          Type any word, address, file, idea, or command → expand to 50 nodes → click to act · 10 node groups · 7 option cards
        </p>
      </div>

      {/* Seed input */}
      <div className="atlas-panel rounded-xl p-4">
        <div className="flex gap-2 mb-3">
          <input
            ref={inputRef}
            value={seedInput}
            onChange={(e) => setSeedInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && expandGraph()}
            placeholder="Enter any concept: property · patent · foreclosure · Leon Therano · genesis cycle..."
            className="flex-1 bg-atlas-surface border border-atlas-border rounded-lg px-3 py-2.5 text-sm text-atlas-text placeholder-atlas-muted"
          />
          <button
            onClick={() => expandGraph()}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-atlas-accent/15 border border-atlas-accent/40 text-atlas-accent hover:bg-atlas-accent/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <><Zap size={14} /> Expand</>}
          </button>
        </div>
        {/* Example seeds */}
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_SEEDS.map((s) => (
            <button
              key={s}
              onClick={() => expandGraph(s)}
              className="text-[10px] px-2 py-1 rounded border border-atlas-border text-atlas-muted hover:text-atlas-accent hover:border-atlas-accent/30 transition-all bg-atlas-surface"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Node graph */}
      {nodes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Node groups */}
          <div className="lg:col-span-2 space-y-3">
            {Object.entries(grouped).map(([type, typeNodes]) => {
              const config = NODE_GROUP_CONFIG[type as keyof typeof NODE_GROUP_CONFIG]
              if (!config) return null
              return (
                <div key={type} className="atlas-panel rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ color: config.color }}>{config.icon}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: config.color }}>
                      {config.label} ({typeNodes.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {typeNodes.map((node) => (
                      <button
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={clsx(
                          'px-2.5 py-1.5 rounded-lg text-xs border transition-all text-left',
                          selectedNode?.id === node.id
                            ? 'text-atlas-text'
                            : 'border-atlas-border bg-atlas-surface text-atlas-muted hover:text-atlas-text hover:border-opacity-60'
                        )}
                        style={selectedNode?.id === node.id ? {
                          background: config.color + '15',
                          borderColor: config.color + '50',
                          color: config.color
                        } : undefined}
                      >
                        {node.label}
                        {node.creditCost && node.creditCost > 0 && (
                          <span className="ml-1 text-[9px] opacity-60">{node.creditCost}cr</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right panel: selected node + option cards */}
          <div className="space-y-3">
            {selectedNode ? (
              <>
                {/* Node detail */}
                <div className="atlas-panel rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-xs font-bold text-atlas-text">{selectedNode.label}</div>
                      <div className="text-[9px] uppercase text-atlas-muted mt-0.5"
                        style={{ color: NODE_GROUP_CONFIG[selectedNode.type]?.color }}>
                        {selectedNode.type}
                      </div>
                    </div>
                    <button onClick={() => setSelectedNode(null)}>
                      <X size={12} className="text-atlas-muted hover:text-atlas-text" />
                    </button>
                  </div>
                  <p className="text-xs text-atlas-muted leading-relaxed mb-3">{selectedNode.description}</p>
                  <div className="flex items-center gap-2 text-[9px] text-atlas-muted">
                    {selectedNode.creditCost !== undefined && (
                      <span className="px-1.5 py-0.5 rounded bg-atlas-panel border border-atlas-border">
                        {selectedNode.creditCost} credits
                      </span>
                    )}
                    {selectedNode.minTier && (
                      <span className={`px-1.5 py-0.5 rounded tier-${selectedNode.minTier}`}>
                        {selectedNode.minTier}+
                      </span>
                    )}
                  </div>
                </div>

                {/* 7 Option Cards */}
                <div className="atlas-panel rounded-xl p-3">
                  <div className="text-[9px] font-bold text-atlas-muted uppercase tracking-widest mb-2">
                    Atlas Suggests — Choose Your Approach
                  </div>
                  <div className="space-y-1.5">
                    {OPTION_CARDS.map((card) => (
                      <button
                        key={card.id}
                        onClick={() => {
                          setSelectedOption(card.id)
                          toast.success(`Option ${card.id}: ${card.label} selected`)
                        }}
                        className={clsx(
                          'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs border transition-all text-left',
                          selectedOption === card.id
                            ? 'text-atlas-text'
                            : 'border-atlas-border bg-atlas-surface text-atlas-muted hover:border-opacity-60 hover:text-atlas-text'
                        )}
                        style={selectedOption === card.id ? {
                          background: card.color + '15',
                          borderColor: card.color + '50',
                        } : undefined}
                      >
                        <span className="text-[9px] font-bold w-4" style={{ color: card.color }}>{card.id}</span>
                        <span className="font-semibold" style={{ color: card.color }}>{card.label}</span>
                        <span className="text-[10px] text-atlas-muted flex-1">{card.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="atlas-panel rounded-xl p-4 text-center">
                <Zap size={20} className="text-atlas-muted mx-auto mb-2" />
                <div className="text-xs text-atlas-muted">
                  Click any node to see details and 7 option cards (A–G)
                </div>
                <div className="mt-3 text-[9px] text-atlas-muted">
                  The Atlas Loop: Observe → Understand → Connect → Remember → Discover → Recommend → Execute → Learn → Repeat
                </div>
              </div>
            )}

            {/* Node stats */}
            {nodes.length > 0 && (
              <div className="atlas-panel rounded-xl p-3">
                <div className="text-[9px] text-atlas-muted uppercase tracking-widest mb-2">Graph Stats</div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(grouped).map(([type, n]) => (
                    <div key={type} className="flex items-center justify-between text-[10px]">
                      <span className="text-atlas-muted capitalize">{type}</span>
                      <span style={{ color: NODE_GROUP_CONFIG[type as keyof typeof NODE_GROUP_CONFIG]?.color ?? '#fff' }}>
                        {n.length}
                      </span>
                    </div>
                  ))}
                  <div className="col-span-2 pt-1 border-t border-atlas-border flex justify-between text-[10px]">
                    <span className="text-atlas-muted">Total nodes</span>
                    <span className="text-atlas-accent font-bold">{nodes.length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {nodes.length === 0 && !loading && (
        <div className="atlas-panel rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">◈</div>
          <div className="text-sm font-semibold text-atlas-text mb-2">The ATLAS Living Graph</div>
          <p className="text-xs text-atlas-muted max-w-md mx-auto leading-relaxed mb-4">
            Type any word, address, or idea above. ATLAS expands it into ~50 nodes across portals, agents, workflows, connectors, prompt packs, models, data sources, risks, opportunities, and next actions.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {['real estate', 'patent', 'Leon Therano', 'foreclosure'].map(s => (
              <button key={s} onClick={() => expandGraph(s)}
                className="text-xs px-3 py-1.5 rounded-lg border border-atlas-accent/30 text-atlas-accent hover:bg-atlas-accent/10 transition-all">
                Try: {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
