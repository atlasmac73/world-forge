'use client'

import { AdminInviteManager } from '@/components/AdminInviteManager'
import { Shield, Users, Activity, Flag, MessageSquare } from 'lucide-react'
import { useState } from 'react'

type AdminTab = 'invites' | 'users' | 'flags' | 'feedback' | 'audit'

export function AdminPortal() {
  const [tab, setTab] = useState<AdminTab>('invites')

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'invites',  label: 'Invites',       icon: <Users size={13} /> },
    { id: 'feedback', label: 'Beta Feedback',  icon: <MessageSquare size={13} /> },
    { id: 'flags',    label: 'Feature Flags',  icon: <Flag size={13} /> },
    { id: 'audit',    label: 'Audit Log',      icon: <Activity size={13} /> },
  ]

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="atlas-panel rounded-xl p-5">
        <div className="flex items-center gap-3 mb-1">
          <Shield size={16} className="text-[#63b3ed]" />
          <h1 className="text-sm font-bold text-atlas-accent">Admin Control Panel</h1>
          <span className="text-[10px] bg-[#1a3a5f] text-[#63b3ed] border border-[#1e3a5f] px-2 py-0.5 rounded-full font-medium">
            OWNER / ADMIN
          </span>
        </div>
        <p className="text-[11px] text-atlas-muted">
          Manage invites, feature flags, feedback, and audit logs. Atlas Genesis Matrix LLC — Isaac Brandon Burdette.
        </p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              tab === t.id
                ? 'bg-[#1e3a5f] border-[#63b3ed] text-[#63b3ed]'
                : 'border-[#1e3a5f] text-[#4a6fa5] hover:border-[#2d5a8f]'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'invites' && <AdminInviteManager />}

      {tab === 'feedback' && <FeedbackPanel />}

      {tab === 'flags' && <FlagsPanel />}

      {tab === 'audit' && <AuditPanel />}
    </div>
  )
}

// ─── Feedback Panel ──────────────────────────────────────────────────────────

function FeedbackPanel() {
  const [items, setItems] = useState<{type:string;portal?:string;rating?:number;message:string;created_at:string}[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/beta/feedback?admin=1')
    const data = await res.json()
    setItems((data.data ?? []) as {type:string;portal?:string;rating?:number;message:string;created_at:string}[])
    setLoading(false)
    setLoaded(true)
  }

  const TYPE_COLOR: Record<string, string> = {
    bug: 'text-[#fc8181]', feature: 'text-[#63b3ed]', ux: 'text-[#f6c90e]',
    performance: 'text-[#f6ad55]', general: 'text-[#4a6fa5]',
  }

  return (
    <div className="atlas-panel rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-sm font-semibold">Beta Feedback</h3>
        <button onClick={load} disabled={loading} className="text-xs text-[#63b3ed] hover:underline">
          {loading ? 'Loading...' : loaded ? 'Refresh' : 'Load feedback'}
        </button>
      </div>
      {!loaded && <p className="text-[#4a6fa5] text-xs text-center py-4">Click &quot;Load feedback&quot; to view submissions</p>}
      {loaded && items.length === 0 && <p className="text-[#4a6fa5] text-xs text-center py-4">No feedback yet</p>}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="bg-[#080e1a] border border-[#1e3a5f] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-medium uppercase ${TYPE_COLOR[String(item.type)] ?? 'text-[#4a6fa5]'}`}>
                {String(item.type)}
              </span>
              {item.portal && <span className="text-[#2d4a6e] text-[10px]">· {String(item.portal)}</span>}
              {item.rating && <span className="text-[#f6c90e] text-[10px]">{'★'.repeat(Number(item.rating))}</span>}
              <span className="text-[#2d4a6e] text-[10px] ml-auto">
                {new Date(String(item.created_at)).toLocaleDateString()}
              </span>
            </div>
            <p className="text-white text-xs">{String(item.message)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Flags Panel ─────────────────────────────────────────────────────────────

function FlagsPanel() {
  return (
    <div className="atlas-panel rounded-xl p-5">
      <h3 className="text-white text-sm font-semibold mb-3">Feature Flags</h3>
      <p className="text-[#4a6fa5] text-xs mb-4">
        Flags are managed in Supabase → feature_flags table. Run SQL to toggle.
      </p>
      <div className="bg-[#080e1a] border border-[#1e3a5f] rounded-lg p-4">
        <pre className="text-[#63b3ed] text-[11px] font-mono leading-relaxed">{`-- Enable a portal
UPDATE feature_flags SET enabled = TRUE
WHERE flag_key = 'PORTAL_LIVING_GRAPH';

-- Disable billing
UPDATE feature_flags SET enabled = FALSE
WHERE flag_key = 'BILLING_ENABLED';

-- See all flags
SELECT flag_key, enabled FROM feature_flags
ORDER BY flag_key;`}</pre>
      </div>
    </div>
  )
}

// ─── Audit Panel ─────────────────────────────────────────────────────────────

function AuditPanel() {
  const [events, setEvents] = useState<{action:string;resource_type?:string;created_at:string}[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/audit?limit=50')
    const data = await res.json()
    setEvents((data.events ?? []) as {action:string;resource_type?:string;created_at:string}[])
    setLoading(false)
  }

  return (
    <div className="atlas-panel rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-sm font-semibold">Audit Log</h3>
        <button onClick={load} disabled={loading} className="text-xs text-[#63b3ed] hover:underline">
          {loading ? 'Loading...' : 'Load audit log'}
        </button>
      </div>
      <div className="space-y-1.5">
        {events.length === 0 && <p className="text-[#4a6fa5] text-xs text-center py-4">Click to load</p>}
        {events.map((e, i) => (
          <div key={i} className="flex items-center gap-3 text-[10px] py-1.5 border-b border-[#0d1829]">
            <span className="text-[#2d4a6e] w-20 shrink-0">
              {new Date(String(e.created_at)).toLocaleTimeString()}
            </span>
            <span className="text-[#63b3ed] font-mono">{String(e.action)}</span>
            <span className="text-[#4a6fa5]">{String(e.resource_type ?? '')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
