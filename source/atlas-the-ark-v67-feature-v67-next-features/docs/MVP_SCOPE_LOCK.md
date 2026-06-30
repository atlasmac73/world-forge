# ATLAS v67 — MVP Scope Lock
**Owner:** Isaac Brandon Burdette · Atlas Genesis Matrix LLC
**Date:** June 18, 2026
**Status:** LOCKED for private beta

---

## The Product

**ATLAS Deal Pro / ATLAS OS v67**
Real estate intelligence SaaS for WV/Appalachian investors, wholesalers, and operators.

---

## Primary MVP User

Investor / wholesaler / real estate operator in WV/Appalachian market.

### Secondary User Shells (portals exist, not fully built yet)
- Contractor (portal stub → full in v68)
- Real estate agent (portal stub)
- Homeowner / FSBO seller (portal stub)
- Property manager (portal stub)
- Admin / Founder (full — Command Center, GodView)

**Rule: Build the investor flow complete first. Role portals exist as shells.**

---

## Core MVP Flow

```
Create/import property
  → enrich / manual county context
  → calculate distress score (8 signals)
  → rank in Top 250 / AIN matrix
  → convert to lead
  → move into pipeline (kanban)
  → run God Mode 4-agent pod
  → generate underwriting / MAO
  → generate rehab estimate
  → draft LOI / outreach
  → save artifacts
  → show next action
  → track audit / usage / billing
```

---

## Must-Build MVP Modules (v67 target)

| Module | Status in v67 | Target |
|--------|--------------|--------|
| Auth / onboarding / invites | ✅ Done | Keep |
| App shell (sidebar, topbar, copilot) | ✅ Done | Enhance |
| Dashboard / Intelligence Pulse | ✅ Exists (portal) | Upgrade to real data |
| Properties | ✅ API + portal | Add scoring display |
| Leads | ✅ API + partial | Complete |
| AIN / WV County Heat Map | ⚠️ Stub portal | Build full module |
| D4D map and saved pins | ❌ Missing | Add |
| Distress scoring / Signal Stack | ⚠️ API exists | Add scoring engine |
| Top 250 Matrix | ❌ Missing | Build |
| Deal Pipeline CRM (kanban) | ⚠️ Partial | Complete |
| God Mode 4-agent pod | ✅ Dossier + run | Wire up properly |
| Underwriting / MAO calculator | ❌ Missing API | Build |
| Rehab estimator | ❌ Missing | Build |
| LOI generator | ✅ API + portal | Keep + save artifact |
| AI Copilot | ✅ Panel exists | Keep |
| Agent registry + run history | ✅ AgentLab portal | Keep |
| Manual outreach draft generator | ✅ Workflows route | Keep |
| Billing / Stripe gates | ✅ Routes exist | Wire feature gates |
| Admin system health | ✅ Done | Keep |
| Launch readiness dashboard | ❌ Missing | Build |
| Integration status | ❌ Missing | Build |
| Audit logs viewer | ❌ Missing | Build |
| Source archive / version history | ❌ Missing | Build |
| GodView (founder dashboard) | ⚠️ Command Center exists | Upgrade |
| Manifesto / About page | ❌ Missing | Build |
| Pricing / marketing page | ❌ Missing | Build |

---

## Do NOT Build in v67

These are explicitly deferred. Do not add them. Do not stub them as "coming soon" in core UI.

- Full ATLAS WORLD / ATLAS TIME
- Mars / Cosmos modules
- Consciousness upload / deceased reconstruction
- Full 1,000-skill autonomous system
- Full 255-agent autonomous system
- Omniverse as primary UI
- Auto-send SMS blasts (until TCPA/STOP compliance complete)
- Autonomous code auto-merge to production
- Full VR/XR world engine
- Full transmedia production suite
- Full contractor business OS
- Full property management OS
- Full marketplace / economy
- Full voice calling (stub only, no auto-dial)
- BidHub / Omega contractor OS

These live in `docs/DO_NOT_BUILD_YET.md`.

---

## Tier / Pricing Target

| Tier | Code | Price | Key Gates |
|------|------|-------|-----------|
| Free | T1 | $0 | 10 properties, 5 leads, no God Mode, no AIN premium |
| Starter | T2 | $49/mo | 100 properties, God Mode 5/day, AIN basic |
| Pro | T3 | $149/mo | Unlimited properties, God Mode 25/day, AIN full, skip trace |
| Elite | T4 | $299/mo | Everything + Top 250 export, LOI batch, rehab AI |
| Sovereign | T5 | $499/mo | Full platform + white-label option |
| God Mode | T6 | $999/mo | Full + priority AI + model selection |
| Founder/Admin | T7 | Internal | Full access, no billing |

---

## Acceptance Criteria Summary

Before calling v67 private-beta-ready:

1. `npm run build` passes — no TS errors, no ESLint errors
2. `npm run typecheck` passes
3. Supabase migrations exist for all core tables
4. RLS enabled on all tenant-owned tables
5. No server secrets in browser/localStorage
6. Distress scoring runs and persists result
7. God Mode 4-agent run works and saves artifact
8. LOI generation works and saves artifact
9. Pipeline kanban works and persists
10. AIN 55-county heat map shows real DB rows (or clearly labeled demo)
11. Billing routes and Stripe webhook exist
12. Admin health route returns real checks
13. Launch readiness dashboard shows real status
14. IP attribution corrected on all public-facing copy
15. At least one full invite-only test session completes without crash
