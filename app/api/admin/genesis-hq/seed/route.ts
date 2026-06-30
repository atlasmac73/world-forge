/**
 * ATLAS v67 — Genesis HQ Admin: Seed
 * POST /api/admin/genesis-hq/seed → idempotent upsert of all seed content (owner-only)
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireGenesisHqOwner, handleGenesisHqPermissionError, GenesisHqAccessError } from '@/lib/genesis-hq/permissions'
import { writeAuditLog } from '@/lib/audit/logger'
import {
  SEED_PHASES,
  SEED_AREAS,
  SEED_TASKS,
  SEED_KANBAN_COLUMNS,
  SEED_IDEAS,
  SEED_MINDMAP_NODES,
  SEED_MOAT_SECTIONS,
} from '@/lib/genesis-hq/seed-data'

export async function POST() {
  try {
    const ctx = await requireGenesisHqOwner()
    const supabase = createServiceClient()

    // Phases
    const { data: phases, error: phaseErr } = await supabase
      .from('genesis_hq_phases')
      .upsert(SEED_PHASES.map((p) => ({ ...p, created_by: ctx.userId })), { onConflict: 'slug' })
      .select()
    if (phaseErr) throw phaseErr
    const phaseBySlug = new Map((phases ?? []).map((p) => [p.slug, p]))

    // Areas
    const { data: areas, error: areaErr } = await supabase
      .from('genesis_hq_areas')
      .upsert(
        SEED_AREAS.map(({ phase_slug, ...a }) => ({ ...a, phase_id: phaseBySlug.get(phase_slug)?.id })),
        { onConflict: 'slug' }
      )
      .select()
    if (areaErr) throw areaErr
    const areaBySlug = new Map((areas ?? []).map((a) => [a.slug, a]))

    // Tasks
    const { data: tasks, error: taskErr } = await supabase
      .from('genesis_hq_tasks')
      .upsert(
        SEED_TASKS.map(({ area_slug, ...t }) => {
          const area = areaBySlug.get(area_slug)
          return { ...t, area_id: area?.id, phase_id: area?.phase_id, created_by: ctx.userId }
        }),
        { onConflict: 'source_key' }
      )
      .select()
    if (taskErr) throw taskErr
    const taskBySourceKey = new Map((tasks ?? []).map((t) => [t.source_key, t]))

    // Kanban columns
    const { error: colErr } = await supabase
      .from('genesis_hq_kanban_columns')
      .upsert(SEED_KANBAN_COLUMNS, { onConflict: 'key' })
    if (colErr) throw colErr

    // Kanban cards — one per task, skip if already created from a prior seed run
    const { data: existingCards } = await supabase.from('genesis_hq_kanban_cards').select('task_id')
    const existingTaskIds = new Set((existingCards ?? []).map((c) => c.task_id).filter(Boolean))

    const newCards = (tasks ?? [])
      .filter((t) => !existingTaskIds.has(t.id))
      .map((t) => ({
        column_key: t.done ? 'done' : 'backlog',
        task_id: t.id,
        text: t.text,
        priority: t.priority,
        sort_order: t.sort_order,
        created_by: ctx.userId,
      }))

    if (newCards.length > 0) {
      const { error: cardErr } = await supabase.from('genesis_hq_kanban_cards').insert(newCards)
      if (cardErr) throw cardErr
    }

    // Ideas
    const { error: ideaErr } = await supabase
      .from('genesis_hq_ideas')
      .upsert(SEED_IDEAS.map((i) => ({ ...i, created_by: ctx.userId })), { onConflict: 'source_number' })
    if (ideaErr) throw ideaErr

    // Mind map nodes
    const { error: mapErr } = await supabase
      .from('genesis_hq_mindmap_nodes')
      .upsert(SEED_MINDMAP_NODES, { onConflict: 'source_key' })
    if (mapErr) throw mapErr

    // Moat sections + items
    const { data: sections, error: sectionErr } = await supabase
      .from('genesis_hq_moat_sections')
      .upsert(
        SEED_MOAT_SECTIONS.map(({ items, ...s }) => s),
        { onConflict: 'slug' }
      )
      .select()
    if (sectionErr) throw sectionErr
    const sectionBySlug = new Map((sections ?? []).map((s) => [s.slug, s]))

    const { data: existingItems } = await supabase.from('genesis_hq_moat_items').select('section_id, text')
    const existingItemKeys = new Set((existingItems ?? []).map((i) => `${i.section_id}::${i.text}`))

    const newItems = SEED_MOAT_SECTIONS.flatMap((section) => {
      const sectionRow = sectionBySlug.get(section.slug)
      if (!sectionRow) return []
      return section.items
        .filter((text) => !existingItemKeys.has(`${sectionRow.id}::${text}`))
        .map((text, idx) => ({ section_id: sectionRow.id, text, sort_order: idx + 1 }))
    })

    if (newItems.length > 0) {
      const { error: itemErr } = await supabase.from('genesis_hq_moat_items').insert(newItems)
      if (itemErr) throw itemErr
    }

    await writeAuditLog({
      user_id: ctx.userId,
      action: 'GENESIS_HQ_SEED_RUN',
      resource_type: 'genesis_hq',
      metadata: {
        phases: phases?.length ?? 0,
        areas: areas?.length ?? 0,
        tasks: tasks?.length ?? 0,
        ideas: SEED_IDEAS.length,
        mindmapNodes: SEED_MINDMAP_NODES.length,
        moatSections: sections?.length ?? 0,
      },
    })

    return NextResponse.json({
      seeded: true,
      phases: phases?.length ?? 0,
      areas: areas?.length ?? 0,
      tasks: tasks?.length ?? taskBySourceKey.size,
      cardsCreated: newCards.length,
      ideas: SEED_IDEAS.length,
      mindmapNodes: SEED_MINDMAP_NODES.length,
      moatSections: sections?.length ?? 0,
      moatItemsCreated: newItems.length,
    })
  } catch (error) {
    if (error instanceof GenesisHqAccessError) {
      return handleGenesisHqPermissionError(error)
    }
    console.error('[Genesis HQ Seed] Error:', error)
    const message = error instanceof Error ? error.message : 'Seed failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
