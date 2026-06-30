/**
 * ATLAS v67 — Mutation Engine
 * Proposes code/config changes as blueprints for human review.
 *
 * SAFETY: No auto-merge. No auto-deploy. No GitHub writes.
 * Every proposal goes to build_blueprints with status PROPOSED.
 * Humans approve via /admin/command-center → Blueprint Queue.
 *
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { requiresHumanApproval, AUTOPOIETIC_LIMITS, type RiskLevel } from './limits'

export interface MutationProposal {
  title: string
  description: string
  blueprint_type: string
  risk_level: RiskLevel
  confidence_score: number
  diff_content?: Record<string, unknown>
  simulation_result?: Record<string, unknown>
}

export interface MutationResult {
  accepted: number
  rejected: number
  queued_for_approval: number
  blueprint_ids: string[]
  blocked: string[]
}

/**
 * Submit mutation proposals to the blueprint queue.
 * All proposals land as PROPOSED — humans approve/reject.
 */
export async function submitMutations(
  supabase: SupabaseClient,
  cycleId: string,
  proposals: MutationProposal[]
): Promise<MutationResult> {
  const result: MutationResult = {
    accepted: 0,
    rejected: 0,
    queued_for_approval: 0,
    blueprint_ids: [],
    blocked: [],
  }

  // Enforce per-cycle limit
  const limited = proposals.slice(0, AUTOPOIETIC_LIMITS.MAX_BLUEPRINTS_PER_CYCLE)
  const skipped = proposals.slice(AUTOPOIETIC_LIMITS.MAX_BLUEPRINTS_PER_CYCLE)
  skipped.forEach(p => result.blocked.push(`Rate limited: ${p.title}`))

  for (const proposal of limited) {
    const needsApproval = requiresHumanApproval(proposal.risk_level, proposal.blueprint_type)

    const { data, error } = await supabase
      .from('build_blueprints')
      .insert({
        cycle_id:          cycleId,
        title:             proposal.title,
        description:       proposal.description,
        blueprint_type:    proposal.blueprint_type,
        risk_level:        proposal.risk_level,
        confidence_score:  proposal.confidence_score,
        diff_content:      proposal.diff_content ?? null,
        simulation_result: proposal.simulation_result ?? null,
        proposed_by:       'A03-GENESIS',
        status:            'PROPOSED',  // Always PROPOSED — never auto-approved
        requires_human_approval: needsApproval,
      })
      .select('id')
      .single()

    if (error) {
      result.rejected++
      result.blocked.push(`DB error for "${proposal.title}": ${error.message}`)
    } else if (data) {
      result.accepted++
      result.blueprint_ids.push(data.id)
      if (needsApproval) result.queued_for_approval++
    }
  }

  return result
}

/**
 * Cancel a pending mutation proposal.
 * Only PROPOSED blueprints can be cancelled this way.
 */
export async function cancelMutation(
  supabase: SupabaseClient,
  blueprintId: string,
  userId: string,
  reason?: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('build_blueprints')
    .update({
      status:      'REJECTED',
      review_notes: reason ?? 'Cancelled by admin',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', blueprintId)
    .eq('status', 'PROPOSED')  // Only cancel PROPOSED ones

  if (error) return { ok: false, error: error.message }

  // Audit log
  try {
    await supabase.from('audit_logs').insert({
      user_id:       userId,
      action:        'MUTATION_CANCELLED',
      resource_type: 'build_blueprints',
      resource_id:   blueprintId,
      metadata:      { reason },
    })
  } catch { /* best-effort, ignore */ }

  return { ok: true }
}

/**
 * Get summary of pending mutations.
 */
export async function getMutationQueue(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('build_blueprints')
    .select('id, title, blueprint_type, risk_level, confidence_score, status, created_at, proposed_by')
    .in('status', ['PROPOSED', 'UNDER_REVIEW'])
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { blueprints: [], error: error.message }
  return { blueprints: data ?? [], error: null }
}
