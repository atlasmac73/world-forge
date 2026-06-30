/**
 * THE ARK — AI Evaluation Runner
 * Runs prompt/agent quality evaluations against the live API.
 * Isaac Brandon Burdette, Sole Inventor — Atlas Genesis Matrix LLC
 *
 * Usage: npm run evals
 * Requires: ANTHROPIC_API_KEY in environment
 */

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Eval definitions ─────────────────────────────────────────────────────────

type Eval = {
  name: string
  systemPrompt: string
  userMessage: string
  validate: (response: string) => boolean
  description: string
}

const EVALS: Eval[] = [
  {
    name: 'distress-score-format',
    systemPrompt: 'You are A15-OMEN, a real estate distress scoring agent. Return JSON only: { score: number, grade: string, flags: string[] }',
    userMessage: 'Score this property: 142 Oak St, Charleston WV 25301. Tax delinquent 3 years, vacant, roof damage visible.',
    validate: (r) => {
      try {
        const parsed = JSON.parse(r.trim())
        return typeof parsed.score === 'number' && typeof parsed.grade === 'string'
      } catch { return false }
    },
    description: 'A15-OMEN returns valid JSON distress score',
  },
  {
    name: 'loi-generator-output',
    systemPrompt: 'You are A06-HERALD, a real estate LOI writer. Generate a professional Letter of Intent.',
    userMessage: 'Write an LOI for 412 Elm St, Charleston WV. Offer $45,000 cash, 30-day close, as-is.',
    validate: (r) => r.length > 200 && (r.includes('Letter of Intent') || r.includes('LOI') || r.includes('offer')),
    description: 'A06-HERALD produces a real LOI with substantive content',
  },
  {
    name: 'deal-navigator-analysis',
    systemPrompt: 'You are A01-ORACLE, an investment deal analyst. Analyze deals and return structured insight.',
    userMessage: 'ARV: $120k. Purchase: $55k. Repair: $25k. Is this a good wholesale deal? Give me a yes/no and the MAO.',
    validate: (r) => r.length > 50 && (r.toLowerCase().includes('yes') || r.toLowerCase().includes('no') || r.includes('MAO') || r.includes('offer')),
    description: 'A01-ORACLE provides deal analysis with recommendation',
  },
]

// ─── Runner ───────────────────────────────────────────────────────────────────

async function runEval(ev: Eval): Promise<{ passed: boolean; error?: string; latencyMs: number }> {
  const start = Date.now()
  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: ev.systemPrompt,
      messages: [{ role: 'user', content: ev.userMessage }],
    })
    const text = (msg.content[0] as { text: string }).text ?? ''
    const passed = ev.validate(text)
    return { passed, latencyMs: Date.now() - start }
  } catch (err) {
    return { passed: false, error: String(err), latencyMs: Date.now() - start }
  }
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌  ANTHROPIC_API_KEY not set. Add it to .env.local or Vercel env vars.')
    process.exit(1)
  }

  console.log('\n🧪  THE ARK — AI Eval Suite\n')

  let passed = 0
  let failed = 0

  for (const ev of EVALS) {
    process.stdout.write(`  ▶  ${ev.name} ... `)
    const result = await runEval(ev)
    if (result.passed) {
      console.log(`✅  PASS  (${result.latencyMs}ms)`)
      passed++
    } else {
      console.log(`❌  FAIL  (${result.latencyMs}ms)${result.error ? ' — ' + result.error : ''}`)
      failed++
    }
    console.log(`     ${ev.description}`)
  }

  console.log(`\n📊  Results: ${passed}/${EVALS.length} passed\n`)

  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error('Eval runner crashed:', err)
  process.exit(1)
})
