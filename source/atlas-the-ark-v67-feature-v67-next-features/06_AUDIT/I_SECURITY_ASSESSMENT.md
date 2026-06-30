# I. Security Assessment
**ATLAS / THE ARK v67**

---

## 1. Overall Posture

Strong foundational security design: RBAC, RLS, audit logging, kill switch, and human-approval
gating are all present, consistently named, and consistently used in the code paths inspected.
The main residual risk is **gaps in consistency** (a few routes/paths not yet covered) rather
than missing design — i.e., this is a "finish the rollout" problem, not a "design it" problem.

## 2. Authentication / Authorization

- Supabase Auth + session refresh on every request via `middleware.ts`.
- `PUBLIC_PATHS` allowlist is narrow and explicit: `/login`, `/invite`, `/auth/callback`,
  `/api/invite/validate`, `/api/heartbeat`, `/home`, `/manifesto`, `/pricing`. Everything else
  requires an authenticated session by default (redirect to `/login?next=...`).
- RBAC hierarchy (`owner(100) > admin(80) > beta_tester(40) > contractor(30) > viewer(10)`) via
  `lib/permissions/index.ts` — confirmed **zero discrepancies** between spec and implementation
  during this pass. All permission functions are non-throwing `{role, error}` pattern, which is
  a deliberate and good design (forces callers to explicitly check rather than relying on
  thrown-exception control flow).
- Admin-gated routes (Command Center, kill switch, blueprints) consistently use `requireAdmin()`
  — this is the exact issue that was patched in the v67 hotfix pass (blocker #1: routes
  previously queried `profiles.id` instead of `profiles.user_id`), now confirmed fixed and
  consistent across all routes inspected.

## 3. Row-Level Security

- 100% RLS coverage across all 124 tables (confirmed by database inventory pass).
- The historical RLS bug class (`id = auth.uid()` vs. `user_id = auth.uid()`) was fixed for the
  v67-introduced tables and should be the **first thing checked** on any future new table — this
  is the single most likely recurring mistake given it already happened once.
- No table grants `DELETE`/`TRUNCATE` broadly; no destructive statements anywhere in the 11 SQL
  files.

## 4. Secrets Handling

- No hardcoded secrets found in any reviewed file.
- Model IDs were previously hardcoded (blocker #9 in `V67_CHANGED_FILES_REPORT.md`) — now
  resolved via env-var map with safe fallbacks + a TODO comment to verify current model IDs in
  Vercel before production use. This is a **process risk** (a stale fallback ID could silently
  route to a deprecated/wrong model) rather than a secrets-exposure risk.
- Per governance: `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, Twilio credentials must never reach client code, never be logged,
  never appear in a client bundle. No violation of this found in the routes/components
  inspected. Secrets scan in the last hotfix pass reported 0 found.
- **Outstanding hard hold:** `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` have not yet
  been rotated, and per `V67_DEPLOYMENT_HOLD.md` must be rotated before the first GitHub push
  (since they may have been present in earlier zip/package handoffs).

## 5. Audit Logging

- `lib/audit/logger.ts`'s `writeAuditLog`/`writeAuditLogs` is non-blocking and never throws —
  good design (an audit-log failure cannot break the underlying action, but also means silent
  audit-log failures are possible and not currently alerted on).
- `AuditAction` is a closed string-literal union (AUTH/AI/DATA/BILLING/ADMIN/GENESIS HQ/
  COMPLIANCE categories) — good design, prevents free-text drift.
- **Gap (cross-corroborated with F. API Inventory):** ~9 AI/agent execution routes have
  incomplete audit-log coverage on error/rejection paths. This means a blocked or failed agent
  call may not always leave an audit trail, which weakens forensic reconstruction in an incident.

## 6. Kill Switch

- Intentionally fail-open: if `system_config` is unreachable, agents are NOT blocked. This is a
  documented, deliberate availability-over-lockout tradeoff — not a bug. Any future change to
  fail-closed behavior should be a discussed decision, not a silent "fix."
- Checked in all agent-execution routes and inside the Genesis Cycle heartbeat — complete
  coverage for current real agents.

## 7. Genesis / Autopoietic Safety

- Triple-gate design (kill switch, rate limit, human approval) is sound and consistently
  enforced in `heartbeat.ts`.
- No code is ever auto-deployed — `build_blueprints` rows only change a status column; there is
  no execution path from "approved blueprint" to "code is now running differently." This is the
  correct posture and should remain unchanged unless the owner explicitly approves a future
  GitHub PR automation system (ZEUS) — which is explicitly NOT yet built or scoped.
- `AUTOPOIETIC_LIMITS` values confirmed exactly as documented (3 blueprints/cycle, 15-min min
  interval, forced human approval for HIGH/CRITICAL risk or schema_change/security/agent_update
  types).

## 8. Compliance (TCPA / Suppression)

- `suppression_list` table exists, but **enforcement at send-time was not confirmed wired** in
  this pass (no SMS send path exists yet anyway, since Twilio is held pending A2P approval —
  so there is currently no live path where this gap is exploitable). This must be closed
  **before**, not after, Twilio is enabled. Treat as a hard precondition for Plan 3/Conditional
  Hold "Twilio SMS."

## 9. Summary of Findings by Severity

| Severity | Finding |
|---|---|
| HIGH (process, not yet live) | Secrets not yet rotated before first GitHub push |
| MEDIUM | Audit-log coverage gap on ~9 agent routes (error/rejection paths) |
| MEDIUM | Suppression-list enforcement not confirmed wired (must close before Twilio enablement) |
| LOW | T7 tier referenced but undefined (dead-reference risk, not a security hole) |
| LOW | Model ID fallbacks should be verified current before production reliance |
| INFORMATIONAL | RLS `id` vs `user_id` bug class — already fixed once, watch for recurrence on new tables |

No critical/active vulnerabilities were found in the code paths inspected. The codebase's
security design is materially ahead of its deployment status — most risk in this audit is about
finishing rollout and rotation hygiene, not redesigning anything.
