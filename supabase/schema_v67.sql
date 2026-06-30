-- ═══════════════════════════════════════════════════════════════════
-- ATLAS v67 — MIGRATION: KILL SWITCH + BLUEPRINT TABLES
-- Run after existing schema files
--
-- SUPERSEDED: this file's content (plus the genesis_cycles columns
-- runHeartbeatTick() needs, which this file never added) now lives in
-- supabase/migrations/20260620_autopoietic_schema.sql — run that
-- instead. Kept here for history; safe to run either (idempotent),
-- but the migration is the one that's actually complete.
-- ═══════════════════════════════════════════════════════════════════

-- ═══ SYSTEM CONFIG (kill switch lives here) ═══
create table if not exists public.system_config (
  key text primary key,
  value jsonb not null default 'null'::jsonb,
  description text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz default now()
);

-- Seed kill switch default (OFF = safe)
insert into public.system_config (key, value, description)
values ('kill_switch', 'false'::jsonb, 'Emergency stop: when true, all /api/agents/* routes return 503')
on conflict (key) do nothing;

-- Seed AI enabled default
insert into public.system_config (key, value, description)
values ('ai_enabled', 'true'::jsonb, 'Master AI execution flag')
on conflict (key) do nothing;

-- RLS: only owner/admin can read or write system_config
alter table public.system_config enable row level security;

drop policy if exists "Owner/admin can manage system config" on public.system_config;
create policy "Owner/admin can manage system config" on public.system_config
  for all using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid() and role in ('owner', 'admin') and is_active = true
    )
  );

-- ═══ BUILD BLUEPRINTS (Genesis Cycle output → human approval queue) ═══
create table if not exists public.build_blueprints (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid,  -- references genesis_cycles if table exists
  title text not null,
  description text,
  proposed_by text default 'A03-GENESIS',
  status text not null default 'PROPOSED'
    check (status in ('PROPOSED','UNDER_REVIEW','APPROVED','REJECTED','IN_PROGRESS','TESTED','READY_FOR_PR','DEPLOYED','FAILED')),
  blueprint_type text
    check (blueprint_type in ('code_change','config_change','schema_change','agent_update','portal_add','skill_add','bug_fix','performance','security')),
  diff_content jsonb,
  simulation_result jsonb,
  confidence_score integer check (confidence_score between 0 and 100),
  risk_level text check (risk_level in ('LOW','MEDIUM','HIGH','CRITICAL')),
  review_notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  deployed_at timestamptz,
  github_pr_url text,
  created_at timestamptz default now()
);

alter table public.build_blueprints enable row level security;

drop policy if exists "Owner/admin can manage blueprints" on public.build_blueprints;
create policy "Owner/admin can manage blueprints" on public.build_blueprints
  for all using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid() and role in ('owner', 'admin') and is_active = true
    )
  );

-- ═══ SELFBUILD TASKS (agent task queue for self-build operations) ═══
create table if not exists public.selfbuild_tasks (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid references public.build_blueprints(id) on delete cascade,
  agent_code text not null,
  task_type text not null
    check (task_type in ('generate_code','run_tests','create_pr','validate_schema','update_agent','security_review','human_review','deploy')),
  status text not null default 'QUEUED'
    check (status in ('QUEUED','RUNNING','COMPLETE','FAILED','BLOCKED','CANCELLED')),
  input_data jsonb,
  output_data jsonb,
  requires_human_approval boolean default false,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  rejection_reason text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

alter table public.selfbuild_tasks enable row level security;

drop policy if exists "Owner/admin can manage selfbuild tasks" on public.selfbuild_tasks;
create policy "Owner/admin can manage selfbuild tasks" on public.selfbuild_tasks
  for all using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid() and role in ('owner', 'admin') and is_active = true
    )
  );

-- ═══ MODEL REGISTRY ═══
create table if not exists public.model_registry (
  id text primary key,
  display_name text not null,
  provider text not null,
  speed integer check (speed between 1 and 10),
  quality integer check (quality between 1 and 10),
  creativity integer check (creativity between 1 and 10),
  cost_tier text check (cost_tier in ('free','$','$$','$$$','$$$$')),
  context_window integer,
  strengths text[] default '{}',
  auto_weight jsonb default '{}'::jsonb,
  tier_min integer default 1,
  is_local boolean default false,
  active boolean default true,
  created_at timestamptz default now()
);

alter table public.model_registry enable row level security;

drop policy if exists "Authenticated users can read models" on public.model_registry;
create policy "Authenticated users can read models" on public.model_registry
  for select using (auth.uid() is not null and active = true);

drop policy if exists "Owner/admin can manage models" on public.model_registry;
create policy "Owner/admin can manage models" on public.model_registry
  for all using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid() and role in ('owner', 'admin') and is_active = true
    )
  );

-- ═══ SPRINT LOG ═══
create table if not exists public.sprint_log (
  id uuid primary key default gen_random_uuid(),
  sprint_number integer not null unique,
  name text not null,
  status text default 'PENDING'
    check (status in ('PENDING','IN_PROGRESS','COMPLETE','BLOCKED','CANCELLED')),
  completion_pct integer default 0 check (completion_pct between 0 and 100),
  target_date date,
  completed_at timestamptz,
  tasks_total integer default 0,
  tasks_done integer default 0,
  owner_tasks integer default 0,
  ai_tasks integer default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.sprint_log enable row level security;

drop policy if exists "Owner/admin can manage sprints" on public.sprint_log;
create policy "Owner/admin can manage sprints" on public.sprint_log
  for all using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid() and role in ('owner', 'admin') and is_active = true
    )
  );

-- SEED: 25 AI models
insert into public.model_registry (id, display_name, provider, speed, quality, creativity, cost_tier, context_window, strengths, tier_min) values
('claude-opus-4-6',       'Claude Opus 4.6',        'Anthropic', 5, 10, 9, '$$$$', 200000, array['reasoning','analysis','code'], 5),
('claude-sonnet-4-6',     'Claude Sonnet 4.6',      'Anthropic', 8, 9,  8, '$$$',  200000, array['balanced','fast','creative'],    2),
('claude-haiku-4-5',      'Claude Haiku 4.5',       'Anthropic', 10,7,  6, '$',    200000, array['speed','cost','chat'],            1),
('gemini-2-5-pro',        'Gemini 2.5 Pro',         'Google',    7, 9,  8, '$$$',  1000000,array['multimodal','research','long-context'], 3),
('gemini-2-5-flash',      'Gemini 2.5 Flash',       'Google',    10,7,  6, '$',    1000000,array['speed','vision','multimodal'],   1),
('gpt-4o',                'GPT-4o',                 'OpenAI',    7, 9,  9, '$$$',  128000, array['creative','vision','coding'],     3),
('gpt-4o-mini',           'GPT-4o mini',            'OpenAI',    10,7,  7, '$',    128000, array['speed','cost','structured'],      1),
('o4-mini',               'o4-mini',                'OpenAI',    6, 10, 7, '$$',   128000, array['reasoning','math','code'],        4),
('grok-3',                'Grok 3',                 'xAI',       7, 8,  9, '$$$',  131072, array['realtime','creative','humor'],    4),
('deepseek-r2',           'DeepSeek R2',            'DeepSeek',  5, 10, 7, '$$',   64000,  array['reasoning','math','code'],        3),
('deepseek-v3',           'DeepSeek V3',            'DeepSeek',  8, 8,  7, '$',    64000,  array['fast','cost','code'],             1),
('llama-4-scout',         'Llama 4 Scout',          'Meta',      9, 7,  6, '$',    10000,  array['local','fast','privacy'],         1),
('llama-4-maverick',      'Llama 4 Maverick',       'Meta',      7, 9,  8, '$$',   128000, array['reasoning','creative','local'],   3),
('kimi-k2',               'Kimi K2',                'Moonshot',  7, 9,  8, '$$',   128000, array['reasoning','multilingual','code'],4),
('command-r-plus',        'Command R+',             'Cohere',    7, 8,  7, '$$',   128000, array['rag','retrieval','grounding'],    3),
('mistral-large',         'Mistral Large',          'Mistral',   8, 8,  7, '$$',   128000, array['european','multilingual','code'], 2),
('qwen-2-5-72b',          'Qwen 2.5 72B',           'Alibaba',   7, 9,  7, '$$',   128000, array['multilingual','code','analysis'], 3),
('perplexity-sonar',      'Perplexity Sonar',       'Perplexity',9, 7,  5, '$$',   128000, array['search','realtime','citations'],  2),
('llama-3-1-405b',        'Llama 3.1 405B',         'Meta',      4, 10, 8, '$$$',  128000, array['flagship','reasoning','creative'],5),
('mixtral-8x22b',         'Mixtral 8x22B MoE',      'Mistral',   7, 8,  7, '$$',   65000,  array['moe','cost-effective','multilingual'],3),
('phi-4',                 'Phi-4',                  'Microsoft', 9, 8,  6, '$',    16000,  array['small','efficient','coding'],     1),
('ollama-llama3',         'Ollama Llama3 (Local)',   'Ollama',    8, 7,  6, 'free', 8000,   array['local','privacy','offline'],      1),
('ollama-mistral',        'Ollama Mistral (Local)',  'Ollama',    9, 6,  5, 'free', 32000,  array['local','fast','offline'],         1),
('ollama-codellama',      'Ollama CodeLlama (Local)','Ollama',    8, 7,  5, 'free', 16000,  array['local','coding','offline'],       1),
('atlas-ensemble',        'ATLAS Ensemble (Vote)',   'ATLAS',     4, 10, 9, '$$$',  128000, array['consensus','reliability','high-stakes'], 6)
on conflict (id) do nothing;

-- SEED: v67 sprint log
insert into public.sprint_log (sprint_number, name, status, completion_pct, tasks_total, ai_tasks, owner_tasks, notes) values
(1, 'Foundation Merge + Kill Switch',     'IN_PROGRESS', 60,  8, 6, 2, 'Kill switch live. Schema merged. Branch: v67-autopoietic-fusion'),
(2, 'Portal 15 SuperLLM',                 'IN_PROGRESS', 40, 10, 8, 2, 'SuperLLM component wired. Chat mode + Genesis mode live'),
(3, 'Model Router + Agent Factory UI',    'PENDING',     0,   9, 7, 2, 'Model scoring engine, RadialWheel, sector nav'),
(4, 'Self-Build Engine + Blueprint Queue','PENDING',     0,  12, 9, 3, 'Blueprint queue in Command Center. 15-min cron. Human approval gate'),
(5, 'Stripe Billing + Access Control',    'PENDING',     0,   8, 5, 3, 'Requires Isaac to create Stripe products first'),
(6, 'Command Center + Observability',     'PENDING',     0,  10, 8, 2, 'All 11 tabs. Sentry. Vercel Analytics'),
(7, 'Skip Trace + AIN Heatmap',          'PENDING',     0,   8, 6, 2, 'Requires BatchSkipTracing + Mapbox API keys'),
(8, 'PWA + Connectors + SMS',            'PENDING',     0,  10, 7, 3, 'Requires A2P 10DLC approval (2-4 weeks)')
on conflict (sprint_number) do update set
  name = excluded.name,
  status = excluded.status,
  completion_pct = excluded.completion_pct,
  tasks_total = excluded.tasks_total,
  ai_tasks = excluded.ai_tasks,
  owner_tasks = excluded.owner_tasks,
  notes = excluded.notes,
  updated_at = now();

select 'v67 schema migration complete' as status;
select 'system_config rows: ' || count(*)::text from public.system_config;
select 'model_registry rows: ' || count(*)::text from public.model_registry;
