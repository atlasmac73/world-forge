/**
 * ATLAS v67 — Autopoietic Safety Limits
 * Hard limits for Genesis Cycle / self-build mutations.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 *
 * SAFETY CONTRACT:
 * - No code is auto-deployed. Humans approve at PROMOTE phase.
 * - No PRs are auto-merged. Blueprint approval writes APPROVED status only.
 * - These limits are enforced by the mutation engine, not the UI.
 * - Owner/admin only. Never exposed to regular users.
 */

export const AUTOPOIETIC_LIMITS = {
  /** Max blueprints that can be PROPOSED per Genesis Cycle */
  MAX_BLUEPRINTS_PER_CYCLE: 3,

  /** Max selfbuild tasks that can be QUEUED at once */
  MAX_QUEUED_TASKS: 10,

  /** Max consecutive agent runs before forced human review */
  MAX_CONSECUTIVE_RUNS_BEFORE_REVIEW: 5,

  /** Minimum minutes between heartbeat cycles */
  MIN_HEARTBEAT_INTERVAL_MINUTES: 15,

  /** Max tokens per mutation proposal */
  MAX_MUTATION_TOKENS: 2000,

  /** Max confidence score required to auto-advance to SIMULATE phase (otherwise requires review) */
  HIGH_CONFIDENCE_THRESHOLD: 85,

  /** Risk levels that ALWAYS require human approval */
  HUMAN_APPROVAL_REQUIRED_RISK: ['HIGH', 'CRITICAL'] as const,

  /** Blueprint types that ALWAYS require human approval regardless of confidence */
  HUMAN_APPROVAL_REQUIRED_TYPES: [
    'schema_change',
    'security',
    'agent_update',
  ] as const,

  /** Max duration for a single selfbuild task before timeout */
  TASK_TIMEOUT_MINUTES: 10,

  /** Heartbeat is disabled if kill switch is armed */
  RESPECT_KILL_SWITCH: true,
} as const

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export function requiresHumanApproval(
  riskLevel: RiskLevel,
  blueprintType: string
): boolean {
  if ((AUTOPOIETIC_LIMITS.HUMAN_APPROVAL_REQUIRED_RISK as readonly string[]).includes(riskLevel)) return true
  if ((AUTOPOIETIC_LIMITS.HUMAN_APPROVAL_REQUIRED_TYPES as readonly string[]).includes(blueprintType)) return true
  return false
}

export function isWithinRateLimit(
  lastCycleAt: Date | null,
  intervalMinutes = AUTOPOIETIC_LIMITS.MIN_HEARTBEAT_INTERVAL_MINUTES
): boolean {
  if (!lastCycleAt) return true
  const elapsed = (Date.now() - lastCycleAt.getTime()) / 60000
  return elapsed >= intervalMinutes
}
