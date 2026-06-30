# ATLAS v66 Deploy-Ready Patch Notes

Patched and verified for Vercel/Next.js deployment.

## Validation performed

- `npm ci` passed.
- `npm run typecheck` passed.
- `npm run lint` passed with no warnings or errors.
- `npm test` passed: 22/22 Vitest unit tests.
- `npm run build` passed with Next.js 14.2.35.

## Fixes applied

1. Fixed TypeScript blockers in:
   - `app/admin/agent-tasks/page.tsx`
   - `components/portals/Market.tsx`
   - `components/portals/Nasdrop.tsx`
   - `components/portals/Skills.tsx`

2. Fixed test routing:
   - Updated `vitest.config.ts` so Vitest excludes Playwright E2E specs.
   - Playwright tests remain available through `npm run test:e2e`.

3. Fixed Next.js build/static-generation behavior:
   - Marked API route handlers dynamic with `export const dynamic = 'force-dynamic'` so live Supabase/API endpoints are not statically evaluated during build.
   - Moved client pages behind server wrappers so route-level dynamic config is applied properly.
   - Dynamically loaded portal modules client-side to reduce server build load.

4. Deployment hardening:
   - Upgraded `next` and `eslint-config-next` from 14.2.33 to 14.2.35.
   - Updated `vercel.json` to use `npm ci` and run check/test/build during Vercel builds.
   - Removed committed `.env.local` from this packaged ZIP. Put secrets only in Vercel Environment Variables.

## Known build warning

The build passes but still emits a Supabase/Edge runtime warning from middleware bundling. This is not currently blocking the build. The middleware should be tested after deployment by signing in and checking that protected routes redirect correctly.

## Important note

`next.config.js` currently sets `outputFileTracing: false` because the uploaded package hung during Next.js build tracing in this sandbox. The production build passes with this setting. Re-enable tracing later after isolating the tracing hang if you need standalone/serverless trace optimization.
