/**
 * THE ARK — Claude Streaming Copilot (A01-ORACLE / LUKA)
 * POST /api/claude
 *
 * SECURITY:
 * - Auth required: rejects unauthenticated requests
 * - systemOverride blocked for non-owner roles
 * - Rate limited: 30 requests/min per user
 * - Usage logged to audit_logs
 * - Timeout: 30s max
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/utils/rateLimit'

export const dynamic = 'force-dynamic'

// NOTE: Cannot use edge runtime with @supabase/ssr cookie auth
export const runtime = 'nodejs'
export const maxDuration = 30

const LUKA_SYSTEM_PROMPT = `You are LUKA (Agent A01-ORACLE) — the ATLAS AI Co-Pilot and Chief of Staff.

You are the intelligence layer of THE ARK — ATLAS Genesis Matrix OS v65.
Founder and sole inventor: Isaac Brandon Burdette, Atlas Genesis Matrix LLC, Saint Albans/Nitro WV.

YOUR FULL CONTEXT:
• 33 portals: Deal Navigator, Investor War Room, Skip Trace (A12-SPECTER), AIN Heatmap, Comms Hub, Agent Lab, Swarm Nexus, Genesis Engine, WorldForge, NASDROP (hidden), and 23 more
• 255 agents: 25 God Squad (A01-ORACLE through A25-ZEUS), 9 supporting squads
• 7 tiers: T1 FREE → T7 GOD MODE ($999/mo)
• Primary market: West Virginia — Kanawha, Cabell, Putnam, Wood, Raleigh counties
• MAO Formula: (ARV × 0.70) − Repairs = Maximum Allowable Offer
• Distress scoring: 8 factors (tax delinquency +30, vacancy +20, liens +20, equity +30)

LEGAL: All IP under Atlas Genesis Matrix LLC — Isaac Brandon Burdette sole inventor.

Be concise, strategic, data-driven. Reference specific system components. Help users build with THE ARK.`

export async function POST(req: NextRequest) {
  // ─── 1. Auth check ────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized — sign in to use LUKA' }, { status: 401 })
  }

  // ─── 2. Rate limit ─────────────────────────────────────────────────────────
  const { allowed, remaining } = checkRateLimit(`claude:${user.id}`, 30, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded — 30 requests per minute' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
    )
  }

  // ─── 3. Parse & validate body ──────────────────────────────────────────────
  let messages: { role: string; content: string }[]
  let systemOverride: string | undefined

  try {
    const body = await req.json()
    messages = body.messages
    systemOverride = body.systemOverride

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 })
    }
    if (messages.length > 50) {
      return NextResponse.json({ error: 'Too many messages (max 50)' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // ─── 4. Block systemOverride for non-owners ────────────────────────────────
  if (systemOverride) {
    const svc = createServiceClient()
    const { data: profile } = await svc
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!profile || !['owner', 'admin'].includes(profile.role)) {
      systemOverride = undefined // silently ignore — don't tell attacker it was blocked
    }
  }

  // ─── 5. Check API key ─────────────────────────────────────────────────────
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      error: 'AI not configured — add ANTHROPIC_API_KEY to environment variables'
    }, { status: 503 })
  }

  // ─── 6. Stream response ────────────────────────────────────────────────────
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = client.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            system: systemOverride ?? LUKA_SYSTEM_PROMPT,
            messages: messages as Anthropic.MessageParam[],
          })

          for await (const chunk of response) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(new TextEncoder().encode(chunk.delta.text))
            }
          }

          // ─── 7. Log usage (non-blocking) ───────────────────────────────────
          const final = await response.finalMessage()
          void (async () => {
            try {
              const svc = createServiceClient()
              await svc.from('audit_logs').insert({
                user_id: user.id,
                action: 'luka.chat',
                resource_type: 'ai_message',
                metadata: {
                  model: 'claude-sonnet-4-20250514',
                  input_tokens: final.usage.input_tokens,
                  output_tokens: final.usage.output_tokens,
                  message_count: messages.length,
                },
              })
            } catch { /* non-critical */ }
          })()

        } catch (streamErr) {
          const msg = streamErr instanceof Error ? streamErr.message : 'Stream error'
          controller.enqueue(new TextEncoder().encode(`\n\n[LUKA ERROR: ${msg}]`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
        'X-RateLimit-Remaining': String(remaining),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
