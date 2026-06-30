# E. Database Inventory
**ATLAS / THE ARK v67 — Supabase Postgres**

---

## 1. Headline Numbers

| Metric | Value |
|---|---|
| Total tables | 124 |
| SQL migration files | 11 |
| RLS coverage | 100% (all 124 tables) |
| Destructive statements (DROP/DELETE/TRUNCATE) | 0 — confirmed zero across all 11 files |
| Migration idempotency | 100% — all use `CREATE TABLE IF NOT EXISTS` / `ON CONFLICT ... DO UPDATE` |
| Existing tables modified by v67 patches | 0 — all v67 additions are net-new tables |

## 2. Subsystem Groups (~20)

1. **Auth / Identity** — `profiles`, role/permission support
2. **Real-estate core** — `properties`, `deals`, `leads`, `contacts`
3. **Distress scoring** — `property_distress_scores`, `score_runs`, `distress_signals`
4. **AIN (county intelligence)** — `counties` (55 WV counties seeded), `ain_county_scores`,
   `top250_snapshots`
5. **Contractor / construction** — rehab estimation support tables
6. **Outreach / comms** — `message_drafts`, `campaigns`, `suppression_list`
7. **Agent execution / runs** — `agent_runs`, `agent_run_steps`, `agent_artifacts`,
   `agent_feedback`, `agent_tools`, `agent_permissions`, `prompt_versions`
8. **Genesis Cycle / self-improvement** — `genesis_cycles`, `build_blueprints`,
   `genesis_mutations`, `selfbuild_tasks`
9. **Genesis HQ** — `genesis_hq_*` tables (confirmed a **separate namespace** from Genesis
   Cycle — see B. Architecture Map; never merge these two systems)
10. **Cognitive intelligence** — supporting tables for AI reasoning/context
11. **Workflow / automation** — `pipeline_stages`, `pipeline_events`, `deal_tasks`,
    `deal_notes`, `deal_artifacts`
12. **Recommendations / intelligence** — scoring/insight support
13. **Kanban / cognitive interface** — pipeline UI support
14. **Living graph / expansion** — relationship/graph data
15. **Cognitive cockpit** — dashboard/metrics support
16. **Infrastructure / config** — `system_config`, `feature_flags`, `model_registry`
17. **Organizations / multi-tenant** — `organizations`, `org_members`, `role_permissions`
18. **Google connector** — integration support tables
19. **Audit / compliance** — `audit_logs`, suppression enforcement support
20. **Pilot execution** — `sprint_log`
21. **Skill / knowledge registry** — `skills`, agent capability tables
22. **Build / release** — `build_blueprints` (also listed under Genesis Cycle — dual-purpose)
23. **Platform features** — `usage_events`, `integration_status`, `launch_checklist_items`,
    `system_health_checks`
24. **Onboarding / vaults** — invite flow support
25. **Document templates** — `document_templates`, `documents`, `document_versions`

## 3. v67-Specific New Tables (schema_v67.sql) — Risk-Rated

| Table | RLS | Risk |
|---|---|---|
| `system_config` | owner/admin only, all ops | LOW |
| `build_blueprints` | owner/admin only; cannot execute code (data only) | LOW |
| `selfbuild_tasks` | owner/admin only; has `requires_human_approval`/`approved_by`/`approved_at` fields | LOW |
| `model_registry` | authenticated SELECT (active=true only); owner/admin all ops | VERY LOW |
| `sprint_log` | owner/admin only; idempotent seed (`ON CONFLICT (sprint_number) DO UPDATE`) | VERY LOW |

## 4. Existing Tables Confirmed NOT Touched by Any v67 Patch

`auth.users`, `profiles`, `subscriptions`, `agent_tasks`, `genesis_cycles`, `agent_runs`,
`audit_logs`, `properties`, `deals`, `leads`, `contacts`, `portals`, `skills`, `feature_flags`.

## 5. Three Historical RLS Hotfixes (Already Applied, For Context)

1. RLS predicate changed from `id = auth.uid()` to `user_id = auth.uid() AND is_active = true`
   — matches actual `profiles` schema (`id` = internal UUID, `user_id` = auth FK). This class of
   bug (id vs. user_id confusion) should be specifically checked for in any NEW table's RLS
   policy going forward.
2. `cost_tier` check constraint expanded to include `'free'` (needed for Ollama local-model seed
   rows in `model_registry`).
3. `sprint_log` given a `sprint_number` unique constraint + idempotent upsert seed (previously
   could duplicate rows on re-run).

## 6. Open Schema Gap

- **Subscription tier T7** is referenced in application code (`app/api/portals/[portalId]/chat/
  route.ts`, parts of `lib/models/router.ts`'s tier-band logic) but is **not defined** in
  `lib/models/registry.ts`'s tier list (which stops at T6 GODMODE). This is a data-model gap,
  not a security gap — but it means any T7-gated logic is currently unreachable/undefined
  behavior until either T7 is added to the registry or the T7 references are removed.

## 7. Schema Safety Posture — Overall Assessment

The database layer is the most mature and lowest-risk part of this codebase. Every new table
follows the same safe pattern (IF NOT EXISTS, RLS-by-default, no destructive statements,
idempotent seeds). No action is required on the schema itself before further development;
outstanding work is in application-level enforcement (suppression list send-time checks,
org-switching UI) rather than the schema.
