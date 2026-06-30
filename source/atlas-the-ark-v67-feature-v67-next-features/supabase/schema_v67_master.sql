-- ═══════════════════════════════════════════════════════════════════════════
-- ATLAS v67 MASTER MERGE MIGRATION
-- Run AFTER all previous schema files.
-- Adds: org/multi-tenant foundation, AIN/counties, scoring, pipeline expansion,
--       agent artifacts, docs/comms, usage metering, launch checklist, integrations.
-- Isaac Brandon Burdette · Atlas Genesis Matrix LLC
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══ MULTI-TENANT FOUNDATION ════════════════════════════════════════════════

-- Organizations
create table if not exists public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  owner_id      uuid not null references auth.users(id),
  plan_code     text not null default 'T1'
                  check (plan_code in ('T1','T2','T3','T4','T5','T6','T7')),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.organizations enable row level security;
create policy "Org members can view their org" on public.organizations
  for select using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid() and org_id = organizations.id and is_active = true
    ) or owner_id = auth.uid()
  );
create policy "Owner can manage org" on public.organizations
  for all using (owner_id = auth.uid());

-- Org Members (role-aware)
create table if not exists public.org_members (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'member'
               check (role in ('owner','admin','analyst','contractor','viewer')),
  is_active  boolean not null default true,
  invited_by uuid references auth.users(id),
  joined_at  timestamptz not null default now(),
  unique (org_id, user_id)
);

alter table public.org_members enable row level security;
create policy "Members can view their org membership" on public.org_members
  for select using (user_id = auth.uid());
create policy "Admins can manage members" on public.org_members
  for all using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid() and role in ('owner','admin') and is_active = true
    )
  );

-- Role Permissions
create table if not exists public.role_permissions (
  id         uuid primary key default gen_random_uuid(),
  role       text not null,
  resource   text not null,
  action     text not null,
  granted    boolean not null default true,
  created_at timestamptz not null default now(),
  unique (role, resource, action)
);

alter table public.role_permissions enable row level security;
create policy "Authenticated can read role permissions" on public.role_permissions
  for select using (auth.uid() is not null);

-- Seed default permissions
insert into public.role_permissions (role, resource, action) values
('owner',      'all',          'all'),
('admin',      'properties',   'all'),
('admin',      'leads',        'all'),
('admin',      'deals',        'all'),
('admin',      'agents',       'all'),
('admin',      'scoring',      'all'),
('admin',      'ain',          'all'),
('analyst',    'properties',   'read'),
('analyst',    'leads',        'read'),
('analyst',    'scoring',      'read'),
('analyst',    'ain',          'read'),
('contractor', 'jobs',         'all'),
('viewer',     'dashboard',    'read')
on conflict (role, resource, action) do nothing;

-- ═══ WV COUNTY INTELLIGENCE (AIN) ═══════════════════════════════════════════

-- 55 WV Counties master table
create table if not exists public.counties (
  id                uuid primary key default gen_random_uuid(),
  state             text not null default 'WV',
  name              text not null,
  fips              text unique,
  seat              text,
  population        integer,
  sq_miles          numeric(10,2),
  region            text check (region in ('northern','eastern','southern','western','central')),
  is_default        boolean default false,
  created_at        timestamptz not null default now(),
  unique (state, name)
);

alter table public.counties enable row level security;
create policy "Authenticated can read counties" on public.counties
  for select using (auth.uid() is not null);

-- County AIN Scores (distress heat map data)
create table if not exists public.ain_county_scores (
  id                  uuid primary key default gen_random_uuid(),
  county_id           uuid not null references public.counties(id) on delete cascade,
  score               integer not null default 0 check (score between 0 and 100),
  grade               text check (grade in ('CRITICAL','HOT','WARM','COOL','COLD')),
  tax_delinquent_pct  numeric(5,2) default 0,
  vacancy_pct         numeric(5,2) default 0,
  foreclosure_rate    numeric(5,2) default 0,
  median_dom          integer default 0,
  median_price        integer,
  distressed_listings integer default 0,
  total_listings      integer default 0,
  data_source         text default 'DEMO',
  data_freshness      text default 'demo',
  is_demo             boolean not null default true,
  scored_at           timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

alter table public.ain_county_scores enable row level security;
create policy "Authenticated can read county scores" on public.ain_county_scores
  for select using (auth.uid() is not null);
create policy "Admin can manage county scores" on public.ain_county_scores
  for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role in ('owner','admin') and is_active = true)
  );

-- ═══ DISTRESS SCORING ════════════════════════════════════════════════════════

-- Individual distress signals per property
create table if not exists public.distress_signals (
  id              uuid primary key default gen_random_uuid(),
  property_id     uuid not null references public.properties(id) on delete cascade,
  signal_type     text not null check (signal_type in (
    'tax_delinquent','vacancy','foreclosure','equity_deficit',
    'days_on_market','owner_distress','court_activity','market_velocity'
  )),
  weight          integer not null default 10,
  value           numeric,
  flag            boolean not null default false,
  detail          text,
  source          text default 'computed',
  created_at      timestamptz not null default now()
);

alter table public.distress_signals enable row level security;
create policy "Users can view their property signals" on public.distress_signals
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = distress_signals.property_id
      and p.user_id = auth.uid()
    )
  );

-- Property distress score results
create table if not exists public.property_distress_scores (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references public.properties(id) on delete cascade,
  user_id       uuid not null references auth.users(id),
  score         integer not null check (score between 0 and 100),
  grade         text not null check (grade in ('CRITICAL','HOT','WARM','COOL','COLD','UNKNOWN')),
  signals_fired integer not null default 0,
  signals_total integer not null default 8,
  mao           numeric(12,2),
  arv           numeric(12,2),
  repair_cost   numeric(12,2),
  equity_pct    numeric(5,2),
  raw_signals   jsonb default '{}',
  scored_at     timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

alter table public.property_distress_scores enable row level security;
create policy "Users can view their scores" on public.property_distress_scores
  for select using (user_id = auth.uid());
create policy "Users can create their scores" on public.property_distress_scores
  for insert with check (user_id = auth.uid());

-- Score run audit trail
create table if not exists public.score_runs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id),
  run_type     text not null check (run_type in ('single','batch','scheduled','top250')),
  properties_scored integer not null default 0,
  duration_ms  integer,
  model_used   text,
  triggered_by text default 'user',
  created_at   timestamptz not null default now()
);

alter table public.score_runs enable row level security;
create policy "Users can view their score runs" on public.score_runs
  for select using (user_id = auth.uid());

-- ═══ TOP 250 MATRIX ══════════════════════════════════════════════════════════

create table if not exists public.top250_snapshots (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id),
  snapshot_at timestamptz not null default now(),
  entries     jsonb not null default '[]',
  entry_count integer not null default 0,
  top_score   integer,
  avg_score   numeric(5,2),
  created_at  timestamptz not null default now()
);

alter table public.top250_snapshots enable row level security;
create policy "Users can view their top250 snapshots" on public.top250_snapshots
  for select using (user_id = auth.uid());
create policy "Users can create top250 snapshots" on public.top250_snapshots
  for insert with check (user_id = auth.uid());

-- ═══ DRIVING FOR DOLLARS ═════════════════════════════════════════════════════

create table if not exists public.d4d_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id),
  name        text not null default 'D4D Session',
  county      text,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  pins_count  integer not null default 0,
  route_miles numeric(8,2),
  created_at  timestamptz not null default now()
);

alter table public.d4d_sessions enable row level security;
create policy "Users can manage their d4d sessions" on public.d4d_sessions
  for all using (user_id = auth.uid());

create table if not exists public.d4d_pins (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.d4d_sessions(id) on delete cascade,
  user_id     uuid not null references auth.users(id),
  property_id uuid references public.properties(id),
  latitude    numeric(10,7) not null,
  longitude   numeric(10,7) not null,
  address     text,
  note        text,
  photo_url   text,
  status      text not null default 'new' check (status in ('new','researching','hot','skip','contacted')),
  pinned_at   timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

alter table public.d4d_pins enable row level security;
create policy "Users can manage their d4d pins" on public.d4d_pins
  for all using (user_id = auth.uid());

-- ═══ PIPELINE EXPANSION ══════════════════════════════════════════════════════

-- Configurable pipeline stages
create table if not exists public.pipeline_stages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id),
  name        text not null,
  color       text default '#63b3ed',
  position    integer not null default 0,
  is_default  boolean default false,
  is_terminal boolean default false,
  stage_type  text check (stage_type in ('lead','negotiation','contract','closed','dead')),
  created_at  timestamptz not null default now()
);

alter table public.pipeline_stages enable row level security;
create policy "Users can manage their pipeline stages" on public.pipeline_stages
  for all using (user_id = auth.uid());

-- Insert default stages for all users via function
create or replace function public.create_default_pipeline_stages(p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  insert into public.pipeline_stages (user_id, name, color, position, is_default, stage_type) values
    (p_user_id, 'New Lead',         '#718096', 0, true, 'lead'),
    (p_user_id, 'Research',         '#63b3ed', 1, true, 'lead'),
    (p_user_id, 'Contacted',        '#4fd1c5', 2, true, 'lead'),
    (p_user_id, 'Negotiating',      '#f6ad55', 3, true, 'negotiation'),
    (p_user_id, 'Under Contract',   '#68d391', 4, true, 'contract'),
    (p_user_id, 'Closed / Won',     '#9f7aea', 5, true, 'closed'),
    (p_user_id, 'Dead / Passed',    '#fc8181', 6, true, 'dead')
  on conflict do nothing;
end;
$$;

-- Pipeline events / history
create table if not exists public.pipeline_events (
  id         uuid primary key default gen_random_uuid(),
  deal_id    uuid not null references public.deals(id) on delete cascade,
  user_id    uuid not null references auth.users(id),
  from_stage text,
  to_stage   text,
  event_type text not null check (event_type in ('created','moved','updated','note','won','lost')),
  note       text,
  created_at timestamptz not null default now()
);

alter table public.pipeline_events enable row level security;
create policy "Users can view their pipeline events" on public.pipeline_events
  for select using (user_id = auth.uid());
create policy "Users can create pipeline events" on public.pipeline_events
  for insert with check (user_id = auth.uid());

-- Deal tasks
create table if not exists public.deal_tasks (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references public.deals(id) on delete cascade,
  user_id     uuid not null references auth.users(id),
  title       text not null,
  description text,
  due_date    date,
  priority    text check (priority in ('low','medium','high','urgent')),
  status      text not null default 'open' check (status in ('open','in_progress','done','cancelled')),
  assigned_to uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.deal_tasks enable row level security;
create policy "Users can manage their deal tasks" on public.deal_tasks
  for all using (user_id = auth.uid());

-- Deal artifacts (saved outputs)
create table if not exists public.deal_artifacts (
  id           uuid primary key default gen_random_uuid(),
  deal_id      uuid not null references public.deals(id) on delete cascade,
  user_id      uuid not null references auth.users(id),
  artifact_type text not null check (artifact_type in ('loi','rehab_estimate','underwriting','dossier','skip_trace','outreach','contract','note')),
  title        text not null,
  content      text,
  content_json jsonb,
  model_used   text,
  agent_run_id uuid,
  created_at   timestamptz not null default now()
);

alter table public.deal_artifacts enable row level security;
create policy "Users can manage their deal artifacts" on public.deal_artifacts
  for all using (user_id = auth.uid());

-- ═══ AI/AGENT EXPANSION ══════════════════════════════════════════════════════

-- Agent run steps (sub-steps within a run)
create table if not exists public.agent_run_steps (
  id          uuid primary key default gen_random_uuid(),
  run_id      uuid not null references public.agent_runs(id) on delete cascade,
  step_number integer not null default 1,
  agent_code  text not null,
  agent_name  text,
  step_type   text check (step_type in ('investigate','underwrite','copywrite','orchestrate','score','extract','draft')),
  status      text not null default 'pending' check (status in ('pending','running','done','failed')),
  input_json  jsonb,
  output_text text,
  output_json jsonb,
  tokens_in   integer,
  tokens_out  integer,
  duration_ms integer,
  started_at  timestamptz,
  finished_at timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.agent_run_steps enable row level security;
create policy "Users can view their agent run steps" on public.agent_run_steps
  for select using (
    exists (
      select 1 from public.agent_runs ar
      where ar.id = agent_run_steps.run_id and ar.user_id = auth.uid()
    )
  );

-- Agent artifacts
create table if not exists public.agent_artifacts (
  id              uuid primary key default gen_random_uuid(),
  run_id          uuid references public.agent_runs(id),
  user_id         uuid not null references auth.users(id),
  property_id     uuid references public.properties(id),
  deal_id         uuid references public.deals(id),
  artifact_type   text not null,
  title           text not null,
  content         text,
  content_json    jsonb,
  model_used      text,
  quality_score   integer check (quality_score between 0 and 100),
  was_used        boolean default false,
  created_at      timestamptz not null default now()
);

alter table public.agent_artifacts enable row level security;
create policy "Users can manage their agent artifacts" on public.agent_artifacts
  for all using (user_id = auth.uid());

-- Agent feedback
create table if not exists public.agent_feedback (
  id          uuid primary key default gen_random_uuid(),
  run_id      uuid references public.agent_runs(id),
  artifact_id uuid references public.agent_artifacts(id),
  user_id     uuid not null references auth.users(id),
  rating      integer check (rating between 1 and 5),
  feedback    text,
  tags        text[] default '{}',
  created_at  timestamptz not null default now()
);

alter table public.agent_feedback enable row level security;
create policy "Users can manage their feedback" on public.agent_feedback
  for all using (user_id = auth.uid());

-- ═══ DOCUMENTS / COMMS ═══════════════════════════════════════════════════════

-- Document templates
create table if not exists public.document_templates (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  template_type text not null check (template_type in ('loi','rehab_estimate','underwriting','outreach','follow_up','contract')),
  content      text not null,
  variables    text[] default '{}',
  is_system    boolean not null default false,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.document_templates enable row level security;
create policy "Authenticated can read templates" on public.document_templates
  for select using (auth.uid() is not null);
create policy "Admin can manage templates" on public.document_templates
  for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role in ('owner','admin') and is_active = true)
  );

-- Generated documents
create table if not exists public.documents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id),
  template_id     uuid references public.document_templates(id),
  property_id     uuid references public.properties(id),
  deal_id         uuid references public.deals(id),
  document_type   text not null,
  title           text not null,
  content         text,
  status          text not null default 'draft' check (status in ('draft','review','final','sent','archived')),
  sent_at         timestamptz,
  recipient_email text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.documents enable row level security;
create policy "Users can manage their documents" on public.documents
  for all using (user_id = auth.uid());

-- TCPA Suppression list (required before any SMS)
create table if not exists public.suppression_list (
  id           uuid primary key default gen_random_uuid(),
  phone        text not null unique,
  email        text,
  reason       text not null check (reason in ('stop','opt_out','bounce','complaint','manual','dnc')),
  source       text not null default 'manual',
  added_by     uuid references auth.users(id),
  created_at   timestamptz not null default now()
);

alter table public.suppression_list enable row level security;
create policy "Admin can manage suppression list" on public.suppression_list
  for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role in ('owner','admin') and is_active = true)
  );

-- ═══ USAGE METERING ══════════════════════════════════════════════════════════

create table if not exists public.usage_events (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id),
  org_id         uuid references public.organizations(id),
  event_type     text not null,
  resource_type  text,
  resource_id    uuid,
  credits_used   integer not null default 1,
  model_used     text,
  tokens_in      integer,
  tokens_out     integer,
  cost_cents      integer,
  metadata       jsonb default '{}',
  created_at     timestamptz not null default now()
);

alter table public.usage_events enable row level security;
create policy "Users can view their usage" on public.usage_events
  for select using (user_id = auth.uid());
create policy "System can insert usage" on public.usage_events
  for insert with check (auth.uid() is not null);

-- ═══ INTEGRATIONS STATUS ═════════════════════════════════════════════════════

create table if not exists public.integration_status (
  id             uuid primary key default gen_random_uuid(),
  integration_id text not null unique,
  name           text not null,
  category       text not null,
  status         text not null default 'not_configured'
                   check (status in ('connected','degraded','not_configured','error','pending')),
  last_check_at  timestamptz,
  last_error     text,
  config_keys    text[] default '{}',
  detail         text,
  updated_at     timestamptz not null default now()
);

alter table public.integration_status enable row level security;
create policy "Admin can manage integrations" on public.integration_status
  for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role in ('owner','admin') and is_active = true)
  );

-- Seed integration status rows
insert into public.integration_status (integration_id, name, category, status, config_keys) values
('supabase',         'Supabase Database',         'Infrastructure', 'connected',      array['NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY']),
('anthropic',        'Anthropic Claude AI',        'AI',             'connected',      array['ANTHROPIC_API_KEY']),
('stripe',           'Stripe Billing',             'Billing',        'not_configured', array['STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET']),
('twilio',           'Twilio SMS/Voice',           'Comms',          'not_configured', array['TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN','TWILIO_PHONE_NUMBER']),
('mapbox',           'Mapbox Maps (AIN/D4D)',      'Maps',           'not_configured', array['NEXT_PUBLIC_MAPBOX_TOKEN']),
('batch_skip_trace', 'BatchSkipTracing',           'Data',           'not_configured', array['BATCH_SKIP_TRACE_KEY']),
('sentry',           'Sentry Error Tracking',      'Observability',  'not_configured', array['SENTRY_DSN']),
('resend',           'Resend Email',               'Comms',          'not_configured', array['RESEND_API_KEY']),
('vercel',           'Vercel Deployment',          'Infrastructure', 'connected',      array['VERCEL_URL'])
on conflict (integration_id) do nothing;

-- ═══ LAUNCH CHECKLIST ════════════════════════════════════════════════════════

create table if not exists public.launch_checklist_items (
  id            uuid primary key default gen_random_uuid(),
  check_id      text not null unique,
  category      text not null,
  label         text not null,
  detail        text,
  status        text not null default 'pending'
                  check (status in ('pass','fail','pending','warning','skipped')),
  required      boolean not null default true,
  auto_checked  boolean not null default false,
  docs_url      text,
  last_checked  timestamptz,
  updated_at    timestamptz not null default now()
);

alter table public.launch_checklist_items enable row level security;
create policy "Admin can manage launch checklist" on public.launch_checklist_items
  for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role in ('owner','admin') and is_active = true)
  );

-- Seed launch checklist
insert into public.launch_checklist_items (check_id, category, label, required, auto_checked) values
('supabase_connected',   'Infrastructure', 'Supabase connected',               true,  true),
('rls_enabled',          'Infrastructure', 'RLS enabled on all tenant tables',  true,  true),
('auth_configured',      'Infrastructure', 'Auth magic link configured',        true,  true),
('anthropic_key',        'AI',             'Anthropic API key set',             true,  true),
('kill_switch_wired',    'Safety',         'Kill switch operational',           true,  true),
('invite_only',          'Security',       'Invite-only mode enforced',         true,  true),
('no_browser_secrets',   'Security',       'No secrets exposed in browser',     true,  true),
('stripe_configured',    'Billing',        'Stripe configured',                 true,  true),
('stripe_webhook',       'Billing',        'Stripe webhook verified',           true,  true),
('build_passes',         'Build',          'npm run build passes',              true,  false),
('typecheck_passes',     'Build',          'TypeScript: 0 errors',              true,  false),
('lint_passes',          'Build',          'ESLint: 0 errors',                  true,  false),
('privacy_page',         'Legal',          'Privacy policy page live',          true,  false),
('terms_page',           'Legal',          'Terms of service page live',        true,  false),
('attribution_corrected','Legal',          'IP attribution corrected',          true,  false),
('mapbox_token',         'Integrations',   'Mapbox token (AIN map)',            false, true),
('skip_trace_key',       'Integrations',   'BatchSkipTracing API key',          false, true),
('twilio_a2p',           'Integrations',   'Twilio A2P 10DLC approved',         false, true),
('sentry_dsn',           'Observability',  'Sentry error tracking',             false, true),
('first_tester',         'Beta',           'First tester invited + confirmed',  false, false)
on conflict (check_id) do nothing;

-- ═══ SEED: 55 WV COUNTIES ════════════════════════════════════════════════════

insert into public.counties (state, name, fips, seat, region, is_default) values
('WV','Barbour','54001','Philippi','northern',false),
('WV','Berkeley','54003','Martinsburg','eastern',false),
('WV','Boone','54005','Madison','southern',false),
('WV','Braxton','54007','Sutton','central',false),
('WV','Brooke','54009','Wellsburg','northern',false),
('WV','Cabell','54011','Huntington','western',false),
('WV','Calhoun','54013','Grantsville','western',false),
('WV','Clay','54015','Clay','central',false),
('WV','Doddridge','54017','West Union','northern',false),
('WV','Fayette','54019','Fayetteville','southern',false),
('WV','Gilmer','54021','Glenville','central',false),
('WV','Grant','54023','Petersburg','eastern',false),
('WV','Greenbrier','54025','Lewisburg','southern',false),
('WV','Hampshire','54027','Romney','eastern',false),
('WV','Hancock','54029','New Cumberland','northern',false),
('WV','Hardy','54031','Moorefield','eastern',false),
('WV','Harrison','54033','Clarksburg','northern',false),
('WV','Jackson','54035','Ripley','western',false),
('WV','Jefferson','54037','Charles Town','eastern',false),
('WV','Kanawha','54039','Charleston','central',true),
('WV','Lewis','54041','Weston','central',false),
('WV','Lincoln','54043','Hamlin','western',false),
('WV','Logan','54045','Logan','southern',false),
('WV','McDowell','54047','Welch','southern',false),
('WV','Marion','54049','Fairmont','northern',false),
('WV','Marshall','54051','Moundsville','northern',false),
('WV','Mason','54053','Point Pleasant','western',false),
('WV','Mercer','54055','Princeton','southern',false),
('WV','Mineral','54057','Keyser','eastern',false),
('WV','Mingo','54059','Williamson','southern',false),
('WV','Monongalia','54061','Morgantown','northern',false),
('WV','Monroe','54063','Union','southern',false),
('WV','Morgan','54065','Berkeley Springs','eastern',false),
('WV','Nicholas','54067','Summersville','central',false),
('WV','Ohio','54069','Wheeling','northern',false),
('WV','Pendleton','54071','Franklin','eastern',false),
('WV','Pleasants','54073','St. Marys','western',false),
('WV','Pocahontas','54075','Marlinton','eastern',false),
('WV','Preston','54077','Kingwood','northern',false),
('WV','Putnam','54079','Winfield','western',false),
('WV','Raleigh','54081','Beckley','southern',false),
('WV','Randolph','54083','Elkins','eastern',false),
('WV','Ritchie','54085','Harrisville','western',false),
('WV','Roane','54087','Spencer','western',false),
('WV','Summers','54089','Hinton','southern',false),
('WV','Taylor','54091','Grafton','northern',false),
('WV','Tucker','54093','Parsons','eastern',false),
('WV','Tyler','54095','Middlebourne','western',false),
('WV','Upshur','54097','Buckhannon','central',false),
('WV','Wayne','54099','Wayne','western',false),
('WV','Webster','54101','Webster Springs','central',false),
('WV','Wetzel','54103','New Martinsville','northern',false),
('WV','Wirt','54105','Elizabeth','western',false),
('WV','Wood','54107','Parkersburg','western',false),
('WV','Wyoming','54109','Pineville','southern',false)
on conflict (state, name) do nothing;

-- Seed demo AIN scores for all 55 counties
insert into public.ain_county_scores (county_id, score, grade, tax_delinquent_pct, vacancy_pct, foreclosure_rate, median_dom, median_price, distressed_listings, total_listings, data_source, is_demo)
select
  c.id,
  -- score: named counties get fixed scores, rest get random 20-80
  case c.name
    when 'Kanawha'     then 78 when 'McDowell'   then 94 when 'Mingo'       then 91
    when 'Logan'       then 87 when 'Wyoming'    then 85 when 'Boone'       then 83
    when 'Lincoln'     then 80 when 'Clay'       then 79 when 'Raleigh'     then 65
    when 'Fayette'     then 70 when 'Cabell'     then 60 when 'Wayne'       then 68
    when 'Mercer'      then 62 when 'Wood'       then 45 when 'Harrison'    then 48
    when 'Marion'      then 50 when 'Monongalia' then 30 when 'Berkeley'    then 25
    when 'Jefferson'   then 20 when 'Putnam'     then 38
    else floor(random() * 60 + 20)::integer
  end as score,
  -- grade: computed from score inline using same CASE logic (cannot ref alias in same SELECT)
  case c.name
    when 'McDowell'    then 'CRITICAL' when 'Mingo'       then 'CRITICAL'
    when 'Logan'       then 'CRITICAL' when 'Wyoming'     then 'CRITICAL'
    when 'Boone'       then 'CRITICAL' when 'Lincoln'     then 'CRITICAL'
    when 'Kanawha'     then 'HOT'      when 'Clay'        then 'HOT'
    when 'Fayette'     then 'HOT'      when 'Wayne'       then 'HOT'
    when 'Raleigh'     then 'HOT'      when 'Cabell'      then 'WARM'
    when 'Mercer'      then 'WARM'     when 'Harrison'    then 'WARM'
    when 'Marion'      then 'WARM'     when 'Wood'        then 'WARM'
    when 'Putnam'      then 'COOL'     when 'Monongalia'  then 'COOL'
    when 'Berkeley'    then 'COOL'     when 'Jefferson'   then 'COLD'
    else 'WARM' -- random scores average ~50 → WARM
  end as grade,
  round((random() * 15 + 2)::numeric, 1) as tax_delinquent_pct,
  round((random() * 20 + 5)::numeric, 1) as vacancy_pct,
  round((random() * 8 + 0.5)::numeric, 1) as foreclosure_rate,
  (floor(random() * 90 + 30))::integer as median_dom,
  (floor(random() * 80000 + 60000))::integer as median_price,
  (floor(random() * 50 + 5))::integer as distressed_listings,
  (floor(random() * 200 + 20))::integer as total_listings,
  'DEMO_SEED',
  true
from public.counties c
where c.state = 'WV'
  and not exists (
    select 1 from public.ain_county_scores s where s.county_id = c.id
  );

-- ═══ INDEXES ════════════════════════════════════════════════════════════════

create index if not exists idx_counties_state        on public.counties(state);
create index if not exists idx_ain_scores_county     on public.ain_county_scores(county_id);
create index if not exists idx_ain_scores_scored_at  on public.ain_county_scores(scored_at desc);
create index if not exists idx_distress_signals_prop on public.distress_signals(property_id);
create index if not exists idx_prop_distress_user    on public.property_distress_scores(user_id);
create index if not exists idx_prop_distress_prop    on public.property_distress_scores(property_id);
create index if not exists idx_top250_user           on public.top250_snapshots(user_id);
create index if not exists idx_d4d_pins_session      on public.d4d_pins(session_id);
create index if not exists idx_d4d_pins_user         on public.d4d_pins(user_id);
create index if not exists idx_pipeline_events_deal  on public.pipeline_events(deal_id);
create index if not exists idx_deal_artifacts_deal   on public.deal_artifacts(deal_id);
create index if not exists idx_agent_run_steps_run   on public.agent_run_steps(run_id);
create index if not exists idx_agent_artifacts_user  on public.agent_artifacts(user_id);
create index if not exists idx_usage_events_user     on public.usage_events(user_id, created_at desc);
create index if not exists idx_suppression_phone     on public.suppression_list(phone);
create index if not exists idx_documents_user        on public.documents(user_id);

select 'ATLAS v67 Master Merge Migration Complete' as status;
select 'Counties seeded: ' || count(*)::text from public.counties where state = 'WV';
select 'AIN scores seeded: ' || count(*)::text from public.ain_county_scores;
select 'Integration records: ' || count(*)::text from public.integration_status;
select 'Launch checklist items: ' || count(*)::text from public.launch_checklist_items;
