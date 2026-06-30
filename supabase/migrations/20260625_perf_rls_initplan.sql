-- ============================================================
-- ATLAS v67 — Performance: wrap auth.* calls in RLS policies (initplan)
--
-- Supabase advisor `auth_rls_initplan`: policies that call auth.uid()/auth.jwt()/
-- auth.role() directly re-evaluate the function once PER ROW. Wrapping them as
-- (select auth.uid()) lets Postgres evaluate once per statement (InitPlan).
-- This is BEHAVIOR-PRESERVING — the value is identical, only evaluation changes.
--
-- This DO block normalizes every public policy referencing those functions:
--   1. unwrap any existing ( SELECT auth.uid() [AS alias] ) back to auth.uid()
--   2. wrap all auth.uid()/jwt()/role() as (select auth.<fn>())
-- so it is idempotent (re-runs converge, never nest).
--
-- NOT touched here (deliberately, see ATLAS_BUILD_LOG 2026-06-25):
--   • unused_index drops — "unused" is a false signal at zero traffic; dropping
--     risks removing indexes real queries will need. Revisit with usage data.
--   • multiple_permissive_policies merges — changes access semantics; needs a
--     per-table review, not a blind sweep.
--   • unindexed_foreign_keys — additive but low-value at zero data and already
--     many unused indexes exist; revisit alongside the unused-index cleanup.
-- Isaac Brandon Burdette · Atlas Genesis Matrix LLC
-- ============================================================

do $$
declare r record; stmt text;
begin
  for r in
    select schemaname, tablename, policyname, qual, with_check,
      regexp_replace(regexp_replace(coalesce(qual,''),
        '\(\s*select\s+auth\.(uid|jwt|role)\(\)(\s+as\s+[a-z_]+)?\s*\)', 'auth.\1()', 'gi'),
        'auth\.(uid|jwt|role)\(\)', '(select auth.\1())', 'g') as nq,
      regexp_replace(regexp_replace(coalesce(with_check,''),
        '\(\s*select\s+auth\.(uid|jwt|role)\(\)(\s+as\s+[a-z_]+)?\s*\)', 'auth.\1()', 'gi'),
        'auth\.(uid|jwt|role)\(\)', '(select auth.\1())', 'g') as nc
    from pg_policies
    where schemaname = 'public'
      and (qual ~ 'auth\.(uid|jwt|role)\(\)' or with_check ~ 'auth\.(uid|jwt|role)\(\)')
  loop
    stmt := format('alter policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
    if r.qual is not null then stmt := stmt || ' using (' || r.nq || ')'; end if;
    if r.with_check is not null then stmt := stmt || ' with check (' || r.nc || ')'; end if;
    execute stmt;
  end loop;
end $$;
