# ATLAS Context Map

Status: CURRENT

One-page map of where things live in this repo, for fast orientation. This is a map, not a
duplicate of the audit — for details, follow the link to the real source.

## Top-Level Structure

| Area | Where | Detail |
|---|---|---|
| Founder orientation | `05_READ_FIRST/` | `05_READ_FIRST/INDEX.md` |
| Factual audit (what exists) | `06_AUDIT/` | `06_AUDIT/INDEX.md` |
| Forward plans (what's next) | `07_PLANS/` | `07_PLANS/INDEX.md` |
| Root router | `CLAUDE.md` | top of repo |
| Genesis Command Center prep | `docs/genesis/` | `docs/genesis/INDEX.md` (packet not yet built) |
| Misc historical reports | `docs/*.md` (V67_*, PHASE_*, etc.) | REFERENCE_ONLY — see `docs/ATLAS_DOC_STATUS.md` |

## Application Structure

| System | Where | Notes |
|---|---|---|
| Legacy SPA shell | `components/app/TheArkApp.tsx`, `store/useArkStore.ts` | PORTAL_MAP-based routing |
| Next.js App Router | `app/(app)`, `app/admin`, `app/(marketing)` | canonical pattern for new routes |
| Auth/permissions helpers | `lib/permissions.ts`, `lib/supabase/server.ts` | reuse, don't duplicate |
| Supabase schema | `supabase/schema*.sql`, `supabase/migrations/` | see `06_AUDIT/E_DATABASE_INVENTORY.md`; known `organizations` table conflict |
| Agents / Tool Gateway | per `06_AUDIT/G_AGENT_INVENTORY.md` | A01/A03/A06/A12/A15 real, A13/A25/A228 stubs only |

## Investor Core Loop (the MVP)

Invite/sign-in → dashboard → find distressed properties → score property → generate dossier →
underwrite deal → move into pipeline → take action.

Routes: `/ain`, `/scoring`, `/top250`, `/pipeline`, `/d4d`, `/underwriting`, `/rehab`.

## Claude Instruction

Use this file to find *where* something lives, then read the linked source file/folder for the
actual current truth. Don't copy facts out of the linked docs into this file — link, don't
paste.
