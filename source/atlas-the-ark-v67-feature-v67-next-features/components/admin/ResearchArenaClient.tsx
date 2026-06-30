'use client'

/**
 * ATLAS v67 — Research Arena (founder/admin only)
 * AI Tournament + NotebookLM-style Research Notebook in one console.
 *
 * - Arena: run model bake-offs or agent contests, judged + ranked.
 * - Notebook: curate sources, ask grounded questions (optionally
 *   tournament-backed so multiple models compete on the answer).
 *
 * All data flows through owner/admin-gated APIs. No secrets on client.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { useState, useEffect, useCallback } from 'react'
import { Trophy, BookOpen, Loader2, Plus, Play, Sparkles, Trash2, Crown, Pin, Download, Archive, RotateCcw, GitCompare } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Entry {
  id: string
  competitor_label: string
  provider: string | null
  score: number | null
  rank: number | null
  status: string
  output: string | null
  error: string | null
}
interface TournamentOutcome {
  tournamentId: string
  status: string
  winnerLabel: string | null
  winnerScore: number | null
  summary: string
  entries: Array<{ id: string; label: string; score: number | null; rank: number | null }>
  skipped?: string[]
}
interface TournamentRow {
  id: string
  title: string
  mode: string
  status: string
  winner_label: string | null
  winner_score: number | null
  created_at: string
}
interface Notebook {
  id: string
  title: string
  description: string | null
  status: string
  updated_at: string
}
interface Source {
  id: string
  title: string
  source_type: string
  token_estimate: number
}
interface Finding {
  id: string
  question: string
  answer: string | null
  model_used: string | null
  tournament_id: string | null
  pinned: boolean
  created_at: string
}

// ─── Download helper ──────────────────────────────────────────────────────────

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 50) || 'export'
}

// Candidate models the founder can field. Availability is enforced server-side;
// unconfigured providers come back in the tournament's `skipped` list.
const MODEL_CHOICES: Array<{ id: string; label: string; provider: string }> = [
  { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', provider: 'Anthropic' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', provider: 'Anthropic' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', provider: 'Anthropic' },
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gpt-4o-mini', label: 'GPT-4o mini', provider: 'OpenAI' },
]
const AGENT_CHOICES = ['A01-ORACLE', 'A12-SPECTER', 'A15-OMEN', 'A06-HERALD']

// ─── Component ────────────────────────────────────────────────────────────────

export function ResearchArenaClient({ userRole }: { userRole: string }) {
  const [tab, setTab] = useState<'arena' | 'notebook'>('arena')

  return (
    <div className="min-h-screen bg-atlas-bg text-atlas-text p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-atlas-accent" />
            <h1 className="text-lg font-bold tracking-wide">Research Arena</h1>
            <span className="text-[10px] uppercase tracking-widest text-atlas-muted ml-2">
              {userRole} · founder-only
            </span>
          </div>
          <p className="text-xs text-atlas-muted mt-1">
            AI tournaments + grounded research. The tournament engine also powers Genesis SIMULATE.
          </p>
        </header>

        <div className="flex gap-1 mb-5 border-b border-atlas-border">
          <TabButton active={tab === 'arena'} onClick={() => setTab('arena')} icon={<Trophy size={13} />} label="Tournament Arena" />
          <TabButton active={tab === 'notebook'} onClick={() => setTab('notebook')} icon={<BookOpen size={13} />} label="Research Notebook" />
        </div>

        {tab === 'arena' ? <ArenaTab /> : <NotebookTab />}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors',
        active ? 'border-atlas-accent text-atlas-accent' : 'border-transparent text-atlas-muted hover:text-atlas-text'
      )}
    >
      {icon}{label}
    </button>
  )
}

// ─── Arena Tab ─────────────────────────────────────────────────────────────────

function ArenaTab() {
  const [mode, setMode] = useState<'model' | 'agent'>('model')
  const [prompt, setPrompt] = useState('')
  const [selectedModels, setSelectedModels] = useState<string[]>(['claude-opus-4-6', 'claude-sonnet-4-6'])
  const [selectedAgents, setSelectedAgents] = useState<string[]>(AGENT_CHOICES)
  const [running, setRunning] = useState(false)
  const [outcome, setOutcome] = useState<TournamentOutcome | null>(null)
  const [history, setHistory] = useState<TournamentRow[]>([])
  const [liveProviders, setLiveProviders] = useState<string[]>([])

  const loadHistory = useCallback(async () => {
    const res = await fetch('/api/tournament')
    const json = await res.json()
    if (json.ok) setHistory(json.tournaments)
  }, [])

  const loadProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/tournament/providers')
      const json = await res.json()
      if (json.ok) setLiveProviders(json.available)
    } catch { /* non-fatal */ }
  }, [])

  useEffect(() => { loadHistory(); loadProviders() }, [loadHistory, loadProviders])

  const toggle = (arr: string[], set: (v: string[]) => void, id: string) =>
    set(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id])

  const run = async () => {
    if (!prompt.trim()) { toast.error('Enter a prompt'); return }
    setRunning(true)
    setOutcome(null)
    try {
      const res = await fetch('/api/tournament/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'model'
            ? { mode, prompt, modelIds: selectedModels, title: prompt.slice(0, 60) }
            : { mode, prompt, agentCodes: selectedAgents, title: prompt.slice(0, 60) }
        ),
      })
      const json = await res.json()
      if (!json.ok && !json.tournamentId) {
        toast.error(json.error || 'Tournament failed')
      } else {
        setOutcome(json)
        if (json.skipped?.length) toast(`Skipped: ${json.skipped.join(', ')}`, { icon: '⚠️' })
        loadHistory()
      }
    } catch {
      toast.error('Request failed')
    } finally {
      setRunning(false)
    }
  }

  const deleteTournament = async (id: string) => {
    const res = await fetch(`/api/tournament?id=${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.ok) {
      toast.success('Tournament deleted')
      if (outcome?.tournamentId === id) setOutcome(null)
      loadHistory()
    } else {
      toast.error(json.error || 'Delete failed')
    }
  }

  const exportTournament = async (id: string, title: string) => {
    const res = await fetch(`/api/tournament?id=${id}`)
    const json = await res.json()
    if (!json.ok) { toast.error('Export failed'); return }
    downloadFile(
      `tournament-${slugify(title)}.json`,
      JSON.stringify({ tournament: json.tournament, entries: json.entries }, null, 2),
      'application/json'
    )
  }

  const rerunTournament = async (id: string) => {
    const det = await fetch(`/api/tournament?id=${id}`).then(r => r.json())
    if (!det.ok || !det.tournament) { toast.error('Could not load tournament'); return }
    const t = det.tournament as { mode: string; prompt: string; title: string }
    if (t.mode === 'blueprint') {
      toast.error('Blueprint tournaments are run by Genesis SIMULATE and can\'t be re-run here')
      return
    }
    const competitorIds = Array.from(
      new Set((det.entries as Array<{ competitor_id: string }>).map(e => e.competitor_id))
    )
    setRunning(true)
    setOutcome(null)
    try {
      const body = t.mode === 'model'
        ? { mode: 'model', prompt: t.prompt, modelIds: competitorIds, title: t.title }
        : { mode: 'agent', prompt: t.prompt, agentCodes: competitorIds, title: t.title }
      const res = await fetch('/api/tournament/run', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!json.ok && !json.tournamentId) { toast.error(json.error || 'Re-run failed') }
      else {
        setOutcome(json)
        if (json.skipped?.length) toast(`Skipped: ${json.skipped.join(', ')}`, { icon: '⚠️' })
        loadHistory()
      }
    } catch {
      toast.error('Re-run failed')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <div className="flex gap-2 mb-3">
            {(['model', 'agent'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={clsx('px-3 py-1 rounded-md text-[11px] font-semibold',
                  mode === m ? 'bg-atlas-accent text-black' : 'bg-atlas-surface border border-atlas-border text-atlas-muted')}>
                {m === 'model' ? 'Model Bake-off' : 'Agent Contest'}
              </button>
            ))}
          </div>

          <textarea
            value={prompt} onChange={e => setPrompt(e.target.value)}
            placeholder="The prompt every competitor answers..."
            rows={4}
            className="w-full bg-atlas-surface border border-atlas-border rounded-lg p-3 text-xs outline-none focus:border-atlas-accent resize-none"
          />

          <div className="mt-3">
            <div className="text-[10px] uppercase tracking-wider text-atlas-muted mb-1.5">
              {mode === 'model' ? 'Competitors' : 'Agents'}
              {mode === 'model' && liveProviders.length > 0 && (
                <span className="ml-2 normal-case tracking-normal text-atlas-muted/70">
                  live: {liveProviders.join(', ')}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {mode === 'model'
                ? MODEL_CHOICES.map(m => {
                    const live = liveProviders.includes(m.provider)
                    return (
                      <Chip key={m.id} active={selectedModels.includes(m.id)}
                        onClick={() => toggle(selectedModels, setSelectedModels, m.id)}>
                        {m.label} <span className="opacity-50">· {m.provider}</span>
                        {!live && <span className="text-atlas-gold/70" title="No API key — will be skipped"> ·no key</span>}
                      </Chip>
                    )
                  })
                : AGENT_CHOICES.map(a => (
                    <Chip key={a} active={selectedAgents.includes(a)}
                      onClick={() => toggle(selectedAgents, setSelectedAgents, a)}>{a}</Chip>
                  ))}
            </div>
          </div>

          <button onClick={run} disabled={running}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-atlas-accent text-black text-xs font-bold disabled:opacity-50">
            {running ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            {running ? 'Judging…' : 'Run Tournament'}
          </button>
        </Card>

        {outcome && (
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Crown size={14} className="text-atlas-gold" />
              <span className="text-xs font-bold flex-1">
                Winner: {outcome.winnerLabel ?? '—'} {outcome.winnerScore != null && `(${outcome.winnerScore})`}
              </span>
              {outcome.tournamentId && (
                <button onClick={() => exportTournament(outcome.tournamentId, outcome.winnerLabel ?? 'result')}
                  title="Export JSON"
                  className="flex items-center gap-1 text-[10px] text-atlas-muted hover:text-atlas-accent">
                  <Download size={11} /> Export
                </button>
              )}
            </div>
            <p className="text-[11px] text-atlas-muted mb-3">{outcome.summary}</p>
            <div className="space-y-1.5">
              {outcome.entries.map(e => (
                <div key={e.id} className="flex items-center justify-between bg-atlas-surface border border-atlas-border rounded-md px-3 py-1.5">
                  <span className="text-[11px]"><span className="text-atlas-muted mr-2">#{e.rank}</span>{e.label}</span>
                  <span className="text-[11px] font-mono text-atlas-accent">{e.score ?? '—'}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Card>
        <div className="text-[10px] uppercase tracking-wider text-atlas-muted mb-2">Recent tournaments</div>
        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
          {history.length === 0 && <p className="text-[11px] text-atlas-muted">None yet.</p>}
          {history.map(t => (
            <div key={t.id} className="bg-atlas-surface border border-atlas-border rounded-md px-2.5 py-1.5 group">
              <div className="flex items-center justify-between gap-1">
                <div className="text-[11px] truncate flex-1">{t.title}</div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t.mode !== 'blueprint' && (
                    <button onClick={() => rerunTournament(t.id)} disabled={running} title="Re-run"
                      className="text-atlas-muted hover:text-atlas-accent disabled:opacity-40"><RotateCcw size={11} /></button>
                  )}
                  <button onClick={() => exportTournament(t.id, t.title)} title="Export JSON"
                    className="text-atlas-muted hover:text-atlas-accent"><Download size={11} /></button>
                  <button onClick={() => deleteTournament(t.id)} title="Delete"
                    className="text-atlas-muted hover:text-red-400"><Trash2 size={11} /></button>
                </div>
              </div>
              <div className="text-[9px] text-atlas-muted flex justify-between">
                <span>{t.mode} · {t.status}</span>
                <span>{t.winner_label ?? ''}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── Notebook Tab ──────────────────────────────────────────────────────────────

function NotebookTab() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [sources, setSources] = useState<Source[]>([])
  const [findings, setFindings] = useState<Finding[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [srcTitle, setSrcTitle] = useState('')
  const [srcContent, setSrcContent] = useState('')
  const [question, setQuestion] = useState('')
  const [useTournament, setUseTournament] = useState(false)
  const [asking, setAsking] = useState(false)
  const [compareIds, setCompareIds] = useState<string[]>([])

  const toggleCompare = (id: string) =>
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length >= 2 ? [prev[1], id] : [...prev, id]
    )

  const loadNotebooks = useCallback(async () => {
    const res = await fetch('/api/research')
    const json = await res.json()
    if (json.ok) setNotebooks(json.notebooks)
  }, [])

  const loadDetail = useCallback(async (id: string) => {
    const res = await fetch(`/api/research?id=${id}`)
    const json = await res.json()
    if (json.ok) { setSources(json.sources); setFindings(json.findings) }
  }, [])

  useEffect(() => { loadNotebooks() }, [loadNotebooks])
  useEffect(() => { setCompareIds([]); if (active) loadDetail(active) }, [active, loadDetail])

  const createNotebook = async () => {
    if (!newTitle.trim()) return
    const res = await fetch('/api/research', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    })
    const json = await res.json()
    if (json.ok) { setNewTitle(''); await loadNotebooks(); setActive(json.notebook.id) }
    else toast.error(json.error || 'Failed')
  }

  const archiveNotebook = async (id: string, status: 'ACTIVE' | 'ARCHIVED') => {
    const res = await fetch('/api/research', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    const json = await res.json()
    if (json.ok) { toast.success(status === 'ARCHIVED' ? 'Archived' : 'Restored'); loadNotebooks() }
    else toast.error(json.error || 'Failed')
  }

  const deleteNotebook = async (id: string) => {
    const res = await fetch(`/api/research?id=${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.ok) {
      toast.success('Notebook deleted')
      if (active === id) setActive(null)
      loadNotebooks()
    } else toast.error(json.error || 'Delete failed')
  }

  const addSource = async () => {
    if (!active || !srcTitle.trim() || !srcContent.trim()) { toast.error('Title + content required'); return }
    const res = await fetch('/api/research/sources', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notebookId: active, title: srcTitle, content: srcContent, sourceType: 'text' }),
    })
    const json = await res.json()
    if (json.ok) { setSrcTitle(''); setSrcContent(''); loadDetail(active) }
    else toast.error(json.error || 'Failed')
  }

  const deleteSource = async (id: string) => {
    await fetch(`/api/research/sources?id=${id}`, { method: 'DELETE' })
    if (active) loadDetail(active)
  }

  const ask = async () => {
    if (!active || !question.trim()) return
    setAsking(true)
    try {
      const res = await fetch('/api/research/ask', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notebookId: active, question, tournament: useTournament }),
      })
      const json = await res.json()
      if (json.ok) { setQuestion(''); loadDetail(active) }
      else toast.error(json.error || 'Ask failed')
    } finally { setAsking(false) }
  }

  const pinFinding = async (id: string, pinned: boolean) => {
    await fetch('/api/research/findings', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, pinned }),
    })
    if (active) loadDetail(active)
  }

  const deleteFinding = async (id: string) => {
    await fetch(`/api/research/findings?id=${id}`, { method: 'DELETE' })
    if (active) loadDetail(active)
  }

  const exportNotebook = () => {
    const nb = notebooks.find(n => n.id === active)
    const title = nb?.title ?? 'notebook'
    const md = [
      `# ${title}`,
      nb?.description ? `\n${nb.description}` : '',
      `\n## Sources (${sources.length})`,
      ...sources.map(s => `- **${s.title}** (${s.source_type}, ~${s.token_estimate} tok)`),
      `\n## Findings (${findings.length})`,
      ...findings.map(f =>
        `\n### Q: ${f.question}\n_${f.pinned ? '📌 pinned · ' : ''}${f.model_used ?? ''}${f.tournament_id ? ' · 🏆 tournament' : ''}_\n\n${f.answer ?? ''}`),
    ].join('\n')
    downloadFile(`notebook-${slugify(title)}.md`, md, 'text/markdown')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <Card>
        <div className="text-[10px] uppercase tracking-wider text-atlas-muted mb-2">Notebooks</div>
        <div className="flex gap-1.5 mb-3">
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="New notebook…"
            className="flex-1 bg-atlas-surface border border-atlas-border rounded-md px-2 py-1 text-[11px] outline-none focus:border-atlas-accent" />
          <button onClick={createNotebook} className="px-2 rounded-md bg-atlas-accent text-black"><Plus size={13} /></button>
        </div>
        <div className="space-y-1.5">
          {notebooks.map(n => (
            <div key={n.id}
              className={clsx('group flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] border',
                active === n.id ? 'border-atlas-accent bg-atlas-accent/10' : 'border-atlas-border bg-atlas-surface',
                n.status === 'ARCHIVED' && 'opacity-50')}>
              <button onClick={() => setActive(n.id)} className="text-left flex-1 truncate">
                {n.title}
                {n.status === 'ARCHIVED' && <span className="ml-1 text-[8px] uppercase text-atlas-muted">archived</span>}
              </button>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => archiveNotebook(n.id, n.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED')}
                  title={n.status === 'ARCHIVED' ? 'Restore' : 'Archive'}
                  className="text-atlas-muted hover:text-atlas-accent">
                  <Archive size={11} />
                </button>
                <button onClick={() => deleteNotebook(n.id)} title="Delete notebook"
                  className="text-atlas-muted hover:text-red-400"><Trash2 size={11} /></button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="lg:col-span-2 space-y-4">
        {!active ? (
          <Card><p className="text-[11px] text-atlas-muted">Select or create a notebook to begin.</p></Card>
        ) : (
          <>
            <Card>
              <div className="text-[10px] uppercase tracking-wider text-atlas-muted mb-2">Sources ({sources.length})</div>
              <div className="space-y-1.5 mb-3">
                {sources.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-atlas-surface border border-atlas-border rounded-md px-2.5 py-1.5">
                    <span className="text-[11px] truncate">{s.title} <span className="text-atlas-muted">· ~{s.token_estimate} tok</span></span>
                    <button onClick={() => deleteSource(s.id)} className="text-atlas-muted hover:text-red-400"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
              <input value={srcTitle} onChange={e => setSrcTitle(e.target.value)} placeholder="Source title"
                className="w-full bg-atlas-surface border border-atlas-border rounded-md px-2 py-1 text-[11px] mb-1.5 outline-none focus:border-atlas-accent" />
              <textarea value={srcContent} onChange={e => setSrcContent(e.target.value)} placeholder="Paste source text…" rows={3}
                className="w-full bg-atlas-surface border border-atlas-border rounded-md px-2 py-1 text-[11px] resize-none outline-none focus:border-atlas-accent" />
              <button onClick={addSource} className="mt-2 px-3 py-1 rounded-md bg-atlas-surface border border-atlas-border text-[11px] hover:border-atlas-accent">+ Add source</button>
            </Card>

            <Card>
              <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask a question grounded in your sources…" rows={2}
                className="w-full bg-atlas-surface border border-atlas-border rounded-md p-2 text-[11px] resize-none outline-none focus:border-atlas-accent" />
              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-1.5 text-[11px] text-atlas-muted cursor-pointer">
                  <input type="checkbox" checked={useTournament} onChange={e => setUseTournament(e.target.checked)} />
                  Tournament-backed (multiple models compete)
                </label>
                <button onClick={ask} disabled={asking}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-atlas-accent text-black text-[11px] font-bold disabled:opacity-50">
                  {asking ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Ask
                </button>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-atlas-muted">
                  Findings
                  {compareIds.length > 0 && (
                    <span className="ml-2 normal-case tracking-normal text-atlas-accent">
                      {compareIds.length}/2 selected to compare
                      <button onClick={() => setCompareIds([])} className="ml-1 text-atlas-muted hover:text-atlas-text underline">clear</button>
                    </span>
                  )}
                </span>
                {findings.length > 0 && (
                  <button onClick={exportNotebook} title="Export notebook as Markdown"
                    className="flex items-center gap-1 text-[10px] text-atlas-muted hover:text-atlas-accent">
                    <Download size={11} /> Export .md
                  </button>
                )}
              </div>

              {compareIds.length === 2 && (() => {
                const a = findings.find(f => f.id === compareIds[0])
                const b = findings.find(f => f.id === compareIds[1])
                if (!a || !b) return null
                return (
                  <div className="mb-3 rounded-lg border border-atlas-accent/30 bg-atlas-accent/5 p-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-atlas-accent mb-2">
                      <GitCompare size={11} /> Comparison
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[a, b].map(f => (
                        <div key={f.id} className="space-y-1">
                          <div className="text-[10px] font-semibold text-atlas-text">Q: {f.question}</div>
                          <div className="text-[9px] text-atlas-muted">{f.model_used}{f.tournament_id ? ' · 🏆' : ''}</div>
                          <div className="text-[10px] text-atlas-muted whitespace-pre-wrap border-t border-atlas-border pt-1">{f.answer}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
              <div className="space-y-2.5 max-h-[40vh] overflow-y-auto">
                {findings.length === 0 && <p className="text-[11px] text-atlas-muted">No findings yet.</p>}
                {findings.map(f => (
                  <div key={f.id} className={clsx(
                    'border rounded-md p-2.5',
                    f.pinned ? 'bg-atlas-gold/5 border-atlas-gold/30' : 'bg-atlas-surface border-atlas-border'
                  )}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[11px] font-semibold mb-1 flex-1">Q: {f.question}</div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => toggleCompare(f.id)} title="Select to compare (max 2)"
                          className={clsx(compareIds.includes(f.id) ? 'text-atlas-accent' : 'text-atlas-muted hover:text-atlas-accent')}>
                          <GitCompare size={11} />
                        </button>
                        <button onClick={() => pinFinding(f.id, !f.pinned)} title={f.pinned ? 'Unpin' : 'Pin'}
                          className={clsx(f.pinned ? 'text-atlas-gold' : 'text-atlas-muted hover:text-atlas-gold')}>
                          <Pin size={11} />
                        </button>
                        <button onClick={() => deleteFinding(f.id)} title="Delete finding"
                          className="text-atlas-muted hover:text-red-400"><Trash2 size={11} /></button>
                      </div>
                    </div>
                    <div className="text-[11px] text-atlas-muted whitespace-pre-wrap">{f.answer}</div>
                    <div className="text-[9px] text-atlas-muted mt-1.5">
                      {f.pinned && '📌 pinned · '}{f.model_used}{f.tournament_id ? ' · 🏆 tournament' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Primitives ────────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-atlas-surface/40 border border-atlas-border rounded-xl p-4">{children}</div>
}
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={clsx('px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors',
        active ? 'bg-atlas-accent/20 border-atlas-accent text-atlas-accent' : 'bg-atlas-surface border-atlas-border text-atlas-muted hover:text-atlas-text')}>
      {children}
    </button>
  )
}
