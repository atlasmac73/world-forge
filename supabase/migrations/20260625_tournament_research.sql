-- ============================================================
-- ATLAS v67 — AI Tournament + Research Notebook Schema
-- Founder/admin-only research & evaluation system.
--
-- Adds:
--   tournaments         — a single bake-off run (model | agent | blueprint)
--   tournament_entries  — one competitor + its output + score per tournament
--   research_notebooks  — a NotebookLM-style grounded research workspace
--   research_sources    — curated source documents for a notebook
--   research_findings   — saved Q&A / tournament results inside a notebook
--
-- The tournament is the shared scoring engine: it ranks models (bake-off),
-- ATLAS agents, and Genesis blueprints (SIMULATE self-eval). The notebook
-- uses it to compare answers over a curated source set (no vector DB).
--
-- SAFETY: owner/admin only via RLS. No user-facing exposure. Idempotent.
-- Isaac Brandon Burdette · Atlas Genesis Matrix LLC
-- ============================================================

-- ═══ TOURNAMENTS ═══
create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  -- what is competing
  mode text not null default 'model'
    check (mode in ('model','agent','blueprint')),
  prompt text not null,
  -- optional grounding context (notebook sources, blueprint payload, etc.)
  context jsonb default '{}'::jsonb,
  -- scoring config: { judge_model, criteria[], use_voting }
  config jsonb default '{}'::jsonb,
  status text not null default 'PENDING'
    check (status in ('PENDING','RUNNING','COMPLETE','FAILED','CANCELLED')),
  -- denormalized winner for quick display
  winner_label text,
  winner_score numeric,
  -- judge rationale + per-criterion summary
  summary jsonb default '{}'::jsonb,
  error_log text,
  -- optional link back to a notebook (research console tie-in)
  notebook_id uuid,
  -- optional link to a Genesis blueprint (self-eval tie-in)
  blueprint_id uuid references public.build_blueprints(id) on delete set null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  completed_at timestamptz
);

create index if not exists tournaments_created_at_idx on public.tournaments (created_at desc);
create index if not exists tournaments_notebook_idx on public.tournaments (notebook_id);

alter table public.tournaments enable row level security;

drop policy if exists "Owner/admin can manage tournaments" on public.tournaments;
create policy "Owner/admin can manage tournaments" on public.tournaments
  for all using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid() and role in ('owner','admin') and is_active = true
    )
  );

-- ═══ TOURNAMENT ENTRIES (competitors) ═══
create table if not exists public.tournament_entries (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  -- competitor identity: a model id, an agent code, or a blueprint candidate id
  competitor_kind text not null default 'model'
    check (competitor_kind in ('model','agent','blueprint')),
  competitor_id text not null,
  competitor_label text not null,
  provider text,
  -- the produced answer/output
  output text,
  -- judge scoring
  score numeric,
  score_breakdown jsonb default '{}'::jsonb,
  votes integer default 0,
  rank integer,
  -- execution metadata
  latency_ms integer,
  input_tokens integer default 0,
  output_tokens integer default 0,
  cost_cents numeric default 0,
  status text not null default 'PENDING'
    check (status in ('PENDING','RUNNING','COMPLETE','FAILED','SKIPPED')),
  error text,
  created_at timestamptz default now()
);

create index if not exists tournament_entries_tournament_idx
  on public.tournament_entries (tournament_id);

alter table public.tournament_entries enable row level security;

drop policy if exists "Owner/admin can manage tournament entries" on public.tournament_entries;
create policy "Owner/admin can manage tournament entries" on public.tournament_entries
  for all using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid() and role in ('owner','admin') and is_active = true
    )
  );

-- ═══ RESEARCH NOTEBOOKS (NotebookLM-style) ═══
create table if not exists public.research_notebooks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  -- owner of the notebook (founder/admin); kept for per-user listing
  owner_id uuid references auth.users(id),
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE','ARCHIVED')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.research_notebooks enable row level security;

drop policy if exists "Owner/admin can manage notebooks" on public.research_notebooks;
create policy "Owner/admin can manage notebooks" on public.research_notebooks
  for all using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid() and role in ('owner','admin') and is_active = true
    )
  );

-- ═══ RESEARCH SOURCES (curated grounding set) ═══
create table if not exists public.research_sources (
  id uuid primary key default gen_random_uuid(),
  notebook_id uuid not null references public.research_notebooks(id) on delete cascade,
  title text not null,
  -- how the source was added
  source_type text not null default 'text'
    check (source_type in ('text','url','file','repo_doc','google_drive')),
  -- raw content used for grounding (truncated/curated, NOT web-scale RAG)
  content text,
  -- where it came from (url, drive file id, repo path)
  source_ref text,
  -- google drive integration metadata (gated; null until connector active)
  external_meta jsonb default '{}'::jsonb,
  token_estimate integer default 0,
  created_at timestamptz default now()
);

create index if not exists research_sources_notebook_idx
  on public.research_sources (notebook_id);

alter table public.research_sources enable row level security;

drop policy if exists "Owner/admin can manage research sources" on public.research_sources;
create policy "Owner/admin can manage research sources" on public.research_sources
  for all using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid() and role in ('owner','admin') and is_active = true
    )
  );

-- ═══ RESEARCH FINDINGS (saved Q&A / tournament outcomes) ═══
create table if not exists public.research_findings (
  id uuid primary key default gen_random_uuid(),
  notebook_id uuid not null references public.research_notebooks(id) on delete cascade,
  question text not null,
  answer text,
  -- which sources grounded the answer (array of research_sources ids)
  grounded_source_ids uuid[] default '{}',
  -- optional link to a tournament that produced this answer
  tournament_id uuid references public.tournaments(id) on delete set null,
  model_used text,
  pinned boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create index if not exists research_findings_notebook_idx
  on public.research_findings (notebook_id);

alter table public.research_findings enable row level security;

drop policy if exists "Owner/admin can manage research findings" on public.research_findings;
create policy "Owner/admin can manage research findings" on public.research_findings
  for all using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid() and role in ('owner','admin') and is_active = true
    )
  );
