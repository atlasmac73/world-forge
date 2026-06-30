# ATLAS Glossary

Status: CURRENT

Terms that are easy to confuse or that only make sense with project-specific context.

- **ATLAS / THE ARK** — this repository; a real-estate-investor SaaS platform and AI operating
  system. "THE ARK" is the product name used in-app (see `LoginPageClient.tsx`); "ATLAS" /
  "Atlas Genesis Matrix" is the broader brand/IP.
- **Investor core loop** — the MVP path: invite/sign-in → dashboard → find distressed properties
  → score property → generate dossier → underwrite deal → move into pipeline → take action.
- **Genesis Cycle (A03 GENESIS)** — the existing 6-phase self-improvement agent loop
  (SENSE→INTERPRET→MUTATE→SIMULATE→PROMOTE→LEARN), manual-triggered and human-approval-gated.
  Do not confuse with "Genesis Command Center" below.
- **Genesis Command Center** — a *future*, not-yet-built product module (roadmap/Kanban/idea
  library/mind-map/patent-moat) that happens to share the "Genesis" name with A03. Tracked via
  `docs/genesis/`.
- **Tool Gateway** — the agent execution pattern: Auth → Tier Gate → Credit Gate → Execute → Log.
- **Legacy SPA shell** — `components/app/TheArkApp.tsx` + `store/useArkStore.ts` +
  PORTAL_MAP-based routing; one of the two coexisting front-end systems (see `CLAUDE.md` §6).
- **App Router** — the Next.js 14 `app/(app)`, `app/admin`, `app/(marketing)` routing system;
  the preferred pattern for new routes.
- **T1–T7** — the tier system used by `schema_v67_master.sql`'s `organizations` table
  (`plan_code`), the shape the owner has chosen to keep over the older `schema_pilot.sql` shape.
- **RBAC hierarchy** — `owner` > `admin` > `beta_tester` > `contractor` > `viewer`, enforced via
  `profiles.role`.
- **Memory OS / second brain levels** — Level 1 (root `CLAUDE.md` router, done), Level 2
  (markdown wiki, this set of docs), Level 3 (semantic search — not built), Level 4 (knowledge
  graph — not built), Level 5 (always-on autonomous brain — not built). Levels 3–5 require
  explicit owner approval before starting.

## Claude Instruction

Add a term here only when its meaning is genuinely non-obvious or has caused confusion (e.g. two
things sharing a name). Don't turn this into a full data dictionary — that belongs in
`06_AUDIT/E_DATABASE_INVENTORY.md`.
