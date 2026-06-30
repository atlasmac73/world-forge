# Navigation Unification — Scoping Doc (not yet approved to build)

Status: **proposal for owner review.** No code changes attached. Per CLAUDE.md
§6, the two front-end systems must not be casually merged or deleted; this scopes
a low-risk, incremental path, not a rewrite.

## Problem

ATLAS has two parallel navigation systems:
1. **Legacy SPA** — `app/page.tsx` mounts `components/app/TheArkApp.tsx` at `/`.
   It renders **47 portals** via `PORTAL_MAP` and `components/Sidebar.tsx`.
   Portal selection is **state-only** (`store/useArkStore.ts` → `activePortal`,
   zustand `persist` to localStorage `the-ark-store`). It is **not URL-driven**.
2. **App Router** — 11 real routed pages under `app/(app)/*` (`agents`, `ain`,
   `counties`, `d4d`, `godmode`, `leads`, `pipeline`, `rehab`, `scoring`,
   `top250`, `underwriting`), each with a real URL and (some) server-side auth.

Consequences:
- SPA portals are **not deep-linkable / bookmarkable**; the browser back button
  doesn't move between portals; you can't share a link to a portal.
- **Overlap/duplication**: e.g. `rehab`, `scoring`, `pipeline`, `leads` exist (or
  could) in *both* worlds, with no single canonical entry.
- The Sidebar already mixes both: most items set `activePortal`; a few use
  `href` to jump to App Router pages (`/admin/*`, and now `/leads`). The model is
  inconsistent.

## Goals / non-goals

**Goals:** deep-linkable, bookmarkable, back-button-correct navigation; one
canonical entry per feature; keep both systems working.
**Non-goals (this effort):** rewriting all 47 portals into App Router; deleting
the SPA shell; changing portal UIs.

## Options

| Option | What | Risk | Verdict |
|---|---|---|---|
| **A. URL-sync the SPA** | Reflect `activePortal` in the URL (`/?portal=<id>` or `/p/[id]`) and hydrate `activePortal` from it on load; push history on change. | Low — one store + one shell change; portals untouched. | **Recommended core** |
| B. Migrate all portals to App Router | Convert each portal to a routed page. | High — 47-surface rewrite, auth/tier reflow. | Reject (too big) |
| C. Canonical routes for MVP portals | For MVP-critical portals that already have App Router pages, make the Sidebar link to the real route and retire the duplicate SPA portal entry. | Low–med per portal. | **Recommended, targeted** |

## Recommended approach: A + targeted C

1. **A — deep links (one-time core change):**
   - Add a URL param (`?portal=<id>`) as the source of truth. On mount, if the
     param is present and valid, `setActivePortal(param)`; otherwise fall back to
     persisted/default. On `setActivePortal`, `router.push`/`replace` the param so
     back/forward and bookmarks work.
   - Resolve the **persist vs URL** conflict explicitly: URL wins on load; persist
     becomes "last portal when no URL param." Keep `partialize` as-is.
   - Validate the param against the `Portal` union; unknown → dashboard.
2. **C — kill duplication for MVP loop:** for each of `leads`, `pipeline`,
   `scoring`, `rehab` (and `underwriting`), pick the **canonical** surface (the
   polished App Router page) and point the Sidebar there via `href`, removing the
   parallel SPA portal entry so there's one door per feature.

## Files in scope
- `store/useArkStore.ts` — URL hydration + history sync for `activePortal`.
- `components/app/TheArkApp.tsx` — read/write the URL param; wrap in `Suspense`
  for `useSearchParams`.
- `components/Sidebar.tsx` — normalize items to either `portal-id` (SPA) or
  `href` (canonical route); de-dupe MVP entries.

## Risks & mitigations
- **Persisted-state vs URL drift** → URL is authoritative on load; document precedence.
- **`useSearchParams` requires `Suspense`** in App Router → wrap the shell.
- **Tier-gating** (`minTier`) currently enforced in the Sidebar only → keep gate
  checks when resolving a portal from the URL (don't let a deep link bypass tiers).
- **Blast radius** (47 portals) → A changes the *mechanism*, not each portal, so
  the surface is the store + shell, not 47 files.

## Effort & testing
- ~0.5–1 day for A; ~15–30 min per portal for C.
- Tests: unit for param↔portal resolution + tier gate; manual: deep-link each MVP
  portal, back/forward, refresh-persistence, invalid param fallback.
- Gate: `npm run check && npm test && npm run build` + manual smoke on a preview.

## Open questions for owner
1. URL shape: `/?portal=<id>` (least churn) vs real paths `/p/<id>` (cleaner)?
2. For overlapping features, is the **App Router page** the canonical surface
   (recommended), or the SPA portal?
3. Scope of C now — just the MVP loop (`leads/pipeline/scoring/rehab/underwriting`)
   or all overlaps?
