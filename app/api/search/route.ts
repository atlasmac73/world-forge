/**
 * THE ARK — Project Search API (Part E-009 Wk 4)
 * Full-text search across project context: files, emails, memories, tasks
 * WORKSPACE-SCOPED — cannot leak across users
 * GET /api/search?q=...&project_id=...
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.trim()
  const projectId = searchParams.get('project_id')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [], total: 0, query })
  }

  // Log search event
  await supabase.from('trust_events').insert({
    user_id: user.id,
    event_type: 'search_performed',
    description: `Search: "${query}"`,
    metadata: { query, project_id: projectId },
  })

  const results: Array<{
    id: string; type: string; title: string; snippet: string;
    source: string; relevance: number; project_id?: string
  }> = []

  // 1. Search document chunks (full-text with GIN index)
  let chunkQuery = supabase.from('document_chunks')
    .select('id, content, file_id, project_id')
    .eq('user_id', user.id)
    .textSearch('search_vector', query.replace(/\s+/g, ' & '))
    .limit(10)

  if (projectId) chunkQuery = chunkQuery.eq('project_id', projectId)

  const { data: chunks } = await chunkQuery
  if (chunks) {
    for (const chunk of chunks) {
      const snippet = highlightSnippet(chunk.content, query)
      results.push({
        id: chunk.id, type: 'document',
        title: 'Document', snippet,
        source: 'document_chunk', relevance: 90,
        project_id: chunk.project_id,
      })
    }
  }

  // 2. Search tasks
  let taskQuery = supabase.from('project_tasks')
    .select('id, title, description, column_name, project_id')
    .eq('user_id', user.id)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(5)

  if (projectId) taskQuery = taskQuery.eq('project_id', projectId)
  const { data: tasks } = await taskQuery

  if (tasks) {
    for (const task of tasks) {
      results.push({
        id: task.id, type: 'task',
        title: task.title,
        snippet: task.description ?? task.column_name ?? '',
        source: 'task', relevance: 80,
        project_id: task.project_id,
      })
    }
  }

  // 3. Search memories
  let memQuery = supabase.from('project_memories')
    .select('id, content, memory_type, project_id')
    .eq('user_id', user.id)
    .ilike('content', `%${query}%`)
    .limit(5)

  if (projectId) memQuery = memQuery.eq('project_id', projectId)
  const { data: memories } = await memQuery

  if (memories) {
    for (const mem of memories) {
      results.push({
        id: mem.id, type: 'memory',
        title: `[${mem.memory_type}] Memory`,
        snippet: mem.content,
        source: 'memory', relevance: 70,
        project_id: mem.project_id,
      })
    }
  }

  // 4. Search google imports
  let importQuery = supabase.from('google_imports')
    .select('id, subject, snippet, body_excerpt, source_type, project_id')
    .eq('user_id', user.id)
    .or(`subject.ilike.%${query}%,snippet.ilike.%${query}%,body_excerpt.ilike.%${query}%`)
    .limit(5)

  if (projectId) importQuery = importQuery.eq('project_id', projectId)
  const { data: imports } = await importQuery

  if (imports) {
    for (const imp of imports) {
      results.push({
        id: imp.id, type: imp.source_type,
        title: imp.subject ?? `${imp.source_type} import`,
        snippet: imp.snippet ?? imp.body_excerpt ?? '',
        source: 'google_import', relevance: 75,
        project_id: imp.project_id,
      })
    }
  }

  // Sort by relevance
  results.sort((a, b) => b.relevance - a.relevance)

  return NextResponse.json({
    results: results.slice(0, limit),
    total: results.length,
    query,
    project_id: projectId,
    scoped: !!projectId,
  })
}

function highlightSnippet(text: string, query: string): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text.slice(0, 200)
  const start = Math.max(0, idx - 60)
  const end = Math.min(text.length, idx + query.length + 60)
  return (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '')
}
