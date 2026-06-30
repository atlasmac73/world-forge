/**
 * ATLAS v67 — Mutation engine tests
 * Guards: blueprints are ALWAYS inserted status=PROPOSED (never auto-approved),
 * the per-cycle cap is enforced, and risk/type drive the human-approval flag.
 * (Reviewer-suggested Priority 1.)
 */
import { describe, it, expect } from 'vitest'
import { submitMutations, cancelMutation, getMutationQueue } from '@/lib/autopoietic/mutationEngine'
import type { SupabaseClient } from '@supabase/supabase-js'

/** Minimal chainable Supabase mock: every builder method returns the builder;
 *  terminal reads resolve a configurable result; inserts are captured. */
function makeSupabase(opts: { single?: unknown; limit?: unknown; then?: unknown } = {}) {
  const inserts: Array<Record<string, unknown>> = []
  const builder: Record<string, unknown> = {}
  Object.assign(builder, {
    _inserts: inserts,
    from: () => builder,
    insert: (row: Record<string, unknown>) => { inserts.push(row); return builder },
    select: () => builder,
    single: () => Promise.resolve(opts.single ?? { data: { id: 'bp-1' }, error: null }),
    update: () => builder,
    eq: () => builder,
    in: () => builder,
    order: () => builder,
    limit: () => Promise.resolve(opts.limit ?? { data: [], error: null }),
    then: (resolve: (v: unknown) => unknown) => resolve(opts.then ?? { error: null }),
  })
  return builder as unknown as SupabaseClient & { _inserts: Array<Record<string, unknown>> }
}

const proposal = (over: Record<string, unknown> = {}) => ({
  title: 'T', description: 'D', blueprint_type: 'config_change',
  risk_level: 'LOW' as const, confidence_score: 50, ...over,
})

describe('submitMutations', () => {
  it('returns zeros for empty proposals', async () => {
    const r = await submitMutations(makeSupabase(), 'cycle-1', [])
    expect(r).toMatchObject({ accepted: 0, rejected: 0, queued_for_approval: 0 })
  })

  it('ALWAYS inserts status PROPOSED (no auto-approval)', async () => {
    const sb = makeSupabase()
    await submitMutations(sb, 'cycle-1', [proposal(), proposal({ risk_level: 'HIGH' })])
    expect(sb._inserts.length).toBeGreaterThan(0)
    for (const row of sb._inserts) expect(row.status).toBe('PROPOSED')
  })

  it('enforces the per-cycle cap (3) and blocks the rest', async () => {
    const five = [proposal(), proposal(), proposal(), proposal(), proposal()]
    const r = await submitMutations(makeSupabase(), 'cycle-1', five)
    expect(r.accepted).toBe(3)
    expect(r.blocked.length).toBe(2)
  })

  it('flags HIGH-risk proposals as needing human approval', async () => {
    const r = await submitMutations(makeSupabase(), 'cycle-1', [proposal({ risk_level: 'HIGH' })])
    expect(r.queued_for_approval).toBe(1)
  })

  it('flags sensitive types (schema_change) regardless of LOW risk', async () => {
    const r = await submitMutations(makeSupabase(), 'cycle-1', [proposal({ blueprint_type: 'schema_change' })])
    expect(r.queued_for_approval).toBe(1)
  })

  it('does NOT flag LOW-risk non-sensitive proposals', async () => {
    const r = await submitMutations(makeSupabase(), 'cycle-1', [proposal()])
    expect(r.queued_for_approval).toBe(0)
  })

  it('counts a DB insert error as rejected', async () => {
    const sb = makeSupabase({ single: { data: null, error: { message: 'boom' } } })
    const r = await submitMutations(sb, 'cycle-1', [proposal()])
    expect(r.rejected).toBe(1)
    expect(r.blocked.some(b => b.includes('boom'))).toBe(true)
  })
})

describe('cancelMutation', () => {
  it('returns ok on success', async () => {
    const r = await cancelMutation(makeSupabase({ then: { error: null } }), 'bp-1', 'user-1', 'nope')
    expect(r.ok).toBe(true)
  })
  it('returns ok:false on DB error', async () => {
    const r = await cancelMutation(makeSupabase({ then: { error: { message: 'fail' } } }), 'bp-1', 'user-1')
    expect(r.ok).toBe(false)
    expect(r.error).toBe('fail')
  })
})

describe('getMutationQueue', () => {
  it('returns blueprints from the DB', async () => {
    const r = await getMutationQueue(makeSupabase({ limit: { data: [{ id: 'bp-1' }], error: null } }))
    expect(r.blueprints).toHaveLength(1)
    expect(r.error).toBeNull()
  })
  it('returns empty + error string on DB error', async () => {
    const r = await getMutationQueue(makeSupabase({ limit: { data: null, error: { message: 'db down' } } }))
    expect(r.blueprints).toEqual([])
    expect(r.error).toBe('db down')
  })
})
