# B. Architecture Map
**ATLAS / THE ARK v67**

---

## 1. System Layers

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT                                                          │
│  ┌─────────────────────────┐   ┌──────────────────────────────┐ │
│  │ Legacy SPA Shell         │   │ Next.js App Router            │ │
│  │ TheArkApp.tsx             │   │ app/(app)/*, app/admin/*,     │ │
│  │ Sidebar.tsx               │   │ app/(marketing)/*              │ │
│  │ useArkStore.ts            │   │ Server Components + Server    │ │
│  │ PORTAL_MAP (54 entries)   │   │ Actions where applicable       │ │
│  │ components/portals/*.tsx  │   │                                 │ │
│  │ (31 portal components)    │   │                                 │ │
│  └─────────────┬─────────────┘   └───────────────┬────────────────┘ │
│                │  fetch()                         │ fetch() / RSC    │
└────────────────┼───────────────────────────────────┼──────────────────┘
                 ▼                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│  MIDDLEWARE (middleware.ts)                                      │
│  - Refresh Supabase session every request                        │
│  - PUBLIC_PATHS allowlist (/login, /invite, /auth/callback,       │
│    /api/invite/validate, /api/heartbeat, /home, /manifesto,        │
│    /pricing)                                                      │
│  - Redirect unauthenticated → /login?next=...                     │
│  - Redirect authenticated-on-/login → app                         │
└────────────────┬──────────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  API ROUTES  (app/api/**/route.ts, ~60 routes)                    │
│  Pattern per route: Auth → Permission Gate → Kill Switch Check    │
│  (agent routes only) → Zod Validate → Execute → Audit Log         │
│                                                                     │
│  lib/permissions/index.ts   — requireUser/requireAdmin/requireOwner│
│  lib/agents/killSwitch.ts   — checkKillSwitch() (fail-open)        │
│  lib/audit/logger.ts        — writeAuditLog()/writeAuditLogs()     │
│  lib/agents/toolGateway.ts  — Auth→Tier→Credit→Execute→Log         │
└────────────────┬──────────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  DOMAIN LOGIC (lib/)                                               │
│  agents/        investigator.ts (A12-SPECTER), underwriter.ts      │
│                 (A15-OMEN), copywriter.ts (A06-HERALD)              │
│  autopoietic/   heartbeat.ts (Genesis Cycle), mutationEngine.ts,    │
│                 limits.ts (AUTOPOIETIC_LIMITS)                      │
│  godmode/       engine.ts (God Mode 4-agent pod)                    │
│  models/        router.ts (TaskType×tier→model), registry.ts        │
│                 (25+ model metadata, display-only)                  │
│  scoring/       engine.ts (8-signal distress scoring, MAO calc)     │
└────────────────┬──────────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                                 │
│  Anthropic API (claude-power/default/fast aliases → env-var IDs)   │
│  Supabase Postgres (124 tables, RLS on 100%)                       │
│  Supabase Auth                                                     │
│  Stripe (NOT yet wired — price IDs null, see H/Plans-3)            │
│  Twilio (NOT enabled — A2P 10DLC pending)                           │
│  Mapbox (NOT enabled — token not provisioned, AIN heatmap)          │
│  BatchSkipTracing (NOT enabled — key not provisioned)               │
└─────────────────────────────────────────────────────────────────┘
```

## 2. The Genesis Cycle (Self-Improvement Loop)

```
Manual trigger only: admin clicks "Trigger" in Autopoietic Console
                      → POST /api/autopoietic/trigger
                      → runHeartbeatTick(supabase, triggeredBy)  [lib/autopoietic/heartbeat.ts]

  SENSE        gather platform metrics (usage, error rates, agent run stats)
     ↓
  INTERPRET    identify opportunities via heuristic rules (NOT an LLM call)
     ↓
  MUTATE       propose ≤3 blueprints/cycle (AUTOPOIETIC_LIMITS.MAX_BLUEPRINTS_PER_CYCLE)
               every blueprint created with status = 'PROPOSED'
     ↓
  SIMULATE     marks blueprint "pending_human_review" — NO actual sandboxed execution occurs
     ↓
  PROMOTE      checks risk level / blueprint type against HUMAN_APPROVAL_REQUIRED_RISK /
               HUMAN_APPROVAL_REQUIRED_TYPES — but blueprints remain PROPOSED regardless;
               promoted count is always 0 today (no auto-promotion path exists)
     ↓
  LEARN        record outcome, mark cycle complete

Human gate: admin reviews build_blueprints rows, calls POST /api/heartbeat/approve to move
            a blueprint to APPROVED. No code is ever auto-deployed — approval only flips a
            status column. There is no GitHub PR automation (explicitly deferred, see
            V67_DEPLOYMENT_HOLD.md item 3).
```

**Important wiring fact:** the Vercel cron-triggered `GET /api/heartbeat` route does **not**
call `runHeartbeatTick()`. It only resets daily credits and emits a `HEARTBEAT_SENSE` event to
`atlas_events`. The actual 6-phase Genesis Cycle only runs when a human manually hits
`/api/autopoietic/trigger`. **The self-improvement engine is not actually scheduled/automatic
today** — this is a production-readiness gap, not a safety gap (the safety posture is, if
anything, stricter than documented because nothing runs unattended).

## 3. Triple-Gate Safety Design

Every agent-execution code path passes through three independent gates before doing anything
that costs money, calls an LLM, or mutates state:

1. **Kill switch gate** — `checkKillSwitch(supabase)` reads `system_config.kill_switch`.
   Fails OPEN by design (if the config row/table is unreachable, agents are NOT blocked —
   documented intentional tradeoff favoring availability over false-positive lockout).
2. **Rate-limit gate** — `isWithinRateLimit(lastCycleAt, intervalMinutes?)` enforces
   `MIN_HEARTBEAT_INTERVAL_MINUTES = 15` between Genesis Cycle runs.
3. **Human-approval gate** — blueprints/mutations are created as `PROPOSED` and require an
   explicit admin/owner action via `/api/heartbeat/approve`. `requiresHumanApproval(riskLevel,
   blueprintType)` forces this for HIGH/CRITICAL risk or `schema_change`/`security`/
   `agent_update` blueprint types.

## 4. Tool Gateway Pattern (Agent Execution)

```
lib/agents/toolGateway.ts
  Auth → Tier Gate (subscription tier vs TOOL_REGISTRY minimum) → Credit Gate
  (subscriptions.credits vs tool cost) → Execute → Log (agent_runs + audit_logs)

TOOL_REGISTRY: 14 tools mapped to agent codes, credit cost (2–50), minimum tier (T1–T6)
Real implementations:   A01-ORACLE (inline, orchestrator/streaming copilot)
                         A03-GENESIS (inline in heartbeat.ts / genesis/cycle route)
                         A06-HERALD (copywriter.ts)
                         A12-SPECTER (investigator.ts)
                         A15-OMEN (underwriter.ts)
Stub-only (registry entry, no implementation file): A13-VANGUARD, A25-ZEUS, A228-UNREAL
```

## 5. Model Routing (Two Separate Systems — Do Not Conflate)

- `lib/models/router.ts` — **actually used at runtime.** Maps `TaskType` (realestate/dossier/
  underwriting/copywriting/scoring/skip_trace/rehab/chat/summary/code/reasoning/speed) × tier
  band (T1–T2 low / T3–T4 mid / T5–T7 high) → one of 3 Anthropic models (claude-power=opus-4,
  claude-default=sonnet-4, claude-fast=haiku-4-5), resolved through env vars with safe fallbacks.
- `lib/models/registry.ts` — **display-only.** Holds richer metadata for 25+ models (including
  non-Anthropic entries like Gemini/GPT-4o/Ollama) purely for admin/UI presentation. Routing
  decisions never read from this file.

## 6. Multi-Tenant Foundation

`organizations`, `org_members`, `role_permissions` tables exist (Phase 3). Per Merge Rule #2/#3,
all new tenant-owned tables carry `org_id` and org/role-aware RLS. Confirmed by the database
inventory pass: 100% RLS coverage across all 124 tables, zero DROP/DELETE/TRUNCATE statements,
fully idempotent migrations.

## 7. RBAC Hierarchy

```
owner (100) > admin (80) > beta_tester (40) > contractor (30) > viewer (10)
lib/permissions/index.ts: requireUser, getUserRole, requireRole, requireAdmin,
                           requireOwner, isAdmin, isOwner
All return a non-throwing {role, error} pattern — confirmed exact match to spec, zero
discrepancies found by the security audit pass.
```
