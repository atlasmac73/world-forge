/**
 * ATLAS v67 — Tournament Provider Layer
 * Provider-agnostic completion calls with graceful degradation.
 *
 * Anthropic is always available when ANTHROPIC_API_KEY is set.
 * OpenAI lights up when OPENAI_API_KEY is set.
 * Every other provider reports UNAVAILABLE — we never fake a result.
 *
 * Model IDs are resolved from env vars (same convention as the portal chat
 * route) so we never hard-code a single canonical model id in app logic.
 *
 * SERVER ONLY — never import into client components.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

export interface CompletionRequest {
  /** Real API model id to call (already resolved). */
  apiModelId: string
  system?: string
  prompt: string
  maxTokens?: number
}

export interface CompletionResult {
  text: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
}

// Clients are created lazily/once; null when the key is absent.
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

/** Providers we can actually execute right now, given the configured keys. */
export function isProviderAvailable(provider: string): boolean {
  switch (provider) {
    case 'Anthropic':
      return Boolean(anthropic)
    case 'OpenAI':
      return Boolean(openai)
    default:
      // Google, xAI, DeepSeek, Meta, Mistral, Cohere, etc. — adapters not wired.
      // Returning false keeps them out of a tournament instead of faking output.
      return false
  }
}

/**
 * Resolve a model_registry id (e.g. 'claude-opus-4-6', 'gpt-4o') to the real
 * API model id to send. Anthropic ids map onto the env-var tiers used
 * elsewhere in the app so there is a single source of truth for model pinning.
 */
export function resolveApiModelId(registryId: string, provider: string): string {
  if (provider === 'Anthropic') {
    const id = registryId.toLowerCase()
    if (id.includes('opus')) {
      return process.env.ANTHROPIC_MODEL_POWER ?? 'claude-opus-4-5-20251001'
    }
    if (id.includes('haiku')) {
      return process.env.ANTHROPIC_MODEL_FAST ?? 'claude-haiku-4-5-20251001'
    }
    return process.env.ANTHROPIC_MODEL_DEFAULT ?? 'claude-sonnet-4-20250514'
  }
  if (provider === 'OpenAI') {
    // Registry ids already match OpenAI's API ids (gpt-4o, gpt-4o-mini, o4-mini).
    return registryId
  }
  return registryId
}

/** Dispatch a single completion to the right provider. Throws on failure. */
export async function runCompletion(
  provider: string,
  req: CompletionRequest
): Promise<CompletionResult> {
  const started = Date.now()
  const maxTokens = req.maxTokens ?? 1024

  if (provider === 'Anthropic') {
    if (!anthropic) throw new Error('Anthropic provider unavailable (ANTHROPIC_API_KEY missing)')
    const res = await anthropic.messages.create({
      model: req.apiModelId,
      max_tokens: maxTokens,
      system: req.system,
      messages: [{ role: 'user', content: req.prompt }],
    })
    const text = res.content[0]?.type === 'text' ? res.content[0].text : ''
    return {
      text,
      inputTokens: res.usage?.input_tokens ?? 0,
      outputTokens: res.usage?.output_tokens ?? 0,
      latencyMs: Date.now() - started,
    }
  }

  if (provider === 'OpenAI') {
    if (!openai) throw new Error('OpenAI provider unavailable (OPENAI_API_KEY missing)')
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []
    if (req.system) messages.push({ role: 'system', content: req.system })
    messages.push({ role: 'user', content: req.prompt })
    const res = await openai.chat.completions.create({
      model: req.apiModelId,
      max_tokens: maxTokens,
      messages,
    })
    return {
      text: res.choices[0]?.message?.content ?? '',
      inputTokens: res.usage?.prompt_tokens ?? 0,
      outputTokens: res.usage?.completion_tokens ?? 0,
      latencyMs: Date.now() - started,
    }
  }

  throw new Error(`Provider "${provider}" has no adapter wired yet`)
}

/** Rough USD-cents estimate for display/audit. Not a billing source of truth. */
export function estimateCostCents(
  provider: string,
  inputTokens: number,
  outputTokens: number
): number {
  // Conservative blended rates; refined per-model later if needed.
  const rate = provider === 'OpenAI'
    ? { in: 0.0000025, out: 0.00001 }
    : { in: 0.000003, out: 0.000015 }
  return Math.ceil((inputTokens * rate.in + outputTokens * rate.out) * 100)
}
