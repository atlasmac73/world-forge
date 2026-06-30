// lib/agents/callAgentRun.ts
// The callAgentRun() function — THE missing piece from the v9 action plan
// Called by frontend components to execute any ATLAS agent
// Routes to: Backend /api/plans/run → provider ladder → Claude/Ollama

export interface AgentRunOptions {
  maxTokens?: number
  portal?: string
  trace_id?: string
}

export interface AgentRunResult {
  output?: string
  raw?: string
  [key: string]: any
  _meta?: {
    trace_id: string
    agent_slug: string
    quality_score: number
    model_used: string
    duration_ms: number
    cost_usd: number
  }
}

/**
 * callAgentRun — Execute any ATLAS agent from the frontend
 *
 * Usage:
 *   const result = await callAgentRun('skip-tracer', { address: '123 Main St' })
 *   const result = await callAgentRun('deal-underwriter', { address, arv: 120000 })
 *
 * Maps to: POST /api/plans/run
 * If BACKEND_URL not set: queues to localStorage outbox for later sync
 */
export async function callAgentRun(
  slug: string,
  input: Record<string, any>,
  options: AgentRunOptions = {}
): Promise<AgentRunResult | null> {
  // Try backend first
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  if (!backendUrl) {
    // Queue for later sync (offline mode)
    queueToOutbox(slug, input)
    console.info(`[callAgentRun] ${slug} queued — set NEXT_PUBLIC_BACKEND_URL to execute`)
    return null
  }

  try {
    const res = await fetch(`${backendUrl}/api/plans/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_slug: slug,
        task: input,
        ...(options.trace_id ? { trace_id: options.trace_id } : {}),
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      console.error(`[callAgentRun] ${slug} failed:`, err.error)
      return { error: err.error, raw: '', _meta: undefined }
    }

    const data = await res.json()

    // Normalize output — the result may be structured JSON or raw text
    const output = data.raw
      ? data.raw
      : Object.entries(data)
          .filter(([k]) => k !== '_meta')
          .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
          .join('\n')

    return { ...data, output, creditsUsed: 1 }

  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.error(`[callAgentRun] ${slug} timed out`)
      return { error: 'Agent timed out after 30s', output: '' }
    }
    console.error(`[callAgentRun] ${slug} error:`, err.message)
    queueToOutbox(slug, input)
    return null
  }
}

// Outbox for offline queueing (from v9 action plan pattern)
function queueToOutbox(slug: string, input: Record<string, any>) {
  if (typeof localStorage === 'undefined') return
  const outbox = JSON.parse(localStorage.getItem('atlas_outbox') || '[]')
  outbox.push({
    id: `run_${Date.now()}`,
    type: 'agent_run',
    endpoint: `/api/plans/run`,
    payload: { agent_slug: slug, task: input },
    created_at: new Date().toISOString(),
    attempts: 0,
  })
  localStorage.setItem('atlas_outbox', JSON.stringify(outbox.slice(-100)))
}

// Flush outbox when backend comes back online
export async function flushOutbox(): Promise<void> {
  if (typeof localStorage === 'undefined') return
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  if (!backendUrl) return

  const outbox = JSON.parse(localStorage.getItem('atlas_outbox') || '[]')
  if (!outbox.length) return

  const remaining = []
  for (const item of outbox) {
    try {
      const res = await fetch(`${backendUrl}${item.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) remaining.push({ ...item, attempts: item.attempts + 1 })
    } catch {
      remaining.push({ ...item, attempts: item.attempts + 1 })
    }
  }

  localStorage.setItem('atlas_outbox', JSON.stringify(remaining.filter(i => i.attempts < 5)))
  console.log(`[Outbox] Flushed ${outbox.length - remaining.length}/${outbox.length} queued runs`)
}
