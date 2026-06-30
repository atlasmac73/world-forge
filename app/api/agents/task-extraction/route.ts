/**
 * THE ARK — Task Extraction Agent (Part E-009 v0.6)
 * Extracts tasks from documents/emails — REQUIRES HUMAN APPROVAL before creation.
 * Never creates tasks automatically.
 * POST /api/agents/task-extraction
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
      resource_type: 'document.task_extraction', metadata: { reason: 'kill_switch' },
    })
    return NextResponse.json(KILL_SWITCH_RESPONSE, { status: 503 })
  }

  const { file_id, project_id, document_text, source_type = 'document', email_subject } = await req.json()

  let docText = document_text
  let sourceName = email_subject ?? 'Project Document'

  if (file_id && !docText) {
    const { data: file } = await supabase
      .from('project_files')
      .select('extracted_text, file_name, summary')
      .eq('id', file_id)
      .eq('user_id', user.id)
      .single()
    docText = file?.extracted_text ?? ''
    sourceName = file?.file_name ?? 'document'
  }

  if (!docText?.trim()) {
    return NextResponse.json({ error: 'No text content to extract from' }, { status: 400 })
  }

  const startTime = Date.now()

  try {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: `You are the ATLAS Task Extraction Agent for contractor project management.

Extract actionable tasks from construction documents and emails.

Rules:
- Only extract real, concrete action items
- Never fabricate tasks that aren't implied by the text
- Assign realistic priorities (critical/high/medium/low)
- Note what column the task belongs in (Inbox/Planned/In Progress/etc.)
- Note evidence reference (quote from source)
- Note confidence 0-100

Return JSON: {
  tasks: [
    {
      title: "Clear, actionable task title",
      description: "Context from document",
      priority: "critical|high|medium|low",
      column_name: "Inbox|Planned|In Progress|Research|Decision Required",
      due_date_hint: "ASAP|before permit|before proposal|null",
      evidence: "exact quote or summary from document supporting this task",
      confidence: 0-100
    }
  ],
  source_summary: "1 sentence about what document this was",
  extraction_notes: "any caveats about the extraction"
}

Return ONLY valid JSON. No markdown.`,
    messages: [{
      role: 'user',
      content: `Extract tasks from this ${source_type}:
Source: ${sourceName}

Text (truncated to 4000 chars):
${docText.slice(0, 4000)}

Extract all concrete action items. Be specific. Do not fabricate.`
    }]
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
  let result
  try {
    result = JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch {
    await writeAuditLog({
      user_id: user.id, action: 'TASK_EXTRACTION_RUN',
      resource_type: 'document', resource_id: file_id ?? undefined,
      metadata: { source_type, project_id, error: 'Failed to parse task extraction output' },
    })
    return NextResponse.json({ error: 'Failed to parse task extraction output', raw }, { status: 500 })
  }

  const duration_ms = Date.now() - startTime

  // Save task suggestions (NOT approved — requires human review)
  const taskSuggestionIds: string[] = []
  if (result.tasks?.length > 0 && project_id) {
    for (const task of result.tasks) {
      const { data: saved } = await supabase.from('project_tasks').insert({
        project_id,
        user_id: user.id,
        title: task.title,
        description: task.description ?? task.evidence,
        column_name: 'Inbox', // All suggestions start in Inbox
        priority: task.priority ?? 'medium',
        source: 'ai_extraction',
        evidence_refs: [{ text: task.evidence, confidence: task.confidence }],
        approved: false, // CRITICAL: never auto-approve
        ai_suggested: true,
        ai_confidence: task.confidence,
      }).select('id').single()

      if (saved?.id) taskSuggestionIds.push(saved.id)
    }
  }

  // Log agent run
  await supabase.from('agent_runs').insert({
    user_id: user.id,
    agent_code: 'FC-21',
    tool_name: 'document.task_extraction',
    status: 'completed',
    input: { file_id, source_type, project_id },
    output: { task_count: result.tasks?.length ?? 0, task_suggestion_ids: taskSuggestionIds },
    credits_consumed: 8,
    tokens_used: response.usage.input_tokens + response.usage.output_tokens,
    duration_ms,
    completed_at: new Date().toISOString(),
  })

  await supabase.from('trust_events').insert({
    user_id: user.id,
    event_type: 'task_suggestion_created',
    resource_type: 'project_task',
    description: `${result.tasks?.length ?? 0} task suggestions extracted — awaiting approval`,
    metadata: { source_type, project_id, suggestion_count: result.tasks?.length }
  })

  await writeAuditLog({
    user_id: user.id, action: 'TASK_EXTRACTION_RUN',
    resource_type: 'document', resource_id: file_id ?? undefined,
    metadata: { source_type, project_id, task_count: result.tasks?.length ?? 0 },
  })

  return NextResponse.json({
    tasks: result.tasks ?? [],
    task_suggestion_ids: taskSuggestionIds,
    source_summary: result.source_summary,
    extraction_notes: result.extraction_notes,
    requires_approval: true, // Always explicit
    approved: false,
    agent: 'FC-21',
    duration_ms,
  })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Task extraction failed'
    await writeAuditLog({
      user_id: user.id, action: 'TASK_EXTRACTION_RUN',
      resource_type: 'document', resource_id: file_id ?? undefined,
      metadata: { source_type, project_id, error: message },
    })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST with action=approve — approve specific task suggestions
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { task_id, approve, column_name } = await req.json()

  if (approve) {
    await supabase.from('project_tasks')
      .update({
        approved: true,
        approved_at: new Date().toISOString(),
        column_name: column_name ?? 'Planned',
      })
      .eq('id', task_id)
      .eq('user_id', user.id)

    await supabase.from('trust_events').insert({
      user_id: user.id,
      event_type: 'task_suggestion_approved',
      resource_type: 'project_task',
      resource_id: task_id,
      description: 'User approved AI task suggestion',
    })
  } else {
    // Reject — remove from DB
    await supabase.from('project_tasks')
      .delete()
      .eq('id', task_id)
      .eq('user_id', user.id)
      .eq('approved', false)
  }

  return NextResponse.json({ success: true, task_id, approved: approve })
}
