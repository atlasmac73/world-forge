# START HERE — ATLAS / THE ARK v67

**Isaac Brandon Burdette, Sole Inventor · Atlas Genesis Matrix LLC**

This folder (`05_READ_FIRST/`) is the handoff package for any new Claude session (or
human) picking up this codebase. Read these five files **before making any code
changes**:

| File | Answers |
|------|---------|
| `README_FIRST.md` (this file) | Where do I start? What's actually true right now? |
| `VISION.md` | What is this product, who is it for, what's the long-term shape? |
| `ROADMAP.md` | What's done, what's in progress, what's genuinely blocked? |
| `KNOWN_ISSUES.md` | What's broken, stubbed, or demo-only right now? |
| `GOVERNANCE.md` | What rules must every change follow (security, RLS, audit, approvals)? |

## What this codebase is

A Next.js 14 (App Router) + Supabase (Postgres/Auth/RLS) real-estate-intelligence
platform, branded "THE ARK" / "ATLAS Genesis Matrix OS." It has two coexisting UI
shells that a new contributor needs to know about up front:

1. **Legacy SPA portal switcher** — `components/app/TheArkApp.tsx` + `components/Sidebar.tsx`
   + `store/useArkStore.ts`. A single client-rendered page that swaps "portals" in and
   out based on a `Portal` enum. Most of the v65/v66-era feature surface lives here.
2. **Next.js App Router pages** — `app/(app)/*`, `app/admin/*`, `app/(marketing)/*`.
   Newer, server-aware pages built during the v67 merge (Phase 4 of `docs/V67_MERGE_PLAN.md`).

**Important, easy-to-miss trap:** a feature can be fully built and working as an
App Router page while the legacy SPA sidebar still shows it as a "Coming Soon" stub
(`PreviewPortal`), because nobody wired the SPA slot to the real page. This was true
for the AIN Heatmap until this session — it had a complete, working implementation at
`app/(app)/ain/page.tsx` and a real `/api/ain/counties` backend the whole time, but
the sidebar showed a fake placeholder. **Before assuming something is "not built,"
grep for it under `app/` and `app/api/` — don't trust the SPA stub list alone.**

## Source-of-truth priority order

Multiple docs at the repo root describe deployment/setup, written across v65, v66,
and v67. They are **not all current** and sometimes disagree (different Supabase
migration lists, different Vercel team IDs, different Next.js point versions). When
they conflict, trust in this order:

1. Actual code/schema in the repo (always wins)
2. `docs/V67_MERGE_PLAN.md` (newest authoritative roadmap doc)
3. This `05_READ_FIRST/` package
4. Root-level `DEPLOY*.md` / `SUPABASE_SETUP.md` / `BETA_LAUNCH_CHECKLIST.md` (useful
   for mechanics — *how* to run a migration or set an env var — but treat their exact
   file lists and env var lists as historical snapshots, not current truth)

## Verified state as of this handoff (2026-06-20)

- `npx tsc --noEmit` → **0 errors** (was 36 at the start of this session; see
  `KNOWN_ISSUES.md` for what was fixed and how).
- `npx eslint .` → clean.
- Git was just initialized for this tree. `main` holds the baseline snapshot in this
  package; `feature/v67-next-features` is checked out and is where new feature work
  should happen.
- Autopoietic Console (self-improvement engine UI + kill switch + human approval
  queue) and Signal Stack (real 8-signal distress scoring UI) were wired to their
  real backends this session — see `ROADMAP.md`.

## Non-negotiable constraints (full detail in `GOVERNANCE.md`)

- Never put `SUPABASE_SERVICE_ROLE_KEY` or any secret in client code.
- Every new tenant-owned table needs RLS and `org_id`.
- Every admin/state-changing action needs an audit log row.
- Genesis/autopoietic mutations require human approval — never auto-deploy code.
- This codebase is unrelated to `genesismasteroperationspacket.docx` (a separate
  business venture document, different entity, same named individual) — do not
  merge or confuse the two.
