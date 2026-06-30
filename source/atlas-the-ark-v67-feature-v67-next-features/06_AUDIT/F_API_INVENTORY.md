# F. API Inventory
**ATLAS / THE ARK v67 — `app/api/**/route.ts`**

---

## 1. Headline Numbers

| Metric | Value |
|---|---|
| Total API routes | ~60 |
| Standard pattern compliance | Auth → Permission gate → (agent routes: kill-switch check) → Zod validation → Execute → Audit log |
| Routes with confirmed audit-logging gap | ~9 (all AI/agent execution routes — see Section 3) |
| Public (unauthenticated) routes | Limited to `PUBLIC_PATHS` allowlist in `middleware.ts`: `/api/invite/validate`, `/api/heartbeat` |

## 2. Route Groups

**Auth / onboarding**
`/api/invite/validate`, auth callback support

**Agent execution** (tool-gateway pattern, kill-switch checked)
`/api/agents/run`, `/api/agents/distress-score`, `/api/agents/document-summary`,
`/api/agents/dossier`, `/api/agents/loi`, `/api/agents/skip-trace`, `/api/agents/task-extraction`

**Genesis / Autopoietic**
`/api/genesis/blueprints` (admin-gated, requireAdmin), `/api/genesis/cycle`,
`/api/autopoietic/trigger` (admin-only, manually fires `runHeartbeatTick`),
`/api/heartbeat/approve` (human-approval gate for blueprints)

**System / health**
`/api/heartbeat` (GET, cron-triggered — resets daily credits, emits `HEARTBEAT_SENSE` event;
does **not** call the Genesis Cycle — see B. Architecture Map),
`/api/health` (returns Command Center metrics: agent_runs, blueprints, pending_approvals,
genesis_cycles, sprints), `/api/system/killswitch` (requireAdmin pattern)

**Portals**
`/api/portals/[portalId]/chat` (Portal 15 SuperLLM; user_id-correct queries, subscriptions
budget check, env-var model resolution)

**Court / property data**
`/api/court-widget/extract`

**Admin**
`/api/admin/*` support routes for Command Center, GodView, launch readiness, integrations,
audit log viewer

## 3. Confirmed Audit-Logging Gap (Cross-Corroborated Finding)

Both the API-inventory research pass and the security-assessment research pass independently
flagged the **same** set of ~9 AI/agent execution routes as missing or incomplete audit-log
writes for some code paths (most have the kill-switch check and the happy-path log, but error/
rejection paths and some intermediate steps are not consistently logged). This is corroborated
from two independent angles, raising confidence it's a real gap rather than a one-off
inspection error. **This is the top recommended fix for Plan 1 (MVP Completion).**

Affected routes (same list `V67_CHANGED_FILES_REPORT.md` shows as kill-switch-patched, which is
the relevant overlap):
`/api/agents/run`, `/api/agents/distress-score`, `/api/agents/document-summary`,
`/api/agents/dossier`, `/api/agents/loi`, `/api/agents/skip-trace`,
`/api/agents/task-extraction`, plus `/api/portals/[portalId]/chat` and
`/api/genesis/cycle`.

## 4. Zod Validation

Per Merge Rule #7 ("Zod validation on all API inputs"), this was spot-checked on the agent
execution routes and the genesis/blueprint routes during the security pass — compliant on the
routes inspected. A full route-by-route Zod audit (all ~60 routes) was not exhaustively
performed in this cycle; recommend as a fast follow before declaring "production ready."

## 5. Permission Gate Consistency

`requireAdmin()`/`requireOwner()` usage is consistent on all admin-surfaced routes inspected
(command-center, killswitch, genesis/blueprints) — this was the subject of the v67 hotfix pass
(blocker #1 in `V67_CHANGED_FILES_REPORT.md`: routes previously queried `profiles.id` instead
of `profiles.user_id`, now fixed and consistent).

## 6. Routes With No Corresponding Reachable UI

Cross-referencing against **D. Portal Inventory**: API routes backing the orphaned pages
(`/scoring`, `/top250`, `/pipeline`, `/d4d`, `/underwriting`, `/rehab`, most `/admin/*`) are
presumably present and functional but effectively unused in normal product usage today since
their front-end pages aren't linked from navigation.
