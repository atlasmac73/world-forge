'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  MessageSquare, LayoutGrid, Map, Plane, Bot, Zap, Film, Shield,
  TrendingUp, Search, Send, Loader2, ChevronDown, X, Sparkles,
  Lightbulb, RotateCcw
} from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { KillSwitchWidget } from '@/components/KillSwitchWidget'

// ─── Types ────────────────────────────────────────────────────────────────

type Mode =
  | 'CHAT' | 'KANBAN' | 'MINDMAP' | 'AUTOPILOT'
  | 'SWARM' | 'GENESIS' | 'TRANSMEDIA' | 'PATENT'
  | 'INVEST' | 'SKIPTRACE'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  mode: Mode
  timestamp: Date
}

interface ModeConfig {
  id: Mode
  icon: React.ReactNode
  label: string
  color: string
  description: string
  placeholder: string
}

// ─── Mode Config ──────────────────────────────────────────────────────────

const MODES: ModeConfig[] = [
  {
    id: 'CHAT',
    icon: <MessageSquare size={13} />,
    label: 'Chat',
    color: '#fbbf24',
    description: 'Direct conversation with portal context',
    placeholder: 'Ask anything about your deals, properties, or agents...',
  },
  {
    id: 'KANBAN',
    icon: <LayoutGrid size={13} />,
    label: 'Kanban',
    color: '#60a5fa',
    description: 'Generate structured task boards',
    placeholder: 'Describe a project and I\'ll generate a Kanban board...',
  },
  {
    id: 'MINDMAP',
    icon: <Map size={13} />,
    label: 'Mind Map',
    color: '#34d399',
    description: 'Visualize ideas as connected nodes',
    placeholder: 'Describe a topic to map out...',
  },
  {
    id: 'AUTOPILOT',
    icon: <Plane size={13} />,
    label: 'Autopilot',
    color: '#818cf8',
    description: 'Hands-off agent execution mode',
    placeholder: 'Describe your objective. I\'ll plan and execute...',
  },
  {
    id: 'SWARM',
    icon: <Bot size={13} />,
    label: 'Swarm',
    color: '#f472b6',
    description: 'Multi-agent parallel dispatch',
    placeholder: 'Describe a task for multi-agent execution...',
  },
  {
    id: 'GENESIS',
    icon: <Zap size={13} />,
    label: 'Genesis',
    color: '#fb923c',
    description: 'Trigger and monitor Genesis Cycle',
    placeholder: 'Trigger a Genesis Cycle or ask about system improvements...',
  },
  {
    id: 'TRANSMEDIA',
    icon: <Film size={13} />,
    label: 'Transmedia',
    color: '#a78bfa',
    description: 'ATLAS Chronicles universe building',
    placeholder: 'Build the ATLAS Chronicles storyworld...',
  },
  {
    id: 'PATENT',
    icon: <Shield size={13} />,
    label: 'Patent',
    color: '#94a3b8',
    description: 'IP documentation and patent drafting',
    placeholder: 'Describe an invention for patent documentation...',
  },
  {
    id: 'INVEST',
    icon: <TrendingUp size={13} />,
    label: 'Invest',
    color: '#34d399',
    description: 'Real estate investment analysis',
    placeholder: 'Enter a property or deal for investment analysis...',
  },
  {
    id: 'SKIPTRACE',
    icon: <Search size={13} />,
    label: 'Skip Trace',
    color: '#22d3ee',
    description: 'Owner contact enrichment (A12-SPECTER)',
    placeholder: 'Enter a property address or owner name to skip trace...',
  },
]

// ─── Component ───────────────────────────────────────────────────────────

interface SuperLLMProps {
  activePortal?: string
  isAdmin?: boolean
}

export function SuperLLM({ activePortal = 'superllm', isAdmin = false }: SuperLLMProps) {
  const [mode, setMode] = useState<Mode>('CHAT')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [showIdeas, setShowIdeas] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const currentMode = MODES.find(m => m.id === mode) ?? MODES[0]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || streaming) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      mode,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setStreaming(true)

    // Build history (last 10 exchanges)
    const history = messages.slice(-20).map(m => ({
      role: m.role,
      content: m.content,
    }))

    const assistantId = crypto.randomUUID()
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      mode,
      timestamp: new Date(),
    }])

    abortRef.current = new AbortController()

    try {
      const res = await fetch(`/api/portals/${activePortal}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, mode, history }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const err = await res.json()
        if (res.status === 503) {
          toast.error('⛔ Kill switch is armed — AI execution halted')
        } else if (res.status === 402) {
          toast.error('Monthly AI budget exceeded — upgrade your tier')
        } else {
          toast.error(err.error || 'Chat failed')
        }
        setMessages(prev => prev.filter(m => m.id !== assistantId))
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.text) {
              fullText += data.text
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: fullText } : m
              ))
            }
            if (data.error) {
              toast.error(data.error)
            }
          } catch {
            // Ignore parse errors on incomplete chunks
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error('Connection lost')
        setMessages(prev => prev.filter(m => m.id !== assistantId))
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }, [input, streaming, mode, activePortal, messages])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const stopStream = () => {
    abortRef.current?.abort()
    setStreaming(false)
  }

  const clearConversation = () => {
    setMessages([])
    toast('Conversation cleared')
  }

  const triggerGenesisCycle = async () => {
    setMode('GENESIS')
    setInput('Trigger a Genesis Cycle now. Show me the 6 phases: SENSE→INTERPRET→MUTATE→SIMULATE→PROMOTE→LEARN.')
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-full bg-atlas-bg rounded-xl overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-atlas-border bg-atlas-surface/50">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg">🔱</span>
          <div>
            <div className="text-xs font-bold text-atlas-accent tracking-widest uppercase">
              SuperLLM Interface
            </div>
            <div className="text-[10px] text-atlas-muted">Portal 15 · Unified Intelligence OS</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Ideas button */}
          <button
            onClick={() => setShowIdeas(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-md border border-atlas-border bg-atlas-surface text-[10px] text-atlas-muted hover:text-atlas-text hover:border-atlas-border2 transition-colors"
          >
            <Lightbulb size={11} />
            <span>100 Ideas</span>
          </button>

          {/* Genesis trigger */}
          <button
            onClick={triggerGenesisCycle}
            className="flex items-center gap-1 px-2 py-1 rounded-md border border-orange-500/30 bg-orange-500/10 text-[10px] text-orange-400 hover:bg-orange-500/20 transition-colors"
          >
            <Zap size={11} />
            <span>Genesis</span>
          </button>

          {/* Kill switch (admin only) */}
          {isAdmin && <KillSwitchWidget variant="mini" />}

          {/* Clear */}
          <button
            onClick={clearConversation}
            disabled={messages.length === 0}
            className="text-atlas-muted hover:text-atlas-text disabled:opacity-30 transition-colors"
            title="Clear conversation"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* ── Mode Bar ── */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-atlas-border overflow-x-auto scrollbar-hide">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            title={m.description}
            className={clsx(
              'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition-all flex-shrink-0',
              mode === m.id
                ? 'text-black'
                : 'text-atlas-muted hover:text-atlas-text border border-atlas-border hover:border-atlas-border2 bg-atlas-surface'
            )}
            style={mode === m.id ? { backgroundColor: m.color, border: 'none' } : {}}
          >
            {m.icon}
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="text-4xl">🔱</div>
            <div>
              <div className="text-sm font-semibold text-atlas-text mb-1">
                SuperLLM — {currentMode.label} Mode
              </div>
              <div className="text-xs text-atlas-muted max-w-xs">
                {currentMode.description}
              </div>
            </div>
            {/* Quick starts */}
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {[
                'Analyze my current deal pipeline',
                'What distress signals should I prioritize?',
                'Run a Genesis Cycle analysis',
                'Generate a skip trace plan for Kanawha County',
              ].map(prompt => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="px-3 py-1.5 rounded-lg border border-atlas-border bg-atlas-surface text-[10px] text-atlas-muted hover:text-atlas-text hover:border-atlas-border2 transition-colors text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={clsx(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-atlas-accent/20 border border-atlas-accent/30 flex items-center justify-center text-[10px] mr-2 mt-1 flex-shrink-0">
                🔱
              </div>
            )}
            <div
              className={clsx(
                'max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed',
                msg.role === 'user'
                  ? 'bg-atlas-accent/15 border border-atlas-accent/25 text-atlas-text'
                  : 'bg-atlas-surface border border-atlas-border text-atlas-text'
              )}
            >
              {msg.content || (
                <span className="flex items-center gap-1 text-atlas-muted">
                  <Loader2 size={10} className="animate-spin" />
                  <span>Thinking...</span>
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="px-3 pb-3">
        <div className={clsx(
          'flex items-end gap-2 rounded-xl border bg-atlas-surface/80 p-2 transition-colors',
          streaming ? 'border-atlas-accent/40' : 'border-atlas-border hover:border-atlas-border2'
        )}>
          {/* Mode indicator dot */}
          <div
            className="w-2 h-2 rounded-full flex-shrink-0 mb-2"
            style={{ backgroundColor: currentMode.color }}
          />
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentMode.placeholder}
            rows={1}
            disabled={streaming}
            className="flex-1 bg-transparent text-xs text-atlas-text placeholder-atlas-muted outline-none resize-none leading-relaxed max-h-32 disabled:opacity-60"
            style={{ minHeight: '24px' }}
          />
          {streaming ? (
            <button
              onClick={stopStream}
              className="flex-shrink-0 w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
              title="Stop"
            >
              <X size={12} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex-shrink-0 w-7 h-7 rounded-lg bg-atlas-accent/20 border border-atlas-accent/30 flex items-center justify-center text-atlas-accent hover:bg-atlas-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Send (Enter)"
            >
              <Send size={12} />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-1 px-1">
          <span className="text-[9px] text-atlas-muted">{currentMode.label} mode · Enter to send · Shift+Enter for newline</span>
          <span className="text-[9px] text-atlas-muted">{messages.filter(m => m.role === 'user').length} messages</span>
        </div>
      </div>

      {/* ── Ideas Panel Overlay ── */}
      {showIdeas && (
        <div className="absolute inset-0 bg-atlas-bg/95 backdrop-blur-sm z-50 flex flex-col rounded-xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-atlas-border">
            <div className="flex items-center gap-2">
              <Lightbulb size={14} className="text-atlas-gold" />
              <span className="text-xs font-bold text-atlas-text">100 Platform Ideas</span>
            </div>
            <button onClick={() => setShowIdeas(false)} className="text-atlas-muted hover:text-atlas-text">
              <X size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 gap-2">
              {IDEAS.map(idea => (
                <div
                  key={idea.n}
                  className="p-3 rounded-lg border border-atlas-border bg-atlas-surface hover:border-atlas-border2 transition-colors cursor-pointer"
                  onClick={() => {
                    setInput(`Tell me more about this ATLAS feature: "${idea.title}" — ${idea.desc}`)
                    setShowIdeas(false)
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-[9px] font-mono text-atlas-muted flex-shrink-0 mt-0.5">{idea.n}</span>
                    <div>
                      <div className="text-[10px] font-semibold text-atlas-text">{idea.title}</div>
                      <div className="text-[9px] text-atlas-muted mt-0.5 leading-relaxed">{idea.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 100 Ideas (condensed for component — filtered to top 20 most relevant) ──

const IDEAS = [
  { n: '001', title: 'Distress Signal Triangulation', desc: 'Combines 14 data signals into a single property distress score updated weekly.' },
  { n: '002', title: 'Autopoietic Self-Build System', desc: 'AI agents propose, test, and deploy their own improvements with human approval.' },
  { n: '003', title: 'Data Sovereignty Vault', desc: 'Every piece of user data in a personal encrypted vault with per-operation permission grants.' },
  { n: '004', title: 'Multi-Agent Swarm for Lead Gen', desc: 'Deploy 50+ agents simultaneously to saturate a market or target list.' },
  { n: '005', title: 'Genesis Cycle HeartbeatOrchestrator', desc: '15-minute self-improvement cycles: SENSE→INTERPRET→MUTATE→SIMULATE→PROMOTE→LEARN.' },
  { n: '006', title: 'LOI BATNA Generator', desc: 'Generate seller-specific LOIs with BATNA negotiation framing and WV legal compliance.' },
  { n: '007', title: 'Skip Trace + Enrichment Pipeline', desc: 'Find owner contacts across 40+ data sources with confidence scoring.' },
  { n: '008', title: 'AIN Heatmap — 55 WV Counties', desc: 'Live distress score heatmap of all WV counties from county assessor data.' },
  { n: '009', title: 'SuperLLM as OS', desc: 'One natural language interface that accesses all 15 portals, 255 agents, 508 skills.' },
  { n: '010', title: 'Blueprint Queue + Human Approval', desc: 'Genesis proposes code changes, you approve them, ZEUS deploys. Full auditability.' },
  { n: '011', title: 'Rehab Cost Estimator (Photo AI)', desc: 'Upload property photos → AI generates line-item rehab cost estimate with WV pricing.' },
  { n: '012', title: 'Drip Campaign Orchestrator', desc: 'Multi-channel seller follow-up: SMS day 1, email day 3, ringless voicemail day 7.' },
  { n: '013', title: 'Model Router + Voting Consensus', desc: 'Multiple AI models vote on best approach. Highest-confidence answer wins.' },
  { n: '014', title: 'Drive for Dollars GPS', desc: 'GPS-triggered property intelligence as you drive through target neighborhoods.' },
  { n: '015', title: 'Neighborhood Trajectory Predictor', desc: 'Analyze 47 leading indicators to predict which neighborhoods will gentrify or decline.' },
  { n: '016', title: 'Franchise Engine', desc: 'White-label ATLAS deployments with parent-child permission inheritance.' },
  { n: '017', title: 'Adverse Action Notice Generator', desc: 'FCRA-compliant adverse action letters for tenant screening decisions.' },
  { n: '018', title: 'Living Graph — Property Relationships', desc: 'Visual graph of all property relationships: owners, liens, entities, relatives.' },
  { n: '019', title: 'AI Intake Assistant', desc: 'Conversational intake that qualifies leads, schedules appointments, creates contacts.' },
  { n: '020', title: 'Exit Strategy Optimizer', desc: 'Analyze fix-and-flip, rental, wholesale, lease-option simultaneously by risk-adjusted ROI.' },
]
