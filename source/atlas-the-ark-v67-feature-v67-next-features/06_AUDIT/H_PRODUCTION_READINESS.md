# H. Production Readiness Assessment
**ATLAS / THE ARK v67**

---

## 1. Overall Estimate

**~55–60% production-ready**, weighted toward backend/schema maturity and away from
discoverability/wiring and external-service activation. This estimate is corroborated
independently across the portal-inventory and security-assessment research passes.

## 2. What's Genuinely Ready Today

| Item | Status |
|---|---|
| Kill switch (API + widget) | ✅ Ready to deploy |
| Portal 15 SuperLLM chat | ✅ Ready (needs `ANTHROPIC_API_KEY` in Vercel) |
| Command Center (11-tab dashboard) | ✅ Ready |
| Blueprint Queue approve/reject | ✅ Ready |
| Kill switch on all 7 agent routes | ✅ Ready |
| Admin-gated command-center page | ✅ Ready |
| Portal 15 in Sidebar nav | ✅ Ready |
| Health route with Command Center metrics | ✅ Ready |
| `schema_v67.sql` | ✅ Safe to run after backup + project-ID confirmation |
| Database layer overall (124 tables, 100% RLS) | ✅ Mature, low risk |
| RBAC / permissions layer | ✅ Mature, zero discrepancies found |

## 3. Hard Blockers Before Any Live Deployment

1. **Secret rotation not yet done** — `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` must
   be rotated before any GitHub push (per `V67_DEPLOYMENT_HOLD.md` Hard Hold #1). New keys go
   into Vercel env vars only; never into `.env.local` committed to git.
2. **Schema not yet run on live DB** — `schema_v67.sql` has not been executed against the live
   Supabase project (`kjfwanpwzgcscgsdgekm`). Requires a backup first, then `seed_owner.sql`
   logged in as `atlasmac73@gmail.com`.
3. **Zero GitHub pushes, zero Vercel deployments to date** — confirmed in
   `V67_CHANGED_FILES_REPORT.md` ("What Was NOT Done": no migration run on live DB, no GitHub
   push, no Vercel deployment, no Stripe/Twilio/BatchSkipTracing enabled). This branch
   (`feature/v67-next-features`) exists only in this sandboxed environment.
4. **No GitHub PR automation** — explicitly deferred (Sprint 4 item); blueprint approval today
   only flips a status column, it does not open a PR or deploy anything.

## 4. Conditional Blockers (Feature-Specific)

| Service | Blocker | Needed For |
|---|---|---|
| Stripe | Products not created in Dashboard; `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`/`STRIPE_PRICE_T*` not set; `BILLING_ENABLED=false` | Any paid-tier signup flow |
| Twilio | A2P 10DLC approval pending (2–4 week lead time, should start now if SMS is on the roadmap) | Any outbound SMS |
| Mapbox | Token not provisioned | AIN heat map beyond demo mode |
| BatchSkipTracing | API key not provisioned | Skip-trace agent (A-series) live data |
| Model env vars | `ANTHROPIC_MODEL_FAST/DEFAULT/POWER` not confirmed set in Vercel — fallback IDs in code should be verified current before relying on them in prod | All AI agent calls |

## 5. Architectural Readiness Gaps (Not Blocked on External Services)

1. **Navigation/discoverability gap (see D. Portal Inventory)** — roughly 14 of ~25 `(app)`
   pages and 7 of 9 `admin` pages are fully built but unreachable from the main nav. This is a
   pure engineering fix (no external dependency) and should be the **highest-priority pre-beta
   item** since it directly affects whether real users can use what's already built.
2. **Genesis Cycle not actually scheduled** — the cron-triggered `/api/heartbeat` does not call
   `runHeartbeatTick()`; the self-improvement loop only runs when an admin manually triggers it.
   If the product vision requires continuous self-improvement, this needs to be wired up (with
   the existing safety gates preserved exactly as-is). If manual-trigger-only is acceptable for
   beta, this is not a blocker, just a documentation point.
3. **Audit logging gap on ~9 agent routes** (see F. API Inventory) — error/rejection paths not
   consistently logged. Should be closed before declaring SOC2-style auditability.
4. **T7 tier referenced but undefined** (see E. Database Inventory) — needs either definition
   or removal of dead references.
5. **No re-verified `tsc --noEmit` / `eslint` / `next build` run on the current branch state**
   — last verified-clean run is the documented hotfix pass; current branch has since received
   the v67 master merge phases 2–6 and 9 (partial). **Recommend re-running all three checks
   before any further planning is acted on as "ready."**

## 6. Suggested Pre-Production Checklist (Synthesized)

- [ ] Re-run `tsc --noEmit`, `eslint`, `next build` on current branch HEAD
- [ ] Close navigation/discoverability gap (link orphaned pages or consolidate shells)
- [ ] Close the 9-route audit-logging gap
- [ ] Resolve T7 tier definition
- [ ] Rotate ANTHROPIC_API_KEY and SUPABASE_SERVICE_ROLE_KEY
- [ ] Take Supabase backup, run `schema_v67.sql`, run `seed_owner.sql`
- [ ] Confirm Vercel env vars for model IDs
- [ ] Decide Genesis Cycle scheduling (manual-only vs. automated) and document the decision
- [ ] First GitHub push to private repo + first Vercel preview deployment
