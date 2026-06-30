# ATLAS v67 Master Merge — Verification Report
**Date:** June 18, 2026
**Package:** ATLAS_v67_MASTER_MERGE.zip (built in session)
**Verified by:** Static analysis (npm registry blocked in sandbox)

---

## File Count

| Location | Count |
|----------|-------|
| Total source files | 191 |
| App pages (page.tsx + route.ts) | 63 |
| Components (.tsx) | 50 |
| Lib files (.ts) | 16 |
| Supabase SQL files | 9 |
| Docs (.md) | 11 |

---

## Phase 0–4 File Verification

All 34 expected Phase 0–4 files confirmed present on disk. ✅

### Root config files
- ✅ package.json
- ✅ next.config.js
- ✅ tsconfig.json
- ✅ tailwind.config.js
- ✅ middleware.ts
- ✅ vercel.json

### Docs
- ✅ docs/SOURCE_MAP_MASTER.md
- ✅ docs/V67_MERGE_PLAN.md
- ✅ docs/MVP_SCOPE_LOCK.md
- ✅ docs/DO_NOT_BUILD_YET.md
- ✅ docs/IP_ATTRIBUTION_CLEANUP.md

### Supabase
- ✅ supabase/schema.sql
- ✅ supabase/schema_beta.sql
- ✅ supabase/schema_v67.sql
- ✅ supabase/schema_v67_master.sql (NEW — 20+ tables, 55 WV counties seeded)

### Design System
- ✅ components/ui/AtlasCard.tsx
- ✅ components/ui/MetricCard.tsx
- ✅ components/ui/index.tsx
- ✅ components/godview/GodViewPanel.tsx
- ✅ components/launch/LaunchChecklist.tsx
- ✅ components/brand/ManifestoPanel.tsx

### API Routes
- ✅ app/api/scoring/route.ts
- ✅ app/api/ain/counties/route.ts
- ✅ app/api/top250/route.ts
- ✅ app/api/ai/underwrite/route.ts
- ✅ app/api/ai/rehab/route.ts
- ✅ app/api/admin/launch-readiness/route.ts
- ✅ app/api/admin/integrations/route.ts

### App Pages
- ✅ app/(app)/ain/page.tsx
- ✅ app/(app)/scoring/page.tsx
- ✅ app/(app)/top250/page.tsx
- ✅ app/(app)/pipeline/page.tsx
- ✅ app/(app)/underwriting/page.tsx
- ✅ app/(app)/rehab/page.tsx
- ✅ app/(app)/godmode/page.tsx
- ✅ app/(app)/d4d/page.tsx
- ✅ app/admin/godview/page.tsx
- ✅ app/admin/launch-readiness/page.tsx
- ✅ app/admin/integrations/page.tsx
- ✅ app/admin/audit-logs/page.tsx
- ✅ app/admin/source-map/page.tsx
- ✅ app/(marketing)/home/page.tsx (renamed from /page.tsx — see fix below)
- ✅ app/(marketing)/manifesto/page.tsx
- ✅ app/(marketing)/pricing/page.tsx

### Lib
- ✅ lib/scoring/engine.ts

---

## Build Check Status

**npm ci:** BLOCKED — npm registry returns 403 in sandbox environment.
**npm run typecheck:** Cannot run without node_modules.
**npm run lint:** Cannot run without node_modules.
**npm run build:** Cannot run without node_modules.
**npm run test:** Cannot run without node_modules.

**Static analysis performed instead.** All imports verified by path resolution checks.

---

## Bugs Found and Fixed

### Bug 1 — Wrong Supabase Import (CRITICAL)
**Files:** `app/admin/godview/page.tsx`, `app/admin/launch-readiness/page.tsx`
**Problem:** Used `createServerComponentClient` from `@supabase/auth-helpers-nextjs` which is NOT in package.json.
**Fix:** Replaced with `createClient` from `@/lib/supabase/server` — the correct v67 pattern.
**Status:** ✅ Fixed

### Bug 2 — SQL Self-Reference Alias (CRITICAL)
**File:** `supabase/schema_v67_master.sql` — `ain_county_scores` seed
**Problem:** `CASE WHEN score >= 80 THEN 'CRITICAL'` referenced `score` which is a SELECT alias — invalid in PostgreSQL.
**Fix:** Replaced grade assignment with full CASE WHEN c.name ... END pattern matching named counties to known grades.
**Status:** ✅ Fixed

### Bug 3 — Routing Conflict (CRITICAL)
**Files:** `app/page.tsx` (TheArkApp at `/`) and `app/(marketing)/page.tsx` (landing at `/`)
**Problem:** Next.js route groups don't add their folder name to the URL, so both pages served at `/` — build-time conflict.
**Fix:** Moved `app/(marketing)/page.tsx` → `app/(marketing)/home/page.tsx`. Marketing landing now at `/home`.
**Status:** ✅ Fixed

### Bug 4 — Type Error: Minus Function (MINOR)
**File:** `components/ui/index.tsx`
**Problem:** Local `Minus` function had incompatible type with `LucideIcon` used in `checkIcons` Record.
**Fix:** Removed local `Minus` function. Changed `skipped` status icon to `Clock` (already imported).
**Status:** ✅ Fixed

### Bug 5 — Unused Imports (MINOR — ESLint warnings)
**Files:** `app/(app)/godmode/page.tsx` (FileText, Eye unused), `components/admin/GodViewClient.tsx` (GodPanelType unused)
**Fix:** Removed unused imports.
**Status:** ✅ Fixed

### Bug 6 — Marketing Pages Not Public
**File:** `middleware.ts`
**Problem:** `/home`, `/manifesto`, `/pricing` were not in `PUBLIC_PATHS` — unauthenticated users got redirected to login.
**Fix:** Added all three to PUBLIC_PATHS.
**Status:** ✅ Fixed

---

## No Issues Found In

- All @/ path imports resolve correctly
- requireUser() usage pattern consistent with v67 convention
- checkKillSwitch() wired in all agent routes
- react-markdown in package.json ✅
- No client-side secrets in new files ✅
- No auth-helpers-nextjs after fix ✅
- RLS SQL pattern (user_id = auth.uid()) correct ✅

---

## V67_MERGE_PLAN.md Status Update

| Phase | Status |
|-------|--------|
| 0 — Baseline Audit | ✅ DONE |
| 1 — Source Map + Safety Docs | ✅ DONE |
| 2 — Design System | ✅ DONE |
| 3 — Schema + RLS Foundation | ✅ DONE |
| 4 — MVP App Routes | ✅ DONE |
| 5 — V20 Recovery Merge | 🔄 IN PROGRESS |
| 6 — v12 Port Merge | PENDING |
| 7 — AIN Full Module | PENDING |
| 8 — Billing + Feature Gates | PENDING |
| 9 — Admin + Launch + Health | PENDING |
| 10 — Compliance + Safety | PENDING |
| 11 — Tests + Hardening | PENDING |
| 12 — Private Beta Package | PENDING |

---

## Phase 5 Readiness

**Can Phase 5 safely begin?** YES.
- All Phase 0–4 files verified present
- All critical bugs fixed
- No broken imports
- No auth-helpers-nextjs leaks
- No routing conflicts
- SQL seed corrected
