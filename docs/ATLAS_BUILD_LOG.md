# ATLAS Build Log

Status: CURRENT

Append-only log of real build/infra events, newest first. For decisions (the "why"), see
`docs/ATLAS_DECISION_LOG.md`. This file is for the "what happened."

## Log

### 2026-06-26 — Site Capture: raw-asset storage + recommender + NAIP/OSM connectors
Applied `site_capture_storage` (private `site-captures` bucket + owner/admin
storage.objects RLS). Ingest now uploads original bytes and stores storage_ref;
new /api/site-capture/asset/[assetId] gives signed-URL download + re-analyze
(re-parse EXIF from stored bytes). Added active-sensing recommender
(lib/measurement/recommend.ts → /[id]/recommend) that ranks next-best captures by
information gain over confidence/conflict/single-source/missing-data. Added real
keyless connectors: USGS NAIP aerial export (image href + bbox + m/px) and OSM
Overpass building footprint (nearest polygon → metric edges/area), wired into
enrichment; geo math in lib/measurement/geo.ts. +9 tests (75/75). Network calls
run in the deployed app — unverified live from the build sandbox (parsing tested).

### 2026-06-26 — Site Capture & Measurement Fusion (P1+P2+connector) shipped
Applied `site_capture` migration (site_captures / capture_assets / measurements,
owner/admin RLS in live convention). New code: server-side EXIF via `exifr`
(serverless-safe, not ExifTool); `lib/measurement/` fusion engine (NOAA solar
position, known-object scale library, vanishing-point estimator, inverse-variance
fusion core with conflict detection); free data connectors (USGS EPQS elevation +
Census reverse-geocode, keyless; parcel gated behind REGRID_API_TOKEN); APIs
/api/site-capture (ingest+enrich), /[id]/measure (fusion), /enrich; founder
console /admin/site-capture. 10 new unit tests (66/66 pass). Spec: 07_PLANS/8.
Still ahead: iOS capture SDK, Python SfM/bundle-adjust microservice, object
storage for raw assets, commercial connectors, ground-truth harness.

### 2026-06-25 — Perf: eliminated auth_rls_initplan across all policies
Applied `perf_rls_initplan` (idempotent DO block) to the live DB. Wrapped every
public RLS policy's auth.uid()/auth.jwt()/auth.role() calls as (select auth.<fn>())
so they evaluate once per statement instead of per row. Behavior-preserving.
Advisor `auth_rls_initplan`: 53 → 0 (64 policies rewritten incl. cosmetic re-wrap
of the new tables). The regex unwraps any existing `( SELECT auth.uid() AS alias )`
first, so it converges and never nests on re-run.

Deliberately NOT done (rationale): unused_index drops (124 — "unused" is a false
signal at zero traffic), multiple_permissive_policies merges (87 — semantic risk,
needs per-table review), unindexed_foreign_keys on other tables (41 — additive but
low value at zero data). Revisit these together once real query/usage data exists.

### 2026-06-25 — Security hardening + perf pass on live DB
Applied `security_hardening_rls` then `perf_new_tables` via Supabase MCP.

Security (advisor-driven): eliminated the 1 ERROR `security_definer_view` by setting
`public.profiles` to `security_invoker = on` (users RLS now applies: own_user_row auth.uid()=id,
god_admin_users is_god_admin; service-role reads still bypass). Closed the 3 most dangerous
always-true policies (invites/webhook_events/franchise_records — were ALL-to-public read/write/
delete) by scoping them to `service_role`. Downgraded the 4 always-true INSERT policies
(agent_approvals/agent_runs/agent_tasks/audit_logs) from `public` → `authenticated`, blocking
anonymous forging while preserving authenticated + service-client inserts (verified each route's
client). Result: security ERRORs 1 → 0; always-true 7 → 4 (remaining 4 are authenticated-INSERT,
need per-row user_id tightening as a follow-up).

Performance (new tables only): rewrote the 10 new tables' RLS to `(select auth.uid())` form
(auth_rls_initplan) and added covering indexes for their 10 foreign keys. Verified the new tables
are now clean of both lints. The broad pre-existing backlog (≈53 auth_rls_initplan, 87 multiple
permissive policies, 124 unused indexes, 41 unindexed FKs on OTHER tables) is deliberately left
for a separate, load-driven pass — not urgent at zero data and risky to bulk-change blind.

### 2026-06-25 — Applied 3 migrations to live Supabase (project kjfwanpwzgcscgsdgekm)
Applied via Supabase MCP, in order: `v67_auth_reconcile` → `autopoietic_schema` → `tournament_research`.

Discovery first: the live DB was a **scaffold** diverging from the app — `auth.users` empty (no
signups ever), `public.profiles` a view over `public.users` with **no `user_id`** column,
`users.role` CHECK limited to `user/admin/super_admin` (app needs owner/admin/beta_tester/
contractor/viewer), and the autopoietic core tables (build_blueprints, model_registry,
system_config, selfbuild_tasks, sprint_log) **never created**. So `requireAdmin()` could never
resolve a role → all `/admin/*` 403.

Reconcile migration (non-destructive): widened `users_role_check`, re-exposed `profiles` with
`id AS user_id`, added `handle_new_user()` trigger on `auth.users` (owner emails → role 'owner'),
backfilled (no-op, auth empty). Then applied the autopoietic schema (idempotent) and the new
tournament/research schema. Verified: 10 tables RLS-on, `profiles.user_id` present, 25 models
seeded, kill_switch=false, signup trigger live.

Remaining owner step: create an auth login (sign up) — the trigger auto-provisions it as `owner`.
Pre-existing advisor backlog noted (1 ERROR security_definer_view on profiles; 7 always-true RLS
policies; auth_rls_initplan perf) — not addressed here.

### 2026-06-21 — Memory OS Level 1 + Level 2 wiki built
Created root `CLAUDE.md` (Level 1 router) and Level 2 markdown wiki: `05_READ_FIRST/INDEX.md`,
`06_AUDIT/INDEX.md`, `07_PLANS/INDEX.md`, plus `docs/ATLAS_CONTEXT_MAP.md`,
`docs/ATLAS_CURRENT_PRIORITY.md`, `docs/ATLAS_DECISION_LOG.md`, `docs/ATLAS_OPEN_QUESTIONS.md`,
`docs/ATLAS_BUILD_LOG.md` (this file), `docs/ATLAS_DOC_STATUS.md`, `docs/ATLAS_GLOSSARY.md`, and
`docs/genesis/INDEX.md`. Scoped down from a larger proposed tree (memory-os/, agents/,
dev-factory/, runbooks/, decisions/, templates/, archive/ subfolders) to just the load-bearing
files — avoiding a "graveyard wiki" of speculative empty templates.

### 2026-06-21 — Environment network egress confirmed restrictive
Direct `curl` checks from this remote container showed 403 "Host not in allowlist" for
`vercel.com`, `api.vercel.com`, `supabase.com`, `api.supabase.com`, and `api.github.com`; only
bare `github.com` is reachable. This explains `vercel login` and `supabase login` failures in
this environment — not fixable from inside the session, requires an environment network-policy
change by the owner.

### 2026-06-21 — GitHub device-flow login attempted
Multiple `gh auth login --web` attempts; first several device codes expired unused (codes are
time-boxed, ~15 min). Retried with fresh codes; push to a private repo pending repo creation via
the GitHub website and successful device authorization.

## Claude Instruction

Add an entry here for real infra/build events (logins, deploys, schema applies, pushes) — not
for routine code edits, which belong in commit history instead.
