# Plan 2 — Private Beta Plan
**ATLAS / THE ARK v67**
**Depends on:** Plan 1 (MVP Completion), 06_AUDIT/H, I

---

## 1. Thesis

Private beta = a small number of real outside users (beta_tester role already exists in RBAC)
using the MVP loop with light supervision, before any billing or public marketing push. Existing
artifacts already anticipate this: `BETA_LAUNCH_CHECKLIST.md`, `TESTER_INVITE_INSTRUCTIONS.md`,
the `beta_tester` role tier, and the invite-flow (`/invite`, `/api/invite/validate`) are all
already built — this plan sequences using them, not building them.

## 2. Preconditions (Must Complete Plan 1 First)

- MVP navigation gap closed for at least the investor core loop.
- First Vercel deployment live and stable.
- Secrets rotated.

## 3. Workstreams

### 3.1 Invite & Onboarding
- Confirm `/invite` flow end-to-end with a real test invite (not just code review).
- Confirm `beta_tester` role grants exactly the intended scope (RBAC hierarchy:
  `beta_tester(40)` — below admin/owner, above contractor/viewer — verify this matches intended
  beta access, e.g. should beta testers see admin pages? Likely no — confirm route guards match).

### 3.2 Feedback Loop
- `agent_feedback` table already exists — confirm a UI path exists for beta testers to leave
  feedback on agent outputs (dossier, underwriting, copywriting). If not, this is the one
  legitimately-new small feature this plan should scope (a lightweight feedback widget wired to
  the existing table — do not create a parallel feedback mechanism).

### 3.3 Guardrails for Real Outside Users
- Kill switch must be tested live (arm/disarm via Command Center) before beta testers get
  access — confirm an admin can stop all agent activity instantly if needed.
- Confirm rate limits / credit gates in Tool Gateway behave correctly for a real T1/T2 user
  (not just admin/owner accounts used in development).
- Confirm suppression-list enforcement question from I. Security Assessment §8 is resolved
  (irrelevant if no SMS/outreach features are exposed to beta testers — confirm scope).

### 3.4 Limited Surface Area
- Recommend beta testers see only the MVP core loop (AIN, scoring, dossier, underwriting,
  pipeline) — NOT Genesis/Autopoietic admin surfaces, Command Center, or GodView. Confirm route
  guards enforce this (RBAC should already do this correctly given `requireAdmin`/`requireOwner`
  gating on those routes — verify with a real beta_tester-role test account, not just code
  inspection).

### 3.5 Monitoring During Beta
- `system_health_checks` / `/api/health` already exist — confirm someone (owner/admin) is
  actually watching this during the beta window. This is an operational, not engineering, task.
- Audit logs should be reviewed periodically during beta to catch real-world edge cases the
  code review didn't anticipate.

## 4. Explicit Non-Goals

- No billing during beta (free access, tracked via existing tier/credit system at T1/T2 level).
- No public sign-up — invite-only.
- No SMS/outreach features exposed to beta testers.

## 5. Definition of Done

- N real outside users (owner to specify N) onboarded via invite flow.
- Feedback mechanism in place and at least one feedback loop closed (a beta finding leads to a
  fix or a documented decision not to fix).
- Kill switch tested live at least once during the beta window.
- No security or data-isolation incident during the beta window.
