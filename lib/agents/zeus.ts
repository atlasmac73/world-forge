/**
 * THE ARK — A25-ZEUS God Squad Swarm Orchestrator
 * Role: Supreme master orchestrator. Runs multi-agent swarm jobs.
 * Extends the existing God Mode pod pattern from lib/godmode/engine.ts.
 * Kill switch respected. All runs persisted. Human approval gate intact.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { checkKillSwitch } from '@/lib/agents/killSwitch'
import { routeModel, type TierCode } from '@/lib/models/router'

export type SwarmPhase =
  | 'initializing'
  | 'dispatching'
  | 'collecting'
  | 'synthesizing'
  | 'complete'
  | 'failed'

export interface SwarmTask {
  id: string
  description: string
  agent_code: string
  agent_name: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  input: Record<string, unknown>
  output?: string
  status: 'queued' | 'running' | 'done' | 'failed'
  duration_ms?: number
}

export interface SwarmInput {
  mission: string              // Natural language goal
  user_id: string
  tier_code?: TierCode
  agent_ids?: string[]         // Override which agents to invoke (defaults to full squad)
  max_agents?: number          // Cap (default 5 to control costs)
  context?: Record<string, unknown>
}

export interface SwarmResult {
  ok: boolean
  run_id: string | null
  mission: string
  tasks: SwarmTask[]
  synthesis: string
  agents_used: string[]
  duration_ms: number
  error?: string
}

// The active God Squad — maps code to name + specialty
const GOD_SQUAD_ROSTER: Record<string, { name: string; specialty: string }> = {
  'A01-ORACLE':   { name: 'ORACLE',   specialty: 'Chief orchestrator, routing, strategy' },
  'A06-HERALD':   { name: 'HERALD',   specialty: 'Outreach copy, SMS, LOI generation' },
  'A12-SPECTER':  { name: 'SPECTER',  specialty: 'Property investigation, skip trace, owner data' },
  'A13-VANGUARD': { name: 'VANGUARD', specialty: 'Market heatmap, territory intelligence' },
  'A15-OMEN':     { name: 'OMEN',     specialty: 'Underwriting, MAO, distress scoring, ARV' },
  'A24-DUSK':     { name: 'DUSK',     specialty: 'Daily summaries, briefings, reports' },
}

import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function runZeusSwarm(
  supabase: SupabaseClient,
  input: SwarmInput,
  onProgress?: (phase: SwarmPhase, detail: string) => void
): Promise<SwarmResult> {
  const startTime = Date.now()
  const { mission, user_id, tier_code = 'T1', max_agents = 4, context = {} } = input

  const report = (phase: SwarmPhase, detail: string) => onProgress?.(phase, detail)

  // 1. Kill switch
  const { armed } = await checkKillSwitch(supabase)
  if (armed) {
    return {
      ok: false, run_id: null, mission,
      tasks: [], synthesis: '', agents_used: [],
      duration_ms: Date.now() - startTime,
      error: 'Kill switch armed — Swarm halted',
    }
  }

  // 2. Create swarm run record
  report('initializing', 'Creating swarm run record')
  let runId: string | null = null
  try {
    const { data } = await supabase
      .from('agent_runs')
      .insert({
        user_id,
        agent_code: 'A25-ZEUS',
        tool_name: 'agent.swarm',
        status: 'running',
        input: { mission, tier_code, max_agents },
        credits_consumed: 50,
      })
      .select('id')
      .single()
    runId = data?.id ?? null
  } catch { /* best-effort */ }

  // 3. ZEUS plans the swarm — which agents, what tasks
  report('dispatching', 'ZEUS planning swarm task distribution')
  const model = routeModel('reasoning', tier_code)
  const rosterList = Object.entries(GOD_SQUAD_ROSTER)
    .map(([code, { name, specialty }]) => `${code} (${name}): ${specialty}`)
    .join('\n')

  let taskPlan: SwarmTask[] = []
  try {
    const planResponse = await client.messages.create({
      model: model.modelId,
      max_tokens: 1000,
      system: `You are A25-ZEUS, Supreme Orchestrator of the ATLAS God Squad.
Break down the user's mission into specific tasks for each available agent.
Return ONLY valid JSON — no markdown, no preamble.
Isaac Brandon Burdette · Atlas Genesis Matrix LLC`,
      messages: [{
        role: 'user',
        content: `Mission: ${mission}

Available agents:
${rosterList}

Context: ${JSON.stringify(context)}

Create a task plan — assign at most ${max_agents} agents. Return:
[
  {
    "id": "task_1",
    "description": "specific task this agent should do",
    "agent_code": "A12-SPECTER",
    "agent_name": "SPECTER",
    "priority": "high",
    "input": {"key": "value"},
    "status": "queued"
  }
]`,
      }],
    })

    const planRaw = planResponse.content[0]?.type === 'text' ? planResponse.content[0].text : '[]'
    const planClean = planRaw.replace(/```json|```/g, '').trim()
    taskPlan = JSON.parse(planClean)
  } catch {
    // Fallback: assign default tasks
    taskPlan = [
      { id: 'task_1', description: mission, agent_code: 'A01-ORACLE', agent_name: 'ORACLE', priority: 'high', input: { mission }, status: 'queued' },
    ]
  }

  // 4. Execute each task
  report('collecting', `Executing ${taskPlan.length} agent tasks`)
  const completedTasks: SwarmTask[] = []

  for (const task of taskPlan.slice(0, max_agents)) {
    const agentInfo = GOD_SQUAD_ROSTER[task.agent_code]
    const taskStart = Date.now()

    try {
      const taskResponse = await client.messages.create({
        model: routeModel('chat', tier_code).modelId,
        max_tokens: 800,
        system: `You are ${task.agent_code} (${agentInfo?.name ?? task.agent_name}) — ${agentInfo?.specialty ?? 'ATLAS agent'}.
Complete your assigned task for Isaac Brandon Burdette's ATLAS real estate intelligence platform.
Be specific, actionable, and concise.`,
        messages: [{
          role: 'user',
          content: `Task: ${task.description}
Input context: ${JSON.stringify(task.input)}
Mission context: ${mission}`,
        }],
      })

      const output = taskResponse.content[0]?.type === 'text' ? taskResponse.content[0].text : 'No output'
      completedTasks.push({
        ...task,
        output,
        status: 'done',
        duration_ms: Date.now() - taskStart,
      })
    } catch (err) {
      completedTasks.push({
        ...task,
        output: `Task failed: ${err}`,
        status: 'failed',
        duration_ms: Date.now() - taskStart,
      })
    }
  }

  // 5. ZEUS synthesizes all outputs
  report('synthesizing', 'ZEUS synthesizing swarm results')
  const outputSummary = completedTasks
    .map(t => `[${t.agent_code} — ${t.description}]:\n${(t.output ?? '').slice(0, 400)}`)
    .join('\n\n---\n\n')

  let synthesis = ''
  try {
    const synthResponse = await client.messages.create({
      model: model.modelId,
      max_tokens: 1000,
      system: `You are A25-ZEUS, synthesizing your swarm's work into a final briefing for Isaac Brandon Burdette.
Be direct, clear, and actionable. Lead with the most important finding.`,
      messages: [{
        role: 'user',
        content: `Mission: ${mission}

Agent outputs:
${outputSummary}

Synthesize these into a clear, actionable briefing for Isaac. What was accomplished, what are the key findings, and what are the recommended next steps?`,
      }],
    })
    synthesis = synthResponse.content[0]?.type === 'text' ? synthResponse.content[0].text : ''
  } catch {
    synthesis = `Swarm complete. ${completedTasks.filter(t => t.status === 'done').length}/${completedTasks.length} tasks succeeded.`
  }

  // 6. Finalize run
  const duration = Date.now() - startTime
  if (runId) {
    try {
      await supabase.from('agent_runs').update({
        status: 'completed',
        output: { synthesis, tasks: completedTasks.length, mission },
        duration_ms: duration,
        completed_at: new Date().toISOString(),
      }).eq('id', runId)
    } catch { /* best-effort */ }
  }

  report('complete', `Swarm complete — ${completedTasks.length} tasks executed`)

  return {
    ok: true,
    run_id: runId,
    mission,
    tasks: completedTasks,
    synthesis,
    agents_used: completedTasks.map(t => t.agent_code),
    duration_ms: duration,
  }
}
