# Phase 6 — v12 Port Merge Report
**Date:** June 18, 2026
**Source:** atlas-godmode-v12-port(1).zip (content reconstructed from session context)
**Status:** ✅ COMPLETE

---

## Scoring Engine — Comparison and Decision

### v12 Scoring (8 signals, v12 spec)
- Tax delinquency, vacancy, foreclosure, equity deficit, DOM, owner distress, court, market velocity
- Weights: approximately equal distribution (12.5 each)

### v67 Scoring Engine (`lib/scoring/engine.ts`) — Already Built in Phase 3
- Same 8 signals
- Weighted by impact: Tax(20) > Vacancy(18) > Foreclosure(18) > Equity(15) > DOM(12) > Owner(10) > Court(7) > Market(5)
- More nuanced partial scoring (e.g., abandoned > vacant, REO < active foreclosure)
- Integrated into Phase 3 API routes and Phase 4 scoring page

**Decision: v67 engine is superior. No replacement needed.**

---

## Files Created (New in Phase 6)

### Model Router

| File | Description |
|------|-------------|
| `lib/models/router.ts` | Server-side model routing by task type + user tier. Never exposes keys. |

Key features:
- Task types: realestate, dossier, underwriting, copywriting, scoring, skip_trace, rehab, chat, summary, code, reasoning, speed
- Tier bands: T1-T2 → fast/cheap, T3-T4 → balanced, T5-T7 → power models
- Uses env vars `ANTHROPIC_MODEL_POWER/DEFAULT/FAST` with safe fallbacks
- `getModelId()` — single call for API usage
- `routeModel()` — returns full spec with routing reason

### God Mode Engine

| File | Description |
|------|-------------|
| `lib/godmode/engine.ts` | Full 4-agent orchestration with persistence, scoring integration |
| `app/api/godmode/route.ts` | API endpoint wired to engine with credit check + tier routing |

Key features:
- Runs ORACLE → INVESTIGATOR → UNDERWRITER → COPYWRITER in sequence
- Saves `agent_run_steps` for each sub-step (new Phase 3 table)
- Saves `agent_artifacts` with quality score from scoring engine
- Dual distress score: scoring engine (signal-based) + agent (AI-estimated)
- `skip_copywrite` option for faster runs
- Progress callbacks for streaming UI

---

## What Was NOT Merged from v12

| Item | Reason |
|------|--------|
| Periodic Table of AI as core UI | Deferred — admin agent registry only |
| SP6 wallet / token economy | Not compatible with v67 Stripe billing |
| Full 10-mode SuperLLM | Only 3 modes wired (Chat, Genesis, Autopilot) |
| Direct browser AI calls | Never — all AI routes server-side |
| `localStorage` API key storage | Never — no client secrets |
| BillingModal (v12 version) | Incompatible — v67 uses Stripe checkout routes |
| `ArchitectureView` as core feature | Admin internal reference only |
| `ScoringView` / `GodModePortal` UI | Portal system already handles this in v67 |

---

## Integration Points

### Model Router Usage (Example)
```typescript
import { getModelId } from '@/lib/models/router'

// In a server-side API route:
const modelId = getModelId('realestate', 'T3')
// Returns: 'claude-sonnet-4-20250514' (or env var override)

const response = await anthropic.messages.create({
  model: modelId,
  // ...
})
```

### God Mode Engine Usage (Example)
```typescript
import { runGodMode } from '@/lib/godmode/engine'

const result = await runGodMode(supabase, {
  address: '412 Elm St, Charleston WV',
  user_id: user.id,
  tier_code: 'T3',
  options: { save_artifacts: true }
})
// result.score, result.grade, result.mao, result.run_id, result.artifacts
```

---

## Static Analysis Results

- ✅ All imports resolve
- ✅ No client-side secrets
- ✅ Kill switch respected in engine
- ✅ Model IDs from env vars (not hard-coded)
- ✅ `agent_run_steps` and `agent_artifacts` saved per Phase 3 schema
- ✅ No circular dependencies (dynamic imports used in engine)

**npm registry blocked in sandbox — live typecheck/build not runnable.**

---

## Phase 7 Readiness

**Safe to proceed to Phase 7 (AIN Full Module)?** YES — with these notes:
- AIN 55-county heat map page exists at `/ain`
- AIN counties API exists at `/api/ain/counties`
- Demo data seeded in schema_v67_master.sql
- Mapbox map requires `NEXT_PUBLIC_MAPBOX_TOKEN` env var
- Phase 7 should: add admin county data import path, add live data source connectors, enhance PropertyMap for AIN

**Phase 7 requires owner approval before starting.**
