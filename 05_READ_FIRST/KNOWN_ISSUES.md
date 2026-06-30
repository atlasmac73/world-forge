# KNOWN ISSUES — Current State, Verified This Session

Supersedes the portal-status section of `KNOWN_LIMITATIONS.md` (root of repo),
which is from the v65 era and is now stale in places (e.g. it lists AIN Heatmap and
Signal Stack as "coming in v66" — both are now live; see below). The root file is
left in place for historical reference but should not be treated as current.

## Build health (verified this session, 2026-06-20)

- `npx tsc --noEmit` → **0 errors**. Was 36 errors at the start of this session.
  Fixed this session:
  - `components/ui/index.tsx` didn't export `AtlasCard`/`MetricCard` (existed as
    files, never re-exported) and was missing `'standby'` from `StatusType` — 7 errors.
  - ~20 errors from `.catch()` chained directly on Supabase/Postgrest query
    builders — `.catch` doesn't exist on those types, and even where TypeScript
    didn't catch it, the calls were silently dead anyway (Postgrest resolves with
    `{data, error}`, it doesn't reject a promise on a DB error). Replaced with
    `try { await ... } catch { /* best-effort */ }` across 10 files: `dossier`,
    `ai/rehab`, `ai/underwrite`, `ain/import`, `court-widget/extract`, `godmode`
    route + engine, `heartbeat/approve`, `lib/autopoietic/heartbeat.ts`,
    `lib/autopoietic/mutationEngine.ts`.
  - 2 instances of a double-unwrap bug: `const { data: x } = await query.then(r =>
    r.data)` — the `.then()` already unwraps, so the outer destructure was reading
    `.data` off an already-unwrapped value. Fixed in `ai/rehab` and `ai/underwrite`.
  - `mapbox-gl` was imported in `components/map/PropertyMap.tsx` but never added to
    `package.json`/installed — installed now, stale `@ts-expect-error` directives
    removed.
  - A bad type cast in `lib/godmode/engine.ts` (`CopywriterOutput as Record<string,
    unknown>` with no overlapping shape) — fixed via `as unknown as Record<...>`.
- `npx eslint .` → clean.
- `npm test` ("13 passed" per `BETA_LAUNCH_CHECKLIST.md`) — **not re-run this
  session**, confirm before relying on it.

## Portal status (corrected from `KNOWN_LIMITATIONS.md`)

✅ Fully working (confirmed this session, beyond what `KNOWN_LIMITATIONS.md` claimed):
- **AIN Heatmap** — was listed as "coming in v66," is actually fully built
  (`app/(app)/ain/page.tsx` + 4 real API routes) and is now wired into the sidebar
  with a `LIVE` badge instead of its old "Coming Soon" stub.
- **Autopoietic Console** — new this session. Genesis Cycle engine UI (manual
  trigger, blueprint approval queue, kill switch, cycle history) wired to the real
  `runHeartbeatTick()` engine, which previously had no caller anywhere in the codebase.
- **Signal Stack** — was a fully simulated/fake UI; now wired to the real
  `lib/scoring/engine.ts` 8-signal distress model via `/api/scoring`.

⚠️ Still accurate from `KNOWN_LIMITATIONS.md` (not touched this session):
- SMS is in mock mode (Twilio A2P 10DLC pending — external, 2-4 weeks)
- Billing/Stripe checkout works technically but no price IDs configured
- AI features need `ANTHROPIC_API_KEY` or fall back to safe demo responses
- File upload / document processing not wired (`mammoth` installed, unused)
- Mobile layout functional but not optimized

🔜 Genuinely not built (confirmed via grep against `app/` and `app/api/` this
session, not just trusting the SPA stub list): `skip-trace`, `swarm`, `voice`,
`transmedia`, `akashic`, `community`, `franchise`, `patents`, `expansion`,
`orchestra`, `blueprint`, `legal`. `pay` is partial — backend billing routes exist,
no user-facing checkout UI wired into the SPA.

## Documentation drift (be aware when reading root-level docs)

The root of the repo has deploy/setup docs written across three eras (v65, v66,
v67) that disagree with each other on details — none of this is dangerous, but
don't follow stale specifics literally:
- `DEPLOY.md` references a specific Vercel team (`team_0BZSp8HQZWzF9FhQV4Uz4Qmf`)
  and lists a different/longer Supabase migration order than `SUPABASE_SETUP.md`.
- `DEPLOY_THIS_BUILD.md` and `V66_PHASE0_PATCH_NOTES.md` describe a specific
  Supabase project ID and reference fixing bugs (`user_profiles` → `profiles`,
  `audit_log` → `audit_logs`) that should already be resolved in this codebase —
  if you see those exact bugs again, something regressed.
- `README.md` states Next.js 14.2.5; other docs and `package.json` may show a
  different patch version — check `package.json` directly, don't trust prose.
- Migration file lists across these docs do not mention
  `supabase/schema_v67_master.sql` or this session's
  `supabase/migrations/20260620_autopoietic_schema.sql` — both are real and
  required for v67; the older docs simply predate them.

When in doubt about deployment mechanics, the *steps* in these docs (how to set a
Vercel env var, how to run a Supabase migration) are still valid — only the
specific *file lists* and *project/team IDs* may be outdated.

## Things this session deliberately did NOT touch (left as-is, flagged for awareness)

- `supabase/schema_v67_master.sql` — a separate, larger multi-tenant/org-foundation
  migration referenced by `components/admin/LaunchReadinessClient.tsx`. Different
  from (and larger than) the `schema_v67.sql` this session folded into the new
  migration. Left alone because it's out of scope for the work done — confirm its
  relationship to the rest of the schema chain before assuming it's redundant.
- `genesismasteroperationspacket.docx` — a separate business-venture document
  (different entity/venture, same named individual). Explicitly out of scope for
  this codebase; do not merge or cross-reference.
