# ATLAS v67 — Baseline Audit
**Date:** June 18, 2026  
**Base:** ATLAS_v66_CLEAN_TYPECHECK_READY.zip → extracted to ATLAS_v67_WORKING/

---

## Build Status — v66 Base (VERIFIED)

| Check | Status | Detail |
|-------|--------|--------|
| `npm ci` | ✅ PASS | 665 packages installed. Lockfile fixed: 48 internal OpenAI Artifactory URLs rewritten to registry.npmjs.org |
| `typecheck` | ✅ PASS | 0 TypeScript errors |
| `lint` | ✅ PASS | 0 ESLint warnings or errors |
| `test` | ✅ PASS | 22/22 Vitest tests pass (permissions.test.ts) |
| `build` | ✅ PASS | Clean Next.js production build, 0 TS errors |

**Verdict: Base is solid. Safe to build on.**

---

## File Inventory

| Category | Count |
|----------|-------|
| Total source files (.tsx/.ts) | 101 |
| App pages | 5 |
| API routes | 30 |
| Components | 39 |
| Portal components | 26 |
| Lib files | 14 |
| Test files | 1 |
| Supabase SQL files | 7 |

---

## Existing API Routes (30)

- `/api/admin/invite` — invite creation (admin only)
- `/api/agents/distress-score` — distress scoring
- `/api/agents/document-summary` — document AI summary
- `/api/agents/dossier` — property dossier generation
- `/api/agents/loi` — LOI generation
- `/api/agents/run` — universal agent execution via toolGateway
- `/api/agents/skip-trace` — skip trace pipeline
- `/api/agents/task-extraction` — AI task extraction
- `/api/audit` — audit log read
- `/api/beta/feedback` — beta feedback
- `/api/billing/checkout` — Stripe checkout
- `/api/billing/portal` — Stripe customer portal
- `/api/billing/webhook` — Stripe webhook handler
- `/api/claude` — raw Claude chat endpoint
- `/api/comms/sms-inbound` — Twilio inbound SMS
- `/api/comms/sms-send` — Twilio outbound SMS
- `/api/genesis/cycle` — Genesis Cycle 6-phase runner ✅ REAL (Claude-wired)
- `/api/health` — health check
- `/api/heartbeat` — cron heartbeat
- `/api/invite/validate` — invite code validation
- `/api/leads` — leads CRUD
- `/api/living-graph/expand` — LivingGraph node expansion
- `/api/portals` — portal list
- `/api/properties` — properties CRUD
- `/api/search` — search
- `/api/skills` — skills
- `/api/trust` — trust dashboard data
- `/api/twilio/sms` — Twilio SMS handler
- `/api/workflows/customer-update-draft` — workflow draft
- `/api/world/generate` — WorldForge generation

---

## Existing Portal Components (26)

Public: AIN, AgentLab, Akashic, CognitiveCockpit, Comms, Contractors, ContractorPortalFull, Dashboard, Deals, Genesis, LOI, LivingGraph, Market, Nasdrop, Onboarding, PhaseRoadmap, Settings, Skills, SkipTrace, SwarmNexus, Transmedia, TrustDashboard, WarRoom, WorldForge  
Admin (stub): Autopoietic, AdminPortal

---

## Existing Supabase Files (7)

- `schema.sql` — core schema
- `schema_beta.sql` — beta additions
- `schema_canon.sql` — canonical schema
- `schema_living_graph.sql` — living graph tables
- `schema_pilot.sql` — pilot schema
- `migrations/20260616_agent_tasks.sql` — agent tasks migration
- `seed_owner.sql` — owner seed

---

## What's Missing (v67 Adds)

| Item | Status |
|------|--------|
| Kill switch (system_config table + `/api/system/killswitch`) | ❌ Missing |
| Kill switch check in all `/api/agents/*` routes | ❌ Missing |
| Build blueprints table | ❌ Missing |
| Selfbuild tasks table | ❌ Missing |
| Model registry table | ❌ Missing |
| Sprint log table | ❌ Missing |
| `/api/genesis/blueprints` | ❌ Missing |
| `/api/system/killswitch` | ❌ Missing |
| `/api/selfbuild/queue` | ❌ Missing |
| `/api/portals/[portalId]/chat` | ❌ Missing |
| `/api/agents/model-route` | ❌ Missing |
| `components/portals/SuperLLM.tsx` (Portal 15) | ❌ Missing |
| `components/admin/CommandCenterClient.tsx` | ❌ Missing |
| `components/KillSwitchWidget.tsx` | ❌ Missing |
| `components/SplitPanel.tsx` | ❌ Missing |
| `components/ModeBar.tsx` | ❌ Missing |
| `app/admin/command-center/page.tsx` | ❌ Missing |
| `lib/agents/modelRouter.ts` | ❌ Missing |
| `lib/agents/selfBuildOrchestrator.ts` | ❌ Missing |
| `registry/models.yml` | ❌ Missing |
| `supabase/schema_v67.sql` (merged) | ❌ Missing |

---

## Risks

1. **Kill switch not implemented** — agents can run unchecked. Priority 1.
2. **Genesis Cycle writes to `genesis_cycles` table** — schema must exist before using.
3. **SuperLLM portal stub** (`Autopoietic.tsx`) — shows placeholder. Needs real implementation.
4. **No human approval gate** — blueprints proposed by Genesis have nowhere to land yet.
5. **`outputFileTracing` disabled** — flagged as will-be-removed in next Next.js major. Not breaking now.

---

## Intentionally NOT Done Yet

- No reference code copied into v66 base
- No prototype HTML imported directly
- No feature work done before base verification

---

*All checks passed. Proceeding to Phase 2: Kill Switch.*
