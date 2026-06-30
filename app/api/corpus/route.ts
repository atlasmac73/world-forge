/**
 * THE ARK — Corpus Compiler API
 * Route: POST /api/corpus
 * Reads other ATLAS repos (v1-v65 history), extracts ideas/features,
 * and ingests them directly into Genesis HQ ideas table.
 * Owner-only endpoint.
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/logger'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const OWNER_EMAILS = ['slisaac89@gmail.com', 'atlasmac73@gmail.com']
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// All ATLAS repos available to the compiler
const ATLAS_REPOS = [
  { name: 'atlas-the-ark-v67',        label: 'v67 (current)',   priority: 1 },
  { name: 'atlas-os',                  label: 'Atlas OS',        priority: 2 },
  { name: 'atlas-godmode-v23',         label: 'GodMode v23',     priority: 2 },
  { name: 'atlas-godmode-v23.1',       label: 'GodMode v23.1',   priority: 2 },
  { name: 'Atlas-Agent-Matrix',        label: 'Agent Matrix',    priority: 3 },
  { name: 'atlas-agent-matrix-20.0',   label: 'Agent Matrix 20', priority: 3 },
  { name: 'Atlas-command-center',      label: 'Command Center',  priority: 3 },
  { name: 'antigravity-omniverse-master-build', label: 'Omniverse', priority: 3 },
  { name: 'atlas-deal-nav-pro',        label: 'Deal Nav Pro',    priority: 4 },
  { name: 'Atlas-v20',                 label: 'v20',             priority: 4 },
  { name: 'deal-nav-pro',              label: 'Deal Nav',        priority: 4 },
  { name: 'leadforge1',                label: 'LeadForge v1',    priority: 5 },
]

interface ExtractedIdea {
  title: string
  description: string
  category: 'CAPTURE' | 'GENERATE' | 'PRIVACY' | 'CONNECT' | 'PATENT'
  source_repo: string
  business_value: number
  tags: string[]
}

async function fetchRepoFiles(
  repoName: string,
  token: string,
  path = ''
): Promise<Array<{ name: string; content: string }>> {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'ATLAS-Corpus-Compiler',
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/atlasmac73/${repoName}/contents/${path}`,
      { headers }
    )
    if (!res.ok) return []

    const items = await res.json()
    if (!Array.isArray(items)) return []

    const files: Array<{ name: string; content: string }> = []

    for (const item of items.slice(0, 20)) { // cap per-dir to 20 files
      if (item.type === 'file' && shouldIndex(item.name) && item.size < 100000) {
        try {
          const fileRes = await fetch(item.download_url, { headers })
          if (fileRes.ok) {
            const content = await fileRes.text()
            files.push({ name: item.name, content: content.slice(0, 6000) })
          }
        } catch { /* skip individual failures */ }
      }
    }

    return files
  } catch {
    return []
  }
}

function shouldIndex(filename: string): boolean {
  const ext = filename.toLowerCase()
  return ['.ts', '.tsx', '.js', '.md', '.txt', '.sql', '.html', '.py', '.json'].some(e => ext.endsWith(e))
    && !filename.includes('package-lock')
    && !filename.includes('.min.')
}

async function extractIdeasFromContent(
  content: string,
  repoLabel: string
): Promise<ExtractedIdea[]> {
  if (content.length < 100) return []

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: `You are DIANA, the ATLAS Document Intelligence Agent.
Extract unique features, ideas, and innovations from ATLAS codebase documents.
Focus on: lead generation methods, AI agent designs, real estate tools, WV/CO market features.
Return ONLY valid JSON array. If nothing notable found, return [].
Isaac Brandon Burdette · Atlas Genesis Matrix LLC`,
      messages: [{
        role: 'user',
        content: `Extract ideas from this ATLAS file (source: ${repoLabel}):

${content.slice(0, 4000)}

Return JSON array — only include genuinely unique ideas:
[{
  "title": "Feature name (max 80 chars)",
  "description": "What it does and why it matters (max 300 chars)",
  "category": "CAPTURE|GENERATE|PRIVACY|CONNECT|PATENT",
  "business_value": 1-10,
  "tags": ["tag1", "tag2"]
}]

Max 5 ideas per file. Empty array if nothing notable.`,
      }],
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '[]'
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    if (!Array.isArray(parsed)) return []

    return parsed.map((idea: ExtractedIdea) => ({
      ...idea,
      source_repo: repoLabel,
      tags: Array.isArray(idea.tags) ? idea.tags.slice(0, 5) : [],
    }))
  } catch {
    return []
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Auth + owner gate
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!OWNER_EMAILS.includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Owner access required' }, { status: 403 })
  }

  const body = await req.json()
  const {
    token,           // GitHub PAT — if not provided, uses GITHUB_TOKEN env var
    repos,           // optional: array of repo names to scan (defaults to all)
    paste_content,   // optional: paste content directly instead of GitHub
    max_repos = 5,   // cap repos scanned per call
  } = body

  const githubToken = token || process.env.GITHUB_TOKEN
  const allIdeas: ExtractedIdea[] = []
  const scannedRepos: string[] = []
  let totalFiles = 0

  if (paste_content) {
    // Direct paste mode — extract from pasted content
    const ideas = await extractIdeasFromContent(paste_content, 'pasted-content')
    allIdeas.push(...ideas)
    scannedRepos.push('pasted-content')
  } else if (githubToken) {
    // GitHub mode — scan repos
    const reposToScan = repos
      ? ATLAS_REPOS.filter(r => repos.includes(r.name))
      : ATLAS_REPOS.sort((a, b) => a.priority - b.priority).slice(0, max_repos)

    for (const repo of reposToScan) {
      const files = await fetchRepoFiles(repo.name, githubToken)
      totalFiles += files.length
      scannedRepos.push(repo.label)

      for (const file of files.slice(0, 10)) { // max 10 files per repo
        const ideas = await extractIdeasFromContent(file.content, repo.label)
        allIdeas.push(...ideas)
      }
    }
  } else {
    return NextResponse.json({
      error: 'Provide a GitHub token (token field) or paste_content. Set GITHUB_TOKEN env var to avoid passing token each time.',
      available_repos: ATLAS_REPOS.map(r => r.name),
    }, { status: 400 })
  }

  // Deduplicate by title (case-insensitive)
  const seen = new Set<string>()
  const uniqueIdeas = allIdeas.filter(idea => {
    const key = idea.title.toLowerCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Sort by business value and take top 50
  const topIdeas = uniqueIdeas
    .sort((a, b) => (b.business_value ?? 0) - (a.business_value ?? 0))
    .slice(0, 50)

  // Insert into genesis_hq_ideas table (existing table from 06_AUDIT)
  let inserted = 0
  let skipped = 0

  for (const idea of topIdeas) {
    const { error } = await supabase
      .from('genesis_hq_ideas')
      .upsert({
        title: idea.title,
        description: idea.description,
        category: idea.category,
        status: 'raw',
        votes: Math.round((idea.business_value ?? 5) * 2),
        tags: [...(idea.tags ?? []), idea.source_repo.toLowerCase().replace(/\s+/g, '-')],
        source: idea.source_repo,
        created_by: user.id,
      }, { onConflict: 'title', ignoreDuplicates: true })

    if (error) skipped++
    else inserted++
  }

  await writeAuditLog({
    user_id: user.id,
    action: 'AGENT_RUN',
    resource_type: 'corpus_compile',
    metadata: {
      repos_scanned: scannedRepos,
      files_processed: totalFiles,
      ideas_found: uniqueIdeas.length,
      ideas_inserted: inserted,
    },
  })

  return NextResponse.json({
    data: {
      repos_scanned: scannedRepos,
      files_processed: totalFiles,
      ideas_found: uniqueIdeas.length,
      ideas_inserted: inserted,
      ideas_skipped: skipped,
      top_ideas: topIdeas.slice(0, 10).map(i => ({ title: i.title, category: i.category, value: i.business_value, source: i.source_repo })),
      message: `Compiled ${scannedRepos.length} sources. ${inserted} new ideas added to Genesis HQ.`,
    }
  })
}

export async function GET() {
  return NextResponse.json({
    data: {
      description: 'Reads ATLAS repos and extracts ideas directly into Genesis HQ.',
      available_repos: ATLAS_REPOS,
      usage: {
        github: { method: 'POST', body: { token: 'ghp_...', max_repos: 5 } },
        paste: { method: 'POST', body: { paste_content: 'paste any file content here' } },
        specific_repos: { method: 'POST', body: { token: 'ghp_...', repos: ['atlas-godmode-v23', 'atlas-os'] } },
      },
      note: 'Set GITHUB_TOKEN in Vercel env vars to avoid passing token in request body.',
    }
  })
}
