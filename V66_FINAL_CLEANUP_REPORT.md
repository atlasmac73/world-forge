# ATLAS v66 — Final Cleanup Report
**Prepared by:** Claude Code (Anthropic)  
**For:** Isaac Brandon Burdette · Atlas Genesis Matrix LLC · Saint Albans WV  
**Status:** Cleaned and prepared for local/Vercel verification.  
**Build verified in sandbox:** NO — npm registry was blocked. All checks must be run locally.

---

## 1. What Was Broken

### A. Build-hiding flags (critical)
`next.config.js` contained two flags that silently swallowed real errors during `next build`:

```js
eslint: { ignoreDuringBuilds: true },     // hid all ESLint errors
typescript: { ignoreBuildErrors: true },  // hid all TypeScript errors
```

These were **removed**. The build now enforces both checks.

### B. TypeScript configuration — wrong scope
`tsconfig.json` included `__tests__/**`, `e2e/**`, and `scripts/**` in its compile scope.  
- `__tests__` imports from `vitest` — a devDependency not declared in the main tsconfig types.  
- `scripts/` uses `tsx` / Node-only APIs not appropriate for the Next.js bundler context.  
- Including them caused hundreds of cascade errors (missing `vitest`, missing `require`, etc.)

### C. Missing ambient type references
`global.d.ts` was either absent or only referenced `node`. Without explicit `/// <reference types="react" />` and `/// <reference types="react-dom" />`, standalone `tsc --noEmit` could not resolve JSX intrinsics or `React.ReactNode`, producing thousands of false `TS7026` errors.

### D. Real implicit-any parameter errors (not cascade)
These were genuine TS2345/TS7006 errors in code that accesses Supabase query results without a generated `lib/supabase/types.ts`:

| File | Issue | Fix |
|------|-------|-----|
| `app/api/trust/route.ts` | `.filter(c => ...)`, `.reduce((s,r) => ...)`, `.filter(p => ...)` on untyped Supabase results | Added inline `type Connector`, `type AgentRun`, `type Permission` |
| `app/api/portals/route.ts` | `.map(p => ...)` on untyped portal rows | Added `type PortalRow` |
| `app/api/workflows/customer-update-draft/route.ts` | `.map(t => ...)` on task rows, `.map(m => ...)` on memory rows | Added `type ProjectTask`, `type ProjectMemory`, `type Project` |
| `lib/featureFlags.ts` | `.map((f) => [f.flag_key, f.enabled])` on untyped flag rows | Added inline `type FlagRow` |

### E. Phase 0 bugs (from prior session — already fixed, included here)
| File | Bug | Fix |
|------|-----|-----|
| `app/api/billing/portal/route.ts` | File did not exist | Created — returns Stripe Customer Portal URL |
| `app/api/skills/route.ts` | File did not exist | Created — paginated skill list endpoint |
| `app/api/comms/sms-inbound/route.ts` | Wrote to `audit_log` (wrong table) | Changed to `audit_logs` |
| `app/api/twilio/sms/route.ts` | Queried `user_profiles` table (v23 schema) | Changed to `profiles`, fixed column `user_id`, fixed role `'president'` → `'owner'` |
| `supabase/migrations/20260616_agent_tasks.sql` | RLS used `auth.users.raw_app_meta_data->>'role'` — app does not set this | Changed to `FROM profiles p WHERE p.user_id = auth.uid()` |
| `scripts/seed.ts` | Referenced in `package.json` but file missing | Created |
| `scripts/run-evals.ts` | Referenced in `package.json` but file missing | Created (3-eval suite against Anthropic API) |
| `tsconfig.json` | `target: "es5"` was deprecated in TS 5.7+ | Changed to `ES2017` |

---

## 2. Files Changed

| File | Change type | Description |
|------|-------------|-------------|
| `next.config.js` | **Modified** | Removed `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` |
| `tsconfig.json` | **Modified** | Excluded `__tests__`, `e2e`, `scripts`; added `global.d.ts` to include; target ES2017 |
| `tsconfig.test.json` | **Created** | Separate config for test files with vitest/globals types |
| `global.d.ts` | **Modified** | Added `/// <reference types="react" />` and `/// <reference types="react-dom" />` |
| `package.json` | **Modified** | `typecheck` now uses `--project tsconfig.json`; added `typecheck:test` script |
| `app/api/billing/portal/route.ts` | **Created** | Stripe Customer Portal session endpoint |
| `app/api/skills/route.ts` | **Created** | Paginated skills list endpoint |
| `app/api/trust/route.ts` | **Modified** | Explicit inline types for Supabase result callbacks |
| `app/api/portals/route.ts` | **Modified** | Explicit `PortalRow` type for map callback |
| `app/api/workflows/customer-update-draft/route.ts` | **Modified** | Explicit types for all Supabase result callbacks |
| `app/api/comms/sms-inbound/route.ts` | **Modified** | `audit_log` → `audit_logs` |
| `app/api/twilio/sms/route.ts` | **Modified** | `user_profiles` → `profiles`, role check fixed |
| `lib/featureFlags.ts` | **Modified** | Explicit `FlagRow` type for map callback |
| `supabase/migrations/20260616_agent_tasks.sql` | **Modified** | RLS now uses `profiles.role` |
| `scripts/seed.ts` | **Created** | Master seed runner |
| `scripts/run-evals.ts` | **Created** | AI quality eval suite |

---

## 3. Why Tests and Scripts Are Excluded from Main tsconfig.json

**`__tests__/`** imports `vitest` types (`describe`, `it`, `vi`, `expect`). These types come from the `vitest` package's own type declarations, which conflict with the main app's type environment. Including them in the main tsconfig causes:
- `Cannot find module 'vitest'` errors in the main typecheck
- Vitest globals colliding with DOM/Node globals

**Solution:** `tsconfig.test.json` extends the main config but adds `types: ["vitest/globals", "node"]` and only includes `__tests__/**`.

**`scripts/`** uses `tsx` at runtime (not Next.js bundler) and imports Node-only APIs. These are stand-alone scripts, not part of the Next.js app. Excluding them prevents false errors about missing web APIs.

**`e2e/`** uses Playwright types (`@playwright/test`). Same separation-of-concerns rationale as tests.

---

## 4. How tsconfig.test.json Is Used

```bash
# Run typecheck on app code only (use this before every push):
npm run typecheck

# Run typecheck on test files only (optional, run when changing tests):
npm run typecheck:test
```

`tsconfig.test.json` extends `tsconfig.json` and overrides:
- `compilerOptions.types`: adds `vitest/globals` and `node`
- `include`: only `__tests__/**`
- `exclude`: only `node_modules`

The vitest runner (`npm run test`) does NOT use tsconfig.test.json — vitest resolves types via its own bundler. The test tsconfig is only for `tsc --noEmit` type checking.

---

## 5. What Could Not Be Run in This Sandbox

The Claude Code sandbox has npm registry access blocked for external packages. Therefore **none of the following could be executed:**

| Command | Status | Reason |
|---------|--------|--------|
| `npm ci` | ❌ Could not run | npm registry 403 Forbidden |
| `npm run typecheck` | ❌ Could not run | Requires node_modules |
| `npm run lint` | ❌ Could not run | Requires node_modules |
| `npm run build` | ❌ Could not run | Requires node_modules |
| `npm run test` | ❌ Could not run | Requires node_modules |

**All fixes were applied by direct file editing and verified by code inspection.**  
The sandbox confirmed: no .env.local, no node_modules, no .next, no hardcoded secrets.

---

## 6. Exact Commands to Run Locally

Run these in order from inside the unzipped `v66-build/` directory:

```bash
# Step 1 — Install dependencies
npm ci

# Step 2 — TypeScript check (app code only)
npm run typecheck
# Expected: zero errors

# Step 3 — ESLint check
npm run lint
# Expected: zero errors

# Step 4 — Full build (now enforces TS + ESLint — no ignore flags)
npm run build
# Expected: compiled successfully, no errors

# Step 5 — Unit tests
npm run test
# Expected: 22/22 passing (or whatever count the suite reports)

# Optional: TypeScript check for test files
npm run typecheck:test
# Expected: zero errors (requires vitest types installed)
```

---

## 7. Expected Pass/Fail Meaning

| Result | Meaning | Action |
|--------|---------|--------|
| `typecheck` passes | All app TypeScript is clean. | Proceed to lint. |
| `typecheck` fails with "Cannot find module 'next/server'" | Run `next build` once first to generate `.next/types/**/*.ts`, then re-run typecheck. | One-time bootstrap step. |
| `typecheck` fails with other errors | Real type errors remain. | Fix them before merge. |
| `lint` passes | ESLint clean. | Proceed to build. |
| `lint` fails | Real ESLint violations. Fix them. | Do not deploy with lint errors. |
| `build` passes | App compiles. Vercel deployment will succeed. | Proceed to test. |
| `build` fails | A real compile error exists. | Fix before deploying. |
| `test` passes | Unit test suite green. | Proceed to deploy. |
| `test` fails | A unit test is broken. | Investigate; may be a mock issue from prior session. |

---

## 8. Private Beta Safety Assessment

**After local checks pass:**

| Criterion | Status |
|-----------|--------|
| No hardcoded secrets | ✅ Confirmed |
| No .env.local committed | ✅ Confirmed |
| Invite-only enforcement | ✅ middleware.ts + /api/invite/validate |
| Auth (Supabase magic link) | ✅ Configured |
| RBAC using profiles.role | ✅ lib/permissions/index.ts |
| agent_tasks RLS uses correct role source | ✅ Fixed |
| Supabase service key server-only | ✅ createServiceClient() never exposed to client |
| Billing disabled by default | ✅ Requires STRIPE_SECRET_KEY env var |
| SMS disabled by default | ✅ Requires TWILIO_* env vars + feature flag |
| Build errors hidden by ignore flags | ✅ Fixed — both flags removed |

**Verdict:** Safe for private beta **after** `npm ci && npm run typecheck && npm run lint && npm run build && npm run test` all pass locally.

---

## 9. Starting v67 Branch

Safe to create a v67 branch **after:**
1. Local checks above pass ✅
2. You push this build to GitHub ✅
3. Vercel deployment is green ✅
4. At least one invite-only tester can sign in and reach the dashboard ✅

**Do not start v67 yet.** Verify v66 deploy first.

---

## 10. Remaining Known Limitations (Not Blockers for Private Beta)

| Item | Notes |
|------|-------|
| `lib/supabase/types.ts` not generated | Supabase types are `any` until `npm run types` is run against the live project. Run after migrations. |
| Skip Trace portal | Shows beta-disabled stub. BatchSkipTracing API not integrated yet. Phase 3. |
| AIN Heatmap portal | Shows beta-disabled stub. Mapbox token not connected yet. Phase 3. |
| Stripe price IDs | Must be created in Stripe dashboard and added to Vercel env vars. Phase 2. |
| Twilio A2P 10DLC | Must be registered. 2–4 week approval window. Phase 5. |
| Sentry | Not yet integrated. Phase 4. |
| E2E Playwright tests | Not run in sandbox. Run locally after deploy. |

---

## IP Declaration

All code, architecture, agent systems, and intellectual property in this repository are the sole property of:  
**Isaac Brandon Burdette · Atlas Genesis Matrix LLC · Saint Albans/Nitro, West Virginia**  
Patent portfolio P001–P100 (OMNIFOLD™). Non-provisional filing deadline: March 29, 2027.

