-- ============================================================
-- ATLAS v67 — Security Hardening: close always-true RLS holes + profiles view
--
-- Supabase advisor flagged 7 RLS policies scoped TO public with always-true
-- predicates (anon + authenticated bypass), and 1 ERROR: public.profiles is a
-- SECURITY DEFINER view. This migration closes them WITHOUT breaking app flows
-- (verified each access path against the route handlers):
--
--   • 4 INSERT policies (agent_approvals/agent_runs/agent_tasks/audit_logs):
--     public → authenticated. Blocks ANONYMOUS forging of these rows. App
--     inserts come from authenticated user-context routes or the service client
--     (Stripe/Twilio webhooks), both unaffected. (Per-row ownership tightening
--     is a follow-up that needs route-by-route user_id verification.)
--
--   • 3 ALL policies (franchise_records/invites/webhook_events):
--     public → service_role. These tables are only ever touched via the service
--     client (invite validate + admin invite + webhook handlers), so this fully
--     removes public read/write/delete (invite tokens, webhook payloads, etc.).
--
--   • public.profiles: security_invoker = on. The view now runs with the
--     caller's privileges, so users.RLS applies (own_user_row: auth.uid()=id;
--     god_admin_users: is_god_admin()). Service-role reads still bypass.
--
-- Idempotent: ALTER POLICY / ALTER VIEW are safe to re-run.
-- Isaac Brandon Burdette · Atlas Genesis Matrix LLC
-- ============================================================

-- 1. INSERT policies: public → authenticated (block anonymous forging)
alter policy agent_approvals_service_insert on public.agent_approvals to authenticated;
alter policy agent_runs_service             on public.agent_runs       to authenticated;
alter policy agent_tasks_service_insert     on public.agent_tasks      to authenticated;
alter policy audit_logs_service_insert      on public.audit_logs       to authenticated;

-- 2. ALL policies: public → service_role (full lockdown; app uses service client)
alter policy admin_franchise_records on public.franchise_records to service_role;
alter policy invites_service_all     on public.invites           to service_role;
alter policy service_webhook_events  on public.webhook_events     to service_role;

-- 3. profiles view: stop running as definer (advisor ERROR security_definer_view)
alter view public.profiles set (security_invoker = on);
