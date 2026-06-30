# ATLAS v67 — Engineering Backlog (verified)

Evidence-backed status from a direct audit + work this session. This is a living
punch list, not a plan of record.

## Done & shipped to main
- Repo imported, extracted to root, `main` cleaned (removed `source/` dup).
- `PropertyMap.tsx` exhaustive-deps lint fixed.
- v9 prototype archived (`legacy/v9/`) + extraction report + reconciliation addendum.
- `/leads` lead-pool page on the existing `app/api/leads`, wired into Sidebar.
- **Pipeline made functional:** added `app/api/deals` (GET/POST/PATCH over the RLS'd
  `deals` table, status validated) and rebuilt `app/(app)/pipeline` on that schema
  (stages = deal status enum; moves persist with optimistic update + rollback). It
  was always-empty and non-persisting before.
- **Security CRITICAL cleared:** the audit critical was **vitest** (dev UI server
  arbitrary file read/exec), not Next.js. Upgraded vitest 2→4 (156 tests still
  pass); a vite HIGH cleared too. Audit 7→5, **0 critical**.
- `tsconfig.tsbuildinfo` untracked + gitignored.

## Verified — no action needed
- **Admin for `atlasmac73@gmail.com`:** already has the `owner` role (top of the
  hierarchy). `ADMIN_EMAILS`/`INVITE_SECRET` are unused env vars; admin is DB-role
  based. Nothing to change.

---

## Owner-gated — prepared, needs a decision or a preview smoke-test

### Next.js framework upgrade → branch `claude/atlas-nextjs-security-upgrade`
Remaining production advisory on `next@14`: **DoS via Image Optimizer
`remotePatterns` + RSC HTTP request deserialization** (1 high). The other remaining
audit items are **dev-only** (`glob` via eslint tooling, `postcss`).

Branch status: **next@16.2.9, build + typecheck + 156 tests green.** Done there:
async `params` codemod (9 files) + `cookies()`→async `createClient()` cascade
(57 server call sites) + `next.config.js` migration (`serverExternalPackages`).
**Remaining before merge:** (1) `next lint` was removed in Next 16 → migrate lint to
ESLint CLI (likely eslint 9 + flat config); `npm run check` fails on this only.
(2) `middleware`→`proxy` deprecation (still works). (3) **runtime smoke-test on a
preview** (cookies/caching behavior changes) before merging to main.

Interim hardening option without upgrading: tighten `next.config.js`
`images.remotePatterns` from `hostname: '**'` to specific hosts (mapbox/supabase/…)
to shrink the Image-Optimizer DoS surface — but verify all image sources first so
nothing breaks.

### Navigation unification → scoped in `docs/NAV_UNIFICATION_SCOPE.md`
`app/page.tsx` mounts the legacy SPA at `/`; portal nav is state-only
(`useArkStore.activePortal`), not URL-addressable; a parallel App Router page set
overlaps it. Recommended path: URL-sync `activePortal` (deep links/back-button) +
de-dupe MVP features to one canonical surface. **Not built** because it touches the
shared 47-portal SPA core (CLAUDE.md §6: don't casually merge), can't be runtime-
tested here, and has 3 open product questions (URL shape, canonical surface, scope).

---

## P2 — Cleanup (low risk, optional)
- **Leftover archives at repo root:** 3 `.zip` files (~1.1 MB) + `Pasted text(21).txt`.
  Harmless to deploy. `atlas-genesis-integration-packet.zip` may relate to the
  Genesis packet — confirm before deleting.
- **Loose API-response parsing** in some client pages (assume `data.leads`/`data.data`
  vs the APIs' bare arrays). Normalize per-page when touched.
