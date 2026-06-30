# THE ARK — Deployment Checklist
**Isaac Brandon Burdette, Sole Inventor — Atlas Genesis Matrix LLC**

---

## Pre-Deploy (do this once, in order)

### 1. Supabase Setup
- [ ] Create Supabase project at https://supabase.com
- [ ] Copy project URL and anon key from Settings → API
- [ ] Copy service role key (keep secret — server only)
- [ ] Go to SQL Editor → run `supabase/schema.sql`
- [ ] Run `supabase/schema_canon.sql`
- [ ] Run `supabase/schema_beta.sql`  ← new in v65 hardening
- [ ] Run `supabase/migrations/20260620_autopoietic_schema.sql`  ← new in v67, required for the Autopoietic Console (kill switch, blueprints, model registry, genesis_cycles columns)
- [ ] Verify tables exist: `profiles`, `invites`, `audit_logs`, `feature_flags`, `beta_feedback`
- [ ] In Supabase Auth settings: enable **Email (Magic Link)**
- [ ] Set Site URL to your Vercel URL (e.g. `https://the-ark.vercel.app`)
- [ ] Add Redirect URLs: `https://the-ark.vercel.app/auth/callback`
- [ ] Disable email confirmations (magic link handles this)

### 2. Vercel Setup
- [ ] Push repo to GitHub
- [ ] Import repo in Vercel
- [ ] Set Framework Preset: **Next.js**
- [ ] Add all environment variables (see `VERCEL_ENV_VARS` section below)
- [ ] Deploy

### 3. First Owner Account
- [ ] Open your Vercel deployment URL
- [ ] Sign in with your email (magic link)
- [ ] Go to Supabase SQL Editor
- [ ] Run `supabase/seed_owner.sql` (edit your email first)
- [ ] Verify your profile shows `role = 'owner'`

### 4. Invite Beta Testers
- [ ] Sign in as owner
- [ ] Navigate to Admin portal
- [ ] Use Invite Manager to add each beta tester email
- [ ] Copy the invite link and send it to them
- [ ] They click the link → accept invite → magic link sent → they sign in

---

## Vercel Environment Variables

Set these in Vercel → Project → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL          = (from Supabase)
NEXT_PUBLIC_SUPABASE_ANON_KEY     = (from Supabase)
SUPABASE_SERVICE_ROLE_KEY         = (from Supabase — mark as secret)
ANTHROPIC_API_KEY                 = (from Anthropic Console)
NEXT_PUBLIC_APP_URL               = https://your-vercel-url.vercel.app
INVITE_SECRET                     = (random string, min 32 chars)
ADMIN_EMAILS                      = your@email.com
```

Optional (add when ready):
```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
```

---

## Post-Deploy Verification

- [ ] `https://your-app.vercel.app` loads login page for unauthenticated users
- [ ] Magic link email arrives within 60 seconds of login attempt
- [ ] After login, redirected to main dashboard
- [ ] Unauthenticated `/` redirects to `/login`
- [ ] `/api/heartbeat` returns 200 (no auth required)
- [ ] Portal navigation works
- [ ] Beta Feedback button visible in bottom-right
- [ ] Admin portal shows invite manager (owner/admin only)

---

## Supabase Migration Steps (Detailed)

1. Open Supabase Dashboard → SQL Editor → New Query
2. Paste full contents of `supabase/schema.sql` → Run
3. Paste full contents of `supabase/schema_canon.sql` → Run
4. Paste full contents of `supabase/schema_beta.sql` → Run
5. Verify in Table Editor that all tables are created
6. Check Authentication → Policies to confirm RLS is enabled on all tables

---

## What Is Working (Beta v65)

✅ Build passes — all 25 routes compile  
✅ TypeScript — 0 errors  
✅ Lint — 0 errors  
✅ Auth — Supabase magic link  
✅ Session middleware — all routes protected  
✅ Invite-only signup — token-based  
✅ RBAC — owner / admin / beta_tester / contractor / viewer  
✅ Admin invite manager  
✅ Beta feedback button  
✅ Feature flags system  
✅ Audit logging  
✅ 24 portals — shell renders  
✅ AI Copilot (LUKA) — streams when ANTHROPIC_API_KEY present  
✅ Deal analyzer, distress score, dossier, LOI agents  
✅ Agent gateway with credit system  

---

## What Is Disabled (Feature-Flagged Off)

⏸ Stripe billing — set `BILLING_ENABLED` flag to enable  
⏸ Twilio SMS — register A2P 10DLC first, then set `SMS_ENABLED`  
⏸ Living Graph — set `PORTAL_LIVING_GRAPH` flag  
⏸ World Forge — set `PORTAL_WORLD_FORGE` flag  
⏸ NASDROP — owner-only, set `PORTAL_NASDROP` flag  
⏸ Genesis Engine — owner-only, set `PORTAL_GENESIS` flag  
⏸ External connectors — coming soon  
