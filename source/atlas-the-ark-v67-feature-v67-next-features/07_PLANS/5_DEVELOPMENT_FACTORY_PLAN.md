# Plan 5 — Development Factory Plan
**ATLAS / THE ARK v67**
**Depends on:** 06_AUDIT/B (Genesis Cycle), G (Agent Inventory), H

---

## 1. Thesis

"Development Factory" = using ATLAS's own Genesis Cycle / Autopoietic engine to accelerate
ATLAS's own development, under the existing triple-gate safety design (kill switch, rate limit,
human approval). This plan is about *operating* the existing engine more deliberately, not
building a new one — the engine itself is already implemented (B. Architecture Map §2).

## 2. Current State Recap

- Genesis Cycle (SENSE→INTERPRET→MUTATE→SIMULATE→PROMOTE→LEARN) is fully implemented in
  `lib/autopoietic/heartbeat.ts`.
- It only runs on manual admin trigger today (`/api/autopoietic/trigger`) — the cron-triggered
  `/api/heartbeat` does not call it.
- Every mutation becomes a `build_blueprints` row at status `PROPOSED`; nothing is ever
  auto-deployed; human approval via `/api/heartbeat/approve` is required for HIGH/CRITICAL risk
  or schema_change/security/agent_update types (and in practice, since promotion never auto-
  executes code today, *all* blueprints require a human to act on them to have any effect).

## 3. Workstreams

### 3.1 Decide: Manual-Only or Scheduled?
- This is an explicit owner decision, not a default to silently change. Options:
  (a) Keep manual-trigger-only — Genesis Cycle runs only when an admin deliberately wants fresh
      blueprint proposals. Lower velocity, lower risk of blueprint-queue overload.
  (b) Wire the cron to call `runHeartbeatTick()` on a schedule (e.g. daily), relying entirely on
      the existing rate-limit gate (15-min minimum) and human-approval gate to keep this safe.
      Higher velocity, more blueprints to triage, no change to the deploy-safety model itself.
- Recommendation: (b) is safe to adopt given the gates already in place, but it should be the
  owner's explicit call given the standing instruction to preserve human approval requirements
  for all Genesis/Autopoietic systems — scheduling more *proposals* doesn't bypass approval, but
  confirm the owner agrees with that framing before flipping it on.

### 3.2 Blueprint Triage Workflow
- As blueprint volume increases (whether from manual or scheduled runs), the Blueprint Queue
  UI (already built) needs a clear triage workflow for the owner/admin: review → approve/
  reject → (manual) implement. Today, "approve" only flips a status column — there is no
  automated path from approved blueprint to shipped code. Decide whether that gap should ever
  be closed (see 3.3) or whether "approved blueprint" is intentionally just a prioritized
  to-do list for a human developer (likely the safer permanent design).

### 3.3 GitHub PR Automation (ZEUS) — Explicitly Held, Not Started
- `V67_DEPLOYMENT_HOLD.md` explicitly says do not set up ZEUS PR automation yet. This plan
  records that the *eventual* shape of "Development Factory" likely involves an approved
  blueprint automatically generating a draft PR (never auto-merged) — but this is future scope,
  not current scope. Do not begin building this without a fresh, explicit owner go-ahead, since
  it materially changes the risk profile (code generation + PR creation, even without auto-
  merge, is a bigger blast radius than data-only blueprint rows).

### 3.4 Stub Agent Backlog as Factory Input
- A13-VANGUARD, A25-ZEUS, A228-UNREAL stubs are natural backlog items for a "development
  factory" — i.e., real engineering tasks that could themselves be tracked as `selfbuild_tasks`
  rows (table already exists with `requires_human_approval` fields) rather than ad hoc work.

## 4. Explicit Non-Goals

- No auto-merge, ever, without a separate explicit owner-approved redesign.
- No loosening of `AUTOPOIETIC_LIMITS`.
- No change to kill-switch fail-open behavior.

## 5. Definition of Done

- Owner has explicitly decided manual-only vs. scheduled Genesis Cycle, and that decision is
  documented (e.g. update B. Architecture Map / KNOWN_ISSUES.md once decided).
- Blueprint triage workflow is actually being used (not just built) — at least one real
  blueprint has gone from PROPOSED → APPROVED → manually implemented.
