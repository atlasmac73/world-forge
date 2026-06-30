# ATLAS v67 — Private Beta Readiness
**Owner:** Isaac Brandon Burdette · Atlas Genesis Matrix LLC
**Date:** June 18, 2026
**Status:** Pre-launch checklist

---

## 15 Acceptance Criteria

| # | Criteria | Status |
|---|----------|--------|
| 1 | `npm run build` passes — no TS errors | ⏳ Verify locally |
| 2 | `npm run typecheck` passes | ⏳ Verify locally |
| 3 | Supabase migrations exist for all core tables | ✅ schema_v67_master.sql + earlier schemas |
| 4 | RLS enabled on all tenant-owned tables | ✅ All new tables have RLS |
| 5 | No server secrets in browser/localStorage | ✅ Verified — model router server-only |
| 6 | Distress scoring runs and persists result | ✅ /api/scoring + lib/scoring/engine.ts |
| 7 | God Mode 4-agent run works and saves artifact | ✅ /api/godmode + lib/godmode/engine.ts |
| 8 | LOI generation works and saves artifact | ✅ Existing /api/agents/loi route |
| 9 | Pipeline kanban works and persists | ✅ /app/(app)/pipeline + /api/pipeline |
| 10 | AIN 55-county heat map shows data | ✅ /app/(app)/ain + 55 counties seeded |
| 11 | Billing routes and Stripe webhook exist | ✅ All billing routes wired |
| 12 | Admin health route returns real checks | ✅ /api/health + /api/admin/launch-readiness |
| 13 | Launch readiness dashboard shows real status | ✅ /admin/launch-readiness |
| 14 | IP attribution corrected on public-facing copy | ✅ All pages use Isaac sole-inventor copy |
| 15 | One full test session completes without crash | ⏳ Run after deployment |

---

## Pre-Deploy Checklist (DO THESE IN ORDER)

### 1. Keys — Before GitHub Push
```bash
# Rotate BEFORE pushing to GitHub:
# 1. Go to Anthropic Console → API Keys → Create new key → Delete old
# 2. Go to Supabase Dashboard → Project Settings → API → Regenerate anon key
# 3. Revoke any old Vercel tokens
# Keep your new values private — don't commit
```

### 2. GitHub
```bash
git checkout -b v67-private-beta
git add .
git commit -m "ATLAS v67 — Private Beta Build (Phases 0-12)"
git push -u origin v67-private-beta
```

### 3. Supabase Migrations (run in order)
```sql
-- Run in Supabase SQL Editor:
-- 1. supabase/schema_beta.sql          (profiles, invites, audit_logs, feature_flags)
-- 2. supabase/schema.sql               (properties, leads, deals, agents, genesis)
-- 3. supabase/schema_v67.sql           (system_config, build_blueprints, model_registry)
-- 4. supabase/schema_v67_master.sql    (organizations, counties, scoring, pipeline, AIN)
-- 5. supabase/seed_owner.sql           (run AFTER first sign-in — see below)
```

### 4. Supabase Auth
- Enable Magic Link (Email) in Auth → Providers
- Add your domain to Redirect URLs: `https://your-vercel-url.vercel.app/auth/callback`
- Set Site URL to your Vercel URL

### 5. Vercel Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=          (from Supabase Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_ANON_KEY=     (new rotated anon key)
SUPABASE_SERVICE_ROLE_KEY=         (service role key — never expose)
ANTHROPIC_API_KEY=                 (new rotated Anthropic key)
NEXT_PUBLIC_APP_URL=               (your Vercel URL)
INVITE_SECRET=                     (random 32-char string for invite validation)
ADMIN_EMAILS=                      (your email, comma-separated for admin access)
CRON_SECRET=                       (random string for heartbeat cron auth)
```

Optional (enables features):
```
STRIPE_SECRET_KEY=                 (Stripe sk_live_ or sk_test_)
STRIPE_WEBHOOK_SECRET=             (whsec_ from Stripe Dashboard)
STRIPE_PRICE_T2_STARTER=          (price_xxx from Stripe)
STRIPE_PRICE_T3_PRO=
STRIPE_PRICE_T4_POWER=
STRIPE_PRICE_T5_ELITE=
STRIPE_PRICE_T7_GOD_MODE=
NEXT_PUBLIC_MAPBOX_TOKEN=          (pk.ey... from Mapbox — enables D4D/AIN map)
BATCH_SKIP_TRACE_KEY=              (from BatchSkipTracing.com)
RESEND_API_KEY=                    (from Resend — enables email)
SENTRY_DSN=                        (from Sentry — enables error tracking)
```

### 6. First Deploy
```bash
# In Vercel: connect atlasmac73/atlas-v22 or v67 branch
# Deploy. Wait for build to succeed.
# Visit /api/health — should return { overall: 'ok' }
```

### 7. Seed Owner (CRITICAL — do this first after deploy)
```sql
-- Run in Supabase SQL Editor AFTER you sign in for the first time:
-- Replace 'YOUR_USER_ID' with your auth.users.id
INSERT INTO public.profiles (user_id, email, role, is_active)
VALUES ('YOUR_USER_ID', 'your@email.com', 'owner', true)
ON CONFLICT (user_id) DO UPDATE SET role = 'owner', is_active = true;

INSERT INTO public.subscriptions (user_id, tier_code, credits_limit_daily, credits_used_today)
VALUES ('YOUR_USER_ID', 'T7', 999999, 0)
ON CONFLICT (user_id) DO UPDATE SET tier_code = 'T7', credits_limit_daily = 999999;
```

### 8. Verify
```bash
# These should all work after deploy:
curl https://YOUR_URL/api/health           # { overall: 'ok' }
curl https://YOUR_URL/api/ain/counties     # { ok: true, data: [...55 counties] }
```

### 9. Invite First Tester
- Go to /admin/system-health → Invite Users
- Or use the /invite route directly
- Send invite link to tester

### 10. Promote to Production
- In Vercel: promote preview → production domain
- Update Supabase Auth redirect URLs with production domain
- Update NEXT_PUBLIC_APP_URL to production URL

---

## Known Limitations for Private Beta

| Limitation | Impact | Workaround |
|-----------|--------|------------|
| Skip trace returns AI estimates, not live data | Leads say "estimated" | Set BATCH_SKIP_TRACE_KEY when ready |
| AIN heat map shows demo scores | Clearly labeled | Import real data via /api/ain/import |
| D4D map shows pin list (no satellite) | Minor | Set NEXT_PUBLIC_MAPBOX_TOKEN |
| SMS disabled (no Twilio A2P) | No auto-outreach | 2-4 week approval — use manual copy |
| Stripe billing in test mode | Payments won't process | Set sk_live_ for production billing |
| Court widget is prototype | Results are AI estimates | Prominently labeled as prototype |
| No n8n workflows | No automation | Phase 8+ roadmap |

---

## Support Contacts
- Platform: Isaac Brandon Burdette (atlasmac73@gmail.com)
- WV Operations: Nalone Stallings (Atlas Management & Construction LLC)
- Construction Estimating: Adrian Burdette (Burdette Built LLC, Denver CO)

---

## Roadmap After Beta

| Version | Focus |
|---------|-------|
| v67 Private Beta | ← YOU ARE HERE |
| v68 | Stripe live billing, skip trace live, Twilio A2P |
| v69 | Franchise Console, multi-location, white-label |
| v70 | PropStream connector, real AIN data, court records |
| v71 | Full LangGraph agent swarm, n8n workflows |
| v72 | ATLAS OS — full platform ecosystem |
| Future | ATLAS Genesis Matrix — Omniverse, enterprise |
