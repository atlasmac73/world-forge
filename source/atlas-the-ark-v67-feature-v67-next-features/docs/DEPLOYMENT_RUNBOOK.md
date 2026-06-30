# ATLAS v67 — Deployment Runbook
**Owner:** Isaac Brandon Burdette · Atlas Genesis Matrix LLC
**Environment:** Vercel + Supabase (project: kjfwanpwzgcscgsdgekm)
**GitHub:** atlasmac73/atlas-v22 (or v67 branch)

---

## Step 1 — Pre-Deploy Security (REQUIRED)

```bash
# 1. Rotate Anthropic API key
# → console.anthropic.com → API Keys → Create new → Delete old

# 2. Rotate Supabase anon key
# → Supabase Dashboard → Project Settings → API → Regenerate

# 3. Verify .gitignore contains .env.local
cat .gitignore | grep env
# Should output: .env.local

# 4. Confirm no secrets in code
grep -r "sk-ant-api\|eyJhbGci" --include="*.ts" --include="*.tsx" .
# Should return nothing
```

---

## Step 2 — Git Push

```bash
# Create release branch
git checkout -b v67-private-beta

# Stage all
git add .

# Commit
git commit -m "ATLAS v67 — Private Beta (Phases 0-12 complete)"

# Push
git push -u origin v67-private-beta
```

---

## Step 3 — Vercel Configuration

```bash
# In Vercel Dashboard:
# 1. Connect atlasmac73/atlas-v22 repo (or import v67)
# 2. Set Framework: Next.js
# 3. Build command: npm run build
# 4. Output directory: .next (default)
# 5. Install command: npm ci

# Add ALL environment variables from docs/ENVIRONMENT_VARIABLES.md
# At minimum: SUPABASE vars + ANTHROPIC_API_KEY + INVITE_SECRET + ADMIN_EMAILS + CRON_SECRET
```

---

## Step 4 — Deploy & Build Check

```bash
# Trigger deploy in Vercel
# Wait for build success (watch for:)
# ✓ Compiled successfully
# ✓ Generating static pages (XX/XX)

# If build fails, check:
# 1. Missing env vars (most common)
# 2. TypeScript errors (run npm run typecheck locally)
# 3. Next.js config issues
```

---

## Step 5 — Supabase Migrations

Run in Supabase SQL Editor (in order):

```sql
-- Migration 1: Beta schema (profiles, invites, audit_logs, feature_flags)
-- Copy contents of: supabase/schema_beta.sql

-- Migration 2: Core schema (properties, leads, deals, agents)
-- Copy contents of: supabase/schema.sql

-- Migration 3: v67 core additions
-- Copy contents of: supabase/schema_v67.sql

-- Migration 4: Master merge (organizations, AIN, scoring, pipeline)
-- Copy contents of: supabase/schema_v67_master.sql

-- Migration 5: Agent tasks
-- Copy contents of: supabase/migrations/20260616_agent_tasks.sql
```

---

## Step 6 — Configure Supabase Auth

```
Dashboard → Authentication → Settings:
  - Enable email (magic link)
  - Site URL: https://YOUR_VERCEL_URL.vercel.app
  - Redirect URLs: https://YOUR_VERCEL_URL.vercel.app/auth/callback
  - Disable email confirmation (for fast beta onboarding)
```

---

## Step 7 — Verify Health

```bash
curl https://YOUR_VERCEL_URL.vercel.app/api/health
# Expected: { "overall": "ok", "checks": [...] }

curl https://YOUR_VERCEL_URL.vercel.app/api/ain/counties
# Expected: { "ok": true, "data": [55 counties...] }
```

---

## Step 8 — Seed Owner Account

1. Sign in at `https://YOUR_VERCEL_URL.vercel.app/login` with your email
2. Copy your user ID from Supabase → Authentication → Users
3. Run in SQL Editor:

```sql
-- Replace PASTE_YOUR_USER_ID_HERE
INSERT INTO public.profiles (user_id, email, role, is_active, display_name)
VALUES (
  'PASTE_YOUR_USER_ID_HERE',
  'your@email.com',
  'owner',
  true,
  'Isaac Burdette'
) ON CONFLICT (user_id) DO UPDATE
  SET role = 'owner', is_active = true;

INSERT INTO public.subscriptions
  (user_id, tier_code, credits_limit_daily, credits_used_today)
VALUES (
  'PASTE_YOUR_USER_ID_HERE',
  'T7',
  999999,
  0
) ON CONFLICT (user_id) DO UPDATE
  SET tier_code = 'T7', credits_limit_daily = 999999;
```

---

## Step 9 — Configure Vercel Cron

In `vercel.json` (already configured):
```json
{
  "crons": [{ "path": "/api/heartbeat", "schedule": "*/15 * * * *" }]
}
```

This runs the Genesis heartbeat every 15 minutes. Requires `CRON_SECRET` env var.

---

## Step 10 — Stripe Setup (when billing ready)

```bash
# 1. Create products in Stripe Dashboard
# 2. Get price IDs (price_xxx)
# 3. Add to Vercel env vars: STRIPE_PRICE_T2_*, T3_*, etc.
# 4. Create webhook endpoint in Stripe Dashboard:
#    URL: https://YOUR_VERCEL_URL.vercel.app/api/billing/webhook
#    Events: customer.subscription.created, updated, deleted
# 5. Copy webhook signing secret → STRIPE_WEBHOOK_SECRET
# 6. Redeploy
```

---

## Step 11 — Private Beta Invite

```bash
# The /invite page accepts invite codes
# Generate codes via: Admin → System Health → Invite Users

# Or manually:
openssl rand -hex 32
# Paste code into invite_codes table in Supabase
```

---

## Rollback Procedure

```bash
# If deploy causes issues:
# 1. Vercel → Deployments → Previous deployment → Promote to Production
# 2. No schema changes needed (migrations don't auto-rollback)
# 3. If schema migration broke something:
#    -- Run migration rollback SQL manually in Supabase
```

---

## Monitoring

- Vercel: Dashboard → Logs (real-time)
- Supabase: Dashboard → Logs → API
- Sentry (if configured): sentry.io → Your Project
- Admin health: `/admin/system-health` (your app)
- Launch readiness: `/admin/launch-readiness` (your app)
