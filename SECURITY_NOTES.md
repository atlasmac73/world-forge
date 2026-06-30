# THE ARK — Security Notes

## Current Security Model (Beta v65)

### Authentication
- **Supabase magic link** — no passwords stored anywhere
- **Session middleware** — all routes checked server-side via `middleware.ts`
- **JWT expiry** — Supabase default (1 hour with refresh)

### Authorization
- **RBAC**: owner → admin → beta_tester → contractor → viewer
- **RLS**: enabled on all Supabase user-data tables
- **Server-only service role key** — never exposed client-side or in edge functions

### API Security
- **`/api/claude`** — auth required, 30 req/min rate limit, systemOverride blocked for non-owners
- **`/api/admin/*`** — requires admin/owner role
- **`/api/billing/webhook`** — Stripe signature verified
- **`/api/invite/validate`** — public but returns no sensitive data
- **All other AI routes** — require authenticated user

### What Is NOT Protected Yet (Production Backlog)

1. No CAPTCHA on login (magic link reduces risk)
2. No IP-based blocking (rate limits are per-user, not per-IP)
3. No WAF in front of Vercel
4. No request logging/tracing (use Vercel logs for now)
5. No brute-force protection on invite token endpoint

### Environment Variables

| Variable | Exposure | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Safe — it's just a URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Safe — RLS protects data |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | **NEVER expose** — bypasses RLS |
| `ANTHROPIC_API_KEY` | Server only | Server-side only |
| `STRIPE_SECRET_KEY` | Server only | Server-side only |
| `STRIPE_WEBHOOK_SECRET` | Server only | Used to verify webhook signatures |

### Checklist Before Production

- [ ] Enable Supabase 2FA for the project
- [ ] Rotate all API keys after beta ends
- [ ] Add Vercel WAF
- [ ] Add Sentry error tracking
- [ ] Audit all RLS policies with a penetration test
- [ ] Enable Supabase PITR (Point in Time Recovery)
- [ ] Add rate limiting at the edge (Vercel middleware)
- [ ] Complete the Stripe security review

### Reporting Security Issues

Contact Isaac Brandon Burdette directly. Do not post publicly.
