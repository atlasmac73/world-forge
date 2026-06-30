# D. Portal Inventory
**ATLAS / THE ARK v67**

---

## 1. Two Portal Systems

The word "portal" is overloaded in this codebase. There are two distinct systems:

1. **Legacy SPA portals** — `components/portals/*.tsx` (31 files), rendered inside
   `TheArkApp.tsx` via the `PORTAL_MAP` lookup table in `store/useArkStore.ts` (54 entries —
   more entries than files because some map to shared/placeholder components).
2. **App Router pages** — real routed pages under `app/(app)/*`, `app/admin/*`,
   `app/(marketing)/*`. These are NOT portals in the legacy sense; they are standalone Next.js
   pages with their own URLs.

## 2. Legacy SPA Portal List (31 components)

Representative categories (not exhaustive, see codebase for full list):
- Core: Dashboard, Sidebar-driven navigation shell
- AI/Agent portals: SuperLLM (Portal 15), WarRoom, SignalStack, Investigator/Dossier, God Mode
- Real estate: PropertyMap (D4D base), CourtWidget
- Admin: Command Center client wrapper
- Various stub/placeholder portals carried forward from v12/v20 merges that have not yet been
  built out to full functionality (exact stub list requires per-file inspection — flagged as a
  follow-up item, not exhaustively re-verified line-by-line in this pass)

## 3. App Router Page Reachability Map (Key Finding)

| Page | Built? | Linked from Sidebar/PORTAL_MAP? |
|---|---|---|
| `/app/(app)/dashboard` (or equivalent home) | ✅ | ✅ |
| `/app/(app)/scoring` | ✅ | ❌ |
| `/app/(app)/top250` | ✅ | ❌ |
| `/app/(app)/pipeline` | ✅ | ❌ |
| `/app/(app)/ain` | ✅ | ❌ (original "trap" example) |
| `/app/(app)/counties` | ✅ | ❌ |
| `/app/(app)/d4d` | ✅ | ❌ |
| `/app/(app)/underwriting` | ✅ | ❌ |
| `/app/(app)/rehab` | ✅ | ❌ |
| `/app/(app)/godmode` | ✅ | partial — referenced in some nav surfaces |
| `/app/(app)/agents` | ✅ | ❌ |
| `/app/admin/godview` | ✅ | ✅ |
| `/app/admin/command-center` | ✅ | ✅ |
| `/app/admin/launch-readiness` | ✅ | ❌ |
| `/app/admin/integrations` | ✅ | ❌ |
| `/app/admin/audit-logs` | ✅ | ❌ |
| `/app/admin/source-map` | ✅ | ❌ |
| `/app/(marketing)/` | ✅ | n/a (public) |
| `/app/(marketing)/pricing` | ✅ | n/a (public) |
| `/app/(marketing)/manifesto` | ✅ | n/a (public) |
| `/app/(marketing)/stakeholder` | ✅ | ❌ (even as internal-only link) |

**Finding:** of ~25 App Router pages under `(app)`/`admin`, only 2–3 are linked from the primary
navigation shell. Everything else is reachable only via direct URL entry. This is the single
most consequential UX/production-readiness finding in this audit (see H).

## 4. Recommended Reconciliation Direction (Not a Decision — Flagged for Plan 1/Plan 2)

Two structurally different fixes exist; this audit does not choose one, it surfaces the choice:

- **Option A — Retrofit nav:** Add all orphaned App Router pages into Sidebar/PORTAL_MAP as new
  entries, keeping both shells running side by side.
- **Option B — Consolidate shells:** Treat the App Router pages as canonical going forward and
  begin sunsetting legacy SPA portals that have an App Router equivalent, redirecting old
  portal IDs to the new routes.

Given that App Router is the modern, server-component-capable path and the legacy SPA shell is
the older v12/v20-era pattern, Option B is architecturally cleaner long-term but higher-risk
short-term (touches navigation state used everywhere). This decision is deferred to the owner —
see **07_PLANS/1_MVP_COMPLETION_PLAN.md**.

## 5. Portal Count Summary

| Metric | Count |
|---|---|
| Legacy SPA portal components | 31 |
| PORTAL_MAP entries | 54 |
| App Router pages (app) | ~25 |
| App Router pages (admin) | ~9 |
| App Router pages (marketing) | ~3 |
| App Router pages NOT in main nav | ~14 of ~25 (app) + ~7 of 9 (admin) |
