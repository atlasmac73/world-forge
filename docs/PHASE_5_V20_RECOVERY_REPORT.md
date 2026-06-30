# Phase 5 — V20 Recovery Merge Report
**Date:** June 18, 2026
**Source:** ATLAS_V20_AUTOPOIETIC.zip (content reconstructed from session context)
**Status:** ✅ COMPLETE

---

## What Already Existed in v67 (No Merge Needed)

All core V20 agent files were already present in v67 from earlier sessions:

| File | Status |
|------|--------|
| `lib/agents/investigator.ts` | ✅ Present — 76 lines, real Claude API |
| `lib/agents/underwriter.ts` | ✅ Present — 94 lines, MAO + distress calc |
| `lib/agents/copywriter.ts` | ✅ Present — 91 lines, 10-touch sequence |
| `lib/agents/toolGateway.ts` | ✅ Present — zero-trust tool router |
| `lib/agents/callAgentRun.ts` | ✅ Present |
| `lib/agents/killSwitch.ts` | ✅ Present — v67 kill switch (v67 addition) |
| `app/api/agents/dossier/route.ts` | ✅ Present — 3-agent pipeline |
| `app/api/agents/run/route.ts` | ✅ Present — universal executor |
| `app/api/heartbeat/route.ts` | ✅ Present — Vercel cron trigger |
| `components/portals/WarRoom.tsx` | ✅ Present |
| `components/portals/SwarmNexus.tsx` | ✅ Present |

---

## Files Created (New in Phase 5)

### A. Autopoietic / Genesis Engine

| File | Description |
|------|-------------|
| `lib/autopoietic/limits.ts` | Safety bounds — max blueprints, rate limits, approval rules |
| `lib/autopoietic/heartbeat.ts` | Genesis Cycle 6-phase runner (SENSE→INTERPRET→MUTATE→SIMULATE→PROMOTE→LEARN) |
| `lib/autopoietic/mutationEngine.ts` | Blueprint proposal queue — admin only, approval-gated |
| `app/api/heartbeat/approve/route.ts` | Human approval/rejection of Genesis proposals |

### B. Court Widget (Prototype)

| File | Description |
|------|-------------|
| `components/portals/CourtWidget.tsx` | County court extraction UI with prominent disclaimer |
| `app/api/court-widget/extract/route.ts` | AI-assisted court research (marked as prototype) |

### C. Property Map

| File | Description |
|------|-------------|
| `components/map/PropertyMap.tsx` | Mapbox-optional map with graceful pin-list fallback |

### D. Dossier Route Enhancement

| File | Change |
|------|--------|
| `app/api/agents/dossier/route.ts` | Enhanced: now saves `agent_run_steps` + `agent_artifacts` per Phase 3 schema |

---

## Safety Contracts Enforced

| Contract | Status |
|----------|--------|
| Kill switch checked before any agent route | ✅ |
| No auto-merge to production | ✅ enforced in limits.ts |
| Human approval required at PROMOTE phase | ✅ — all blueprints land as PROPOSED |
| No GitHub PR auto-creation | ✅ — no githubPR.ts, no auto-write |
| No client-side secrets | ✅ |
| Court records clearly labeled as prototype/unverified | ✅ — disclaimer in both UI and API response |
| Autopoietic console is admin/owner only | ✅ — requireAdmin() on all routes |
| Rate limiting on heartbeat | ✅ — min 15 min between cycles |
| Max 3 blueprints per cycle | ✅ — AUTOPOIETIC_LIMITS.MAX_BLUEPRINTS_PER_CYCLE |

---

## NOT Merged from V20

| Item | Reason |
|------|--------|
| `lib/autopoietic/githubPR.ts` | No GitHub integration built — blueprints approve manually only |
| Client-side API key storage | Not present in V20 context, not added |
| Twilio auto-send routes | Not enabled — TCPA/suppression compliance required first |
| SP6 wallet / token economy | Deferred to v68+ |
| Simulated property data as "real" | All AI outputs labeled as estimates |

---

## Static Analysis Results

- ✅ All imports resolve
- ✅ No auth-helpers-nextjs usage
- ✅ No client-side secrets
- ✅ Kill switch on agent routes
- ✅ requireAdmin() on autopoietic routes

**npm registry blocked in sandbox — live typecheck/build not runnable.**
