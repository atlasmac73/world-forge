'use client'

/**
 * ATLAS v67 — God Mode Page
 * 4-agent pod: Orchestrator → Investigator → Underwriter → Copywriter
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { useState } from 'react'
import { Zap, Bot, Copy, Save, Loader2, CheckCircle2 } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { SectionHeader, AgentBadge, AtlasCard, CommandButton } from '@/components/ui/index'
import ReactMarkdown from 'react-markdown'

interface AgentStep {
  agent: string; code: string; label: string; status: 'idle' | 'running' | 'done' | 'failed'; output: string
}

const AGENT_POD: AgentStep[] = [
  { agent: 'ORACLE',      code: 'A01', label: 'Orchestrator',    status: 'idle', output: '' },
  { agent: 'INVESTIGATOR',code: 'A08', label: 'Investigator',    status: 'idle', output: '' },
  { agent: 'UNDERWRITER', code: 'A02', label: 'Underwriter',     status: 'idle', output: '' },
  { agent: 'COPYWRITER',  code: 'A11', label: 'Copywriter',      status: 'idle', output: '' },
]

const QUICK_PROPS = [
  '412 Elm St, Charleston WV 25301',
  '1847 Bridge Rd, South Charleston WV 25303',
  '234 Oak Ave, Nitro WV 25143',
  '89 Pine Hill Rd, St. Albans WV 25177',
]

export default function GodModePage() {
  const [address, setAddress] = useState('')
  const [agents, setAgents] = useState<AgentStep[]>(AGENT_POD)
  const [running, setRunning] = useState(false)
  const [runId, setRunId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0)

  function updateAgent(idx: number, patch: Partial<AgentStep>) {
    setAgents(prev => prev.map((a, i) => i === idx ? { ...a, ...patch } : a))
  }

  async function runGodMode() {
    if (!address.trim()) { toast.error('Enter a property address'); return }
    setRunning(true)
    setAgents(AGENT_POD.map(a => ({ ...a, status: 'idle', output: '' })))

    try {
      // Step 1: ORACLE orchestrates (brief)
      updateAgent(0, { status: 'running' })
      await new Promise(r => setTimeout(r, 400))
      updateAgent(0, { status: 'done', output: `Orchestrating God Mode run for: ${address}\n\nDispatch order: INVESTIGATOR → UNDERWRITER → COPYWRITER\nExpected output: Full dossier, MAO analysis, outreach package.` })

      // Step 2: Run dossier (INVESTIGATOR)
      updateAgent(1, { status: 'running' })
      const dossierRes = await fetch('/api/agents/dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })
      const dossierData = await dossierRes.json()
      if (!dossierData.ok && !dossierData.dossier) throw new Error('Dossier agent failed')
      const dossier = dossierData.dossier ?? dossierData
      setRunId(dossierData.runId ?? null)
      updateAgent(1, {
        status: 'done',
        output: `## Property Investigation: ${address}\n\n${
          dossier.investment_thesis
            ? `**Investment Thesis:** ${dossier.investment_thesis}\n\n` +
              `**Distress Score:** ${dossier.distress_score ?? 'N/A'} · **Grade:** ${dossier.deal_grade ?? 'N/A'}\n\n` +
              `**Equity:** ${dossier.equity_pct ?? 'N/A'}% · **ARV:** $${(dossier.arv ?? 0).toLocaleString()} · **MAO:** $${(dossier.recommended_offer ?? 0).toLocaleString()}\n\n` +
              `**Risk Factors:** ${(dossier.risk_factors ?? []).join(', ')}`
            : JSON.stringify(dossier, null, 2)
        }`,
      })

      // Step 3: UNDERWRITER brief
      updateAgent(2, { status: 'running' })
      await new Promise(r => setTimeout(r, 600))
      const arv = dossier.arv ?? 120000
      const repair = dossier.estimated_repair ?? 25000
      const mao = Math.max(0, arv * 0.70 - repair)
      updateAgent(2, {
        status: 'done',
        output: `## Underwriting Analysis\n\n**ARV:** $${arv.toLocaleString()}\n**Estimated Repair:** $${repair.toLocaleString()}\n**MAO (70%):** $${mao.toLocaleString()}\n\n**Recommendation:** ${mao > 0 ? 'Deal viable at or below MAO. Verify repair scope.' : 'Negative MAO — pass or negotiate heavy discount.'}`,
      })

      // Step 4: COPYWRITER outreach
      updateAgent(3, { status: 'running' })
      await new Promise(r => setTimeout(r, 400))
      const ownerName = dossier.owner_name ?? 'Property Owner'
      updateAgent(3, {
        status: 'done',
        output: `## Outreach Package\n\n**SMS Draft:**\nHi ${ownerName.split(' ')[0]}, I noticed your property at ${address}. I'm a local real estate investor and I'm interested in making a fair cash offer. Would you be open to a quick conversation? – Atlas Investments\n\n**Talking Points:**\n- Fast cash close (7-14 days)\n- As-is purchase, no repairs needed\n- Flexible closing timeline\n- Local buyer, no banks involved\n\n**Voicemail:**\nHi, this is [Your Name] calling about your property on ${address.split(',')[0]}. I'm a cash buyer in the area and would love to discuss a potential purchase. Please call me back at your convenience.`,
      })

      toast.success('God Mode run complete — all 4 agents finished')
    } catch (err) {
      const failIdx = agents.findIndex(a => a.status === 'running')
      if (failIdx >= 0) updateAgent(failIdx, { status: 'failed', output: `Error: ${err instanceof Error ? err.message : 'Unknown error'}` })
      toast.error('God Mode run failed — see agent output')
    } finally {
      setRunning(false)
    }
  }

  const allDone = agents.every(a => a.status === 'done')

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <SectionHeader
        title="God Mode"
        subtitle="4-agent intelligence pod — full property dossier in one run"
        badge="GOD SQUAD"
        badgeColor="#f6ad55"
      />

      {/* Input */}
      <AtlasCard className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Enter WV property address..."
            disabled={running}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-atlas-border text-sm text-atlas-text placeholder-atlas-muted focus:outline-none focus:border-atlas-gold/50 disabled:opacity-50"
            onKeyDown={e => e.key === 'Enter' && runGodMode()}
          />
          <CommandButton onClick={runGodMode} loading={running} icon={<Zap size={14} />} variant="gold" size="lg">
            Launch God Mode
          </CommandButton>
        </div>

        {/* Quick select */}
        <div className="flex flex-wrap gap-2">
          {QUICK_PROPS.map(p => (
            <button
              key={p}
              onClick={() => setAddress(p)}
              disabled={running}
              className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 text-atlas-muted border border-white/10 hover:border-white/20 hover:text-atlas-text transition-all disabled:opacity-40"
            >
              {p.split(',')[0]}
            </button>
          ))}
        </div>
      </AtlasCard>

      {/* Agent Status Row */}
      <div className="grid grid-cols-4 gap-3">
        {agents.map((a, i) => (
          <button
            key={a.agent}
            onClick={() => setActiveTab(i)}
            className={clsx(
              'rounded-xl border p-3 text-left transition-all',
              activeTab === i ? 'border-atlas-gold/40 bg-atlas-gold/8' : 'border-atlas-border bg-atlas-panel hover:border-white/20',
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <AgentBadge code={a.code} name="" status={a.status === 'idle' ? 'standby' : a.status === 'running' ? 'running' : a.status === 'done' ? 'completed' : 'failed'} compact />
              {a.status === 'running' && <Loader2 size={11} className="animate-spin text-atlas-accent" />}
              {a.status === 'done' && <CheckCircle2 size={11} className="text-atlas-green" />}
            </div>
            <p className="text-xs font-bold text-atlas-text">{a.agent}</p>
            <p className="text-[9px] text-atlas-muted">{a.label}</p>
          </button>
        ))}
      </div>

      {/* Output Panel */}
      <AtlasCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot size={14} className="text-atlas-gold" />
            <span className="text-sm font-bold text-atlas-text">{agents[activeTab].agent}</span>
            <span className="text-xs text-atlas-muted">— {agents[activeTab].label}</span>
          </div>
          {agents[activeTab].output && (
            <button
              onClick={() => { navigator.clipboard.writeText(agents[activeTab].output); toast.success('Copied') }}
              className="p-1.5 rounded hover:bg-white/8 text-atlas-muted hover:text-atlas-text transition-colors"
            >
              <Copy size={12} />
            </button>
          )}
        </div>

        <div className="min-h-48 rounded-xl bg-[#080b15] border border-atlas-border p-5">
          {agents[activeTab].status === 'idle' ? (
            <p className="text-atlas-muted text-xs">Waiting for run...</p>
          ) : agents[activeTab].status === 'running' ? (
            <div className="flex items-center gap-2 text-atlas-accent text-xs">
              <Loader2 size={12} className="animate-spin" />
              Agent running...
            </div>
          ) : (
            <div className="prose prose-invert prose-xs max-w-none text-atlas-muted">
              <ReactMarkdown>{agents[activeTab].output}</ReactMarkdown>
            </div>
          )}
        </div>

        {allDone && runId && (
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-atlas-green">
            <Save size={10} /> Run saved · ID: {runId}
          </div>
        )}
      </AtlasCard>

      <p className="text-[10px] text-atlas-muted text-center">
        God Mode · A01 ORACLE · A08 INVESTIGATOR · A02 UNDERWRITER · A11 COPYWRITER · Isaac Brandon Burdette · Atlas Genesis Matrix LLC
      </p>
    </div>
  )
}
