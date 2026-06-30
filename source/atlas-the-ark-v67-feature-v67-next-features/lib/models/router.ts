/**
 * ATLAS v67 — Server-Side Model Router
 * Selects the best AI model for a given task, user tier, and context.
 * SERVER ONLY — never exposed to client. No secrets on client side.
 * Derived from atlas-godmode-v12-port model router.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

export type TaskType =
  | 'realestate'    // Property analysis, WV market
  | 'dossier'       // Full property dossier pipeline
  | 'underwriting'  // MAO calculation, deal grading
  | 'copywriting'   // Outreach, LOI drafts
  | 'scoring'       // Distress signal analysis
  | 'skip_trace'    // Owner lookup research
  | 'rehab'         // Rehab estimate generation
  | 'chat'          // General conversation
  | 'summary'       // Document summarization
  | 'code'          // Code generation
  | 'reasoning'     // Deep analysis
  | 'speed'         // Fast/bulk operations

export type TierCode = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7'

interface ModelSpec {
  id: string
  name: string
  provider: 'Anthropic' | 'OpenAI' | 'Google' | 'Local'
  costTier: number  // 1=cheapest, 5=most expensive
  quality:  number  // 0-100
  speed:    number  // 0-100
}

// Server-side model registry — model IDs from env vars where possible, safe fallbacks
const MODELS: Record<string, ModelSpec> = {
  // Primary: Claude (always available if ANTHROPIC_API_KEY set)
  'claude-power':   { id: process.env.ANTHROPIC_MODEL_POWER   ?? 'claude-opus-4-20250514',    name: 'Claude Power',   provider: 'Anthropic', costTier: 5, quality: 99, speed: 40 },
  'claude-default': { id: process.env.ANTHROPIC_MODEL_DEFAULT ?? 'claude-sonnet-4-20250514',  name: 'Claude Default', provider: 'Anthropic', costTier: 3, quality: 94, speed: 75 },
  'claude-fast':    { id: process.env.ANTHROPIC_MODEL_FAST    ?? 'claude-haiku-4-5-20251001', name: 'Claude Fast',    provider: 'Anthropic', costTier: 1, quality: 82, speed: 95 },
}

// Task-to-model mapping by tier
const TASK_MODEL_MAP: Record<TaskType, {
  tier_low:  keyof typeof MODELS  // T1-T2
  tier_mid:  keyof typeof MODELS  // T3-T4
  tier_high: keyof typeof MODELS  // T5-T7
}> = {
  realestate:    { tier_low: 'claude-fast',    tier_mid: 'claude-default', tier_high: 'claude-power'   },
  dossier:       { tier_low: 'claude-default', tier_mid: 'claude-default', tier_high: 'claude-power'   },
  underwriting:  { tier_low: 'claude-default', tier_mid: 'claude-default', tier_high: 'claude-power'   },
  copywriting:   { tier_low: 'claude-fast',    tier_mid: 'claude-default', tier_high: 'claude-default' },
  scoring:       { tier_low: 'claude-fast',    tier_mid: 'claude-fast',    tier_high: 'claude-default' },
  skip_trace:    { tier_low: 'claude-default', tier_mid: 'claude-default', tier_high: 'claude-power'   },
  rehab:         { tier_low: 'claude-default', tier_mid: 'claude-default', tier_high: 'claude-power'   },
  chat:          { tier_low: 'claude-fast',    tier_mid: 'claude-default', tier_high: 'claude-default' },
  summary:       { tier_low: 'claude-fast',    tier_mid: 'claude-fast',    tier_high: 'claude-default' },
  code:          { tier_low: 'claude-default', tier_mid: 'claude-default', tier_high: 'claude-power'   },
  reasoning:     { tier_low: 'claude-default', tier_mid: 'claude-power',   tier_high: 'claude-power'   },
  speed:         { tier_low: 'claude-fast',    tier_mid: 'claude-fast',    tier_high: 'claude-fast'    },
}

function getTierBand(tierCode: TierCode): 'tier_low' | 'tier_mid' | 'tier_high' {
  if (['T1', 'T2'].includes(tierCode)) return 'tier_low'
  if (['T3', 'T4'].includes(tierCode)) return 'tier_mid'
  return 'tier_high' // T5, T6, T7
}

export interface RoutedModel {
  modelId: string
  modelName: string
  provider: string
  tierBand: 'tier_low' | 'tier_mid' | 'tier_high'
  taskType: TaskType
  reason: string
}

/**
 * Select the best model for a task + user tier.
 * Always server-side. Never returns API keys.
 */
export function routeModel(
  taskType: TaskType,
  tierCode: TierCode = 'T1',
  forceModel?: string
): RoutedModel {
  // Admin/founder can force a specific model
  if (forceModel && MODELS[forceModel]) {
    const spec = MODELS[forceModel]
    return {
      modelId:   spec.id,
      modelName: spec.name,
      provider:  spec.provider,
      tierBand:  'tier_high',
      taskType,
      reason:    `Forced by admin: ${forceModel}`,
    }
  }

  const tierBand = getTierBand(tierCode)
  const taskMap  = TASK_MODEL_MAP[taskType] ?? TASK_MODEL_MAP.chat
  const modelKey = taskMap[tierBand]
  const spec     = MODELS[modelKey]

  return {
    modelId:   spec.id,
    modelName: spec.name,
    provider:  spec.provider,
    tierBand,
    taskType,
    reason:    `${taskType} on ${tierCode} → ${tierBand} band → ${modelKey}`,
  }
}

/**
 * Get model ID string only — use in Anthropic SDK calls.
 */
export function getModelId(taskType: TaskType, tierCode: TierCode = 'T1'): string {
  return routeModel(taskType, tierCode).modelId
}

/**
 * Get available models for admin/debug view.
 * Returns specs without API keys.
 */
export function getModelSpecs() {
  return Object.entries(MODELS).map(([key, spec]) => ({
    key,
    name:      spec.name,
    provider:  spec.provider,
    costTier:  spec.costTier,
    quality:   spec.quality,
    speed:     spec.speed,
    // Only show env var name, not the actual model ID (to avoid confusion with keys)
    configured: Boolean(spec.id),
  }))
}
