import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/permissions'
import { SiteCaptureClient } from '@/components/admin/SiteCaptureClient'

export const dynamic = 'force-dynamic'

/** Founder/admin-only Site Capture & Measurement Fusion console. */
export default async function SiteCapturePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { role, error } = await requireAdmin(user.id)
  if (error || !role) redirect('/')
  return <SiteCaptureClient userRole={role} />
}
