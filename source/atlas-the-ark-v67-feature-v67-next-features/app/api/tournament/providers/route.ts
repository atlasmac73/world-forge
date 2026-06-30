/**
 * ATLAS v67 — Tournament Provider Availability
 * GET /api/tournament/providers
 * Owner/admin only. Reports which model providers can actually execute given the
 * configured API keys, so the Arena can show what will run vs. be skipped.
 * Never returns key values — only booleans.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextResponse } from 'next/server'
import { requireUser, requireAdmin } from '@/lib/permissions'
import { isProviderAvailable } from '@/lib/tournament/providers'

export const dynamic = 'force-dynamic'

// Providers the model_registry references; only Anthropic + OpenAI have adapters.
const KNOWN_PROVIDERS = ['Anthropic', 'OpenAI', 'Google', 'xAI', 'DeepSeek', 'Meta', 'Mistral', 'Cohere']

export async function GET() {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const providers = KNOWN_PROVIDERS.map(name => ({
    name,
    available: isProviderAvailable(name),
  }))

  return NextResponse.json({
    ok: true,
    providers,
    available: providers.filter(p => p.available).map(p => p.name),
  })
}
