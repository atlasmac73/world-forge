# THE ARK — Supabase Setup Guide

## Migration Order (MUST run in this exact order)

Run each file in Supabase Dashboard → SQL Editor → New Query:

### 1. schema.sql
Core tables: `properties`, `leads`, `agent_runs`, `trust_events`, `subscriptions`, `subscription_tiers`, `connector_accounts`

### 2. schema_canon.sql
Extended tables: `workspace_ai_tools`, `tool_registry`, `credit_ledger`, `api_keys`

### 3. schema_living_graph.sql
Living Graph tables: `graph_nodes`, `graph_edges`, `graph_sessions`

### 4. schema_pilot.sql
Pilot/org tables: `organizations`, `workspaces`, `workspace_members`

### 5. schema_beta.sql ← NEW
Beta hardening: `profiles`, `invites`, `audit_logs`, `feature_flags`, `beta_feedback`, `memberships`
Also creates the auto-profile trigger and feature flag seed data.

### 6. seed_owner.sql
Bootstrap owner account (edit email before running).

---

## Verify RLS Is Enabled

Run this check after all migrations:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should show `rowsecurity = TRUE`.

---

## Required Supabase Auth Settings

1. **Email → Magic Link**: Enabled
2. **Site URL**: `https://your-app.vercel.app`
3. **Redirect URLs**: `https://your-app.vercel.app/auth/callback`
4. **Email confirmations**: Disabled (magic link handles this)

---

## Verify Tables Exist

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables (minimum for beta):
- `properties`, `leads`, `agent_runs`, `trust_events`
- `subscriptions`, `subscription_tiers`
- `profiles`, `invites`, `audit_logs`
- `feature_flags`, `beta_feedback`

---

## Check Feature Flags

```sql
SELECT flag_key, enabled FROM feature_flags ORDER BY flag_key;
```

Default beta state:
- `PORTAL_DEALS` = TRUE
- `PORTAL_AGENT_LAB` = TRUE
- `AI_ENABLED` = TRUE
- `BILLING_ENABLED` = FALSE
- `SMS_ENABLED` = FALSE
