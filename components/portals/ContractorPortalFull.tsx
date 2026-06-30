'use client'

import { useState } from 'react'
import { Hammer, Upload, Search, Bot, CheckCircle2, AlertTriangle, FileText, LayoutGrid, Plus, Loader2, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

const KANBAN_COLUMNS = [
  'Inbox', 'Captured', 'Research', 'Discovery', 'Opportunity', 'Risk',
  'Recommendation', 'Decision Required', 'Approved', 'Planned',
  'In Progress', 'Waiting', 'Blocked', 'Completed', 'Knowledge Base'
]

const DEMO_TASKS = [
  { id:'1', title:'Confirm final scope assumptions', column:'Planned', priority:'high', ai_suggested:true, approved:true },
  { id:'2', title:'Review permit requirements', column:'Planned', priority:'critical', ai_suggested:true, approved:true },
  { id:'3', title:'Confirm mechanical scope', column:'In Progress', priority:'high', ai_suggested:true, approved:true },
  { id:'4', title:'Review asbestos/lead/hazard assumptions', column:'Decision Required', priority:'critical', ai_suggested:true, approved:false },
  { id:'5', title:'Prepare customer update', column:'Recommendation', priority:'high', ai_suggested:true, approved:false },
  { id:'6', title:'Verify schedule assumptions', column:'Research', priority:'medium', ai_suggested:false, approved:true },
  { id:'7', title:'Collect missing documents', column:'In Progress', priority:'medium', ai_suggested:false, approved:true },
  { id:'8', title:'Prepare revised proposal packet', column:'Planned', priority:'high', ai_suggested:false, approved:true },
]

const DEMO_RECS = [
  { title:'Confirm Hazmat Assumptions', risk:'high', desc:'Project scope may depend on asbestos/lead review before final pricing.', evidence:['Permit Checklist.txt','Scope Notes.docx'] },
  { title:'Create Permit Checklist', risk:'critical', desc:'Permit review must complete before schedule commitment.', evidence:['Project Requirements.pdf'] },
  { title:'Prepare Customer Update', risk:'medium', desc:'Shannon Hill prefers written updates. Last update was 5 days ago.', evidence:['Customer Email Export.txt'] },
  { title:'Review Budget Jump', risk:'high', desc:'Budget increased significantly — explanation needed before presenting.', evidence:['2 Garden Center Estimate Draft.pdf'] },
]

type ViewMode = 'kanban' | 'list' | 'files' | 'recommendations'

export function ContractorPortalFull() {
  const [view, setView] = useState<ViewMode>('kanban')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeProjectTab, setActiveProjectTab] = useState('2 Garden Center')

  const PROJECT = {
    name: '2 Garden Center — Medical Tenant Improvement',
    customer: 'Shannon Hill / Family Practice',
    location: 'Broomfield, CO',
    status: 'Proposal',
    budget: '$1,342,000',
    activationScore: 23,
    valueScore: 18,
    trustScore: 4.2,
  }

  async function runDocumentSummary() {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    toast.success('Document summarized — 5 key points, 3 open questions, 2 risks extracted')
    setLoading(false)
  }

  async function runTaskExtraction() {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    toast.success('8 tasks extracted — review and approve below')
    setLoading(false)
  }

  async function generateCustomerUpdate() {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    toast.success('Customer update draft generated — review before sending')
    setLoading(false)
  }

  const displayedColumns = ['In Progress', 'Planned', 'Decision Required', 'Recommendation', 'Research', 'Completed']

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-atlas-accent flex items-center gap-2">
            <Hammer size={14} /> Atlas Project Command Center
          </h1>
          <p className="text-[10px] text-atlas-muted mt-0.5">
            Contractor OS · AllTrades · Project Intelligence · Bid Normalizer
          </p>
        </div>
        <div className="flex gap-1.5">
          {(['kanban', 'list', 'files', 'recommendations'] as ViewMode[]).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={clsx('px-2.5 py-1.5 rounded text-[10px] capitalize transition-all',
                view === v ? 'bg-atlas-accent/15 text-atlas-accent border border-atlas-accent/30' : 'text-atlas-muted hover:text-atlas-text'
              )}>{v}</button>
          ))}
        </div>
      </div>

      {/* Project header */}
      <div className="atlas-panel rounded-xl p-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold text-atlas-text">{PROJECT.name}</h2>
            <div className="text-xs text-atlas-muted mt-0.5">{PROJECT.customer} · {PROJECT.location}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-atlas-gold">{PROJECT.activationScore}</div>
              <div className="text-[9px] text-atlas-muted">Activation</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-atlas-green">{PROJECT.valueScore}</div>
              <div className="text-[9px] text-atlas-muted">Value</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-atlas-accent">{PROJECT.trustScore}/5</div>
              <div className="text-[9px] text-atlas-muted">Trust</div>
            </div>
            <span className="text-[10px] px-2 py-1 rounded bg-atlas-gold/10 border border-atlas-gold/30 text-atlas-gold">{PROJECT.status}</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-atlas-border">
          <button onClick={runDocumentSummary} disabled={loading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-atlas-border bg-atlas-surface text-atlas-muted hover:text-atlas-accent hover:border-atlas-accent/30 transition-all">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Bot size={12} />} Summarize Document
          </button>
          <button onClick={runTaskExtraction} disabled={loading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-atlas-border bg-atlas-surface text-atlas-muted hover:text-atlas-accent hover:border-atlas-accent/30 transition-all">
            <FileText size={12} /> Extract Tasks
          </button>
          <button onClick={generateCustomerUpdate} disabled={loading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-atlas-border bg-atlas-surface text-atlas-muted hover:text-atlas-accent hover:border-atlas-accent/30 transition-all">
            <ChevronRight size={12} /> Customer Update Draft
          </button>
          <div className="flex-1 flex items-center gap-2 border border-atlas-border rounded-lg px-3 bg-atlas-surface">
            <Search size={12} className="text-atlas-muted" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search project context..."
              className="flex-1 bg-transparent text-xs text-atlas-text placeholder-atlas-muted outline-none py-1.5" />
          </div>
        </div>
      </div>

      {/* Kanban view */}
      {view === 'kanban' && (
        <div className="overflow-x-auto">
          <div className="flex gap-3 pb-2 min-w-max">
            {displayedColumns.map((col) => {
              const colTasks = DEMO_TASKS.filter(t => t.column === col)
              return (
                <div key={col} className="w-52 flex-shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className={clsx('text-[10px] font-bold uppercase tracking-wide',
                      col === 'Decision Required' ? 'text-atlas-coral' :
                      col === 'In Progress' ? 'text-atlas-accent' :
                      col === 'Recommendation' ? 'text-atlas-gold' : 'text-atlas-muted'
                    )}>
                      {col}
                    </span>
                    <span className="text-[9px] text-atlas-muted px-1.5 py-0.5 rounded-full bg-atlas-surface border border-atlas-border">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {colTasks.map((task) => (
                      <div key={task.id} className={clsx(
                        'bg-atlas-surface rounded-lg border p-2.5 text-xs cursor-pointer hover:border-opacity-60 transition-all',
                        task.priority === 'critical' ? 'border-atlas-coral/40' :
                        task.priority === 'high' ? 'border-atlas-gold/30' : 'border-atlas-border'
                      )}>
                        <div className="text-atlas-text mb-1.5">{task.title}</div>
                        <div className="flex items-center gap-1.5">
                          {task.ai_suggested && (
                            <span className={clsx(
                              'text-[8px] px-1 py-0.5 rounded',
                              task.approved ? 'bg-atlas-green/15 text-atlas-green' : 'bg-atlas-gold/15 text-atlas-gold'
                            )}>
                              {task.approved ? '✓ AI' : '⚠ Pending'}
                            </span>
                          )}
                          <span className={clsx('text-[8px] px-1 py-0.5 rounded capitalize',
                            task.priority === 'critical' ? 'bg-atlas-coral/15 text-atlas-coral' :
                            task.priority === 'high' ? 'bg-atlas-gold/15 text-atlas-gold' : 'bg-atlas-muted/10 text-atlas-muted'
                          )}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                    <button className="w-full py-2 rounded-lg border border-dashed border-atlas-border/40 text-[10px] text-atlas-muted hover:text-atlas-text hover:border-atlas-border transition-all flex items-center justify-center gap-1">
                      <Plus size={10} /> Add task
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {view === 'recommendations' && (
        <div className="space-y-3">
          {DEMO_RECS.map((rec, i) => (
            <div key={i} className={clsx(
              'atlas-panel rounded-xl p-4 border',
              rec.risk === 'critical' ? 'border-atlas-coral/30' :
              rec.risk === 'high' ? 'border-atlas-gold/30' : 'border-atlas-border'
            )}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={12} className={
                    rec.risk === 'critical' ? 'text-atlas-coral' :
                    rec.risk === 'high' ? 'text-atlas-gold' : 'text-atlas-muted'
                  } />
                  <span className="text-xs font-bold text-atlas-text">{rec.title}</span>
                </div>
                <span className={clsx('text-[9px] px-1.5 py-0.5 rounded font-bold uppercase',
                  rec.risk === 'critical' ? 'bg-atlas-coral/15 text-atlas-coral' :
                  rec.risk === 'high' ? 'bg-atlas-gold/15 text-atlas-gold' : 'bg-atlas-muted/10 text-atlas-muted'
                )}>
                  {rec.risk}
                </span>
              </div>
              <p className="text-xs text-atlas-muted mb-3">{rec.desc}</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 flex flex-wrap gap-1">
                  {rec.evidence.map((e, j) => (
                    <span key={j} className="text-[9px] px-1.5 py-0.5 rounded bg-atlas-panel border border-atlas-border text-atlas-muted">{e}</span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button className="text-[10px] px-2 py-1 rounded border border-atlas-border text-atlas-muted hover:text-atlas-text transition-all">View Evidence</button>
                  <button className="text-[10px] px-2 py-1 rounded bg-atlas-accent/15 border border-atlas-accent/30 text-atlas-accent hover:bg-atlas-accent/25 transition-all">Create Task</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Files view */}
      {view === 'files' && (
        <div className="atlas-panel rounded-xl p-4">
          <div className="text-xs font-bold text-atlas-text mb-3">Project Files — 2 Garden Center</div>
          {['2 Garden Center Proposal.pdf','2 Garden Center Scope Notes.docx','Permit Checklist.txt','Customer Email Export.txt'].map((f, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-atlas-border/40 last:border-0">
              <FileText size={14} className="text-atlas-accent flex-shrink-0" />
              <span className="flex-1 text-xs text-atlas-text">{f}</span>
              <span className="text-[9px] text-atlas-green">✓ Parsed</span>
              <button className="text-[9px] text-atlas-muted hover:text-atlas-accent transition-colors">Summarize</button>
            </div>
          ))}
          <button className="mt-3 w-full py-2 rounded-lg border border-dashed border-atlas-border text-xs text-atlas-muted hover:text-atlas-text hover:border-atlas-accent/30 transition-all flex items-center justify-center gap-2">
            <Upload size={12} /> Upload Document, PDF, Estimate, or Receipt
          </button>
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="atlas-panel rounded-xl p-4">
          <div className="text-xs font-bold text-atlas-text mb-3">All Tasks</div>
          {DEMO_TASKS.map((task, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-atlas-border/40 last:border-0">
              <CheckCircle2 size={14} className={task.approved ? 'text-atlas-green' : 'text-atlas-muted'} />
              <span className="flex-1 text-xs text-atlas-text">{task.title}</span>
              <span className="text-[9px] text-atlas-muted">{task.column}</span>
              <span className={clsx('text-[9px] px-1.5 py-0.5 rounded capitalize',
                task.priority === 'critical' ? 'bg-atlas-coral/15 text-atlas-coral' :
                task.priority === 'high' ? 'bg-atlas-gold/15 text-atlas-gold' : 'bg-atlas-muted/10 text-atlas-muted'
              )}>{task.priority}</span>
            </div>
          ))}
        </div>
      )}

      {/* Before/After proof strip */}
      <div className="grid grid-cols-2 gap-3">
        <div className="atlas-panel rounded-xl p-3 border border-atlas-coral/20">
          <div className="text-[9px] text-atlas-coral font-bold uppercase mb-2">Before Atlas</div>
          {['Project info scattered across Gmail, Drive, files, notes',
            'Tasks hidden in emails — easily missed',
            'Proposal assumptions unclear and undocumented',
            'Customer updates take hours of manual review',
            'No evidence trail for AI recommendations'].map((t,i) => (
            <div key={i} className="text-[10px] text-atlas-muted flex items-start gap-1.5 mb-1">
              <span className="text-atlas-coral mt-0.5 flex-shrink-0">✗</span>{t}
            </div>
          ))}
        </div>
        <div className="atlas-panel rounded-xl p-3 border border-atlas-green/20">
          <div className="text-[9px] text-atlas-green font-bold uppercase mb-2">After Atlas</div>
          {['All project context in one workspace',
            'Tasks extracted with AI evidence and approval gates',
            'Scope assumptions surfaced and tracked',
            'Customer update draft in one click',
            'Every AI action logged in Trust Dashboard'].map((t,i) => (
            <div key={i} className="text-[10px] text-atlas-muted flex items-start gap-1.5 mb-1">
              <span className="text-atlas-green mt-0.5 flex-shrink-0">✓</span>{t}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}



