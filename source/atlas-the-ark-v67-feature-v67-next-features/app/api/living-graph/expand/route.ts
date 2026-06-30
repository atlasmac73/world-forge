/**
 * THE ARK — Living Graph Expansion Engine
 * POST /api/living-graph/expand
 * 12-layer intelligence pipeline → ~50 Atlas nodes
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const Schema = z.object({
  seed:    z.string().min(1).max(500),
  depth:   z.number().int().min(1).max(3).default(1),
  filters: z.array(z.string()).optional(),
})

const MOCK_NODES = (seed: string) => ([
  { id: 'portal-deals', label: 'Deal Navigator', type: 'portal', description: `Find distressed properties related to "${seed}"`, creditCost: 0, minTier: 'T1' },
  { id: 'agent-oracle', label: 'A01-ORACLE', type: 'agent', description: 'Master intelligence orchestrator', creditCost: 10, minTier: 'T1' },
  { id: 'wf-skip-trace', label: 'Skip Trace Flow', type: 'workflow', description: 'Locate owner contact info automatically', creditCost: 5, minTier: 'T1' },
  { id: 'conn-propstream', label: 'PropStream', type: 'connector', description: 'Live MLS + public records data', creditCost: 2, minTier: 'T2' },
  { id: 'prompt-distress', label: 'Distress Analyzer', type: 'prompt', description: 'Score property financial distress', creditCost: 3, minTier: 'T1' },
  { id: 'model-sonnet', label: 'Claude Sonnet', type: 'model', description: 'Primary AI reasoning engine', creditCost: 8, minTier: 'T1' },
  { id: 'ds-kanawha', label: 'Kanawha County Records', type: 'datasource', description: 'WV deed and lien data', creditCost: 0, minTier: 'T1' },
  { id: 'risk-title', label: 'Title Cloud Risk', type: 'risk', description: 'Clouded title may block deal', creditCost: 0, minTier: 'T1' },
  { id: 'opp-wholesale', label: 'Wholesale Exit', type: 'opportunity', description: 'Assign contract for $15-30K profit', creditCost: 0, minTier: 'T1' },
  { id: 'action-loi', label: 'Generate LOI', type: 'action', description: 'Create Letter of Intent immediately', creditCost: 5, minTier: 'T1' },
])

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError

  try {
    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { seed } = parsed.data
    const supabase = createClient()

    // Mock mode when AI not configured
    if (!process.env.ANTHROPIC_API_KEY) {
      const nodes = MOCK_NODES(seed)
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'living_graph.expand',
        resource_type: 'graph',
        metadata: { seed, node_count: nodes.length, mock: true },
      })
      return NextResponse.json({ ok: true, data: { nodes, seed, mock: true } })
    }

    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: `You are the ATLAS Living Graph Expansion Engine. Expand any concept into exactly 40 Atlas intelligence nodes.
Node types: portal, agent, workflow, connector, prompt, model, datasource, risk, opportunity, action.
Platform: ATLAS Genesis Matrix — real estate AI OS for West Virginia/Appalachian market.
Isaac Brandon Burdette, sole inventor. God Squad agents: A01-ORACLE through A25-ZEUS.
Return ONLY a valid JSON array. No markdown. No explanation. No code blocks.`,
      messages: [{
        role: 'user',
        content: `Expand the concept "${seed}" into 40 Atlas nodes.
Each node: { id: string (slug), label: string (short name), type: string (one of 10 types), description: string (one sentence), creditCost: number (0-50), minTier: string (T1-T7) }
Return ONLY the JSON array.`
      }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const match = raw.match(/\[[\s\S]*\]/)
    if (!match) {
      return NextResponse.json({ ok: true, data: { nodes: MOCK_NODES(seed), seed, fallback: true } })
    }

    const nodes = JSON.parse(match[0])

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'living_graph.expand',
      resource_type: 'graph',
      metadata: { seed, node_count: nodes.length },
    })

    return NextResponse.json({ ok: true, data: { nodes, seed } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Expansion failed'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
