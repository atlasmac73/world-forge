# ATLAS v67 — Master Merge Plan
**Owner:** Isaac Brandon Burdette · Atlas Genesis Matrix LLC
**Branch:** v67-master-merge-atlas-sources
**Date:** June 18, 2026

---

## Phase Status

| Phase | Name | Status | Output |
|-------|------|--------|--------|
| 0 | Baseline Audit | ✅ DONE | docs/V67_BASELINE_AUDIT.md |
| 1 | Source Map + Safety Docs | ✅ DONE | 8 docs created |
| 2 | Design System / ATLAS Look | ✅ DONE | components/ui/, components/godview/, components/launch/, components/brand/ |
| 3 | Schema + RLS Foundation | ✅ DONE | supabase/schema_v67_master.sql — 20+ tables, 55 WV counties seeded |
| 4 | MVP App Routes | ✅ DONE | 16 pages, 7 API routes, lib/scoring/engine.ts |
| 5 | V20 Recovery Merge | ✅ DONE | lib/autopoietic/, heartbeat/approve, CourtWidget, PropertyMap, dossier enhanced |
| 6 | v12 Port Merge | ✅ DONE | lib/models/router.ts, lib/godmode/engine.ts, /api/godmode route |
| 7 | AIN Full Module | PENDING (needs owner approval) | live data connectors, admin import |
| 8 | Billing + Feature Gates | PENDING | Stripe product IDs, tier gates |
| 9 | Admin + Launch + Health | ✅ DONE (partial) | GodView, launch readiness, integrations, audit logs |
| 10 | Compliance + Safety | PENDING | suppression enforcement, audit logging complete |
| 11 | Tests + Hardening | PENDING | typecheck clean, all tests pass |
| 12 | Private Beta Package | PENDING | runbook + readiness doc |

---

## Phase 2 — Design System (Current)

### Goal
Extract visual tokens from GodView/Launch/Manifesto HTML sources.
Build reusable Atlas UI component library.
Do NOT copy monolithic HTML/CSS. Extract tokens and rebuild in React/Tailwind.

### Components to Create

**UI Primitives** (`components/ui/`)
- `AtlasCard.tsx` — base card with Atlas dark theme
- `MetricCard.tsx` — metric tile with label/value/trend
- `StatusBadge.tsx` — colored status indicator
- `ScoreBar.tsx` — horizontal score bar with gradient
- `SignalBadge.tsx` — distress signal indicator (hot/warm/cold/critical)
- `AgentBadge.tsx` — agent avatar with status dot
- `LaunchCheckItem.tsx` — checklist item with pass/fail/pending state
- `GlassPanel.tsx` — frosted glass panel with border glow
- `CommandButton.tsx` — primary action button
- `SectionHeader.tsx` — section heading with optional badge

**Shell Components** (update existing)
- `components/shell/AppShell.tsx` — master layout wrapper
- `components/shell/Sidebar.tsx` → update `components/Sidebar.tsx`
- `components/shell/TopBar.tsx` → update `components/TopBar.tsx`

**GodView Components** (`components/godview/`)
- `GodViewPanel.tsx` — individual panel in 5-panel layout
- `GodViewGrid.tsx` — 5-panel grid layout

**Launch Components** (`components/launch/`)
- `LaunchChecklist.tsx` — database-backed launch readiness checklist

**Brand Components** (`components/brand/`)
- `ManifestoPanel.tsx` — brand canon / founder story section

### Design Tokens (from GodView/Manifesto)

```
Background:  #05080f (void/obsidian)
Surface:     #0a0e1a (sidebar/nav)
Panel:       #0f1525 (cards)
Border:      rgba(99,179,237,0.15)
BorderActive: rgba(99,179,237,0.4)

Accents:
  Cyan:   #63b3ed (primary)
  Gold:   #f6ad55 (founder/admin)
  Green:  #68d391 (live/active)
  Red:    #fc8181 (danger/hot)
  Purple: #b794f4 (genesis/ai)
  Teal:   #4fd1c5 (score/intel)
  Pink:   #f687b3 (signal)

Text:
  Primary: #e2e8f0
  Muted:   #718096
  
Fonts:
  UI: System sans-serif
  Data/Code: Fira Code / monospace
  Brand: Geist (if available)

Glow effects:
  Card hover: box-shadow 0 0 20px rgba(99,179,237,0.1)
  Active:     box-shadow 0 0 30px rgba(99,179,237,0.2)
  Gold glow:  box-shadow 0 0 20px rgba(246,173,85,0.15)
```

---

## Phase 3 — Schema Additions

### New Tables (additions to existing schema)

**Multi-tenant foundation**
- `organizations` — org entity
- `org_members` — user ↔ org membership + role
- `role_permissions` — RBAC permission grants

**Real estate expansion**
- `counties` — all 55 WV counties (seed from AIN HTML)
- `ain_county_scores` — per-county distress scores
- `distress_signals` — individual signal records per property
- `property_distress_scores` — computed score results
- `score_runs` — audit trail for scoring runs
- `top250_snapshots` — periodic top 250 captures
- `d4d_sessions` — driving-for-dollars sessions
- `d4d_pins` — pinned properties from D4D
- `pipeline_stages` — configurable pipeline columns
- `pipeline_events` — audit trail for stage changes
- `deal_tasks` — tasks attached to deals
- `deal_notes` — notes on deals
- `deal_artifacts` — files/outputs attached to deals

**AI/Agent expansion**
- `agent_tools` — tools available to each agent
- `agent_permissions` — what agents can do
- `agent_run_steps` — sub-steps within a run
- `agent_artifacts` — outputs saved from agent runs
- `agent_feedback` — human feedback on agent outputs
- `prompt_versions` — versioned prompt templates

**Docs/Comms**
- `document_templates` — LOI, rehab, underwriting templates
- `documents` — generated documents
- `document_versions` — version history
- `message_drafts` — outreach drafts
- `campaigns` — campaign tracking
- `suppression_list` — TCPA suppression (required before any SMS)

**Platform**
- `usage_events` — metered usage per user/org
- `integration_status` — connected integrations
- `launch_checklist_items` — database-backed launch gates
- `system_health_checks` — health check results

---

## Phase 4 — New App Routes

### Investor Flow (Priority 1)
```
/app/(app)/scoring          — Distress Scoring + Signal Stack
/app/(app)/top250           — Top 250 Matrix view
/app/(app)/pipeline         — Deal Pipeline CRM (kanban)
/app/(app)/ain              — AIN 55-county heat map (full)
/app/(app)/counties         — County detail view
/app/(app)/d4d              — Driving for Dollars map
/app/(app)/underwriting     — MAO calculator
/app/(app)/rehab            — Rehab estimator
/app/(app)/godmode          — God Mode 4-agent pod dedicated page
```

### Admin / Founder (Priority 2)
```
/app/admin/godview          — 5-panel GodView founder dashboard
/app/admin/launch-readiness — Launch readiness + domino checklist
/app/admin/integrations     — Integration status
/app/admin/audit-logs       — Audit log viewer
/app/admin/source-map       — Source archive + version history
```

### Marketing (Priority 3)
```
/app/(marketing)/           — Landing page
/app/(marketing)/pricing    — Pricing tiers
/app/(marketing)/manifesto  — Brand canon / About
/app/(marketing)/stakeholder — Internal stakeholder view
```

---

## Phase 5 — V20 Recovery

### Merge targets from ATLAS_V20_AUTOPOIETIC.zip
- `lib/agents/investigator.ts` → already exists in v67, compare and merge best version
- `lib/agents/underwriter.ts` → already exists, compare
- `lib/agents/copywriter.ts` → already exists, compare
- `lib/autopoietic/heartbeat.ts` → merge as admin-only, approval-gated
- `lib/autopoietic/mutationEngine.ts` → merge admin-only
- `components/portals/SignalStack.tsx` → replace stub with real signal component
- `components/portals/WarRoom.tsx` → enhance existing WarRoom portal
- `components/map/PropertyMap.tsx` → D4D map base component
- `app/api/court-widget/extract/route.ts` → court widget prototype

### NOT from V20
- Any client-side API key storage
- Twilio routes (not until compliance ready)
- Auto-send features

---

## Phase 6 — v12 Port

### Merge targets from atlas-godmode-v12-port
- `lib/god-mode/scoring.ts` → `lib/scoring/engine.ts`
- `lib/model-router/index.ts` → `lib/models/router.ts` (server-side only)
- Scoring signals (8): tax delinquent, vacancy, foreclosure, equity pct,
  days on market, owner distress, court activity, market velocity

### Not from v12
- Periodic Table as core MVP UI
- SP6 Wallet / token economy
- Full 10-mode SuperLLM (3 modes only)

---

## Phase 7 — AIN Full Module

### Source: AIN_HEAT_MAP_55_COUNTIES.html

Build `/app/(app)/ain` as full production module:
1. Load all 55 WV counties from `counties` table
2. Display as heat map cards (Critical/Hot/Warm/Cool/Cold)
3. Filters: tax delinquent %, vacant/abandoned %, foreclosure rate
4. County selector → detail drawer
5. Actions: "Add to Top 250", "Run SPECTER", "Add to War Room"
6. Data freshness label + source attribution
7. Demo mode with clear label if no live data

Counties seed: Kanawha (default), Cabell, Wood, Mercer, Raleigh, Putnam,
Berkeley, Monongalia, Wayne, Marshall ... (all 55)

---

## Merge Rules (Applied to Every Phase)

1. v67 conventions are canonical — adapt imports, not override them
2. Add `org_id` to all new tenant-owned tables
3. Replace user-only RLS with org/role-aware RLS
4. No client-side secrets
5. All agent runs must be persisted (agent_runs table)
6. All artifacts must be saved (agent_artifacts table)
7. Zod validation on all API inputs
8. Every PR/change must pass: typecheck, lint, build
9. Demo/mock data must be clearly labeled
10. Human approval required for Genesis/autopoietic mutations

---

## Files This Branch Will Create or Modify

### New files (Phase 2)
- `components/ui/AtlasCard.tsx`
- `components/ui/MetricCard.tsx`
- `components/ui/StatusBadge.tsx`
- `components/ui/ScoreBar.tsx`
- `components/ui/SignalBadge.tsx`
- `components/ui/AgentBadge.tsx`
- `components/ui/LaunchCheckItem.tsx`
- `components/ui/GlassPanel.tsx`
- `components/ui/CommandButton.tsx`
- `components/ui/SectionHeader.tsx`
- `components/godview/GodViewPanel.tsx`
- `components/godview/GodViewGrid.tsx`
- `components/launch/LaunchChecklist.tsx`
- `components/brand/ManifestoPanel.tsx`

### New files (Phase 3)
- `supabase/schema_v67_master.sql` — master merge migration

### New files (Phase 4)
- `app/(app)/scoring/page.tsx`
- `app/(app)/top250/page.tsx`
- `app/(app)/pipeline/page.tsx`
- `app/(app)/ain/page.tsx`
- `app/(app)/counties/page.tsx`
- `app/(app)/d4d/page.tsx`
- `app/(app)/underwriting/page.tsx`
- `app/(app)/rehab/page.tsx`
- `app/(app)/godmode/page.tsx`
- `app/admin/godview/page.tsx`
- `app/admin/launch-readiness/page.tsx`
- `app/admin/integrations/page.tsx`
- `app/admin/audit-logs/page.tsx`
- `app/admin/source-map/page.tsx`
- `app/(marketing)/page.tsx`
- `app/(marketing)/pricing/page.tsx`
- `app/(marketing)/manifesto/page.tsx`
- (+ corresponding API routes and components)

### Modified files
- `components/Sidebar.tsx` — add new routes
- `store/useArkStore.ts` — add new portal types and state
- `components/app/TheArkApp.tsx` — register new portals
- `app/globals.css` — add design token CSS vars
- `tailwind.config.js` — add any missing tokens
