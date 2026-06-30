/**
 * ATLAS v67 — Admin GodView (Founder Dashboard)
 * 5-panel executive intelligence layout.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GodViewClient } from '@/components/admin/GodViewClient'

export const dynamic = 'force-dynamic'

export default async function GodViewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('user_id', user.id)
    .single()

  if (!profile || !['owner', 'admin'].includes(profile.role ?? '')) {
    redirect('/')
  }

  return <GodViewClient userId={user.id} userEmail={user.email ?? ''} />
}
