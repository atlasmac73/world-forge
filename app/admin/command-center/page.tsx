import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/permissions'
import { CommandCenterClient } from '@/components/admin/CommandCenterClient'

export const dynamic = 'force-dynamic'

export default async function CommandCenterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use the existing requireAdmin helper — queries by user_id correctly
  const { role, error: adminError } = await requireAdmin(user.id)
  if (adminError || !role) redirect('/')

  // Fetch tier from subscriptions (not profiles — profiles has no tier column)
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('tier_code')
    .eq('user_id', user.id)
    .single()

  return (
    <CommandCenterClient
      userId={user.id}
      userRole={role}
      userTier={sub?.tier_code ?? 'T1'}
    />
  )
}
