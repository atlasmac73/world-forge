import { createServiceClient } from '@/lib/supabase/server'

export async function createAuditLog(params: {
  userId: string
  action: string
  resourceType?: string
  resourceId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
}) {
  const supabase = createServiceClient()
  // Write to both audit_logs (new) and trust_events (legacy compat)
  await supabase.from('audit_logs').insert({
    user_id: params.userId,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId,
    metadata: params.metadata ?? {},
    ip_address: params.ipAddress,
  })
}
