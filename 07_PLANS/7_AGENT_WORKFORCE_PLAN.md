# Plan 7 — Agent Workforce Plan
**ATLAS / THE ARK v67**
**Depends on:** 06_AUDIT/G (Agent Inventory)

---

## 1. Thesis

"Agent Workforce" = growing from today's 5 real agents (ORACLE, GENESIS, HERALD, SPECTER, OMEN)
plus 3 stubs (VANGUARD, ZEUS, UNREAL) toward a larger, deliberately-curated roster — not a
literal headcount target. Prior planning material referenced a much larger aspirational figure
(roughly 230 agent slots); this plan treats that as a ceiling/vision number, not a near-term
build target, and recommends growing the roster need-by-need through the existing Tool Gateway
pattern rather than mass-generating agent stubs.

## 2. Current Roster (Confirmed by G. Agent Inventory)

| Status | Agents |
|---|---|
| Real | A01-ORACLE, A03-GENESIS, A06-HERALD, A12-SPECTER, A15-OMEN |
| Stub (registry-only) | A13-VANGUARD, A25-ZEUS, A228-UNREAL |
| Unbuilt (vision-only) | remainder of the aspirational roster |

## 3. Workstreams

### 3.1 Finish the 3 Existing Stubs Before Adding New Ones
- A13-VANGUARD (market heatmap) — natural next agent, directly complements AIN/scoring work
  already built; likely the highest-leverage next build since the heat map UI and county data
  already exist (this plan recommends it as the first new agent built, pending owner
  prioritization).
- A25-ZEUS (swarm/god squad) — note the naming collision with the *separately-discussed*
  "ZEUS PR automation" concept from Plan 5/`V67_DEPLOYMENT_HOLD.md`. Confirm with owner whether
  these are meant to be the same agent eventually or are two unrelated concepts that happen to
  share a name — resolve the naming ambiguity before building either, to avoid building the
  wrong thing.
- A228-UNREAL (world generation) — lowest apparent connection to the real-estate-investor core
  product; confirm this is still in scope before investing build time, since it reads as the
  most speculative of the three stubs relative to VISION.md's stated focus.

### 3.2 New Agent Onboarding Checklist (Reusable Process)
Every new agent, going forward, should be onboarded through the same checklist (derived from
how the 5 real agents are already built):
1. Implementation file in `lib/agents/` (or appropriate lib/ subdirectory).
2. `TOOL_REGISTRY` entry with credit cost + minimum tier.
3. Routed through `lib/models/router.ts` by `TaskType`, not hardcoded model IDs.
4. Kill-switch check (`checkKillSwitch`) before execution.
5. Audit log write on every run (success and failure/rejection paths — closing the same gap
   flagged for existing agents in Plan 1).
6. `agent_runs`/`agent_artifacts` persistence (governance: "all agent runs must be persisted").
7. Zod validation on the API route that exposes it.

### 3.3 Workforce Composition Strategy
- Grow by product need (what does the investor core loop actually require next?), not by
  roster-size target. VANGUARD is the clearest need-driven next agent given existing AIN
  infrastructure.
- Avoid building agents that duplicate existing capability — e.g. do not build a second
  dossier/investigation agent alongside SPECTER; extend SPECTER instead, per governance.

### 3.4 Multi-Agent Coordination (God Mode as Precedent)
- `lib/godmode/engine.ts` already implements a 4-agent pod pattern — this is the existing
  precedent for "agent workforce" coordination (multiple agents collaborating on one task) and
  should be the template extended/reused for any future swarm-style work (relevant directly to
  the ZEUS naming-collision question in 3.1), rather than designing a new coordination pattern
  from scratch.

## 4. Explicit Non-Goals

- No mass-generation of placeholder agent stubs toward the ~230 aspirational figure — that
  number is a vision ceiling, not a sprint target.
- No new agent ships without passing the full onboarding checklist in 3.2, including the audit-
  logging and kill-switch requirements already mandatory for the existing 5.

## 5. Definition of Done (For This Plan's Initial Phase)

- ZEUS naming ambiguity resolved with owner (one agent or two distinct concepts).
- VANGUARD scoped and either built or explicitly deprioritized with reasoning recorded.
- UNREAL's product relevance explicitly confirmed in or out of current roadmap scope.
- Reusable onboarding checklist (3.2) adopted as the standard for any agent built from this
  point forward.
