import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/permissions'
import { ResearchArenaClient } from '@/components/admin/ResearchArenaClient'

export const dynamic = 'force-dynamic'

/**
 * Founder/admin-only AI Tournament + Research Notebook console.
 * Gated server-side via requireAdmin (queries profiles by user_id).
 */
export default async function ResearchArenaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { role, error: adminError } = await requireAdmin(user.id)
  if (adminError || !role) redirect('/')

  return <ResearchArenaClient userRole={role} />
}
