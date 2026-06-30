/**
 * ATLAS v67 — Tournament Judge (LLM-as-judge)
 * Scores competing outputs against weighted criteria and ranks them.
 * The judge is always a strong Anthropic model (env-pinned).
 *
 * Used by the tournament engine for model bake-offs, agent contests, and
 * Genesis blueprint self-evaluation.
 *
 * SERVER ONLY.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { runCompletion } from './providers'

export interface JudgeCandidate {
  id: string
  label: string
  output: string
}

export interface JudgeCriterion {
  name: string
  weight: number
}

export interface JudgeScore {
  id: string
  score: number                       // 0-100 weighted overall
  breakdown: Record<string, number>   // per-criterion 0-100
  rationale: string
}

export interface JudgeResult {
  scores: JudgeScore[]
  winnerId: string | null
  summary: string
  judgeModel: string
  parsed: boolean
}

export const DEFAULT_CRITERIA: JudgeCriterion[] = [
  { name: 'accuracy', weight: 0.35 },
  { name: 'completeness', weight: 0.25 },
  { name: 'reasoning', weight: 0.25 },
  { name: 'clarity', weight: 0.15 },
]

function judgeModelId(): string {
  // Judge with the strongest available model; env-pinned, no hard-coded canon.
  return process.env.ANTHROPIC_MODEL_POWER ?? 'claude-opus-4-5-20251001'
}

/**
 * Score candidates against the prompt + criteria. Single judge call returning
 * structured JSON. On parse failure, returns neutral scores flagged parsed=false
 * so callers never silently treat a failed judging as a real verdict.
 */
export async function judgeCandidates(
  taskPrompt: string,
  candidates: JudgeCandidate[],
  criteria: JudgeCriterion[] = DEFAULT_CRITERIA,
  groundingContext?: string
): Promise<JudgeResult> {
  const model = judgeModelId()

  const criteriaList = criteria
    .map(c => `- ${c.name} (weight ${c.weight})`)
    .join('\n')

  const candidateBlocks = candidates
    .map((c, i) => `### CANDIDATE ${i + 1} — id="${c.id}" (${c.label})\n${c.output || '(no output)'}`)
    .join('\n\n')

  const system = [
    'You are an impartial evaluation judge for the ATLAS AI tournament.',
    'Score each candidate answer to the task on every criterion from 0-100.',
    'Be rigorous and discriminating — do not award ties unless truly warranted.',
    'Return ONLY valid JSON. No markdown, no prose outside the JSON.',
  ].join(' ')

  const prompt = [
    `TASK BEING EVALUATED:\n${taskPrompt}`,
    groundingContext ? `\nGROUNDING CONTEXT (answers should be consistent with this):\n${groundingContext}` : '',
    `\nSCORING CRITERIA:\n${criteriaList}`,
    `\nCANDIDATES:\n${candidateBlocks}`,
    `\nReturn JSON of the exact shape:
{
  "scores": [
    { "id": "<candidate id>", "breakdown": { ${criteria.map(c => `"${c.name}": <0-100>`).join(', ')} }, "rationale": "<one sentence>" }
  ],
  "winner_id": "<id of best candidate>",
  "summary": "<2-3 sentence comparative verdict>"
}`,
  ].join('\n')

  const res = await runCompletion('Anthropic', {
    apiModelId: model,
    system,
    prompt,
    maxTokens: 1500,
  })

  try {
    const cleaned = res.text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned) as {
      scores: Array<{ id: string; breakdown: Record<string, number>; rationale: string }>
      winner_id: string
      summary: string
    }

    const scores: JudgeScore[] = parsed.scores.map(s => {
      const overall = criteria.reduce((sum, c) => {
        const v = Number(s.breakdown?.[c.name] ?? 0)
        return sum + v * c.weight
      }, 0)
      return {
        id: s.id,
        score: Math.round(overall * 10) / 10,
        breakdown: s.breakdown ?? {},
        rationale: s.rationale ?? '',
      }
    })

    // Winner = judge's pick if valid, else highest computed score.
    const validWinner = scores.find(s => s.id === parsed.winner_id)
    const topByScore = [...scores].sort((a, b) => b.score - a.score)[0]
    const winnerId = validWinner?.id ?? topByScore?.id ?? null

    return { scores, winnerId, summary: parsed.summary ?? '', judgeModel: model, parsed: true }
  } catch {
    // Honest fallback: neutral scores, flagged unparsed.
    const scores: JudgeScore[] = candidates.map(c => ({
      id: c.id,
      score: 50,
      breakdown: {},
      rationale: 'Judge response could not be parsed — manual review required.',
    }))
    return {
      scores,
      winnerId: null,
      summary: 'Judging failed to parse; scores are neutral placeholders.',
      judgeModel: model,
      parsed: false,
    }
  }
}
