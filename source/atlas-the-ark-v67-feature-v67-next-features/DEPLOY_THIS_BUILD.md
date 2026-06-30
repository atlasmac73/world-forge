# ATLAS — Deploy This Build (v65 + v23 harvest, wired to live Supabase)
© 2026 Atlas Genesis Matrix, LLC · Isaac Brandon Burdette, sole inventor

## What this is
- **Base:** the-ark-v65 (schema matches your live Supabase — 23 of 36 tables)
- **Added (verified, build-tested):** real skip-trace (BatchSkipTracing+AI), real Twilio SMS, multi-model registry, callAgentRun
- **Wired to:** live Supabase kjfwanpwz (.env.local already filled with URL + anon key)
- **Build status:** ✅ `npm run build` SUCCEEDS (Next.js 14.2.33, security-patched)

## Before deploy — 2 values to paste into .env.local
1. `SUPABASE_SERVICE_ROLE_KEY` — Supabase Dashboard → Settings → API → service_role
2. `ANTHROPIC_API_KEY` — a NEWLY ROTATED key (the old one was leaked — do not reuse it)

## Deploy to Vercel (under YOUR account, not Nas's team)
1. Push this folder to a GitHub repo you own (or drag-folder at vercel.com/new)
2. Vercel → New Project → import it → Framework auto-detects **Next.js**
3. Settings → Environment Variables → add the 4 keys from .env.local
   (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY)
4. Deploy → you get a live URL
5. Set NEXT_PUBLIC_APP_URL to that URL, redeploy

## What works at each stage
- **Just the 4 env vars:** 10 portals live + 6 AI portals light up (one Anthropic key does it)
- **+ seed properties/deals:** NASDROP, Cognitive Cockpit, Investor War Room come alive
- **+ external signups (optional):** BatchSkipTrace, Twilio A2P, Stripe price IDs

## Still on you (not buildable by Claude)
- Rotate the leaked Anthropic key
- Make GitHub repo private if it isn't
- Reconnect Gmail/Drive in claude.ai if you want me to verify those
