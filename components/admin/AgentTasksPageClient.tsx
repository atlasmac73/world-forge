'use client'
/**
 * /admin/agent-tasks — THE SELF-BUILD BRAIN
 * The app's agents file tasks here. Isaac approves. Claude Code executes.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC · v66
 */

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Brain, Zap, CheckCircle, XCircle, Clock, Play, Filter,
  RefreshCw, Plus, ChevronDown, ChevronUp, Tag, GitBranch,
  AlertTriangle, Layers, ArrowUpRight, Circle
} from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = 'pending' | 'approved' | 'in_progress' | 'done' | 'rejected' | 'deferred'
type TaskType   = 'feature' | 'bug' | 'refactor' | 'infra' | 'data' | 'external' | 'research'
type TaskEffort = 'tiny' | 'small' | 'medium' | 'large' | 'epic'

interface AgentTask {
  id: string
  created_at: string
  updated_at: string
  title: string
  description?: string
  type: TaskType
  priority: number
  effort: TaskEffort
  estimated_hrs?: number
  source_agent?: string
  source_portal?: string
  target_portal?: string
  assigned_to?: string
  sprint?: number
  status: TaskStatus
  approved_at?: string
  started_at?: string
  completed_at?: string
  result_summary?: string
  pr_url?: string
  vercel_url?: string
  tags?: string[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:     { label: 'Pending',     color: '#f0a000', bg: 'rgba(240,160,0,.12)',   icon: <Clock size={10} /> },
  approved:    { label: 'Approved',    color: '#18c8e8', bg: 'rgba(24,200,232,.12)',  icon: <CheckCircle size={10} /> },
  in_progress: { label: 'In Progress', color: '#9b87fa', bg: 'rgba(155,135,250,.12)', icon: <Play size={10} /> },
  done:        { label: 'Done',        color: '#00d48a', bg: 'rgba(0,212,138,.12)',   icon: <CheckCircle size={10} /> },
  rejected:    { label: 'Rejected',    color: '#ff3050', bg: 'rgba(255,48,80,.12)',   icon: <XCircle size={10} /> },
  deferred:    { label: 'Deferred',    color: '#4a5268', bg: 'rgba(74,82,104,.12)',   icon: <Circle size={10} /> },
}

const TYPE_COLORS: Record<TaskType, string> = {
  feature:  '#18c8e8',
  bug:      '#ff3050',
  refactor: '#9b87fa',
  infra:    '#f0a000',
  data:     '#00d48a',
  external: '#f8872c',
  research: '#f687b3',
}

const EFFORT_HRS: Record<TaskEffort, string> = {
  tiny: '< 1h', small: '1–4h', medium: '4–16h', large: '16–40h', epic: '40h+'
}

const PRIORITY_LABEL = (p: number) =>
  p >= 95 ? { label: 'BLOCKER', color: '#ff3050' }
  : p >= 80 ? { label: 'CRITICAL', color: '#f0a000' }
  : p >= 60 ? { label: 'HIGH', color: '#18c8e8' }
  : p >= 40 ? { label: 'MEDIUM', color: '#9b87fa' }
  : { label: 'LOW', color: '#4a5268' }

// ─── Component ────────────────────────────────────────────────────────────────

export default function AgentTasksPage() {
  const supabase = createClient()

  const [tasks, setTasks]             = useState<AgentTask[]>([])
  const [loading, setLoading]         = useState(true)
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all')
  const [filterSprint, setFilterSprint] = useState<number | 'all'>('all')
  const [filterPortal, setFilterPortal] = useState<string>('all')
  const [expanded, setExpanded]       = useState<string | null>(null)
  const [updatingId, setUpdatingId]   = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // ── Stats ──
  const stats = {
    total:       tasks.length,
    pending:     tasks.filter(t => t.status === 'pending').length,
    approved:    tasks.filter(t => t.status === 'approved').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done:        tasks.filter(t => t.status === 'done').length,
    blockers:    tasks.filter(t => t.priority >= 95 && t.status !== 'done').length,
  }

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('agent_tasks')
      .select('*')
      .order('priority', { ascending: false })
    if (error) {
      toast.error('Failed to load tasks: ' + error.message)
    } else {
      setTasks(data ?? [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id: string, status: TaskStatus) => {
    setUpdatingId(id)
    const patch: Partial<AgentTask> = { status }
    if (status === 'approved')    patch.approved_at   = new Date().toISOString()
    if (status === 'in_progress') patch.started_at    = new Date().toISOString()
    if (status === 'done')        patch.completed_at  = new Date().toISOString()

    const { error } = await supabase.from('agent_tasks').update(patch).eq('id', id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(`Task marked ${status}`)
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
    }
    setUpdatingId(null)
  }

  // ── Filtering ──
  const portals = Array.from(new Set(tasks.map(t => t.target_portal).filter((p): p is string => Boolean(p))))
  const sprints = Array.from(new Set(tasks.map(t => t.sprint).filter((s): s is number => typeof s === 'number'))).sort((a, b) => a - b)

  const visible = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    if (filterSprint !== 'all' && t.sprint !== filterSprint) return false
    if (filterPortal !== 'all' && t.target_portal !== filterPortal) return false
    return true
  })

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#060810', color: '#e8eaf0', padding: 24, fontFamily: "'Space Mono', monospace" }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,.08)', paddingBottom: 20 }}>
          <div style={{ fontSize: 10, color: '#f0a000', letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 6 }}>
            ⬡ ATLAS GENESIS MATRIX · SELF-BUILD BRAIN · v66
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Brain size={20} color="#9b87fa" />
            <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Syne', sans-serif", letterSpacing: '-.02em' }}>
              Agent Task Queue
            </h1>
          </div>
          <p style={{ fontSize: 11, color: '#8892b0', lineHeight: 1.6 }}>
            Agents generate tasks. You approve. Claude Code executes. This is the real self-build loop.
          </p>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 20 }}>
          {[
            { label: 'TOTAL',       value: stats.total,       color: '#e8eaf0' },
            { label: 'PENDING',     value: stats.pending,     color: '#f0a000' },
            { label: 'APPROVED',    value: stats.approved,    color: '#18c8e8' },
            { label: 'IN PROGRESS', value: stats.in_progress, color: '#9b87fa' },
            { label: 'DONE',        value: stats.done,        color: '#00d48a' },
            { label: 'BLOCKERS',    value: stats.blockers,    color: '#ff3050' },
          ].map(s => (
            <div key={s.label} style={{ background: '#0a0d18', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: '#4a5268', marginTop: 3, letterSpacing: '.1em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Filter size={12} color="#4a5268" />

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as TaskStatus | 'all')}
            style={{ background: '#0a0d18', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, color: '#e8eaf0', fontSize: 11, padding: '5px 10px', fontFamily: 'inherit' }}
          >
            <option value="all">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <select
            value={filterSprint === 'all' ? 'all' : String(filterSprint)}
            onChange={e => setFilterSprint(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            style={{ background: '#0a0d18', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, color: '#e8eaf0', fontSize: 11, padding: '5px 10px', fontFamily: 'inherit' }}
          >
            <option value="all">All Sprints</option>
            {sprints.map(s => <option key={s} value={s}>Sprint {s}</option>)}
          </select>

          <select
            value={filterPortal}
            onChange={e => setFilterPortal(e.target.value)}
            style={{ background: '#0a0d18', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, color: '#e8eaf0', fontSize: 11, padding: '5px 10px', fontFamily: 'inherit' }}
          >
            <option value="all">All Portals</option>
            {portals.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              onClick={load}
              style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, color: '#8892b0', fontSize: 11, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}
            >
              <RefreshCw size={11} /> Refresh
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              style={{ background: 'rgba(155,135,250,.15)', border: '1px solid rgba(155,135,250,.3)', borderRadius: 6, color: '#9b87fa', fontSize: 11, padding: '5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}
            >
              <Plus size={11} /> New Task
            </button>
          </div>
        </div>

        {/* Task count */}
        <div style={{ fontSize: 10, color: '#4a5268', marginBottom: 10, letterSpacing: '.08em' }}>
          SHOWING {visible.length} OF {tasks.length} TASKS · SORTED BY PRIORITY
        </div>

        {/* Task list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#4a5268', fontSize: 12 }}>
            <Brain size={24} style={{ marginBottom: 8, opacity: .4 }} />
            <div>Loading task queue…</div>
          </div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#4a5268', fontSize: 12 }}>
            <Layers size={24} style={{ marginBottom: 8, opacity: .4 }} />
            <div>No tasks match current filters.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {visible.map(task => {
              const sc  = STATUS_CONFIG[task.status]
              const pri = PRIORITY_LABEL(task.priority)
              const isExpanded = expanded === task.id
              const isUpdating = updatingId === task.id

              return (
                <div
                  key={task.id}
                  style={{
                    background: '#0a0d18',
                    border: `1px solid ${task.priority >= 95 ? 'rgba(255,48,80,.25)' : 'rgba(255,255,255,.07)'}`,
                    borderRadius: 10,
                    overflow: 'hidden',
                    transition: 'border-color .15s',
                  }}
                >
                  {/* Task row */}
                  <div
                    style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12 }}
                    onClick={() => setExpanded(isExpanded ? null : task.id)}
                  >
                    {/* Priority bar */}
                    <div style={{ width: 3, alignSelf: 'stretch', minHeight: 36, borderRadius: 2, background: pri.color, flexShrink: 0 }} />

                    {/* Main content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        {/* Priority badge */}
                        <span style={{ fontSize: 9, fontWeight: 700, color: pri.color, letterSpacing: '.1em' }}>
                          [{task.priority}] {pri.label}
                        </span>

                        {/* Title */}
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#e8eaf0', fontFamily: "'Syne', sans-serif" }}>
                          {task.title}
                        </span>
                      </div>

                      {/* Metadata row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {/* Status pill */}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 100, fontSize: 9, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.color}40` }}>
                          {sc.icon} {sc.label}
                        </span>

                        {/* Type */}
                        <span style={{ fontSize: 9, color: TYPE_COLORS[task.type], padding: '1px 6px', background: `${TYPE_COLORS[task.type]}15`, borderRadius: 4 }}>
                          {task.type}
                        </span>

                        {/* Effort */}
                        <span style={{ fontSize: 9, color: '#4a5268' }}>
                          {task.effort} · {EFFORT_HRS[task.effort]}
                        </span>

                        {/* Portal */}
                        {task.target_portal && (
                          <span style={{ fontSize: 9, color: '#18c8e8', padding: '1px 6px', background: 'rgba(24,200,232,.08)', borderRadius: 4 }}>
                            → {task.target_portal}
                          </span>
                        )}

                        {/* Sprint */}
                        {task.sprint && (
                          <span style={{ fontSize: 9, color: '#4a5268' }}>sprint {task.sprint}</span>
                        )}

                        {/* Source agent */}
                        {task.source_agent && (
                          <span style={{ fontSize: 9, color: '#9b87fa' }}>via {task.source_agent}</span>
                        )}
                      </div>
                    </div>

                    {/* Chevron */}
                    <div style={{ color: '#4a5268', flexShrink: 0, marginTop: 2 }}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{ padding: '0 14px 14px 29px', borderTop: '1px solid rgba(255,255,255,.05)' }}>
                      {task.description && (
                        <p style={{ fontSize: 12, color: '#8892b0', lineHeight: 1.65, marginBottom: 12, marginTop: 10 }}>
                          {task.description}
                        </p>
                      )}

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                          <Tag size={10} color="#4a5268" style={{ marginTop: 2 }} />
                          {task.tags.map(tag => (
                            <span key={tag} style={{ fontSize: 9, background: 'rgba(255,255,255,.05)', color: '#4a5268', padding: '2px 6px', borderRadius: 4 }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Links */}
                      {(task.pr_url || task.vercel_url) && (
                        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                          {task.pr_url && (
                            <a href={task.pr_url} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 10, color: '#18c8e8', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                              <GitBranch size={10} /> PR <ArrowUpRight size={9} />
                            </a>
                          )}
                          {task.vercel_url && (
                            <a href={task.vercel_url} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 10, color: '#00d48a', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                              ▲ Preview <ArrowUpRight size={9} />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Result summary */}
                      {task.result_summary && (
                        <div style={{ background: 'rgba(0,212,138,.06)', border: '1px solid rgba(0,212,138,.2)', borderRadius: 7, padding: '8px 10px', marginBottom: 12, fontSize: 11, color: '#00d48a' }}>
                          ✓ {task.result_summary}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                        {task.status === 'pending' && (
                          <>
                            <ActionBtn
                              label="Approve →"
                              color="#18c8e8"
                              loading={isUpdating}
                              onClick={() => updateStatus(task.id, 'approved')}
                            />
                            <ActionBtn
                              label="Defer"
                              color="#4a5268"
                              loading={isUpdating}
                              onClick={() => updateStatus(task.id, 'deferred')}
                            />
                            <ActionBtn
                              label="Reject"
                              color="#ff3050"
                              loading={isUpdating}
                              onClick={() => updateStatus(task.id, 'rejected')}
                            />
                          </>
                        )}
                        {task.status === 'approved' && (
                          <ActionBtn
                            label="▶ Start"
                            color="#9b87fa"
                            loading={isUpdating}
                            onClick={() => updateStatus(task.id, 'in_progress')}
                          />
                        )}
                        {task.status === 'in_progress' && (
                          <ActionBtn
                            label="✓ Mark Done"
                            color="#00d48a"
                            loading={isUpdating}
                            onClick={() => updateStatus(task.id, 'done')}
                          />
                        )}
                        {(task.status === 'done' || task.status === 'rejected') && (
                          <ActionBtn
                            label="↩ Reopen"
                            color="#f0a000"
                            loading={isUpdating}
                            onClick={() => updateStatus(task.id, 'pending')}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* New Task Modal */}
        {showAddModal && (
          <AddTaskModal
            onClose={() => setShowAddModal(false)}
            onSaved={() => { setShowAddModal(false); load() }}
            supabase={supabase}
          />
        )}

        <div style={{ marginTop: 30, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.06)', fontSize: 9, color: '#4a5268', textAlign: 'center', letterSpacing: '.1em' }}>
          ATLAS GENESIS MATRIX LLC · ISAAC BRANDON BURDETTE, SOLE INVENTOR · SAINT ALBANS WV · PATENT PENDING
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionBtn({ label, color, loading, onClick }: { label: string; color: string; loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        background: `${color}18`,
        border: `1px solid ${color}40`,
        borderRadius: 6,
        color,
        fontSize: 10,
        padding: '4px 10px',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? .5 : 1,
        fontFamily: "'Space Mono', monospace",
        transition: 'opacity .15s',
      }}
    >
      {loading ? '…' : label}
    </button>
  )
}

function AddTaskModal({ onClose, onSaved, supabase }: { onClose: () => void; onSaved: () => void; supabase: ReturnType<typeof createClient> }) {
  const [form, setForm] = useState({
    title: '', description: '', type: 'feature', priority: 50,
    effort: 'medium', target_portal: '', assigned_to: 'claude-code',
    sprint: 1, tags: '',
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return }
    setSaving(true)
    const { error } = await supabase.from('agent_tasks').insert({
      ...form,
      priority: Number(form.priority),
      sprint: Number(form.sprint),
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Task created')
      onSaved()
    }
    setSaving(false)
  }

  const iStyle = { background: '#060810', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, color: '#e8eaf0', fontSize: 12, padding: '7px 10px', width: '100%', fontFamily: "'Space Mono', monospace", boxSizing: 'border-box' as const }
  const lStyle = { fontSize: 9, color: '#8892b0', letterSpacing: '.1em', marginBottom: 5, display: 'block' as const }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#0a0d18', border: '1px solid rgba(155,135,250,.3)', borderRadius: 14, padding: 24, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 18, fontFamily: "'Syne', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={14} color="#9b87fa" /> New Agent Task
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={lStyle}>TITLE *</label><input style={iStyle} value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="What needs to be built?" /></div>
          <div><label style={lStyle}>DESCRIPTION</label><textarea style={{...iStyle, minHeight: 70, resize: 'vertical'}} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Context, links, acceptance criteria…" /></div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lStyle}>TYPE</label>
              <select style={iStyle} value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                {['feature','bug','refactor','infra','data','external','research'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={lStyle}>EFFORT</label>
              <select style={iStyle} value={form.effort} onChange={e => setForm(f => ({...f, effort: e.target.value}))}>
                {['tiny','small','medium','large','epic'].map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div><label style={lStyle}>PRIORITY (0–100)</label><input style={iStyle} type="number" min={0} max={100} value={form.priority} onChange={e => setForm(f => ({...f, priority: Number(e.target.value)}))} /></div>
            <div><label style={lStyle}>SPRINT</label><input style={iStyle} type="number" min={1} value={form.sprint} onChange={e => setForm(f => ({...f, sprint: Number(e.target.value)}))} /></div>
            <div><label style={lStyle}>PORTAL</label><input style={iStyle} value={form.target_portal} onChange={e => setForm(f => ({...f, target_portal: e.target.value}))} placeholder="e.g. deals" /></div>
          </div>

          <div><label style={lStyle}>ASSIGNED TO</label><input style={iStyle} value={form.assigned_to} onChange={e => setForm(f => ({...f, assigned_to: e.target.value}))} placeholder="claude-code | isaac | agent-code" /></div>
          <div><label style={lStyle}>TAGS (comma separated)</label><input style={iStyle} value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))} placeholder="v66, ai, deploy" /></div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, color: '#8892b0', fontSize: 11, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button onClick={save} disabled={saving} style={{ background: 'rgba(155,135,250,.2)', border: '1px solid rgba(155,135,250,.4)', borderRadius: 6, color: '#9b87fa', fontSize: 11, padding: '6px 16px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? .6 : 1 }}>
            {saving ? 'Saving…' : '+ Create Task'}
          </button>
        </div>
      </div>
    </div>
  )
}
