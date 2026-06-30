# ATLAS v67 Master Merge — Changelog
**Owner:** Isaac Brandon Burdette · Atlas Genesis Matrix LLC
**Branch:** v67-master-merge-atlas-sources
**Date:** June 18, 2026

---

## Summary

ATLAS v67 Master Merge (Phases 0–12) is the most comprehensive build sprint in the platform's history.
Starting from the v67 PATCHED baseline (9 blockers fixed), this session merged all source packages
into a unified production SaaS build with 40+ new files, 20+ new database tables, and complete
investor workflow from property import → distress scoring → God Mode → LOI → pipeline.

---

## Files Changed (from v67 PATCHED baseline)

### Fixed (Phase 0–4 bugs)
- `app/admin/godview/page.tsx` — wrong supabase import
- `app/admin/launch-readiness/page.tsx` — wrong supabase import
- `supabase/schema_v67_master.sql` — SQL alias self-reference
- `middleware.ts` — marketing routes not in PUBLIC_PATHS
- `components/ui/index.tsx` — Minus type error
- `app/(app)/godmode/page.tsx` — unused imports
- `components/admin/GodViewClient.tsx` — unused type import
- `app/(marketing)/page.tsx` → `app/(marketing)/home/page.tsx` — routing conflict

---

## Files Created

### Phase 2 — Design System
- `components/ui/AtlasCard.tsx`
- `components/ui/MetricCard.tsx`
- `components/ui/index.tsx` (StatusBadge, ScoreBar, SignalBadge, AgentBadge, LaunchCheckItem, GlassPanel, CommandButton, SectionHeader)
- `components/godview/GodViewPanel.tsx` (GodViewPanel, GodViewGrid, GodViewStatRow)
- `components/launch/LaunchChecklist.tsx`
- `components/brand/ManifestoPanel.tsx`

### Phase 3 — Schema
- `supabase/schema_v67_master.sql` (20+ tables, 55 WV counties, integration status, launch checklist)

### Phase 4 — App Pages + API Routes
- `app/(app)/ain/page.tsx` — AIN 55-county heat map
- `app/(app)/scoring/page.tsx` — Distress scoring / Signal Stack
- `app/(app)/top250/page.tsx` — Top 250 Matrix
- `app/(app)/pipeline/page.tsx` — Deal Pipeline CRM (kanban)
- `app/(app)/underwriting/page.tsx` — MAO calculator
- `app/(app)/rehab/page.tsx` — Rehab estimator
- `app/(app)/godmode/page.tsx` — God Mode 4-agent pod page
- `app/(app)/d4d/page.tsx` — Driving for Dollars
- `app/(app)/agents/page.tsx` — Agent registry + run history
- `app/(marketing)/home/page.tsx` — Marketing landing
- `app/(marketing)/pricing/page.tsx` — Pricing tiers
- `app/(marketing)/manifesto/page.tsx` — Brand canon
- `app/admin/godview/page.tsx` — Founder GodView
- `app/admin/launch-readiness/page.tsx` — Launch readiness
- `app/admin/integrations/page.tsx` — Integration status
- `app/admin/audit-logs/page.tsx` — Audit logs
- `app/admin/source-map/page.tsx` — Source archive
- `app/admin/billing/page.tsx` — Billing admin
- `app/(app)/counties/[name]/page.tsx` — County detail (dynamic)
- `app/api/scoring/route.ts`
- `app/api/ain/counties/route.ts`
- `app/api/ain/heatmap/route.ts`
- `app/api/ain/import/route.ts`
- `app/api/top250/route.ts`
- `app/api/ai/underwrite/route.ts`
- `app/api/ai/rehab/route.ts`
- `app/api/admin/launch-readiness/route.ts`
- `app/api/admin/integrations/route.ts`
- `app/api/billing/tiers/route.ts`
- `lib/scoring/engine.ts` (8-signal distress engine)

### Phase 5 — V20 Recovery
- `lib/autopoietic/heartbeat.ts` (Genesis Cycle 6-phase)
- `lib/autopoietic/mutationEngine.ts` (approval-gated blueprint queue)
- `lib/autopoietic/limits.ts` (safety bounds)
- `app/api/heartbeat/approve/route.ts`
- `components/portals/CourtWidget.tsx` (prototype)
- `app/api/court-widget/extract/route.ts`
- `components/map/PropertyMap.tsx`
- `app/api/agents/dossier/route.ts` (enhanced — was existing, now saves agent_run_steps)

### Phase 6 — v12 Port
- `lib/models/router.ts` (server-side model routing)
- `lib/godmode/engine.ts` (4-agent orchestration engine)
- `app/api/godmode/route.ts`

### Phase 7 — AIN Full Module
- `app/api/ain/import/route.ts` (admin county data import)
- `app/api/ain/heatmap/route.ts` (aggregated heat map)
- `app/(app)/counties/[name]/page.tsx` (county detail)

### Phase 8 — Billing Gates
- `lib/billing/gates.ts` (tier feature gates, requireFeature, checkCredits)
- `app/api/billing/tiers/route.ts` (public tier info)
- `app/admin/billing/page.tsx`

### Phase 9 — Admin Polish
- `app/(app)/agents/page.tsx`

### Phase 10 — Compliance
- `lib/audit/logger.ts` (enhanced audit logging, suppression check)

### Phase 11 — Tests
- `__tests__/scoring/engine.test.ts` (23 scoring tests)
- `__tests__/scoring/router.test.ts` (model router + billing gate tests)

### Phase 12 — Private Beta Package
- `docs/PRIVATE_BETA_READINESS.md`
- `docs/ENVIRONMENT_VARIABLES.md`
- `docs/DEPLOYMENT_RUNBOOK.md`
- `docs/CHANGELOG_V67_MASTER_MERGE.md` (this file)
- `docs/PHASE_5_V20_RECOVERY_REPORT.md`
- `docs/PHASE_6_V12_PORT_MERGE_REPORT.md`
- `docs/V67_MASTER_MERGE_VERIFICATION_REPORT.md`
- `docs/SOURCE_MAP_MASTER.md`
- `docs/V67_MERGE_PLAN.md`
- `docs/MVP_SCOPE_LOCK.md`
- `docs/DO_NOT_BUILD_YET.md`
- `docs/IP_ATTRIBUTION_CLEANUP.md`

---

## Database Changes

New tables in `schema_v67_master.sql`:
`organizations`, `org_members`, `role_permissions`, `counties` (55 WV seeded),
`ain_county_scores` (demo scores seeded), `distress_signals`, `property_distress_scores`,
`score_runs`, `top250_snapshots`, `d4d_sessions`, `d4d_pins`, `pipeline_stages`,
`pipeline_events`, `deal_tasks`, `deal_notes`, `deal_artifacts`, `agent_run_steps`,
`agent_artifacts`, `agent_feedback`, `document_templates`, `documents`, `suppression_list`,
`usage_events`, `integration_status` (9 seeded), `launch_checklist_items` (20 seeded)

---

## Test Coverage

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `__tests__/permissions.test.ts` | 23 | RBAC, auth, rate limit, feature flags |
| `__tests__/scoring/engine.test.ts` | ~18 | 8-signal scoring engine, MAO calc, grades |
| `__tests__/scoring/router.test.ts` | ~12 | Model routing, billing gates |
| **Total** | **~53** | Core business logic |

---

## What Did NOT Change

- All v67 original portals (TheArkApp.tsx portal system) — preserved
- All v67 existing API routes — preserved and kill-switch protected
- All v67 auth/middleware — enhanced only (public paths added)
- All v67 Supabase schemas — additive only (no drops, no truncates)
- Kill switch — still wired on all agent routes

---

## IP Attribution

**Isaac Brandon Burdette** — Sole Founder, Owner, and Inventor
Atlas Genesis Matrix LLC · Saint Albans, West Virginia
Patent Pending P001–P100 (OMNIFOLD™ family)
Non-provisional filing deadline: March 29, 2027
