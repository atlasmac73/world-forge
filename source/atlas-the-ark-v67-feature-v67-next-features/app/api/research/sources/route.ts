/**
 * ATLAS v67 — Research Notebook Sources
 * POST   /api/research/sources   → add a grounding source to a notebook
 * DELETE /api/research/sources?id=...  → remove a source
 * Owner/admin only.
 *
 * Sources are a curated grounding set (NotebookLM-style), not web-scale RAG.
 * 'text' and 'repo_doc' sources store content directly. 'url' / 'google_drive'
 * require their connectors; until those are wired, content must be supplied
 * by the caller (we never fabricate fetched content).
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireUser, requireAdmin } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

const CONNECTOR_TYPES = new Set(['url', 'google_drive'])

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const body = await req.json().catch(() => null)
  const notebookId: string = body?.notebookId ?? ''
  const title: string = (body?.title ?? '').trim()
  const sourceType: string = body?.sourceType ?? 'text'
  const content: string = body?.content ?? ''
  const sourceRef: string | null = body?.sourceRef ?? null

  if (!notebookId) return NextResponse.json({ ok: false, error: 'notebookId is required' }, { status: 400 })
  if (!title) return NextResponse.json({ ok: false, error: 'title is required' }, { status: 400 })

  // Connector-backed sources need content supplied until the connector is live.
  if (CONNECTOR_TYPES.has(sourceType) && !content) {
    return NextResponse.json({
      ok: false,
      error: `Source type "${sourceType}" connector is not wired yet. Supply 'content' directly, or paste the text.`,
      connectorPending: true,
    }, { status: 400 })
  }
  if (!content) return NextResponse.json({ ok: false, error: 'content is required' }, { status: 400 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('research_sources')
    .insert({
      notebook_id: notebookId,
      title: title.slice(0, 300),
      source_type: sourceType,
      content,
      source_ref: sourceRef,
      token_estimate: Math.ceil(content.length / 4),
    })
    .select('id, title, source_type, source_ref, token_estimate, created_at')
    .single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  // Touch notebook updated_at
  await supabase.from('research_notebooks')
    .update({ updated_at: new Date().toISOString() }).eq('id', notebookId)

  return NextResponse.json({ ok: true, source: data })
}

export async function DELETE(req: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  const { error: adminError } = await requireAdmin(user.id)
  if (adminError) return adminError

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase.from('research_sources').delete().eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
