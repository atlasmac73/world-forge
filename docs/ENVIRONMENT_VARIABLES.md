# ATLAS v67 — Environment Variables Reference
**Owner:** Isaac Brandon Burdette · Atlas Genesis Matrix LLC
**Never commit .env.local to git. Never hard-code secrets.**

---

## Required (App will not work without these)

| Variable | Source | Example |
|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | `https://kjfwanpwzgcscgsdgekm.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | `eyJ...` (rotate before push) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | `eyJ...` (server-only, never expose) |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | `sk-ant-api03-...` (rotate before push) |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL | `https://atlasdealnavpro13.vercel.app` |
| `INVITE_SECRET` | Generate: `openssl rand -hex 32` | `a1b2c3...` |
| `ADMIN_EMAILS` | Your email address(es) | `atlasmac73@gmail.com` |
| `CRON_SECRET` | Generate: `openssl rand -hex 32` | `x7y8z9...` |

---

## Billing (Stripe — enables paid tiers)

| Variable | Source | Required For |
|----------|--------|-------------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API | Checkout + billing |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks | Subscription sync |
| `STRIPE_PRICE_T2_STARTER` | Stripe Dashboard → Products | T2 checkout |
| `STRIPE_PRICE_T3_PRO` | Stripe Dashboard → Products | T3 checkout |
| `STRIPE_PRICE_T4_POWER` | Stripe Dashboard → Products | T4 checkout |
| `STRIPE_PRICE_T5_ELITE` | Stripe Dashboard → Products | T5 checkout |
| `STRIPE_PRICE_T7_GOD_MODE` | Stripe Dashboard → Products | T6 checkout |

---

## AI Models (optional overrides)

| Variable | Default | Notes |
|----------|---------|-------|
| `ANTHROPIC_MODEL_POWER` | `claude-opus-4-20250514` | High-tier users |
| `ANTHROPIC_MODEL_DEFAULT` | `claude-sonnet-4-20250514` | Mid-tier users |
| `ANTHROPIC_MODEL_FAST` | `claude-haiku-4-5-20251001` | Low-tier, bulk ops |

---

## Integrations (each unlocks a feature)

| Variable | Provider | Unlocks |
|----------|----------|---------|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | mapbox.com | D4D satellite map, AIN map layer |
| `BATCH_SKIP_TRACE_KEY` | batchskiptracing.com | Live skip trace results |
| `TWILIO_ACCOUNT_SID` | twilio.com | SMS (requires A2P 10DLC first) |
| `TWILIO_AUTH_TOKEN` | twilio.com | SMS auth |
| `TWILIO_PHONE_NUMBER` | twilio.com | SMS sender |
| `TWILIO_WEBHOOK_URL` | Your app URL | SMS status callbacks |
| `RESEND_API_KEY` | resend.com | Email delivery |
| `SENTRY_DSN` | sentry.io | Error tracking |
| `UPSTASH_REDIS_REST_URL` | upstash.com | Redis rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | upstash.com | Redis auth |

---

## Vercel-Specific (auto-set by Vercel)

| Variable | Value | Notes |
|----------|-------|-------|
| `VERCEL_URL` | Auto | Current deployment URL |
| `VERCEL_ENV` | Auto | production/preview/development |
| `NODE_ENV` | Auto | production/development |

---

## Example .env.local (NEVER COMMIT THIS)

```bash
# ─── Required ───────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=eyJ...YOUR_SERVICE_KEY
ANTHROPIC_API_KEY=sk-ant-api03-...YOUR_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
INVITE_SECRET=your_random_32_char_string_here_abc123
ADMIN_EMAILS=atlasmac73@gmail.com,slisaac89@gmail.com
CRON_SECRET=another_random_32_char_string_here

# ─── Optional — uncomment when ready ────────────────────────
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
# NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...
# BATCH_SKIP_TRACE_KEY=bst_...
# RESEND_API_KEY=re_...
# SENTRY_DSN=https://...@sentry.io/...
```

---

## Security Rules

1. **Never commit** any of these to git (`.env.local` is in `.gitignore`)
2. **Rotate** `ANTHROPIC_API_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` before first git push
3. **Never** pass `SUPABASE_SERVICE_ROLE_KEY` or `ANTHROPIC_API_KEY` to the client
4. **Never** store API keys in `localStorage` or `sessionStorage`
5. **Set in Vercel** for production — never in code

---

## Vercel Setup Guide

1. Go to vercel.com → Your Project → Settings → Environment Variables
2. Add each variable with the scope: Production, Preview, Development (all)
3. Redeploy after adding new variables
4. Variables are NOT visible to client unless prefixed with `NEXT_PUBLIC_`
