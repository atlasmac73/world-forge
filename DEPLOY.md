# THE ARK — Deployment Runbook
## Atlas Genesis Matrix LLC · Isaac Brandon Burdette, Sole Inventor

---

## CRITICAL BLOCKERS (do in this order)

### 1. GitHub Push (MUST DO FIRST)
```bash
cd the-ark
git init
git branch -M main
git add .
git commit -m "feat: THE ARK v65 — canonical build"
git remote add origin https://github.com/atlasmac73/the-ark.git
git push -u origin main --force
```

### 2. Vercel Project (MUST DO SECOND)
1. Go to vercel.com → New Project
2. Import: `atlasmac73/the-ark`
3. Team: `nstallings-2570s-projects` (ID: `team_0BZSp8HQZWzF9FhQV4Uz4Qmf`)
4. Framework: **Next.js** (auto-detected)
5. Root: `.`

### 3. Vercel Environment Variables
Set ALL of these in Vercel dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://kjfwanpwzgcscgsdgekm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[get from Supabase → API settings]
SUPABASE_SERVICE_ROLE_KEY=[get from Supabase → API settings — KEEP SECRET]
ANTHROPIC_API_KEY=sk-ant-api03-...
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_T2_STARTER=price_...
STRIPE_PRICE_T3_PRO=price_...
STRIPE_PRICE_T4_POWER=price_...
STRIPE_PRICE_T5_ELITE=price_...
STRIPE_PRICE_T6_SOVEREIGN=price_...
STRIPE_PRICE_T7_GOD_MODE=price_...
N8N_WEBHOOK_URL=https://your-n8n.com/webhook/
N8N_SHARED_SECRET=[random 32 char string]
GITHUB_TOKEN=ghp_...
GITHUB_REPO=atlasmac73/the-ark
NEXT_PUBLIC_APP_URL=https://your-vercel-url.vercel.app
CRON_SECRET=[random 32 char string]
ADMIN_ROUTE_SEGMENT=nasdrop-7f2a-ops
NODE_ENV=production
```

### 4. Supabase SQL Migrations
Run in order in Supabase SQL Editor:
1. `supabase/schema.sql` — core tables (35+ tables)
2. `supabase/schema_canon.sql` — extended Data Fabric tables

### 5. Stripe Products (create these in dashboard.stripe.com)
Create 6 products with monthly recurring prices:
| Tier | Name | Price/mo |
|------|------|----------|
| T2 | STARTER | $29 |
| T3 | PRO | $99 |
| T4 | POWER | $299 |
| T5 | ELITE | $499 |
| T6 | SOVEREIGN | $799 |
| T7 | GOD MODE | $999 |

Then copy price IDs into Supabase:
```sql
UPDATE subscription_tiers SET stripe_price_id = 'price_XXXX' WHERE tier_code = 'T2';
-- repeat for T3–T7
```

### 6. Twilio A2P 10DLC (START TODAY — 2-4 WEEK APPROVAL)
1. console.twilio.com → Messaging → Senders → A2P 10DLC
2. Register Brand: **Atlas Genesis Matrix LLC**
3. Use EIN for business registration
4. Website must be live (blocks on step 2)
5. Campaign type: Mixed — Real Estate outreach
6. Set inbound webhook to: `https://[your-url]/api/comms/sms-inbound`

### 7. Stripe Webhook
1. dashboard.stripe.com → Developers → Webhooks → Add endpoint
2. URL: `https://[your-vercel-url]/api/billing/webhook`
3. Events to listen: 
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET`

---

## POST-DEPLOY VERIFICATION

```bash
# 1. Check deployment
curl https://[your-url].vercel.app/api/heartbeat -H "Authorization: Bearer [CRON_SECRET]"

# 2. Check Supabase connection
curl https://[your-url].vercel.app/api/portals -H "Authorization: Bearer [user_jwt]"

# 3. Test dossier pipeline
curl -X POST https://[your-url].vercel.app/api/agents/dossier \
  -H "Content-Type: application/json" \
  -d '{"address":"412 Elm St, Charleston WV 25301"}'
```

---

## ARCHITECTURE SUMMARY
- **Framework:** Next.js 14 App Router
- **Database:** Supabase PostgreSQL (kjfwanpwzgcscgsdgekm) — ACTIVE_HEALTHY
- **Auth:** Supabase Auth + SSR cookies
- **AI:** Anthropic Claude claude-sonnet-4-20250514 (streaming + batch)
- **Billing:** Stripe (7 tiers + webhooks)
- **SMS:** Twilio (A2P 10DLC)
- **State:** Zustand (persisted)
- **Design:** ATLAS gold-on-void system

## KEY ENDPOINTS
| Route | Agent | Credits |
|-------|-------|---------|
| POST /api/agents/dossier | A12→A15→A06 | 25 |
| POST /api/agents/skip-trace | A12-SPECTER | 10 |
| POST /api/agents/distress-score | A15-OMEN | 8 |
| POST /api/agents/loi | A06-HERALD | 12 |
| POST /api/agents/run | Universal | varies |
| POST /api/genesis/cycle | A03+A25 | 40 (T6+) |
| POST /api/billing/checkout | — | free |
| POST /api/comms/sms-send | A06-HERALD | 3 |
| POST /api/world/generate | A03+A228 | 30 |
| GET /api/heartbeat | Cron | — |

## IP DECLARATION
All code, architecture, IP, and patents (P001–P100, OMNIFOLD™) are the sole intellectual property of:
**Isaac Brandon Burdette · Atlas Genesis Matrix LLC · Saint Albans/Nitro WV**
Non-provisional patent deadline: March 29, 2027. Priority: P001, P003, P019.
