/**
 * ATLAS v67 — Genesis HQ Overview
 * GET /api/genesis-hq → full dashboard payload (phases+areas+tasks, kanban, ideas, mindmap, moat, stats)
 *
 * Unrelated to /api/genesis (the Genesis Cycle self-improvement engine).
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireGenesisHqAccess, handleGenesisHqPermissionError } from '@/lib/genesis-hq/permissions'
import type { GenesisHqOverview, GenesisHqPhase, GenesisHqKanbanColumn } from '@/lib/genesis-hq/types'

export async function GET() {
  try {
    await requireGenesisHqAccess()
    const supabase = await createClient()

    const [phasesRes, areasRes, tasksRes, columnsRes, cardsRes, ideasRes, mindmapRes, moatSectionsRes, moatItemsRes] =
      await Promise.all([
        supabase.from('genesis_hq_phases').select('*').order('sort_order'),
        supabase.from('genesis_hq_areas').select('*').order('sort_order'),
        supabase.from('genesis_hq_tasks').select('*').order('sort_order'),
        supabase.from('genesis_hq_kanban_columns').select('*').order('sort_order'),
        supabase.from('genesis_hq_kanban_cards').select('*').order('sort_order'),
        supabase.from('genesis_hq_ideas').select('*').order('source_number'),
        supabase.from('genesis_hq_mindmap_nodes').select('*').order('sort_order'),
        supabase.from('genesis_hq_moat_sections').select('*').order('sort_order'),
        supabase.from('genesis_hq_moat_items').select('*').order('sort_order'),
      ])

    const firstError = [phasesRes, areasRes, tasksRes, columnsRes, cardsRes, ideasRes, mindmapRes, moatSectionsRes, moatItemsRes]
      .find((r) => r.error)?.error
    if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 })

    const areas = areasRes.data ?? []
    const tasks = tasksRes.data ?? []
    const phases: GenesisHqPhase[] = (phasesRes.data ?? []).map((phase) => ({
      ...phase,
      areas: areas
        .filter((a) => a.phase_id === phase.id)
        .map((area) => ({ ...area, tasks: tasks.filter((t) => t.area_id === area.id) })),
    }))

    const cards = cardsRes.data ?? []
    const kanban: GenesisHqKanbanColumn[] = (columnsRes.data ?? []).map((col) => ({
      ...col,
      cards: cards.filter((c) => c.column_key === col.key),
    }))

    const moatItems = moatItemsRes.data ?? []
    const moat = (moatSectionsRes.data ?? []).map((section) => ({
      ...section,
      items: moatItems.filter((i) => i.section_id === section.id),
    }))

    const doneTasks = tasks.filter((t) => t.done).length

    const overview: GenesisHqOverview = {
      stats: {
        totalTasks: tasks.length,
        doneTasks,
        progressPct: tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0,
        totalIdeas: ideasRes.data?.length ?? 0,
        totalPhases: phases.length,
        totalAreas: areas.length,
        kanbanColumns: kanban.length,
        kanbanCards: cards.length,
      },
      phases,
      kanban,
      ideas: ideasRes.data ?? [],
      mindmap: mindmapRes.data ?? [],
      moat,
    }

    return NextResponse.json(overview)
  } catch (error) {
    return handleGenesisHqPermissionError(error)
  }
}
