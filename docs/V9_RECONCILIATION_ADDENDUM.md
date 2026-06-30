# V9 → V67 Reconciliation Addendum (verified against the live repo)

**Purpose:** This addendum corrects `docs/V9_FEATURE_EXTRACTION_REPORT.md`. That
report was written from the v9 prototype + memory, **before** verifying against
the actual v67 source tree. A direct audit of the repo shows v67 is far more
complete than the report implies, and several "build new" items would
**duplicate working code**. Per CLAUDE.md ("the biggest MVP gap is
navigation/wiring, not missing functionality" and "reuse existing components
rather than duplicating them"), those builds should **not** proceed as written.

Original report is preserved unchanged; this file is the source of truth where
the two conflict.

## Architecture reality (verified)

- `app/page.tsx` mounts the **legacy SPA shell** `components/app/TheArkApp.tsx`
  at the root route `/`. That shell renders 50+ portals through `PORTAL_MAP`
  and the `components/Sidebar.tsx` nav.
- SPA portal navigation is **state-only** — `activePortal` in
  `store/useArkStore.ts` (`setActivePortal`). There is **no URL routing** for
  portals (no `useSearchParams`/`router.push`), so portals are not
  deep-linkable, bookmarkable, or back-button navigable.
- A **parallel** set of Next.js App Router pages exists under `app/(app)/`
  (`rehab`, `scoring`, `pipeline`, `underwriting`, `d4d`, `ain`, `top250`,
  `agents`, `counties`, `godmode`) with real URLs. The two systems overlap and
  are not fully cross-wired. **Do not merge or delete either** (CLAUDE.md §6).

## Report items that ALREADY EXIST — do NOT rebuild

| Report "build new" item | Reality in v67 | Evidence |
|---|---|---|
| RepairEstimateBuilder → `/estimates` | **Exists** as full AI rehab estimator | `app/(app)/rehab/page.tsx` (268 lines) → `app/api/ai/rehab/route.ts` |
| OfferDraftBuilder → `/offers` (LOI) | **Exists** as a portal | `components/portals/LOI.tsx` (`LOIPortal`), `PORTAL_MAP['loi']`, Sidebar "LOI Generator" |
| Contractor job board → `/contractors` | **Exists** as a portal | `components/portals/Contractors.tsx`, `ContractorPortalFull.tsx`, `PORTAL_MAP['contractors']`, Sidebar "Contractors" |
| Comms hub / OutreachDraftBox | **Exists** as a portal | `components/portals/Comms.tsx` (`CommsPortal`), `PORTAL_MAP['comms']`, Sidebar "Comms Hub" |
| Distress score / scoring | **Exists** | `lib/scoring/engine.ts` (304 lines), `app/(app)/scoring` |
| Pipeline kanban | **Exists** | `app/(app)/pipeline/page.tsx` |
| Deal calculator / underwriting / MAO | **Exists** | `app/(app)/underwriting`, `app/api/ai/underwrite/route.ts` |
| Command palette | **Exists** | `components/CommandPalette.tsx` |
| Org / invite flow | **Exists** | `components/AdminInviteManager.tsx` |
| Feature flags | **Exists** (Supabase-backed) | `lib/featureFlags.ts` |

## Genuine gaps (verified) — what's actually worth doing

1. **Lead-list UI is missing.** `app/api/leads/route.ts` and
   `app/api/leads/sources/route.ts` exist, but there is **no dedicated lead
   pool / lead-table page** (no `app/(app)/leads`, no Leads portal in
   `PORTAL_MAP`). This is the one genuinely-additive item from the report's
   "top 10" (#1). It should reuse existing UI primitives
   (`components/ui/index`) and consume the existing API — not introduce a new
   data layer.
2. **Discoverability / navigation wiring** (the real MVP gap per CLAUDE.md):
   - SPA portals are not URL-addressable. Making `activePortal` reflect a URL
     param (deep links + back button) is high-value but touches the SPA core
     (`useArkStore` + `TheArkApp`) across all 50 portals — an **owner-level
     architectural decision**, not a casual change.
   - App Router pages (`/rehab`, `/scoring`, etc.) vs. SPA portals overlap and
     aren't unified in one nav.

## Leave-behind (confirmed demo-only, do not migrate)

Matches the original report: SP6 launch-tool, LangGraph/Neo4j toys, swarm
visuals, Top 250 vanity leaderboard, white-label editor, fake DocuSign,
unwired export buttons, fake Google/Apple auth (v67 has real Supabase auth).

## Recommended next step

Skip the duplicative `/estimates`, `/offers`, `/contractors`, and comms builds.
The smallest genuinely-additive, low-risk slice is a **`/leads` list page** wired
to the existing `app/api/leads`, reusing existing UI components, with discovery
via the Sidebar. Bigger nav-unification work should be an explicit owner
decision because it modifies the shared SPA core.
