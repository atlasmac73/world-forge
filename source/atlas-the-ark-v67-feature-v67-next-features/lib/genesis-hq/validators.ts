// lib/genesis-hq/validators.ts
// ATLAS v22 — Genesis HQ — Zod Mutation Validators

import { z } from 'zod'

const PrioritySchema = z.enum(['critical', 'high', 'medium', 'low'])
const KanbanColumnKeySchema = z.enum(['backlog', 'inprogress', 'review', 'done'])
const IdeaCategorySchema = z.enum(['CAPTURE', 'GENERATE', 'PRIVACY', 'CONNECT', 'PATENT'])
const PhaseStatusSchema = z.enum(['active', 'planned', 'future', 'complete', 'archived'])

// ─── Tasks ─────────────────────────────────────────────────────

export const UpdateTaskSchema = z.object({
  text: z.string().min(1).max(1000).optional(),
  done: z.boolean().optional(),
  priority: PrioritySchema.optional(),
  due_date: z.string().nullable().optional(),
})

// ─── Kanban ────────────────────────────────────────────────────

export const CreateKanbanCardSchema = z.object({
  column_key: KanbanColumnKeySchema,
  text: z.string().min(1).max(500),
  priority: PrioritySchema.default('medium'),
  task_id: z.string().uuid().nullable().optional(),
  phase_label: z.string().max(100).nullable().optional(),
  area_title: z.string().max(200).nullable().optional(),
  color: z.string().max(20).nullable().optional(),
  sort_order: z.number().int().min(0).default(0),
})

export const UpdateKanbanCardSchema = z.object({
  column_key: KanbanColumnKeySchema.optional(),
  text: z.string().min(1).max(500).optional(),
  priority: PrioritySchema.optional(),
  sort_order: z.number().int().min(0).optional(),
})

// ─── Ideas ─────────────────────────────────────────────────────

export const CreateIdeaSchema = z.object({
  category: IdeaCategorySchema,
  title: z.string().min(1).max(300),
  description: z.string().min(1).max(2000),
  patent_direction: z.string().min(1).max(1000),
  status: z.string().max(50).default('concept'),
  score: z.number().int().min(0).max(100).nullable().optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
})

export const UpdateIdeaSchema = z.object({
  category: IdeaCategorySchema.optional(),
  title: z.string().min(1).max(300).optional(),
  description: z.string().min(1).max(2000).optional(),
  patent_direction: z.string().min(1).max(1000).optional(),
  status: z.string().max(50).optional(),
  score: z.number().int().min(0).max(100).nullable().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
})

// ─── User Preferences ──────────────────────────────────────────

export const UpdateGenesisHqPreferencesSchema = z.object({
  default_view: z.enum(['roadmap', 'kanban', 'mindmap', 'ideas', 'moat']).optional(),
  collapsed_phases: z.record(z.string(), z.boolean()).optional(),
})

// ─── Admin ─────────────────────────────────────────────────────

export const AdminResetSchema = z.object({
  confirm: z.literal('RESET GENESIS HQ'), // exact match required
})

// ─── Phase / Moat (Admin Edit) ───────────────────────────────────

export const UpdatePhaseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: PhaseStatusSchema.optional(),
  eta: z.string().max(100).nullable().optional(),
  color: z.string().max(20).optional(),
})

export const UpdateMoatSectionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  icon: z.string().max(10).nullable().optional(),
  color: z.string().max(20).optional(),
})

export const CreateMoatItemSchema = z.object({
  text: z.string().min(1).max(500),
  sort_order: z.number().int().default(0),
})

export const UpdateMoatItemSchema = z.object({
  text: z.string().min(1).max(500).optional(),
  sort_order: z.number().int().optional(),
})

// ─── Type exports ───────────────────────────────────────────────

export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>
export type CreateKanbanCardInput = z.infer<typeof CreateKanbanCardSchema>
export type UpdateKanbanCardInput = z.infer<typeof UpdateKanbanCardSchema>
export type CreateIdeaInput = z.infer<typeof CreateIdeaSchema>
export type UpdateIdeaInput = z.infer<typeof UpdateIdeaSchema>
export type UpdateGenesisHqPreferencesInput = z.infer<typeof UpdateGenesisHqPreferencesSchema>
export type AdminResetInput = z.infer<typeof AdminResetSchema>
export type UpdatePhaseInput = z.infer<typeof UpdatePhaseSchema>
export type UpdateMoatSectionInput = z.infer<typeof UpdateMoatSectionSchema>
export type CreateMoatItemInput = z.infer<typeof CreateMoatItemSchema>
export type UpdateMoatItemInput = z.infer<typeof UpdateMoatItemSchema>
