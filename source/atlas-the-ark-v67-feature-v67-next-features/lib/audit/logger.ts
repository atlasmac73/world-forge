/**
 * ATLAS v67 — Audit Log Helper (Enhanced Phase 10)
 * Server-side audit logging for all compliance-relevant events.
 * Never silently fails — always logs, even on error.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { createServiceClient } from '@/lib/supabase/server'

// All audit event types — add new ones here, never remove
export type AuditAction =
  // Auth
  | 'USER_INVITE_SENT'
  | 'USER_INVITE_ACCEPTED'
  | 'USER_ROLE_CHANGED'
  | 'USER_DEACTIVATED'
  // AI Actions (billable)
  | 'DOSSIER_RUN'
  | 'GOD_MODE_RUN'
  | 'LOI_GENERATED'
  | 'REHAB_ESTIMATED'
  | 'UNDERWRITING_RUN'
  | 'SKIP_TRACE_RUN'
  | 'DISTRESS_SCORED'
  | 'COURT_EXTRACTION'
  | 'AI_CHAT_MESSAGE'
  | 'DOCUMENT_SUMMARIZED'
  | 'TASK_EXTRACTION_RUN'
  | 'AGENT_RUN'           // generic agent execution (VANGUARD/ZEUS/corpus compiler)
  | 'AGENT_RUN_BLOCKED'   // kill-switch or gate blocked an agent execution request
  // Data actions
  | 'PROPERTY_CREATED'
  | 'PROPERTY_EXPORTED'
  | 'LEAD_CREATED'
  | 'CONTACT_VIEWED'     // Owner contact data viewed
  | 'CONTACT_EXPORTED'   // Owner contact exported
  // Billing
  | 'SUBSCRIPTION_UPGRADED'
  | 'SUBSCRIPTION_DOWNGRADED'
  | 'CREDIT_LIMIT_HIT'
  // Admin
  | 'KILL_SWITCH_ARMED'
  | 'KILL_SWITCH_DISARMED'
  | 'BLUEPRINT_APPROVED'
  | 'BLUEPRINT_REJECTED'
  | 'MUTATION_CANCELLED'
  | 'ADMIN_SETTING_CHANGED'
  | 'AIN_COUNTY_IMPORT'
  | 'GENESIS_CYCLE_TRIGGERED'
  // Research Arena (AI tournament + research notebook — founder/admin only)
  | 'TOURNAMENT_RUN'
  | 'RESEARCH_NOTEBOOK_CREATED'
  | 'RESEARCH_NOTEBOOK_DELETED'
  | 'RESEARCH_ASK'
  | 'RESEARCH_ASK_TOURNAMENT'
  // Site Capture & Measurement Fusion (founder/admin only)
  | 'SITE_CAPTURE_INGEST'
  | 'SITE_MEASUREMENT_RUN'
  // Genesis HQ (Product Command Center — unrelated to Genesis Cycle above)
  | 'GENESIS_HQ_TASK_UPDATED'
  | 'GENESIS_HQ_KANBAN_CARD_CREATED'
  | 'GENESIS_HQ_KANBAN_CARD_UPDATED'
  | 'GENESIS_HQ_KANBAN_CARD_DELETED'
  | 'GENESIS_HQ_IDEA_CREATED'
  | 'GENESIS_HQ_IDEA_UPDATED'
  | 'GENESIS_HQ_IDEA_DELETED'
  | 'GENESIS_HQ_SEED_RUN'
  | 'GENESIS_HQ_RESET_RUN'
  // Compliance
  | 'LOI_SENT'
  | 'SMS_SENT'           // Only after TCPA compliance
  | 'EMAIL_SENT'
  | 'SUPPRESSION_ADDED'
  | 'SUPPRESSION_REMOVED'

export interface AuditLogEntry {
  user_id:       string
  action:        AuditAction
  resource_type?: string
  resource_id?:  string
  metadata?:     Record<string, unknown>
  ip_address?:   string
}

/**
 * Write an audit log entry.
 * Non-blocking — never throws, always returns.
 */
export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createServiceClient()
    await supabase.from('audit_logs').insert({
      user_id:       entry.user_id,
      action:        entry.action,
      resource_type: entry.resource_type ?? null,
      resource_id:   entry.resource_id ?? null,
      metadata:      entry.metadata ?? null,
    })
  } catch {
    // Never throw — audit log failures are silent but we log to console
    console.error('[AuditLog] Failed to write:', entry.action, entry.user_id)
  }
}

/**
 * Batch write multiple audit log entries.
 */
export async function writeAuditLogs(entries: AuditLogEntry[]): Promise<void> {
  try {
    const supabase = createServiceClient()
    await supabase.from('audit_logs').insert(
      entries.map(e => ({
        user_id:       e.user_id,
        action:        e.action,
        resource_type: e.resource_type ?? null,
        resource_id:   e.resource_id ?? null,
        metadata:      e.metadata ?? null,
      }))
    )
  } catch {
    console.error('[AuditLog] Batch write failed:', entries.map(e => e.action).join(', '))
  }
}

/**
 * Check if a phone number is on the suppression list.
 * Call before any SMS send.
 */
export async function isSupressed(phone: string): Promise<boolean> {
  try {
    const supabase = createServiceClient()
    const normalized = phone.replace(/\D/g, '')
    const { count } = await supabase
      .from('suppression_list')
      .select('*', { count: 'exact', head: true })
      .or(`phone.eq.${phone},phone.eq.${normalized},phone.eq.+1${normalized}`)
    return (count ?? 0) > 0
  } catch {
    // If we can't check, assume suppressed (fail-safe)
    return true
  }
}

/**
 * Add to suppression list (STOP handler).
 */
export async function addToSuppression(
  phone: string,
  reason: 'stop' | 'opt_out' | 'bounce' | 'complaint' | 'manual',
  addedBy?: string
): Promise<void> {
  try {
    const supabase = createServiceClient()
    await supabase.from('suppression_list').upsert({
      phone,
      reason,
      source: 'system',
      added_by: addedBy ?? null,
    }, { onConflict: 'phone' })
  } catch {
    console.error('[Suppression] Failed to add:', phone)
  }
}
