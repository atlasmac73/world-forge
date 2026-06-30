-- ============================================================
-- ATLAS v67 — Performance: optimize RLS + FK indexes for the new tables
--
-- Scoped to the tables this work introduced (autopoietic core + tournament +
-- research). Two advisor classes addressed for these tables only:
--
--   • auth_rls_initplan: rewrite policy predicates to use (select auth.uid())
--     so auth.uid() is evaluated once per query, not per row. Same semantics.
--   • unindexed_foreign_keys: add covering indexes for FK columns.
--
-- The broader pre-existing perf backlog (other tables' initplan, multiple
-- permissive policies, 100+ unused indexes) is intentionally NOT touched here —
-- it's a separate, load-driven optimization pass.
-- Idempotent.
-- Isaac Brandon Burdette · Atlas Genesis Matrix LLC
-- ============================================================

-- ── RLS: (select auth.uid()) form ───────────────────────────────────────────
drop policy if exists "Owner/admin can manage system config" on public.system_config;
create policy "Owner/admin can manage system config" on public.system_config
  for all using (exists (select 1 from public.profiles
    where user_id = (select auth.uid()) and role in ('owner','admin') and is_active = true));

drop policy if exists "Owner/admin can manage blueprints" on public.build_blueprints;
create policy "Owner/admin can manage blueprints" on public.build_blueprints
  for all using (exists (select 1 from public.profiles
    where user_id = (select auth.uid()) and role in ('owner','admin') and is_active = true));

drop policy if exists "Owner/admin can manage selfbuild tasks" on public.selfbuild_tasks;
create policy "Owner/admin can manage selfbuild tasks" on public.selfbuild_tasks
  for all using (exists (select 1 from public.profiles
    where user_id = (select auth.uid()) and role in ('owner','admin') and is_active = true));

drop policy if exists "Authenticated users can read models" on public.model_registry;
create policy "Authenticated users can read models" on public.model_registry
  for select using ((select auth.uid()) is not null and active = true);

drop policy if exists "Owner/admin can manage models" on public.model_registry;
create policy "Owner/admin can manage models" on public.model_registry
  for all using (exists (select 1 from public.profiles
    where user_id = (select auth.uid()) and role in ('owner','admin') and is_active = true));

drop policy if exists "Owner/admin can manage sprints" on public.sprint_log;
create policy "Owner/admin can manage sprints" on public.sprint_log
  for all using (exists (select 1 from public.profiles
    where user_id = (select auth.uid()) and role in ('owner','admin') and is_active = true));

drop policy if exists "Owner/admin can manage tournaments" on public.tournaments;
create policy "Owner/admin can manage tournaments" on public.tournaments
  for all using (exists (select 1 from public.profiles
    where user_id = (select auth.uid()) and role in ('owner','admin') and is_active = true));

drop policy if exists "Owner/admin can manage tournament entries" on public.tournament_entries;
create policy "Owner/admin can manage tournament entries" on public.tournament_entries
  for all using (exists (select 1 from public.profiles
    where user_id = (select auth.uid()) and role in ('owner','admin') and is_active = true));

drop policy if exists "Owner/admin can manage notebooks" on public.research_notebooks;
create policy "Owner/admin can manage notebooks" on public.research_notebooks
  for all using (exists (select 1 from public.profiles
    where user_id = (select auth.uid()) and role in ('owner','admin') and is_active = true));

drop policy if exists "Owner/admin can manage research sources" on public.research_sources;
create policy "Owner/admin can manage research sources" on public.research_sources
  for all using (exists (select 1 from public.profiles
    where user_id = (select auth.uid()) and role in ('owner','admin') and is_active = true));

drop policy if exists "Owner/admin can manage research findings" on public.research_findings;
create policy "Owner/admin can manage research findings" on public.research_findings
  for all using (exists (select 1 from public.profiles
    where user_id = (select auth.uid()) and role in ('owner','admin') and is_active = true));

-- ── Covering indexes for foreign keys ───────────────────────────────────────
create index if not exists build_blueprints_cycle_id_idx     on public.build_blueprints (cycle_id);
create index if not exists build_blueprints_reviewed_by_idx  on public.build_blueprints (reviewed_by);
create index if not exists research_findings_created_by_idx  on public.research_findings (created_by);
create index if not exists research_findings_tournament_idx  on public.research_findings (tournament_id);
create index if not exists research_notebooks_owner_idx      on public.research_notebooks (owner_id);
create index if not exists selfbuild_tasks_approved_by_idx   on public.selfbuild_tasks (approved_by);
create index if not exists selfbuild_tasks_blueprint_idx     on public.selfbuild_tasks (blueprint_id);
create index if not exists system_config_updated_by_idx      on public.system_config (updated_by);
create index if not exists tournaments_blueprint_idx         on public.tournaments (blueprint_id);
create index if not exists tournaments_created_by_idx        on public.tournaments (created_by);
