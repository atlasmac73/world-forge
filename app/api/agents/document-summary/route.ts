/**
 * THE ARK — Document Summary Agent (Part E-009 v0.6)
 * Summarizes uploaded project documents using A09-CIPHER context + Claude
 * POST /api/agents/document-summary
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkKillSwitch, KILL_SWITCH_RESPONSE } from '@/lib/agents/killSwitch'
import { writeAuditLog } from '@/lib/audit/logger'

export const dynamic = 'force-dynamic'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // v67: Kill switch check
  const { armed } = await checkKillSwitch(supabase)
  if (armed) {
    await writeAuditLog({
      user_id: user.id, action: 'AGENT_RUN_BLOCKED',
      resource_type: 'document.summary', metadata: { reason: 'kill_switch' },
    })
    return NextResponse.json(KILL_SWITCH_RESPONSE, { status: 503 })
  }

  const { file_id, project_id, document_text, document_name } = await req.json()
  if (!document_text?.trim() && !file_id) {
    return NextResponse.json({ error: 'document_text or file_id required' }, { status: 400 })
  }

  try {

  // Get document text from DB if file_id provided
  let docText = document_text
  let fileName = document_name

  if (file_id && !docText) {
    const { data: file } = await supabase
      .from('project_files')
      .select('extracted_text, file_name')
      .eq('id', file_id)
      .eq('user_id', user.id)
      .single()

    if (!file?.extracted_text) {
      return NextResponse.json({ error: 'Document not yet parsed or empty' }, { status: 400 })
    }
    docText = file.extracted_text
    fileName = file.file_name
  }

  // Get project context
  let projectContext = ''
  if (project_id) {
    const { data: proj } = await supabase
      .from('contractor_projects')
      .select('project_name, customer_name, scope_summary, status')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single()

    if (proj) {
      projectContext = `Project: ${proj.project_name} | Customer: ${proj.customer_name} | Status: ${proj.status}`
    }
  }

  const startTime = Date.now()

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: `You are the ATLAS Document Summary Agent — part of the contractor project command center.

Summarize construction/real estate documents for contractors. Focus on:
- Scope of work
- Key deliverables and deadlines
- Open questions and assumptions
- Risk factors
- Budget/cost items
- Permit/compliance requirements
- Customer commitments

Return JSON: {
  summary: "2-3 paragraph plain-English summary",
  key_points: ["array of 5-8 key points"],
  open_questions: ["unanswered questions or assumptions"],
  risks: ["risks or concerns"],
  action_items: ["recommended next actions"],
  document_type: "proposal|scope|estimate|permit|contract|email|receipt|other",
  confidence: 0-100
}

Return ONLY valid JSON. No markdown.`,
    messages: [{
      role: 'user',
      content: `Summarize this document:
File: ${fileName ?? 'Project Document'}
${projectContext ? `Project context: ${projectContext}` : ''}

Document text (truncated to 6000 chars):
${docText.slice(0, 6000)}`
    }]
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
  let result
  try {
    result = JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch {
    result = {
      summary: raw.slice(0, 500),
      key_points: [],
      open_questions: [],
      risks: [],
      action_items: [],
      document_type: 'other',
      confidence: 50,
    }
  }

  const duration_ms = Date.now() - startTime

  // Update file with summary
  if (file_id) {
    await supabase.from('project_files')
      .update({ summary: result.summary })
      .eq('id', file_id)
      .eq('user_id', user.id)
  }

  // Log agent run
  await supabase.from('agent_runs').insert({
    user_id: user.id,
    agent_code: 'FC-21',
    tool_name: 'document.summary',
    status: 'completed',
    input: { file_id, document_name: fileName, project_id },
    output: result,
    credits_consumed: 5,
    tokens_used: response.usage.input_tokens + response.usage.output_tokens,
    duration_ms,
    completed_at: new Date().toISOString(),
  })

  // Log trust event
  await supabase.from('trust_events').insert({
    user_id: user.id,
    event_type: 'agent_run_completed',
    resource_type: 'document',
    resource_id: file_id,
    description: `Document summary: ${fileName}`,
    metadata: { agent: 'FC-21', tokens: response.usage.input_tokens + response.usage.output_tokens }
  })

  await writeAuditLog({
    user_id: user.id, action: 'DOCUMENT_SUMMARIZED',
    resource_type: 'document', resource_id: file_id ?? undefined,
    metadata: { document_name: fileName, project_id, document_type: result.document_type },
  })

  return NextResponse.json({
    ...result,
    file_id,
    project_id,
    agent: 'FC-21 (Real Estate Agent)',
    duration_ms,
    tokens: response.usage.input_tokens + response.usage.output_tokens,
  })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Document summary failed'
    await writeAuditLog({
      user_id: user.id, action: 'DOCUMENT_SUMMARIZED',
      resource_type: 'document', resource_id: file_id ?? undefined,
      metadata: { document_name, project_id, error: message },
    })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
