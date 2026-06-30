# ATLAS Source Map Master
**Owner:** Isaac Brandon Burdette · Atlas Genesis Matrix LLC
**Date:** June 18, 2026
**Base:** ATLAS_v67_WORKING_FINAL_PATCHED.zip → canonical production base

---

## Source Hierarchy — Role of Every Package

| Source | Role | Status |
|--------|------|--------|
| **v67 repo (this repo)** | Canonical production base. All merges target this. | ✅ ACTIVE BASE |
| `ATLAS_V20_AUTOPOIETIC.zip` | Strongest old Next.js code recovery. Best agent pipeline, autopoietic console, WarRoom, SignalStack, dossier chain, court widget. | MERGE SELECTIVELY |
| `files (66).zip` | v22 security/schema/deploy reference. middleware, scraper, schema upgrades, env template, Vercel config. | REFERENCE ONLY |
| `atlas-godmode-v12-port.zip` | Best GodMode/scoring engine/model-router module seed. 4-agent pod, 8-signal scoring, BillingModal. | MERGE SELECTIVELY |
| `ATLAS_GodMode_v12.html` | Full product + UI spec. Source of truth for feature list, portal map, agent names, scoring signals, tier pricing. | SPEC REFERENCE |
| `ATLAS REIP v7 120 Prompt Blueprint.docx` | Implementation checklist. Schema, API contracts, RLS policies, Stripe gates, n8n workflows, validation. | CHECKLIST |
| `AIN_HEAT_MAP_55_COUNTIES.html` | MVP county intelligence module. All 55 WV counties, distress heat map, SPECTER integration points. | MERGE AS MODULE |
| `ATLAS_GODVIEW_FINAL(1).html` | Founder/admin God View UX. 5-panel executive dashboard, visual design tokens. | UI INSPIRATION |
| `ATLAS_LAUNCH_COMMAND.html` | Launch sequencing dashboard. Pre-beta checklist, domino sequence, readiness gates. | ADMIN MODULE |
| `ATLAS_GENESIS_MATRIX_MANIFESTO.html` | Brand canon. Founder story, sovereignty principles, IP doctrine, About page. | BRAND/LEGAL |
| `ATLAS_OS_v22_Stakeholder_Deck` | Pitch language, pricing tiers, 25-agent God Squad names, WV market framing, technical stack overview. | POSITIONING |
| `Pasted text(22)/(23)` | v1-v67 version history, source map, era classification. | ARCHIVE REFERENCE |
| `BidHub` | Contractor bid/document module. Future — Contractor Lite portal. | DEFERRED v68+ |
| `Omega` | Advanced contractor OS. Future module. | DEFERRED v68+ |
| `Omniverse/BlackHole/ATGENIX` | Long-term empire roadmap. Future platform expansion. | ROADMAP ONLY |

---

## What v67 Already Has (Do Not Rebuild)

### App Pages
- `/login`, `/invite`, `/auth/callback`
- `app/page.tsx` (root redirect)
- `app/admin/agent-tasks`
- `app/admin/command-center` (11-tab God Mode dashboard)
- `app/admin/system-health`

### API Routes (33 total)
- Properties, Leads, Deals (basic CRUD)
- Agents: distress-score, document-summary, dossier, loi, run, skip-trace, task-extraction
- Billing: checkout, portal, webhook
- Comms: sms-inbound, sms-send
- Genesis: blueprints, cycle
- System: health, heartbeat, killswitch
- Auth: invite/validate, auth/callback
- Portal chat, skills, trust, search, audit, beta/feedback, world/generate

### Components (42 total)
- Shell: Sidebar, TopBar, CommandPalette, CopilotPanel, Providers
- Admin: AgentTasksPageClient, CommandCenterClient, SystemHealthPageClient
- Portals (26): Dashboard, Deals, AgentLab, AIN, Akashic, Autopoietic, CognitiveCockpit,
  Comms, ContractorPortalFull, Genesis, LOI, LivingGraph, Market, Nasdrop,
  Onboarding, PhaseRoadmap, Settings, Skills, SkipTrace, SuperLLM, SwarmNexus,
  Transmedia, TrustDashboard, WarRoom, WorldForge, AdminPortal

### Lib (15 files)
- agents: callAgentRun, copywriter, investigator, killSwitch, toolGateway, underwriter
- audit: createAuditLog
- auth: requireUser
- featureFlags, models/registry, observability/logger, permissions/index
- supabase: client, server
- utils: rateLimit

### Schema (8 SQL files)
- schema.sql (properties, leads, deals, agents, genesis, subscriptions, 30+ tables)
- schema_beta.sql (profiles, invites, audit_logs, feature_flags, beta_feedback)
- schema_canon.sql, schema_living_graph.sql, schema_pilot.sql
- schema_v67.sql (system_config, build_blueprints, selfbuild_tasks, model_registry, sprint_log)
- migrations/20260616_agent_tasks.sql

---

## What Must Be Added (Master Merge Targets)

### PHASE 2 — Design System
- `components/ui/` — AtlasCard, MetricCard, StatusBadge, ScoreBar, SignalBadge,
  AgentBadge, LaunchCheckItem, GlassPanel, CommandButton, SectionHeader
- `components/godview/` — GodViewPanel, GodViewGrid
- `components/launch/` — LaunchChecklist
- `components/brand/` — ManifestoPanel
- CSS tokens from GodView/Launch/Manifesto HTML files

### PHASE 3 — Schema Additions
- `organizations`, `org_members`, `role_permissions` (multi-tenant)
- `counties`, `ain_county_scores`, `distress_signals`, `property_distress_scores`
- `score_runs`, `top250_snapshots`, `d4d_sessions`, `d4d_pins`
- `pipeline_stages`, `pipeline_events`, `deal_tasks`, `deal_artifacts`
- `agent_tools`, `agent_permissions`, `agent_run_steps`, `agent_artifacts`
- `document_templates`, `documents`, `message_drafts`, `campaigns`, `suppression_list`
- `usage_events`, `integration_status`, `launch_checklist_items`

### PHASE 4 — App Routes
- `/app/(app)/ain` — AIN 55-county heat map (full module)
- `/app/(app)/scoring` — Distress scoring / Signal Stack
- `/app/(app)/top250` — Top 250 Matrix
- `/app/(app)/pipeline` — Deal Pipeline CRM (kanban)
- `/app/(app)/godmode` — God Mode 4-agent pod (dedicated page)
- `/app/(app)/rehab` — Rehab estimator
- `/app/(app)/underwriting` — MAO calculator
- `/app/(app)/d4d` — Driving for Dollars map
- `/app/(app)/counties` — County detail view
- `/app/admin/godview` — Founder God View (5-panel)
- `/app/admin/launch-readiness` — Launch readiness dashboard
- `/app/admin/integrations` — Integration status
- `/app/admin/audit-logs` — Audit logs
- `/app/admin/source-map` — Source archive viewer
- `/app/(marketing)/` — Landing page
- `/app/(marketing)/pricing` — Pricing page
- `/app/(marketing)/manifesto` — Brand canon page

### PHASE 5 — V20 Recovery Merges
- 3-agent dossier chain → GodMode pod
- AutopoieticConsole (admin-only, approval-gated)
- SignalStack → real distress signal component
- CourtWidget → county/court extraction prototype
- PropertyMap → D4D map component

### PHASE 6 — v12 Port Merges
- Scoring engine (8 signals) → `lib/scoring/engine.ts`
- God Mode engine → `lib/godmode/engine.ts`
- Model router → server-side only in `lib/models/router.ts`
- GodModePortal visual → merged into existing portal system

---

## IP Attribution Rule

All public and production-facing copy must attribute:
**Isaac Brandon Burdette** as sole founder, owner, and inventor of Atlas Genesis Matrix core IP.

Nalone Stallings may be referenced only for:
- WV operations support
- Atlas Management & Construction LLC operations
- Build support on specific projects
- Construction project work

Do NOT imply Nalone Stallings is an inventor of Atlas Genesis Matrix IP in any
investor-facing, legal, or public documentation.

See `docs/IP_ATTRIBUTION_CLEANUP.md` for full details.
