/**
 * ATLAS v67 — Admin Launch Readiness Page
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LaunchReadinessClient } from '@/components/admin/LaunchReadinessClient'

export const dynamic = 'force-dynamic'

export default async function LaunchReadinessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('user_id', user.id)
    .single()

  if (!profile || !['owner', 'admin'].includes(profile.role ?? '')) redirect('/')

  return <LaunchReadinessClient />
}
