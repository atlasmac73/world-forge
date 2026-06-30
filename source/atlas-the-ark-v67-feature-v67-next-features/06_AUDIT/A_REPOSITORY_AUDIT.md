# A. Complete Repository Audit
**ATLAS / THE ARK v67 — Owner: Isaac Brandon Burdette · Atlas Genesis Matrix LLC**
**Branch:** feature/v67-next-features
**Date:** June 20, 2026

---

## 1. Purpose of This Document

This is the entry point for the 12-part audit (A–L). It gives the high-level shape of the
repository; each subsequent letter document drills into one dimension in depth. Read this
first, then jump to the section you need.

## 2. Repo Vitals

| Metric | Value |
|---|---|
| Framework | Next.js 14 (App Router) + Supabase (Postgres/Auth/RLS) + Anthropic API |
| Source files (approx., current branch) | 101+ baseline (V66) + substantial v67 additions (Genesis HQ, AIN, scoring, billing scaffolding) |
| API routes (`app/api/**/route.ts`) | ~60 |
| App Router pages | ~25 under `app/(app)/*`, ~9 under `app/admin/*`, ~3 under `app/(marketing)/*` |
| Legacy SPA portal components (`components/portals/*.tsx`) | 31 |
| `PORTAL_MAP` entries in `store/useArkStore.ts` / `TheArkApp.tsx` | 54 |
| Supabase SQL files | 11 |
| Total database tables | 124 |
| Test files | 1 unit test suite baseline (22/22 passing as of last verified hotfix pass) + `e2e/` Playwright scaffold |
| Last full check status (V66_PATCHED) | npm ci ✅, typecheck ✅ 0 errors, lint ✅ 0 warnings, test ✅ 22/22, build ✅ 9 pages, secrets scan ✅ 0 found |
| Current branch check status | NOT independently re-run in this audit pass (audit is documentation-only per owner instruction — see Section 6) |

## 3. Top-Level Structure

```
app/              — Next.js App Router: (app)/, admin/, (marketing)/, api/
components/       — UI primitives, shell, portals (legacy SPA), godview, launch, brand, admin
lib/              — agents, autopoietic, godmode, models, scoring, permissions, audit, supabase clients
store/            — useArkStore.ts (legacy SPA global state + PORTAL_MAP)
supabase/         — 11 SQL migration files (schema_v67_master.sql + incremental patches)
docs/             — V67_BASELINE_AUDIT.md, V67_CHANGED_FILES_REPORT.md, V67_DEPLOYMENT_HOLD.md,
                    V67_SCHEMA_SAFETY_REPORT.md, V67_MERGE_PLAN.md
05_READ_FIRST/    — README_FIRST.md, VISION.md, ROADMAP.md, KNOWN_ISSUES.md, GOVERNANCE.md
06_AUDIT/         — this document set (NEW)
07_PLANS/         — 7 strategic plans (NEW, follows this audit)
middleware.ts     — session refresh, public-path allowlist, auth redirects
__tests__/, e2e/  — Vitest unit tests, Playwright e2e scaffold
```

## 4. Two Coexisting UI Shells (Critical Architectural Fact)

The repository runs **two parallel front-end systems** simultaneously:

1. **Legacy SPA shell** — `components/app/TheArkApp.tsx` + `components/Sidebar.tsx` +
   `store/useArkStore.ts`. Navigation is driven by a `PORTAL_MAP` lookup (54 entries) rendered
   inside a single-page shell. This is the "portal" system referenced throughout v20/v12-era docs.
2. **Next.js App Router shell** — real routed pages under `app/(app)/*`, `app/admin/*`,
   `app/(marketing)/*`, each with its own URL, layout, and (where applicable) RLS-protected
   server-side data fetching.

These two systems were built at different times by different merge phases (legacy = v12/v20
ports; App Router = v67 MVP routes) and were **never fully reconciled**. The result, confirmed
independently by the portal-inventory and API-inventory research passes in this audit cycle:

- Several App Router pages are fully built, working, and reachable only by typing the URL
  directly — they are **not linked from the Sidebar/PORTAL_MAP at all**: `/d4d`, `/scoring`,
  `/top250`, `/pipeline`, `/agents`, `/godmode`, and nearly every `/admin/*` page except
  `command-center` and `godview`, plus all of `/(marketing)/*`.
- This is the same "trap" pattern previously identified for `/app/(app)/ain` (a fully-built
  55-county heat map page with zero discoverability from the main app navigation) — it is now
  confirmed to be a **systemic pattern, not a one-off oversight**.
- Net effect: a meaningful fraction of "done" Phase 4/6/7 work (per `V67_MERGE_PLAN.md` phase
  table) is invisible to a real user navigating the product normally. See **D. Portal Inventory**
  and **H. Production Readiness** for the full reachability map and remediation priority.

## 5. Governing Documents (Read Before Any Code Change)

Per the owner's standing instruction, these are authoritative and were re-confirmed present
this cycle:

| Doc | Location | Status |
|---|---|---|
| README_FIRST.md | `05_READ_FIRST/` | ✅ present |
| VISION.md | `05_READ_FIRST/` | ✅ present |
| ROADMAP.md | `05_READ_FIRST/` | ✅ present |
| KNOWN_ISSUES.md | `05_READ_FIRST/` | ✅ present |
| GOVERNANCE.md | `05_READ_FIRST/` | ✅ present |
| PHASE_0_ORIENTATION.md | — | ❌ does not exist anywhere in repo (gap — see Section 7) |
| docs/V67_BASELINE_AUDIT.md | `docs/` | ✅ present |
| docs/V67_CHANGED_FILES_REPORT.md | `docs/` | ✅ present |
| docs/V67_DEPLOYMENT_HOLD.md | `docs/` | ✅ present |
| docs/V67_SCHEMA_SAFETY_REPORT.md | `docs/` | ✅ present |

## 6. Audit Methodology and Scope Boundary

This audit was produced by:
1. Direct reading of all 5 authoritative `docs/` + `V67_MERGE_PLAN.md` files.
2. Five parallel research passes covering: portal/feature inventory, API route inventory,
   database/schema inventory, agent-system inventory, and security assessment.
3. Cross-referencing findings against prior session knowledge of the codebase (kill switch,
   Genesis Cycle, RBAC, audit logging, scoring engine, model router — all independently
   re-verified, not assumed).

**No application code was written, edited, or modified during this audit.** Per the owner's
explicit instruction ("Do not begin implementation until the audit is complete"), this entire
06_AUDIT/ and 07_PLANS/ deliverable is documentation-only.

## 7. Known Gap in This Audit Pass

- `PHASE_0_ORIENTATION.md` is referenced by the owner's own onboarding template but does not
  exist in the repository. It has not been authored as part of this pass — flagging it here so
  it isn't silently lost. Recommend authoring it as a short pointer doc (it can mostly delegate
  to this `06_AUDIT/` set plus `05_READ_FIRST/`) once the owner confirms scope/format.
- Live `tsc --noEmit` / `eslint` / `next build` were **not** re-run as part of this audit (the
  last verified-clean run is the hotfix pass documented in `V67_CHANGED_FILES_REPORT.md`). Re-run
  these before any deployment decision — see **H. Production Readiness Assessment**.
