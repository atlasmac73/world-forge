# Plan 1 — MVP Completion Plan
**ATLAS / THE ARK v67**
**Depends on:** 06_AUDIT/D, H, J, K

---

## 1. Thesis

Per **K. MVP Readiness**, the MVP core loop (find distressed property → dossier → underwrite →
pipeline) is **already built in code** and blocked almost entirely by navigation wiring and
deployment hygiene, not by missing features. This plan is therefore short and sequencing-
focused rather than feature-development-focused.

## 2. Workstreams

### 2.1 Close the Navigation/Wiring Gap (highest priority, no external dependency)
- Decide: retrofit links into legacy SPA Sidebar/PORTAL_MAP, or begin consolidating toward App
  Router as canonical (open decision flagged in D. Portal Inventory §4 — recommend owner makes
  this call before work starts, since it affects how much rework is "throwaway").
- Minimum bar for MVP: `/ain`, `/scoring`, `/top250`, `/pipeline`, `/d4d`, `/underwriting`,
  `/rehab` must be reachable from primary nav for the authenticated investor user.
- Admin pages (`/admin/launch-readiness`, `/admin/integrations`, `/admin/audit-logs`,
  `/admin/source-map`) should also get nav entries — lower priority than investor-facing pages
  but needed before this can be called "admin-usable."

### 2.2 Clear Deployment Hard Blockers
- Rotate `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY`; confirm `.env.local` is not
  staged in git.
- Take a Supabase backup, confirm connection to project `kjfwanpwzgcscgsdgekm`, run
  `schema_v67.sql`, then log in as `atlasmac73@gmail.com` and run `seed_owner.sql`.
- First push to a private GitHub repo; first Vercel preview deployment.
- Confirm Vercel env vars for `ANTHROPIC_MODEL_FAST/DEFAULT/POWER` are set (or verify fallback
  IDs in code are still current).

### 2.3 Close the Audit-Logging Gap
- Add consistent audit-log writes to error/rejection paths on the ~9 agent-execution routes
  identified in F/I (currently only happy-path and kill-switch-block events are reliably
  logged). Extend the existing `AuditAction` union rather than creating new mechanisms.

### 2.4 Data/Labeling Verification
- Confirm `counties`/`distress_signals` demo-vs-live data status; confirm demo mode is clearly
  labeled in the UI per governance ("demo/mock data must be clearly labeled").
- Resolve the T7 tier dead-reference (either define it in `lib/models/registry.ts` or remove
  the references) — small but should not ship undefined.

### 2.5 Re-Verify Quality Gates
- Re-run `tsc --noEmit`, `eslint`, `next build` on current branch HEAD before declaring MVP
  complete — last verified-clean run predates phases 2–6/9 of the merge plan.

## 3. Explicit Non-Goals for MVP

- No new agents (VANGUARD/ZEUS/UNREAL stay stubs).
- No billing (Stripe stays off — see Plan 3).
- No SMS (Twilio stays off pending A2P — see Plan 3).
- No org-switching UI (see Plan 4).
- No scheduled/automated Genesis Cycle (stays manual-trigger — explicit owner decision needed
  before changing this, see Plan 5/6).

## 4. Definition of Done

- Investor persona can complete the full core loop using only in-app navigation, no direct URL
  entry required.
- All 3 hard deployment blockers cleared; first successful Vercel deployment exists.
- `tsc`/`eslint`/`build` all green on the deployed commit.
- Audit-logging gap closed on all 9 flagged routes.
- AIN/scoring data sourcing is either live or clearly labeled demo.
