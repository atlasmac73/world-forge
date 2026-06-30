# PHASE 0 ORIENTATION — ATLAS / THE ARK v67

**Isaac Brandon Burdette, Sole Inventor · Atlas Genesis Matrix LLC**

This file closes a gap: the owner's own onboarding template lists `PHASE_0_ORIENTATION.md` as
required reading (item 6, between `GOVERNANCE.md` and `docs/V67_BASELINE_AUDIT.md`), but it did
not exist in the repo until now. It is a short pointer doc — it does not duplicate content that
already lives elsewhere, it tells you what order to read things in and what each thing is for.

## What "Phase 0" means here

Phase 0 is the orientation phase: read before you write code, not while you write code. If
you're a fresh Claude session (or a human) picking this codebase up cold, do these in order:

1. **`05_READ_FIRST/`** (5 files) — what this product is, what's true right now, what rules
   govern every change. Start with `README_FIRST.md`.
2. **This file** — confirms you're in the right order and tells you where the deeper material is.
3. **`docs/V67_BASELINE_AUDIT.md`, `V67_CHANGED_FILES_REPORT.md`, `V67_DEPLOYMENT_HOLD.md`,
   `V67_SCHEMA_SAFETY_REPORT.md`** — historical implementation/deployment record. These describe
   *how the codebase got here*, including specific bugs that were already found and fixed
   (e.g. an RLS `id` vs `user_id` bug class — see `06_AUDIT/I_SECURITY_ASSESSMENT.md` §3 for why
   this matters for any new table you write).
4. **`06_AUDIT/` (A–L)** — the current, full-repository audit (architecture, features, portals,
   database, API, agents, production readiness, security, missing functionality, MVP readiness,
   enterprise readiness). This is the most current single source of truth for "what actually
   exists and what state is it in." If something in an older doc conflicts with `06_AUDIT/`,
   trust `06_AUDIT/` — it was produced by direct inspection of the current branch.
5. **`07_PLANS/` (1–7)** — the strategic plans that follow from the audit (MVP Completion,
   Private Beta, Production SaaS, Enterprise Scale, Development Factory, Memory OS, Agent
   Workforce). Read whichever plan matches the work you're about to do before starting it.

## The one fact every reader needs immediately

The MVP core loop (find a distressed property → pull a dossier → underwrite → move into
pipeline) is **already built in code**. The reason it doesn't feel built is that most of the
pages live behind URLs that are never linked from the main navigation — two UI shells
(legacy SPA portal switcher vs. Next.js App Router) were never fully reconciled. See
`06_AUDIT/D_PORTAL_INVENTORY.md` and `06_AUDIT/K_MVP_READINESS.md` before assuming any
feature needs to be built from scratch. Grep `app/` and `app/api/` first.

## What Phase 0 does not include

Phase 0 is read-only. No code changes happen during Phase 0. The transition out of Phase 0
into implementation happens only after:
- The relevant `06_AUDIT/` section(s) for your task have been read, and
- The relevant `07_PLANS/` plan has been read, and
- Any open decision flagged in that plan (e.g. the legacy-shell-vs-App-Router consolidation
  choice in Plan 1, the org-scoping question in Plan 4) has been resolved with the owner if
  it hasn't already been.

## Standing rules (full detail in `05_READ_FIRST/GOVERNANCE.md`)

Repeating the highest-stakes ones because they're easy to violate by accident mid-task:
- Never expose secrets to client code or logs.
- Never bypass RLS, audit logging, or kill switch checks.
- Never auto-deploy Genesis/Autopoietic mutations — human approval is mandatory.
- Inspect existing code before creating anything new; prefer extending over duplicating.
