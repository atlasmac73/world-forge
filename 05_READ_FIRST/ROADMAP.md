# ROADMAP — What's Done, In Progress, and Pending

Primary source: `docs/V67_MERGE_PLAN.md` (the most current phase plan), cross-checked
against actual repo contents — its phase table is not fully accurate, corrections
are noted below. Secondary source: `PRODUCTION_SAAS_ROADMAP.md` (post-beta backlog,
written in v65/v66 terms — items still genuinely pending are folded in below).

## Phase status (corrected against actual repo state)

| Phase | Name | Plan says | Actually verified |
|-------|------|-----------|---------------------|
| 0 | Baseline Audit | ✅ DONE | Confirmed — `docs/V67_BASELINE_AUDIT.md` exists |
| 1 | Source Map + Safety Docs | ✅ DONE | Confirmed — 8 docs exist |
| 2 | Design System | ✅ DONE | **Was partially false** — `AtlasCard`/`MetricCard` existed as files but weren't exported from `components/ui/index.tsx`, and `StatusType` was missing `'standby'`. Fixed this session; now genuinely done. |
| 3 | Schema + RLS Foundation | ✅ DONE | Confirmed, plus this session added `supabase/migrations/20260620_autopoietic_schema.sql` to close a gap where `genesis_cycles` was missing columns the heartbeat engine actually writes |
| 4 | MVP App Routes | ✅ DONE | Confirmed — 16 pages, 7+ API routes exist under `app/(app)/` and `app/admin/` |
| 5 | V20 Recovery Merge | ✅ DONE | Confirmed — `lib/autopoietic/`, `/api/heartbeat/approve`, `CourtWidget`, `PropertyMap` exist. **This session additionally**: built the Autopoietic Console UI (was dead/unwired code before — `runHeartbeatTick()` had no caller anywhere except a stub), and replaced the fake/simulated Signal Stack with one wired to the real `lib/scoring/engine.ts`. |
| 6 | v12 Port Merge | ✅ DONE | Confirmed — `lib/models/router.ts`, `lib/godmode/engine.ts`, `/api/godmode` exist |
| 7 | AIN Full Module | Plan says PENDING ("needs owner approval") | **Already built** — `app/(app)/ain/page.tsx` (county heatmap, filters, grades) + `/api/ain/counties`, `/api/ain/county`, `/api/ain/heatmap`, `/api/ain/import` are real and working. Only gap: the legacy SPA sidebar showed a "Coming Soon" stub instead of this real page — **fixed this session**, now wired. Mapbox token still needed for the optional map *visualization* layer (the data/cards/filters work without it). |
| 8 | Billing + Feature Gates | PENDING | Confirmed pending — see "External blockers" below |
| 9 | Admin + Launch + Health | ✅ DONE (partial) | Confirmed — GodView, launch readiness, integrations, audit logs all exist |
| 10 | Compliance + Safety | PENDING | Confirmed pending — no detailed spec exists yet beyond a one-line mention; needs owner input before it can be built (see "Needs your input" below) |
| 11 | Tests + Hardening | PENDING | **`npx tsc --noEmit` now passes with 0 errors** (was 36 going into this session — see `KNOWN_ISSUES.md` for the fix list). `eslint` clean. Automated test suite (`npm test` referenced in `BETA_LAUNCH_CHECKLIST.md` as "13 passed") not re-verified this session — confirm before relying on it. |
| 12 | Private Beta Package | PENDING | `docs/PRIVATE_BETA_RUNBOOK.md` drafted this session (pre-launch checklist, kill switch usage, rollback, onboarding, "not ready yet" list) |

## What was completed this session (in order)

1. Fixed the `genesis_cycles` schema gap and folded the orphaned `schema_v67.sql`
   into a real migration (`supabase/migrations/20260620_autopoietic_schema.sql`).
2. Built the Autopoietic Console portal (`/api/autopoietic/status`,
   `/api/autopoietic/trigger`, `components/portals/AutopoieticConsole.tsx`) — the
   first working caller of `runHeartbeatTick()` anywhere in the codebase.
3. Replaced the simulated Signal Stack with one wired to the real
   `lib/scoring/engine.ts` 8-signal distress model and the real `/api/scoring` route.
4. Fixed the Phase 2 design-system export gap (`AtlasCard`/`MetricCard`/`StatusType`).
5. Fixed ~20 real bugs where Postgrest query builders were chained with a no-op
   `.catch()` (Postgrest resolves with `{error}`, it doesn't reject — these were
   silently never firing) across 10 files, replaced with proper `try/catch`.
6. Installed the missing `mapbox-gl` package (was imported but never added as a
   dependency) and cleaned up stale `@ts-expect-error` directives in `PropertyMap.tsx`.
7. Wired the SPA's `'ain'` portal slot to the real, already-working AIN page instead
   of its "Coming Soon" placeholder.
8. Drafted `docs/PRIVATE_BETA_RUNBOOK.md`.
9. Initialized git for this tree (it had none) and created this `05_READ_FIRST/`
   handoff package.

## Still-stubbed portals (legacy SPA only — verify against `app/` before assuming "not built")

These currently render a `PreviewPortal` "Coming Soon" placeholder in
`components/app/TheArkApp.tsx`. Unlike AIN, these do **not** have a hidden real
implementation elsewhere as far as this session verified — they're genuinely not built:

`skip-trace`, `swarm`, `voice`, `transmedia`, `akashic`, `pay`, `community`,
`franchise`, `patents`, `expansion`, `orchestra`, `blueprint`, `legal`

(`pay` is a partial exception — billing API routes and an admin billing page exist,
just not a user-facing checkout UI inside the SPA; see Phase 8 below.)

## External blockers — not code gaps, need the project owner to act

| Item | Blocks | What's needed |
|------|--------|----------------|
| Stripe live keys + price IDs | Phase 8 billing, `pay` portal | Create products/prices in Stripe Dashboard, set env vars, flip `BILLING_ENABLED` |
| Twilio A2P 10DLC registration | `voice` portal, real SMS send (currently mock mode) | 2–4 week external approval process — register brand at console.twilio.com |
| Mapbox token | AIN map visual layer, D4D map | `NEXT_PUBLIC_MAPBOX_TOKEN` |
| BatchSkipTracing API key | `skip-trace` portal | Sign up, set key |
| Sentry DSN | Observability (Phase 11/Production Roadmap Priority 5) | Create Sentry project |

## Needs your input before it can be built (not blocked externally, just unspecified)

- **Phase 10 (Compliance + Safety)** — "suppression enforcement, audit logging
  complete" is the entire spec in the merge plan. No detail on what suppression
  rules mean in this product (DNC list? opt-out tracking? something else?).
- **Genuinely unbuilt stub portals** (`swarm`, `transmedia`, `franchise`, `patents`,
  `expansion`, `orchestra`, `blueprint`, `legal`, `community`) — each is a one-line
  description in the merge plan with no real functional spec. Building any of these
  means inventing scope, not executing a plan — confirm intent first.

## Older backlog still relevant (`PRODUCTION_SAAS_ROADMAP.md`, written pre-v67)

Still-open items from that doc not superseded by anything above:
- Credit metering automation (increment on every AI call, daily reset cron, 429 on
  limit exceeded) — partially exists (`credits_used_today`/`credits_limit_daily`
  fields exist in `useArkStore`), full enforcement not re-verified this session.
- Document processing (file upload, `mammoth.js`/`pdf-parse` extraction, pgvector
  RAG search) — `mammoth` is installed but not wired per that doc; not re-verified.
- Legal pages (`/privacy`, `/terms`, cookie consent, GDPR/CCPA delete+export
  endpoints) — required before public launch, not present as of that doc.
- Security hardening (Sentry, edge rate limiting, IP allowlisting on admin routes,
  Supabase PITR, full RLS penetration test) — not re-verified this session.
