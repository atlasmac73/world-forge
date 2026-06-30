# THE ARK — Deployment Guide

## Prerequisites

- Supabase account (free tier works for beta)
- Vercel account
- GitHub repo with this code
- Anthropic API key

---

## Step 1: Supabase Setup

1. Go to https://supabase.com → New Project
2. Save your: Project URL, anon key, service role key
3. In **SQL Editor → New Query**, run these files IN ORDER:
   1. `supabase/schema.sql`
   2. `supabase/schema_canon.sql`
   3. `supabase/schema_living_graph.sql`
   4. `supabase/schema_pilot.sql`
   5. `supabase/schema_beta.sql`
4. In **Authentication → Configuration**:
   - Enable **Email (Magic Link)**
   - Set **Site URL**: `https://your-app.vercel.app`
   - Add **Redirect URLs**: `https://your-app.vercel.app/auth/callback`
   - Disable email confirmations (magic link handles this)

---

## Step 2: Vercel Setup

1. Push code to GitHub
2. Import repo at https://vercel.com/new
3. Framework: **Next.js**
4. Add environment variables (see list below)
5. Deploy

---

## Required Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # SECRET — never expose client-side

# AI
ANTHROPIC_API_KEY=sk-ant-...

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
INVITE_SECRET=generate-random-32-char-string
ADMIN_EMAILS=your@email.com
```

### Optional (enable when ready)

```bash
# Stripe — add when BILLING_ENABLED flag is turned on
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_T2_STARTER=price_...
STRIPE_PRICE_T3_PRO=price_...
STRIPE_PRICE_T4_POWER=price_...
STRIPE_PRICE_T5_ELITE=price_...
STRIPE_PRICE_T6_SOVEREIGN=price_...
STRIPE_PRICE_T7_GOD_MODE=price_...

# Twilio — add after A2P 10DLC registration
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

---

## Step 3: First Login

1. Open your Vercel URL
2. Sign in with your email (magic link)
3. Run `supabase/seed_owner.sql` in Supabase SQL Editor (edit your email first)

---

## Step 4: Stripe Webhook (when billing is enabled)

- Endpoint: `https://your-app.vercel.app/api/billing/webhook`
- Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
