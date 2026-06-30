/**
 * ATLAS v67 — Portal-Aware Chat API
 * POST /api/portals/[portalId]/chat
 *
 * Streams Claude responses with portal-specific system prompt injection.
 * Queries profiles by user_id (correct schema). Budget from subscriptions table.
 * Model selection from env vars with safe fallback.
 * Kill-switch checked before execution.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkKillSwitch, KILL_SWITCH_RESPONSE } from '@/lib/agents/killSwitch'
import { writeAuditLog } from '@/lib/audit/logger'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Portal-specific system prompt injections
const PORTAL_CONTEXTS: Record<string, string> = {
  dashboard:   'You are the ATLAS Empire Dashboard assistant. Help analyze deal pipeline, agent performance, and platform metrics.',
  deals:       'You are the ATLAS Deal Navigator. Help analyze real estate deals, calculate ARV/MAO, draft LOIs, and track pipeline stages.',
  'skip-trace':'You are ATLAS A12-SPECTER Skip Trace agent. Help find property owner contact information using data enrichment techniques.',
  ain:         'You are the ATLAS AIN (Assessor Identification Network) analyst. Help interpret WV property records, tax data, and distress signals.',
  'war-room':  'You are the ATLAS Investor War Room strategist. Help with investment analysis, market intelligence, and deal structuring.',
  agents:      'You are the ATLAS Agent Lab coordinator. Help manage, spawn, monitor, and optimize AI agent configurations.',
  genesis:     'You are the ATLAS Genesis Engine — A03-GENESIS. You run the 6-phase autopoietic cycle: SENSE→INTERPRET→MUTATE→SIMULATE→PROMOTE→LEARN.',
  autopoietic: 'You are the ATLAS Autopoietic Console. Help monitor the self-build system, review blueprints, and manage the Genesis cycle.',
  comms:       'You are the ATLAS Comms Hub assistant. Help draft SMS campaigns, email sequences, and manage TCPA-compliant outreach.',
  contractors: 'You are the ATLAS Contractor Portal assistant. Help with job bids, rehab estimates, work orders, and WV contractor management.',
  skills:      'You are the ATLAS Skills Matrix coordinator. Help manage, generate, and organize the platform skill library.',
  swarm:       'You are the ATLAS Swarm Nexus coordinator. Help design and deploy multi-agent parallel execution strategies.',
  market:      'You are the ATLAS Market Intelligence analyst. Provide WV real estate market analysis, trends, and comparable sales data.',
  loi:         'You are the ATLAS LOI Generator. Draft seller-specific Letters of Intent with BATNA negotiation framing and WV legal compliance.',
  worldforge:  'You are the ATLAS WorldForge Reality Engine. Help build the digital twin universe and world expansion system.',
  nasdrop:     'You are ATLAS NASDROP — the administrator-only God Mode interface. Full system access. Authorized admin only.',
  superllm:    'You are the ATLAS SuperLLM — the unified intelligence OS. You are the most capable, fully integrated version of ATLAS. Help with anything across all 15 portals.',
}

// Mode-specific behavior modifiers
const MODE_CONTEXTS: Record<string, string> = {
  CHAT:       'Respond conversationally. Be helpful, direct, and specific to the portal context.',
  KANBAN:     'Output structured JSON task lists when appropriate. Format: { tasks: [{ title, status, priority, assignee }] }',
  MINDMAP:    'Output hierarchical JSON for mindmap rendering when appropriate. Format: { center: string, nodes: [{ id, label, children: [] }] }',
  AUTOPILOT:  'Execute autonomously. Provide detailed step-by-step plans with expected outputs. Be decisive.',
  SWARM:      'Design multi-agent execution plans. Specify: which agents, parallel vs sequential, expected outputs per agent.',
  GENESIS:    'You are running Genesis Cycle phase analysis. Be systematic, data-driven, and propose specific actionable improvements.',
  TRANSMEDIA: 'Help with the ATLAS Chronicles transmedia universe, character development, and narrative design.',
  PATENT:     'Help draft patent claims, invention disclosures, and IP documentation. Be precise with technical language.',
  INVEST:     'Help with real estate investment analysis, deal structuring, and portfolio strategy. Show your math.',
  SKIPTRACE:  'Help find and verify property owner contact information. Be systematic and cite data confidence levels.',
}

// Model selection by tier code — use env vars with fallback
// TODO: verify exact current Anthropic model IDs before production deployment
const MODEL_BY_TIER: Record<string, string> = {
  T1: process.env.ANTHROPIC_MODEL_FAST    ?? 'claude-haiku-4-5-20251001',
  T2: process.env.ANTHROPIC_MODEL_DEFAULT ?? 'claude-sonnet-4-20250514',
  T3: process.env.ANTHROPIC_MODEL_DEFAULT ?? 'claude-sonnet-4-20250514',
  T4: process.env.ANTHROPIC_MODEL_DEFAULT ?? 'claude-sonnet-4-20250514',
  T5: process.env.ANTHROPIC_MODEL_POWER   ?? 'claude-opus-4-5-20251001',
  T6: process.env.ANTHROPIC_MODEL_POWER   ?? 'claude-opus-4-5-20251001',
  T7: process.env.ANTHROPIC_MODEL_POWER   ?? 'claude-opus-4-5-20251001',
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ portalId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Kill switch check
  const { armed } = await checkKillSwitch(supabase)
  if (armed) {
    await writeAuditLog({
      user_id: user.id, action: 'AGENT_RUN_BLOCKED',
      resource_type: 'portal.chat', resource_id: (await params).portalId, metadata: { reason: 'kill_switch' },
    })
    return NextResponse.json(KILL_SWITCH_RESPONSE, { status: 503 })
  }

  // BLOCKER 1+4 FIX: Query profiles by user_id (not id)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('user_id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
  if (!profile.is_active) return NextResponse.json({ error: 'Account inactive' }, { status: 403 })

  // BLOCKER 4 FIX: Budget/tier from subscriptions table (not profiles)
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('tier_code, credits_used_today, credits_limit_daily')
    .eq('user_id', user.id)
    .single()

  const tierCode = sub?.tier_code ?? 'T1'
  const creditsUsed = sub?.credits_used_today ?? 0
  const creditsLimit = sub?.credits_limit_daily ?? 100

  // Budget check (skip for owner/admin)
  const isPrivileged = ['owner', 'admin'].includes(profile.role ?? '')
  if (!isPrivileged && creditsUsed >= creditsLimit) {
    return NextResponse.json({
      error: `Daily credit limit reached (${creditsUsed}/${creditsLimit}). Upgrade your tier for more credits.`,
    }, { status: 402 })
  }

  const { message, mode = 'CHAT', history = [] } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 })

  const portalId = (await params).portalId
  const portalContext = PORTAL_CONTEXTS[portalId] ?? PORTAL_CONTEXTS.superllm
  const modeContext = MODE_CONTEXTS[mode] ?? MODE_CONTEXTS.CHAT

  // BLOCKER 9 FIX: Model from env var map with fallback — never hard-coded
  const baseModel = MODEL_BY_TIER[tierCode] ?? MODEL_BY_TIER.T1
  // GENESIS and AUTOPILOT always use the best available model regardless of tier
  const model = (mode === 'GENESIS' || mode === 'AUTOPILOT')
    ? (process.env.ANTHROPIC_MODEL_POWER ?? 'claude-opus-4-5-20251001')
    : baseModel

  const systemPrompt = [
    'You are ATLAS — an AI-powered real estate intelligence and business operations platform.',
    `Active Portal: ${portalId}. ${portalContext}`,
    `Current Mode: ${mode}. ${modeContext}`,
    'Always be specific, actionable, and grounded in real estate / business context.',
    'Never expose API keys, credentials, or internal system architecture to users.',
    isPrivileged
      ? 'You are speaking with an ATLAS administrator. Full capabilities available.'
      : `User tier: ${tierCode}. Credits today: ${creditsUsed}/${creditsLimit}.`,
  ].join('\n\n')

  type MsgRole = 'user' | 'assistant'
  const messages: Array<{ role: MsgRole; content: string }> = [
    ...(history as Array<{ role: MsgRole; content: string }>).slice(-10),
    { role: 'user', content: message },
  ]

  const encoder = new TextEncoder()
  let inputTokens = 0
  let outputTokens = 0

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const streamResponse = await anthropic.messages.create({
          model,
          max_tokens: 1024,
          system: systemPrompt,
          messages,
          stream: true,
        })

        for await (const event of streamResponse) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
            )
          }
          if (event.type === 'message_start' && event.message.usage) {
            inputTokens = event.message.usage.input_tokens
          }
          if (event.type === 'message_delta' && event.usage) {
            outputTokens = event.usage.output_tokens
          }
        }

        // Update credits used (non-fatal)
        // Each portal chat = 1 credit (lightweight compared to dossier = 25)
        try {
          await supabase
            .from('subscriptions')
            .update({ credits_used_today: creditsUsed + 1 })
            .eq('user_id', user.id)
        } catch {
          // Non-fatal: credit tracking failure doesn't block the response
        }

        const costCents = Math.ceil((inputTokens * 0.000003 + outputTokens * 0.000015) * 100)

        await writeAuditLog({
          user_id: user.id, action: 'AI_CHAT_MESSAGE',
          resource_type: 'portal', resource_id: portalId,
          metadata: { mode, model, inputTokens, outputTokens, costCents },
        })

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, model, costCents })}\n\n`)
        )
        controller.close()

      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Chat failed'
        await writeAuditLog({
          user_id: user.id, action: 'AI_CHAT_MESSAGE',
          resource_type: 'portal', resource_id: portalId,
          metadata: { mode, model, error: errMsg },
        })
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
