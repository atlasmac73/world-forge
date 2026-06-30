-- ============================================================
-- ATLAS v67 — Site Capture raw-asset storage
-- Private bucket for original photos/videos so they persist and can be
-- re-analyzed as the fusion engine improves. Server writes via the service
-- client (bypasses RLS); these policies are defense-in-depth for direct access.
-- Idempotent.
-- Isaac Brandon Burdette · Atlas Genesis Matrix LLC
-- ============================================================

insert into storage.buckets (id, name, public)
values ('site-captures', 'site-captures', false)
on conflict (id) do nothing;

drop policy if exists "Owner/admin read site-captures" on storage.objects;
create policy "Owner/admin read site-captures" on storage.objects
  for select using (
    bucket_id = 'site-captures' and exists (
      select 1 from public.profiles
      where user_id = (select auth.uid()) and role in ('owner','admin') and is_active = true
    )
  );

drop policy if exists "Owner/admin write site-captures" on storage.objects;
create policy "Owner/admin write site-captures" on storage.objects
  for all using (
    bucket_id = 'site-captures' and exists (
      select 1 from public.profiles
      where user_id = (select auth.uid()) and role in ('owner','admin') and is_active = true
    )
  ) with check (
    bucket_id = 'site-captures' and exists (
      select 1 from public.profiles
      where user_id = (select auth.uid()) and role in ('owner','admin') and is_active = true
    )
  );
