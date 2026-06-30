# CLAUDE.md
# ATLAS AI Developer Router — Level 1 Memory OS

## 1. Project Identity

This repository is ATLAS / THE ARK v67.

ATLAS is a real-estate-investor SaaS platform and AI operating system. The current MVP focus is
the investor core loop:

Invite/sign-in → dashboard → find distressed properties → score property → generate dossier →
underwrite deal → move into pipeline → take action.

The broader long-term vision includes Genesis Command Center, a Memory OS, an Agent Workforce, a
Development Factory, and an autopoietic self-improvement loop — but the current build must
prioritize the MVP and any new module integration safely, without breaking what already works.

## 2. Owner / IP Rules

Isaac Brandon Burdette is the sole owner, founder, and inventor of ATLAS / Atlas Genesis Matrix
and related core intellectual property.

Do not list any other person or entity as inventor of Atlas Genesis Matrix IP. Any IP, patent,
founder, ownership, or admin copy must preserve Isaac Brandon Burdette as sole founder/inventor/
owner unless he explicitly says otherwise.

Patent/IP content inside the app is internal strategy content, not legal advice.

## 3. Current Build Status

Per `07_PLANS/1_MVP_COMPLETION_PLAN.md`: the MVP core loop is already built in code. The biggest
gap is navigation/wiring, not missing features. Don't restart a full repository audit by default
— the audit in `06_AUDIT/` is current. Do a quick preflight (package manager, route structure,
auth/Supabase/permissions helpers, migrations folder, available npm scripts) before any new
implementation, then proceed.

## 4. Source of Truth Docs

This is the Level 2 markdown wiki layer. Each folder below has its own `INDEX.md` — read the
index before the files inside it.

- `05_READ_FIRST/` (`05_READ_FIRST/INDEX.md`) — README_FIRST.md, VISION.md, ROADMAP.md,
  KNOWN_ISSUES.md, GOVERNANCE.md, PHASE_0_ORIENTATION.md
- `06_AUDIT/` (`06_AUDIT/INDEX.md`) — A through L, repository/architecture/feature/portal/
  database/API/agent/production/security/missing-functionality/MVP-readiness/
  enterprise-readiness inventories
- `07_PLANS/` (`07_PLANS/INDEX.md`) — 1 through 7, MVP completion through enterprise scale,
  development factory, memory OS, agent workforce
- `docs/ATLAS_CONTEXT_MAP.md` — where things live in this repo
- `docs/ATLAS_CURRENT_PRIORITY.md` — owner-set active sequencing (overrides plan ordering on
  timing, not on governance)
- `docs/ATLAS_DECISION_LOG.md` — append-only record of real decisions made
- `docs/ATLAS_OPEN_QUESTIONS.md` — unresolved questions needing an owner call
- `docs/ATLAS_BUILD_LOG.md` — append-only record of real infra/build events
- `docs/ATLAS_DOC_STATUS.md` — what CURRENT/SUPERSEDED/LEGACY/etc. mean across this repo's docs
- `docs/ATLAS_GLOSSARY.md` — terms that are easy to confuse (e.g. Genesis Cycle vs. Genesis
  Command Center)
- `docs/genesis/` (`docs/genesis/INDEX.md`) — Genesis Command Center integration packet index;
  packet files are FUTURE_SCOPE, not yet created — don't build until explicitly approved

Per `05_READ_FIRST/README_FIRST.md`'s own stated priority order: actual code/schema in the repo
always wins over any doc, including this one, if they conflict.

## 5. Required Read Order

General repo work:
1. `05_READ_FIRST/README_FIRST.md`
2. `05_READ_FIRST/GOVERNANCE.md`
3. `06_AUDIT/A_REPOSITORY_AUDIT.md`
4. `06_AUDIT/B_ARCHITECTURE_MAP.md`
5. `06_AUDIT/D_PORTAL_INVENTORY.md`
6. `06_AUDIT/E_DATABASE_INVENTORY.md`
7. `06_AUDIT/I_SECURITY_ASSESSMENT.md`
8. `06_AUDIT/K_MVP_READINESS.md`
9. The relevant plan in `07_PLANS/`

Database/schema work specifically: cross-check `supabase/schema*.sql` and `supabase/migrations/`
directly — several schema files are stale or superseded relative to each other; don't trust file
headers alone, verify against the live project and other files for conflicts (e.g. duplicate
table definitions with incompatible columns).

## 6. Architecture Rules

This repo has two front-end systems:
1. Legacy SPA shell — `components/app/TheArkApp.tsx`, `store/useArkStore.ts`, PORTAL_MAP-based
   routing.
2. Next.js App Router — pages under `app/(app)`, `app/admin`, `app/(marketing)`.

Do not delete or casually merge these systems. When adding new modules, prefer the App Router
pattern for new routes, and also check whether the page needs a legacy Sidebar/PORTAL_MAP entry
for discoverability — the biggest MVP gap is navigation/wiring, not missing functionality.

## 7. Database Rules

Supabase Postgres/Auth/RLS.

- Don't run destructive migrations (DROP/DELETE/TRUNCATE) without explicit approval.
- Use `CREATE TABLE IF NOT EXISTS` and idempotent seed patterns (`ON CONFLICT ... DO NOTHING/
  UPDATE`).
- All new tables need RLS policies.
- Check for table-name collisions across `supabase/schema*.sql` and `supabase/migrations/`
  before adding new tables — this repo has at least one known historical conflict (two
  incompatible `organizations` table definitions in `schema_pilot.sql` vs
  `schema_v67_master.sql`).
- Never expose the service-role key in client code.

## 8. Auth / Security Rules

Use the existing auth and permission helpers — do not create a second auth/user system.

RBAC hierarchy (per `supabase/schema_beta.sql`): `owner` > `admin` > `beta_tester` >
`contractor` > `viewer`.

Admin-only routes/actions must use server-side role checks. Client-side hiding alone is not
sufficient. Never hard-code or log secrets, service-role keys, API tokens, or sensitive user
data. Audit important admin actions via the existing `audit_logs` table.

## 9. Agent Rules

Real, implemented agents (per `06_AUDIT/G_AGENT_INVENTORY.md`):
- A01 ORACLE — orchestrator / streaming copilot
- A03 GENESIS — self-improvement Genesis Cycle (6-phase, manual/human-gated)
- A06 HERALD — outreach copywriting
- A12 SPECTER — property investigation / dossier generation
- A15 OMEN — underwriting / MAO analysis

Registered-but-stub (registry metadata only, no implementation — do not present as usable in any
UI): A13 VANGUARD, A25 ZEUS, A228 UNREAL.

Do not build new agents or implement the stubs unless explicitly instructed. The Genesis Cycle
(A03) is manual-triggered and human-approval-gated for its most sensitive outputs — preserve that
gate; do not convert it to unsupervised/always-on automation.

Don't confuse "Genesis Cycle" (A03, the self-improvement loop above) with any future "Genesis
Command Center" product module — they are different things that happen to share a name.

## 10. What Not to Build Yet

Unless explicitly approved: full autonomous always-on memory/scheduling, vector-DB/RAG layer,
knowledge graph, GitHub PR automation (ZEUS), VANGUARD/UNREAL implementations, public billing,
the Twilio/SMS send path, franchise/enterprise tooling. Document future work in the relevant plan
doc rather than building it.

## 11. Coding Rules

TypeScript strictly, no implicit `any`. Reuse existing UI components and helpers rather than
duplicating them. No dead routes, dead imports, unused files, or fake success states.

## 12. Validation Commands

From `package.json`: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` (also
`npm run test:e2e`, `npm run seed`). Fix any failure your change introduces; if a failure
pre-exists your change, say so explicitly with evidence rather than silently working around it.

## 13. Final Report Format

End any implementation task with: files created/modified, routes added, migrations added, seed
behavior, auth/admin behavior, validation results (lint/typecheck/test/build), remaining manual
steps, known limitations, risks/blockers. Don't claim something is complete unless validation
passed or a failure is proven pre-existing.
