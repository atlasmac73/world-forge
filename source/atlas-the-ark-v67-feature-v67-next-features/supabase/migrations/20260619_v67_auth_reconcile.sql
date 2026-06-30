-- ============================================================
-- ATLAS v67 — Auth/RBAC Reconciliation (live DB ↔ app model)
--
-- The live project (kjfwanpwzgcscgsdgekm) was a scaffold whose user model
-- diverged from the v67 app:
--   • public.profiles is a VIEW over public.users with no `user_id` column,
--     but the app (lib/permissions, route handlers) queries profiles.user_id.
--   • public.users.role CHECK only allowed user/admin/super_admin, but the
--     app's RBAC is owner/admin/beta_tester/contractor/viewer.
--   • public.users.id was a free uuid not linked to auth.users; no trigger
--     provisioned a row on signup, so requireAdmin() could never resolve a role.
--
-- This migration reconciles the DB to the app WITHOUT destroying data:
--   1. Widen users.role CHECK to include the app's RBAC roles (keep old ones).
--   2. Re-expose profiles with `id AS user_id` so profiles.user_id = auth.uid()
--      (makes both the app queries AND the repo's profiles-based RLS valid).
--   3. Add handle_new_user() trigger so every auth signup creates a users row
--      with id = auth.users.id; owner emails get role 'owner'.
--   4. Backfill any existing auth users (no-op while auth.users is empty).
--
-- MUST run before 20260620_autopoietic_schema.sql and 20260625_tournament_research.sql
-- (their RLS references profiles.user_id, added here).
-- Isaac Brandon Burdette · Atlas Genesis Matrix LLC
-- ============================================================

-- 1. Widen the role CHECK to the app's RBAC hierarchy (additive, non-destructive).
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check
  check (role = any (array['user','viewer','contractor','beta_tester','admin','super_admin','owner']));

-- 2. Re-expose profiles with user_id (appended last — CREATE OR REPLACE safe).
create or replace view public.profiles as
  select
    id,
    email,
    full_name,
    role,
    tier as plan,
    is_active,
    metadata,
    created_at,
    updated_at,
    id as user_id
  from public.users;

-- 3. Auto-provision a public.users row for each new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    case
      when new.email in ('atlasmac73@gmail.com','slisaac89@gmail.com') then 'owner'
      else 'user'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Backfill existing auth users (idempotent; no-op while auth.users is empty).
insert into public.users (id, email, role)
select
  a.id,
  a.email,
  case when a.email in ('atlasmac73@gmail.com','slisaac89@gmail.com') then 'owner' else 'user' end
from auth.users a
on conflict (id) do nothing;
