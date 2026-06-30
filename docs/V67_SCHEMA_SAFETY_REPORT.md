# ATLAS v67 — Schema Safety Report (PATCHED)
**File:** supabase/schema_v67.sql
**Status: SAFE TO REVIEW — do not run on live Supabase until you confirm this document**

---

## Safety Checklist

| Check | Result |
|-------|--------|
| No DROP TABLE | ✅ PASS |
| No TRUNCATE | ✅ PASS |
| No DELETE FROM | ✅ PASS |
| No ALTER TABLE on existing tables | ✅ PASS |
| All CREATE TABLE use IF NOT EXISTS | ✅ PASS — all 5 |
| RLS enabled on all new tables | ✅ PASS — all 5 |
| RLS policies use user_id = auth.uid() | ✅ PASS (hotfix applied) |
| RLS policies check is_active = true | ✅ PASS (hotfix applied) |
| cost_tier constraint includes 'free' | ✅ PASS (hotfix applied) |
| sprint_number unique constraint | ✅ PASS (hotfix applied) |
| Sprint seed uses ON CONFLICT (sprint_number) DO UPDATE | ✅ PASS (hotfix applied) |
| No hardcoded secrets | ✅ PASS |
| No modification to existing tables | ✅ PASS |
| No modification to auth.users | ✅ PASS |
| Blueprint table cannot execute code | ✅ PASS — data only |

---

## Hotfixes Applied vs ATLAS_v67_WORKING_FINAL.zip

1. RLS: was `where id = auth.uid()` → now `where user_id = auth.uid() and is_active = true`
   Matches existing profiles table: id = internal UUID, user_id = auth FK

2. cost_tier: was `check (cost_tier in ('$','$$','$$$','$$$$'))` → added 'free'
   Required for Ollama local model seed rows

3. sprint_log: added `sprint_number integer not null unique`
   Seed changed from `on conflict do nothing` to `on conflict (sprint_number) do update set ...`
   Prevents duplicate rows on re-runs

---

## New Tables

### system_config
RLS: owner/admin only (all ops)
Seed: kill_switch = false, ai_enabled = true
Risk: LOW

### build_blueprints
RLS: owner/admin only
Cannot deploy automatically — data only, no stored procedures
Risk: LOW

### selfbuild_tasks
RLS: owner/admin only
Human approval fields: requires_human_approval, approved_by, approved_at
Risk: LOW

### model_registry
RLS: authenticated SELECT (active=true only); owner/admin all ops
Seed: 25 AI models
Risk: VERY LOW

### sprint_log
RLS: owner/admin only
Seed: 8 sprint rows, idempotent (ON CONFLICT update)
Risk: VERY LOW

---

## Existing Tables NOT Touched

auth.users, profiles, subscriptions, agent_tasks, genesis_cycles,
agent_runs, audit_logs, properties, deals, leads, contacts,
portals, skills, feature_flags — all completely untouched.

---

## Pre-Run Checklist

- [ ] Read this report
- [ ] Take a Supabase backup
- [ ] Confirm connected to kjfwanpwzgcscgsdgekm (not a different project)
- [ ] Confirm no table name collisions (system_config, build_blueprints, selfbuild_tasks, model_registry, sprint_log)
- [ ] Run schema_v67.sql first
- [ ] Log in as atlasmac73@gmail.com
- [ ] Run seed_owner.sql second
