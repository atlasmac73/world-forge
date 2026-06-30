# C. Feature Inventory
**ATLAS / THE ARK v67**

Features are grouped by business function. Status reflects actual code presence and wiring,
not the merge-plan's self-reported phase status — discrepancies are called out explicitly.

---

## 1. Investor / Deal-Flow Features

| Feature | Code Status | Reachable from Nav? | Notes |
|---|---|---|---|
| Distress Scoring (8-signal engine) | ✅ Implemented — `lib/scoring/engine.ts` | ✅ `/scoring` exists but **not in Sidebar/PORTAL_MAP** | scoreProperty() fully implemented: tax delinquency, vacancy, foreclosure, equity deficit, DOM, owner distress, court/legal, market velocity → CRITICAL/HOT/WARM/COOL/COLD/UNKNOWN grade |
| Top 250 Matrix | ✅ Page exists | ❌ not linked | `top250_snapshots` table exists; periodic capture logic not confirmed wired to a scheduler |
| Deal Pipeline (Kanban CRM) | ✅ Page + tables exist (`pipeline_stages`, `pipeline_events`, `deal_tasks`, `deal_notes`, `deal_artifacts`) | ❌ not linked | |
| AIN 55-County Heat Map | ✅ Full page built | ❌ historically the canonical "trap" example — built, working, invisible | Needs Mapbox token to go beyond demo mode |
| County Detail View | ✅ Page exists | ❌ not linked | |
| Driving for Dollars (D4D) | ✅ Page + `d4d_sessions`/`d4d_pins` tables + `PropertyMap.tsx` base component | ❌ not linked | |
| Underwriting / MAO Calculator | ✅ Implemented (MAO = max(0, ARV×0.70 − repairs)) | ❌ not linked | |
| Rehab Estimator | ✅ Page exists | ❌ not linked | |
| God Mode (4-agent pod) | ✅ `lib/godmode/engine.ts` + dedicated page | Partially — referenced in some nav | |

## 2. AI / Agent Features

| Feature | Code Status | Notes |
|---|---|---|
| A01-ORACLE (orchestrator / streaming copilot) | ✅ Implemented inline in toolGateway | |
| A03-GENESIS (self-improvement engine) | ✅ Implemented (heartbeat.ts + genesis/cycle route) | Manual-trigger only, see B/H |
| A06-HERALD (copywriter) | ✅ `lib/agents/copywriter.ts` | |
| A12-SPECTER (investigator/dossier) | ✅ `lib/agents/investigator.ts` | |
| A15-OMEN (underwriter) | ✅ `lib/agents/underwriter.ts` | |
| A13-VANGUARD (market heatmap agent) | ❌ Stub — registry entry only, no implementation | |
| A25-ZEUS (swarm / god squad) | ❌ Stub — registry entry only | Also referenced as future "ZEUS PR automation" — explicitly NOT to be built yet per V67_DEPLOYMENT_HOLD.md |
| A228-UNREAL (world generation) | ❌ Stub — registry entry only | |
| Court Widget extraction | ✅ Prototype (`app/api/court-widget/extract/route.ts`) | From V20 recovery |
| SignalStack | ✅ Real component (replaced V20 stub) | |
| WarRoom portal | ✅ Enhanced from V20 base | |
| Portal 15 — SuperLLM chat | ✅ Implemented, gated to T7/NASDROP-tier users | Needs ANTHROPIC_API_KEY in Vercel to run live |

## 3. Admin / Founder Features

| Feature | Code Status | Notes |
|---|---|---|
| Command Center (11-tab dashboard) | ✅ Implemented, admin-gated | Ready to deploy per DEPLOYMENT_HOLD |
| Kill Switch (API + widget) | ✅ Implemented, wired into 9 agent routes + heartbeat | Ready to deploy |
| Blueprint Queue (approve/reject) | ✅ Implemented | Data-only, cannot execute code |
| GodView (5-panel founder dashboard) | ✅ Implemented | |
| Launch Readiness checklist | ✅ Database-backed, implemented | |
| Integrations status page | ✅ Page exists | ❌ not linked from Sidebar |
| Audit Log viewer | ✅ Page exists | ❌ not linked from Sidebar |
| Source Map / archive page | ✅ Page exists | ❌ not linked from Sidebar |

## 4. Compliance / Comms Features

| Feature | Code Status | Notes |
|---|---|---|
| Suppression list (TCPA) | ✅ Table exists (`suppression_list`) | Enforcement logic at send-time not confirmed wired — required before ANY SMS feature ships |
| Document templates / generation | ✅ Tables exist (`document_templates`, `documents`, `document_versions`) | UI wiring not confirmed |
| Campaign tracking | ✅ Table exists (`campaigns`) | |
| Message drafts (outreach) | ✅ Table exists (`message_drafts`) | No send path — Twilio explicitly held |

## 5. Platform Features

| Feature | Code Status | Notes |
|---|---|---|
| Usage metering | ✅ Table exists (`usage_events`) | |
| Subscription tiers T1–T6 | ✅ Implemented in `lib/models/registry.ts` | **T7 referenced in code (chat route, model router) but not defined in registry — gap, see I/J** |
| Billing / Stripe | ❌ Not enabled — product IDs not created, `BILLING_ENABLED` flag false | See Plan 3 |
| Org/multi-tenant foundation | ✅ Tables exist (`organizations`, `org_members`, `role_permissions`) | Enforcement present in schema; full product-level org-switching UI not confirmed |
| System health checks | ✅ Table + `/api/health` route returns Command Center metrics | |

## 6. Marketing / Brand Features

| Feature | Code Status | Notes |
|---|---|---|
| Landing page | ✅ Implemented | ❌ in PUBLIC_PATHS but reachability from authenticated app unclear |
| Pricing page | ✅ Implemented | |
| Manifesto / brand canon page | ✅ Implemented (`ManifestoPanel.tsx`) | |
| Stakeholder internal view | ✅ Page exists | ❌ not linked |

---

## Summary Count

- **Fully implemented + reachable:** ~12 features
- **Fully implemented, NOT reachable from main nav (the "trap" pattern):** ~14 features — this
  is the single largest gap between "done" and "usable" in the entire codebase.
- **Stub only:** 3 agents (VANGUARD, ZEUS, UNREAL), Stripe/Twilio/Mapbox/BatchSkipTracing
  integrations.
- **Schema exists, enforcement/UI not confirmed:** suppression enforcement, document generation
  UI, org-switching UI.
