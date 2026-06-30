# Plan 3 — Production SaaS Plan
**ATLAS / THE ARK v67**
**Depends on:** Plan 2 (Private Beta), 06_AUDIT/H, I, J

---

## 1. Thesis

Production SaaS = public sign-up, real billing, real outreach (SMS), real third-party data
(skip-trace, mapping). This is the plan where every "Conditional Hold" in
`V67_DEPLOYMENT_HOLD.md` gets cleared. A `PRODUCTION_SAAS_ROADMAP.md` already exists at repo
root — this plan should be reconciled with it, not duplicated; treat that file as prior input
and this plan as the audit-informed update.

## 2. Workstreams

### 3.1 Billing (Stripe)
- Create products/prices in Stripe Dashboard for tiers T1–T6 (and resolve the T7 gap from
  J. Missing Functionality §6 — define or remove before billing goes live).
- Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_T*` to Vercel env vars.
- Set `BILLING_ENABLED=true` in `feature_flags` only after webhook handling is verified in
  Stripe test mode end-to-end (subscribe, upgrade, downgrade, cancel, payment-fail-and-retry).
- Decide billing unit (per-user vs. per-org) — this decision also gates Plan 4 (Enterprise
  Scale) and should be made once, consistently, not per-plan.

### 3.2 Outreach (Twilio)
- Start A2P 10DLC approval immediately if not already started (2–4 week lead time).
- **Hard precondition, not optional:** confirm suppression-list enforcement is actually wired
  at send-time before `SMS_ENABLED=true` is ever set (flagged in I. Security Assessment §8 and
  J. Missing Functionality §4 as unconfirmed-wired). This is a compliance risk, not just a
  feature gap — do not treat it as a nice-to-have.
- Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` once approved.

### 3.3 Third-Party Data
- Mapbox token for AIN heat map (low risk, low effort).
- BatchSkipTracing key for live skip-trace data (confirm pricing/usage model fits the credit
  system before enabling broadly).

### 3.4 Public Sign-Up
- Move from invite-only to public sign-up (or hybrid) — requires deciding what "free tier" (T1)
  actually grants given the now-live credit/billing system, and requires the navigation gap
  from Plan 1 to be fully closed (a public user landing on an orphaned page on day one is a
  much worse experience than an invited beta tester who's been walked through it).

### 3.5 Operational Readiness
- GodView/Command Center dashboards should be the primary tool for monitoring production load,
  agent run volume, and credit consumption — confirm these surfaces scale visually/functionally
  beyond the low-volume beta dataset (not independently load-tested in this audit).
- Re-confirm audit-logging gap (Plan 1 item) is fully closed before public launch — production
  scale makes any logging gap much more costly to discover after the fact.

## 3. Explicit Non-Goals

- No GitHub PR automation / ZEUS (still explicitly held — V67_DEPLOYMENT_HOLD.md item 3).
- No change to kill-switch fail-open design without an explicit owner-approved discussion.
- No loosening of `AUTOPOIETIC_LIMITS` thresholds without explicit owner sign-off.

## 4. Definition of Done

- Stripe billing live in production mode with at least one real successful subscription.
- Twilio SMS live only after A2P approval AND confirmed suppression-list enforcement.
- Mapbox + BatchSkipTracing live (or explicitly deferred with owner sign-off).
- Public sign-up live with a coherent free-tier experience that does not hit orphaned pages.
