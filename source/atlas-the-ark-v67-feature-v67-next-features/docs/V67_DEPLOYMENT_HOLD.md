# ATLAS v67 — Deployment Hold (PATCHED)
**Status: HOLD — clear each item before proceeding**
**Date:** June 18, 2026

---

## HARD HOLDS (clear before any live action)

### 1. Rotate secrets before GitHub push
- [ ] Rotate ANTHROPIC_API_KEY (console.anthropic.com)
- [ ] Rotate SUPABASE_SERVICE_ROLE_KEY (Supabase Dashboard → Settings → API)
- [ ] Revoke old keys
- [ ] New keys go in Vercel env vars only
- [ ] Confirm git status shows .env.local NOT staged

### 2. Review schema_v67.sql before running on live DB
- [ ] Read docs/V67_SCHEMA_SAFETY_REPORT.md
- [ ] Take Supabase backup
- [ ] Confirm connected to kjfwanpwzgcscgsdgekm
- [ ] Run schema_v67.sql
- [ ] Log in as atlasmac73@gmail.com, then run seed_owner.sql

### 3. GitHub PR automation — Sprint 4 item, not yet built
- [ ] Do not set up ZEUS PR automation yet
- [ ] Blueprint approval writes APPROVED status only — no GitHub integration exists

---

## CONDITIONAL HOLDS

### Stripe — needs product setup
- [ ] Create products in Stripe Dashboard
- [ ] Add STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_T* to Vercel
- [ ] Set BILLING_ENABLED=true in feature_flags table

### Twilio SMS — needs A2P approval
- [ ] A2P 10DLC approval required (start NOW — 2-4 weeks)
- [ ] Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
- [ ] Set SMS_ENABLED=true only after A2P approved

### Portal 15 model IDs — verify before production
- [ ] Confirm ANTHROPIC_MODEL_FAST, ANTHROPIC_MODEL_DEFAULT, ANTHROPIC_MODEL_POWER
  are set in Vercel env vars, OR verify fallback model IDs are current
- [ ] See TODO comment in app/api/portals/[portalId]/chat/route.ts

### BatchSkipTracing
- [ ] Sign up at batchskiptracing.com, get BATCH_SKIP_TRACE_KEY
- [ ] Add to Vercel env vars

### Mapbox (AIN Heatmap) — Sprint 7
- [ ] Create Mapbox account, get token
- [ ] Add MAPBOX_TOKEN to Vercel env vars

---

## DEPLOYMENT SEQUENCE (when holds are cleared)

1. git push to private GitHub repo
2. Vercel creates preview deployment
3. Set required env vars in Vercel
4. Run schema_v67.sql in Supabase SQL Editor
5. Log in as atlasmac73@gmail.com → run seed_owner.sql
6. Verify /api/health returns 200
7. Verify kill switch toggle works in Command Center
8. Verify Portal 15 SuperLLM chat responds
9. Verify /login and /invite flows
10. Promote preview → production

---

## What IS Ready to Deploy Right Now

Kill switch API + widget ✅
Portal 15 SuperLLM chat ✅ (needs ANTHROPIC_API_KEY in Vercel)
Command Center 11-tab dashboard ✅
Blueprint Queue approve/reject ✅
Kill switch on all 7 agent routes ✅
Admin-gated command-center page ✅
Portal 15 in Sidebar nav ✅
Health route with Command Center metrics ✅
schema_v67.sql ✅ (safe to run after review)
