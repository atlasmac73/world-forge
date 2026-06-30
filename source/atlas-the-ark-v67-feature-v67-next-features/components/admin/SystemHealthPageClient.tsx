// app/admin/system-health/page.tsx
// Internal system-health dashboard. Owner/admin only.
'use client'

import { useEffect, useState } from 'react'

interface Check { name: string; status: 'ok' | 'degraded' | 'down'; detail?: string; ms?: number }
interface Health { overall: string; ts: string; checks: Check[] }

const COLORS: Record<string, string> = {
  ok: '#00d48a', degraded: '#f0a000', down: '#ff3050',
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<Health | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastFetch, setLastFetch] = useState<string>('')

  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch('/api/health', { cache: 'no-store' })
      setHealth(await res.json())
      setLastFetch(new Date().toLocaleTimeString())
    } catch {
      setHealth(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 30000) // auto-refresh every 30s
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#060810', color: '#e8eaf0', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>⬡ System Health</h1>
          <button onClick={refresh} style={{ padding: '8px 18px', background: 'rgba(24,200,232,.12)', border: '1px solid rgba(24,200,232,.35)', borderRadius: 10, color: '#18c8e8', fontWeight: 700, cursor: 'pointer' }}>
            ↻ Refresh
          </button>
        </div>
        <p style={{ color: '#4a5268', fontSize: 12, marginBottom: 24 }}>
          Auto-refreshes every 30s. Last: {lastFetch || '—'}. This page reads <code>/api/health</code> — real checks against Supabase, env, and integrations.
        </p>

        {loading && !health && <p style={{ color: '#8892b0' }}>Checking systems…</p>}

        {health && (
          <>
            <div style={{
              padding: 20, borderRadius: 16, marginBottom: 20,
              background: `${COLORS[health.overall] ?? '#4a5268'}1a`,
              border: `1px solid ${COLORS[health.overall] ?? '#4a5268'}55`,
            }}>
              <div style={{ fontSize: 12, color: '#8892b0', textTransform: 'uppercase', letterSpacing: '.12em' }}>Overall Status</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: COLORS[health.overall] ?? '#e8eaf0', marginTop: 4 }}>
                {health.overall.toUpperCase()}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {health.checks.map((c) => (
                <div key={c.name} style={{
                  padding: 16, borderRadius: 14, background: '#0a0d18',
                  border: `1px solid ${COLORS[c.status] ?? '#4a5268'}40`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</span>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[c.status] ?? '#4a5268' }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#8892b0', marginTop: 6 }}>
                    {c.status.toUpperCase()}{c.detail ? ` · ${c.detail}` : ''}{c.ms != null ? ` · ${c.ms}ms` : ''}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && !health && (
          <div style={{ padding: 20, borderRadius: 14, background: 'rgba(255,48,80,.1)', border: '1px solid rgba(255,48,80,.3)', color: '#ff3050' }}>
            Health endpoint unreachable. The app may not be deployed, or env vars are missing.
          </div>
        )}
      </div>
    </div>
  )
}
