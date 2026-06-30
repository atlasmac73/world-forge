# ATLAS Current Priority

Status: CURRENT
Owner: Isaac Brandon Burdette

This file is the single place the owner can re-sequence work without rewriting any plan or audit
doc. If this file conflicts with `07_PLANS/` on *sequencing/timing*, this file wins. It cannot
override `05_READ_FIRST/GOVERNANCE.md` hard constraints (ownership/IP, security).

## Active Priority (as of last update)

1. **MVP core loop navigation/wiring** — per `07_PLANS/1_MVP_COMPLETION_PLAN.md`. This is the
   top priority; nothing below should block or delay it.
2. **Memory OS Level 2 (this markdown wiki)** — in progress. Level 3 (semantic search), Level 4
   (knowledge graph), and Level 5 (always-on autonomous brain) are explicitly **not** to be built
   without separate owner approval — see `07_PLANS/6_MEMORY_OS_PLAN.md` and
   `docs/DO_NOT_BUILD_YET.md`.
3. **Genesis Integration Packet (`docs/genesis/`)** — docs-only packet, to be created when
   explicitly scoped by the owner. The Genesis Command Center *feature* (DB-backed roadmap,
   `/genesis` + `/genesis/admin` routes, etc.) is not yet started and should not be built until
   the packet exists and is explicitly approved.
4. **GitHub/Vercel/Supabase access plumbing** — first private-repo push, deployment pipeline.
   Procedural, ongoing.

## Not Currently Prioritized (do not start without explicit go-ahead)

- Full Genesis Command Center implementation (feature code, migrations, routes)
- Fixing the invite-only signup gap in `components/app/LoginPageClient.tsx` /
  `app/api/admin/invite/route.ts` (real gap — magic-link sign-in doesn't check invite status —
  flagged but not yet authorized to fix)
- Anything listed in `docs/DO_NOT_BUILD_YET.md` / `CLAUDE.md` §10

## Claude Instruction

Check this file before starting any non-trivial task. If it's stale or empty for a given
question, fall back to `07_PLANS/INDEX.md`'s dependency ordering.
