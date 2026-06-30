# ATLAS v67 — Engineering Backlog (verified)

Evidence-backed findings from a direct audit of the repo. Items are grouped by
priority. Each lists concrete evidence and why it is or isn't safe to do without
owner direction. This is a living punch list, not a plan of record.

## Done this session (context)
- Repo imported, extracted to root, `main` cleaned (removed `source/` dup), build green.
- `PropertyMap.tsx` exhaustive-deps lint fixed.
- v9 prototype archived (`legacy/v9/`) + extraction report + verified reconciliation addendum.
- `/leads` lead-pool page added on the existing `app/api/leads`, wired into Sidebar.
- `tsconfig.tsbuildinfo` untracked + gitignored.

---

## P0 — Core-loop bug: Pipeline board is non-functional against the backend
**Files:** `app/(app)/pipeline/page.tsx`, `app/api/leads/route.ts`, `supabase/schema.sql`

Evidence:
- The page fetches `/api/leads?limit=100` (line ~53) but parses `data.ok || data.leads || data.data`; `GET /api/leads` returns a **bare array**, so the board is **always empty**.
- It renders **deal**-shaped fields (`arv`, `asking_price`, `deal_grade`, `stage`) that the **leads** table doesn't have (leads has `name`, `status`, `touch_sequence`, joined `properties`).
- Moves PATCH `/api/leads/${dealId}` (line ~74) with `{ acquisition_status }`, but there is **no `app/api/leads/[id]` route** and the leads column is `status` (CHECK: new/contacted/negotiating/closed/dead). Moves silently 404 (`.catch(() => null)`) and never persist.
- A `deals` **table** exists (`supabase/schema.sql:83`) but there is **no `/api/deals` route**.

Deeper finding: the page's UI fields (`address`, `title`, `owner_name`, `deal_grade`, `asking_price`) and stages (`new/research/contacted/negotiating/contract/closed`) match **neither** current table:
- `deals` has `deal_name`/`purchase_price`/`arv` and status enum `prospect/analyzing/offer_made/under_contract/closed_won/closed_lost` (`supabase/schema.sql:83-101`).
- `leads` has `name`/`status` (`new/contacted/negotiating/closed/dead`).

So this is not a wire-up — it's a **redesign against a chosen schema**, which involves owner-facing product choices (stage taxonomy, which financial fields to surface). Two resolutions:
1. **Deals pipeline:** build `app/api/deals` (GET/POST/PATCH + `[id]`), redesign the board to the `deals` schema (stages = deal status enum, fields = deal_name/purchase_price/arv/MAO/profit + joined property address).
2. **Leads kanban:** rebuild the board on `/api/leads` (stages = lead statuses, persist via `PATCH /api/leads` with `{id, status}`).

Recommendation: option 1 (richer, matches the acquisition workflow), but it's a deliberate build with design choices — **confirm the stage taxonomy/fields before starting.**

## P0 — Next.js security advisories (10: 1 critical, 5 high, 4 moderate)
**Evidence:** `npm audit` — all in `next@14.2.35` + bundled `postcss`; the only listed fix is `npm audit fix --force` → **`next@16.2.9` (major, breaking)**.

Why not auto-done: a 14→16 jump changes App Router/runtime/config behavior and would likely break the build/deploy. Needs a dedicated, branch-isolated upgrade with full `check && test && build` and manual smoke testing. Do **not** run `--force` blind.

---

## P1 — Navigation / discoverability unification (the standing MVP gap)
**Evidence:** `app/page.tsx` mounts the legacy SPA (`TheArkApp`) at `/`; portal nav is state-only (`store/useArkStore.ts` `activePortal`), not URL-addressable. A parallel App Router page set (`app/(app)/*`) has real URLs. The two overlap and aren't unified.

Why it needs owner direction: making portals URL-addressable touches the shared SPA core across all 50 portals; CLAUDE.md §6 says **do not casually merge** the two front-end systems. Scope as an explicit, owner-approved effort.

## P1 — Admin access for `atlasmac73@gmail.com`
**Evidence:** `ADMIN_EMAILS` and `INVITE_SECRET` are in `.env.example` but **not referenced anywhere in code**. Admin is governed by **Supabase DB role** (migrations `promote_isaac_account`, `owner_login_role_grants_v2`).

Action (needs explicit go — it's a live auth change): grant the `admin`/`owner` role to that account via SQL, audited through `audit_logs`. Setting the env var would be a no-op.

---

## P2 — Cleanup (low risk, optional)
- **Leftover archives at repo root:** `ATLAS_V20_AUTOPOIETIC.zip`, `atlas-genesis-integration-packet.zip`, `atlasv22genesishq.zip` (~1.1 MB) + `Pasted text(21).txt`. Harmless to deploy. Removal is optional; `atlas-genesis-integration-packet.zip` may relate to the Genesis packet (CLAUDE.md docs/genesis) — confirm before deleting.
- **Loose API-response parsing pattern:** several client pages assume wrapped shapes (`data.leads`/`data.data`) while APIs return bare arrays. Normalize per-page when touched (the new `/leads` page already tolerates both).
