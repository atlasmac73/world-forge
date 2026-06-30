# J. Missing Functionality Assessment
**ATLAS / THE ARK v67**

---

## 1. Navigation / Wiring Gaps (Highest Priority — No External Dependency)

- ~14 of ~25 `(app)` pages and 7 of 9 `admin` pages built but not linked from Sidebar/PORTAL_MAP
  (full list in D. Portal Inventory). This is the largest single gap between "built" and
  "usable" in the entire codebase, and it's pure front-end wiring work — no schema, no API, no
  external service needed.
- Decision needed (not yet made): retrofit nav links into the legacy SPA shell, or begin
  consolidating toward App Router as canonical (see D. Portal Inventory Section 4).

## 2. Stub Agents

- A13-VANGUARD (market heatmap), A25-ZEUS (swarm/god squad), A228-UNREAL (world generation) —
  registry entries only, zero implementation. If product copy or UI anywhere implies these are
  usable today, that's a false-availability bug to fix immediately; otherwise they're simply
  unbuilt roadmap items (see Plan 7 — Agent Workforce).

## 3. External Service Activation (Conditional Blockers, Not Code Gaps)

- Stripe: no products created, billing flag off.
- Twilio: A2P 10DLC pending; no send path exists yet regardless.
- Mapbox: token not provisioned (AIN heat map runs in demo mode only without it).
- BatchSkipTracing: key not provisioned (skip-trace agent has no live data source yet).

## 4. Enforcement Gaps (Schema Exists, Logic Not Confirmed)

- Suppression-list enforcement at send-time — table exists, enforcement code not confirmed
  wired. Must close before any SMS feature ships (see I. Security Assessment Section 8).
- Document generation UI — `document_templates`/`documents`/`document_versions` tables exist;
  front-end generation flow not confirmed built out.
- Org-switching UI — `organizations`/`org_members`/`role_permissions` tables exist (multi-tenant
  foundation is real), but a user-facing "switch organization" UI was not confirmed present.
  This matters specifically for Enterprise readiness (see L).

## 5. Scheduling Gaps

- Genesis Cycle is not actually scheduled — only runs on manual admin trigger. If the long-term
  vision requires a continuously self-improving platform, this needs explicit wiring (cron →
  `runHeartbeatTick()`), with all three safety gates left exactly as-is. This is a deliberate
  open question for the owner, not an oversight to silently "fix."
- Top 250 snapshot capture (`top250_snapshots`) — described as "periodic" in the merge plan;
  no confirmed scheduler triggers this today.

## 6. Data Model Gaps

- Subscription tier T7 referenced in code but undefined in `lib/models/registry.ts`. Needs
  either a definition (price, credits, name) or removal of the dead references.

## 7. Audit / Observability Gaps

- ~9 agent routes missing consistent audit-log coverage on error/rejection paths (cross-
  corroborated in F and I).
- No alerting confirmed on audit-log write failures (writeAuditLog is non-blocking/never-throws
  by design, but that also means a silent failure mode exists with no current alarm).

## 8. Testing Gaps

- Baseline test suite (22/22 passing) is small relative to the size of the codebase (124 tables,
  ~60 routes, 5 real agents, full Genesis Cycle). No confirmation of test coverage for: Genesis
  Cycle phases, kill-switch fail-open behavior, RLS policy correctness (e.g. an automated check
  that would have caught the `id` vs `user_id` bug class before it shipped), or the tool-gateway
  tier/credit gating logic. Recommend expanding test coverage as part of Plan 1.
- `e2e/` Playwright scaffold exists but depth of coverage not confirmed in this pass.

## 9. Documentation Gap

- `PHASE_0_ORIENTATION.md` referenced in the owner's own onboarding template does not exist
  anywhere in the repo (see A. Repository Audit Section 7).

## 10. What Is Explicitly NOT Missing (Avoid Re-Building)

To prevent duplicate-build risk per governance ("prefer extending existing systems over creating
duplicates"), explicitly confirming these are NOT gaps:
- Kill switch — fully implemented, do not rebuild.
- Audit logger / AuditAction union — fully implemented, extend the union, don't create a second
  logging system.
- RBAC / permissions — fully implemented and verified correct, do not create a parallel system.
- Genesis HQ vs. Genesis Cycle — both exist, are intentionally separate, do not merge them.
- Model router vs. model registry — both exist, intentionally separate purposes (routing vs.
  display), do not merge them.
