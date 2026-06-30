'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useArkStore } from '@/store/useArkStore'
import { X, Send, Trash2, Zap, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import ReactMarkdown from 'react-markdown'

const QUICK_PROMPTS = [
  'What are my top deals?',
  'Run a dossier on 412 Elm St, Charleston WV',
  'What are the current platform blockers?',
  'Explain the Genesis Cycle',
  'Show me Kanawha County distress data',
]

export function CopilotPanel() {
  const { messages, isStreaming, isCopilotOpen, addMessage, updateLastMessage, clearMessages, setStreaming, toggleCopilot, subscription } = useArkStore()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || isStreaming) return

    setInput('')
    addMessage({ role: 'user', content: msg })
    addMessage({ role: 'assistant', content: '' })
    setStreaming(true)

    try {
      const history = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
        .slice(-8)

      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...history, { role: 'user', content: msg }]
        }),
      })

      if (!res.ok || !res.body) throw new Error('Stream failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        updateLastMessage(accumulated)
      }
    } catch (err) {
      updateLastMessage('LUKA offline. Check API key configuration.')
    } finally {
      setStreaming(false)
    }
  }

  if (!isCopilotOpen) {
    return (
      <button
        onClick={toggleCopilot}
        className="fixed right-4 bottom-4 w-10 h-10 rounded-full bg-atlas-accent/20 border border-atlas-accent/40 flex items-center justify-center hover:bg-atlas-accent/30 transition-all z-40"
        title="Open LUKA Copilot"
      >
        <Zap size={16} className="text-atlas-accent" />
      </button>
    )
  }

  return (
    <aside className="w-72 flex flex-col bg-atlas-surface border-l border-atlas-border h-screen flex-shrink-0">
      {/* Header */}
      <div className="p-3 border-b border-atlas-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-atlas-accent/20 flex items-center justify-center">
            <Zap size={12} className="text-atlas-accent" />
          </div>
          <div>
            <div className="text-xs font-bold text-atlas-accent">LUKA · A01-ORACLE</div>
            <div className="text-[9px] text-atlas-muted">Atlas Chief of Staff</div>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={clearMessages} className="p-1.5 rounded hover:bg-white/5 text-atlas-muted hover:text-atlas-text transition-colors" title="Clear chat">
            <Trash2 size={12} />
          </button>
          <button onClick={toggleCopilot} className="p-1.5 rounded hover:bg-white/5 text-atlas-muted hover:text-atlas-text transition-colors">
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="bg-atlas-panel border border-atlas-border rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-atlas-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap size={9} className="text-atlas-accent" />
                </div>
                <div className="text-xs text-atlas-text leading-relaxed">
                  I&apos;m LUKA — your Atlas Chief of Staff. I have full context over all 33 portals, 255 agents, 7 subscription tiers, and the live Supabase database. What do you need?
                </div>
              </div>
            </div>
            <div>
              <div className="text-[9px] text-atlas-muted uppercase tracking-widest mb-2">Quick prompts</div>
              <div className="space-y-1">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="w-full text-left text-[10px] text-atlas-muted hover:text-atlas-text px-2 py-1.5 rounded hover:bg-white/5 transition-all border border-transparent hover:border-atlas-border"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx('flex items-start gap-2', msg.role === 'user' && 'flex-row-reverse')}
          >
            <div className={clsx(
              'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold',
              msg.role === 'user'
                ? 'bg-atlas-purple/20 text-atlas-purple'
                : 'bg-atlas-accent/20 text-atlas-accent'
            )}>
              {msg.role === 'user' ? 'IB' : '◈'}
            </div>
            <div className={clsx(
              'rounded-lg px-3 py-2 text-xs leading-relaxed max-w-[85%]',
              msg.role === 'user'
                ? 'bg-atlas-purple/10 border border-atlas-purple/20 text-atlas-text'
                : 'bg-atlas-panel border border-atlas-border text-atlas-text'
            )}>
              {msg.role === 'assistant' && msg.content === '' && isStreaming ? (
                <div className="flex items-center gap-1.5 text-atlas-muted">
                  <Loader2 size={10} className="animate-spin" />
                  <span>Thinking...</span>
                </div>
              ) : (
                <ReactMarkdown
                  components={{
                    p: ({ children }: { children?: React.ReactNode }) => <p className="mb-1 last:mb-0">{children}</p>,
                    code: ({ children }: { children?: React.ReactNode }) => (
                      <code className="bg-atlas-surface px-1 py-0.5 rounded text-atlas-accent font-mono text-[10px]">
                        {children}
                      </code>
                    ),
                    ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc list-inside space-y-0.5 my-1">{children}</ul>,
                    ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal list-inside space-y-0.5 my-1">{children}</ol>,
                    strong: ({ children }: { children?: React.ReactNode }) => <strong className="text-atlas-gold font-semibold">{children}</strong>,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-atlas-border flex-shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask LUKA..."
            disabled={isStreaming}
            className="flex-1 bg-atlas-panel border border-atlas-border rounded-lg px-3 py-2 text-xs placeholder-atlas-muted text-atlas-text focus:border-atlas-accent/50 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isStreaming}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-atlas-accent/15 border border-atlas-accent/30 text-atlas-accent hover:bg-atlas-accent/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isStreaming ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className={clsx('text-[9px]', subscription.tier_code === 'T1' ? 'text-atlas-gold' : 'text-atlas-muted')}>
            {subscription.credits_limit_daily - subscription.credits_used_today} credits left
          </span>
          <span className="text-[9px] text-atlas-muted">claude-sonnet-4-20250514</span>
        </div>
      </div>
    </aside>
  )
}
