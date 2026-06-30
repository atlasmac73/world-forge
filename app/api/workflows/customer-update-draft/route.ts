/**
 * THE ARK — Customer Update Draft Workflow (Part E-008 Section 15)
 * Generates professional customer update from project context.
 * NEVER sends email automatically — draft only, user must manually send.
 * POST /api/workflows/customer-update-draft
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type ProjectTask = {
  title: string
  column_name: string | null
  priority: string | null
  approved: boolean | null
}

type ProjectMemory = {
  content: string | null
  memory_type: string | null
}

type Project = {
  project_name: string
  customer_name: string
  location: string
  city: string
  state: string
  status: string
  scope_summary?: string | null
  [key: string]: unknown
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project_id } = await req.json()
  if (!project_id) return NextResponse.json({ error: 'project_id required' }, { status: 400 })

  const { data: project } = await supabase
    .from('contractor_projects')
    .select('*')
    .eq('id', project_id)
    .eq('user_id', user.id)
    .single()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const p = project as Project

  const { data: tasksRaw } = await supabase
    .from('project_tasks')
    .select('title, column_name, priority, approved')
    .eq('project_id', project_id)
    .order('created_at', { ascending: false })
    .limit(15)

  const { data: memoriesRaw } = await supabase
    .from('project_memories')
    .select('content, memory_type')
    .eq('project_id', project_id)
    .eq('approved', true)
    .limit(5)

  const tasks = tasksRaw as ProjectTask[] | null
  const memories = memoriesRaw as ProjectMemory[] | null

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    system: `You are a professional construction project communication assistant.
    
Generate a customer update email draft. Rules:
- Professional, clear, brief tone
- Include: progress summary, completed items, open questions needing customer input, next steps
- DO NOT include: internal margins, unapproved pricing, private notes, sensitive audit data, unconfirmed promises
- Flag open questions clearly so customer can respond
- This is a DRAFT — the user will review before sending`,
    messages: [{
      role: 'user',
      content: `Project: ${p.project_name}
Customer: ${p.customer_name}
Location: ${p.location}, ${p.city} ${p.state}
Status: ${p.status}
Scope: ${p.scope_summary ?? 'Under development'}

Recent tasks:
${tasks?.map((t) => `- [${t.column_name}] ${t.title} (${t.priority})`).join('\n') ?? 'None'}

Project memories:
${memories?.map((m) => `- [${m.memory_type}] ${m.content}`).join('\n') ?? 'None'}

Generate a professional customer update email. Include a subject line.`
    }]
  })

  const draft = response.content[0].type === 'text' ? response.content[0].text : ''

  await supabase.from('trust_events').insert({
    user_id: user.id,
    event_type: 'agent_run_completed',
    resource_type: 'workflow',
    description: `Customer update draft generated for ${p.project_name}`,
    metadata: {
      workflow: 'customer-update-draft',
      project_id,
      tokens: response.usage.input_tokens + response.usage.output_tokens,
    },
  })

  return NextResponse.json({
    draft,
    project_name: p.project_name,
    customer_name: p.customer_name,
    notice: 'DRAFT ONLY — Atlas does not send emails automatically. Review and send manually.',
    tasks_included: tasks?.length ?? 0,
    memories_included: memories?.length ?? 0,
    workflow: 'customer-update-draft',
  })
}
