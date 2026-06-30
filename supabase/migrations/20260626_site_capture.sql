-- ============================================================
-- ATLAS v67 — Site Capture & Measurement Fusion (P1 schema)
-- See 07_PLANS/8_SITE_CAPTURE_MEASUREMENT_PLAN.md
--
-- site_captures   — one capture session for a location/property
-- capture_assets  — each photo/video + its parsed EXIF/packet metadata
-- measurements    — fused measurements with confidence + source provenance
--
-- Owner/admin only (matches live DB convention: profiles.user_id +
-- (select auth.uid()) initplan form). Idempotent.
-- Isaac Brandon Burdette · Atlas Genesis Matrix LLC
-- ============================================================

create table if not exists public.site_captures (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  notes text,
  -- best-known site location (from first asset GPS or user input)
  latitude double precision,
  longitude double precision,
  gps_accuracy_m double precision,
  -- external enrichment snapshot (USGS elevation, census geo, parcel, etc.)
  enrichment jsonb default '{}'::jsonb,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','ARCHIVED')),
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists site_captures_created_by_idx on public.site_captures (created_by);
create index if not exists site_captures_created_at_idx on public.site_captures (created_at desc);

alter table public.site_captures enable row level security;
drop policy if exists "Owner/admin manage site_captures" on public.site_captures;
create policy "Owner/admin manage site_captures" on public.site_captures
  for all using (exists (select 1 from public.profiles
    where user_id = (select auth.uid()) and role in ('owner','admin') and is_active = true));

create table if not exists public.capture_assets (
  id uuid primary key default gen_random_uuid(),
  capture_id uuid not null references public.site_captures(id) on delete cascade,
  filename text not null,
  media_type text default 'image',
  storage_ref text,                 -- where the raw bytes live (P1.5: Supabase Storage)
  -- parsed Level-1 metadata (EXIF/XMP)
  exif jsonb default '{}'::jsonb,
  latitude double precision,
  longitude double precision,
  altitude_m double precision,
  captured_at timestamptz,
  camera_model text,
  lens_model text,
  focal_length_mm double precision,
  image_width integer,
  image_height integer,
  orientation integer,
  -- Level-2 sensor packet (sidecar JSON from a future capture SDK)
  packet jsonb default '{}'::jsonb,
  has_depth boolean default false,
  has_mesh boolean default false,
  created_at timestamptz default now()
);
create index if not exists capture_assets_capture_idx on public.capture_assets (capture_id);

alter table public.capture_assets enable row level security;
drop policy if exists "Owner/admin manage capture_assets" on public.capture_assets;
create policy "Owner/admin manage capture_assets" on public.capture_assets
  for all using (exists (select 1 from public.profiles
    where user_id = (select auth.uid()) and role in ('owner','admin') and is_active = true));

create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  capture_id uuid not null references public.site_captures(id) on delete cascade,
  label text not null,              -- "pool length", "north pad edge", etc.
  kind text default 'length' check (kind in ('length','area','height','angle','count','volume')),
  -- fused result
  value double precision,
  unit text default 'ft',
  sigma double precision,           -- 1-σ uncertainty in `unit`
  confidence integer check (confidence between 0 and 100),
  -- every constraint that fed the fusion, with its value/sigma/source
  source_provenance jsonb default '[]'::jsonb,
  conflict boolean default false,   -- solver flagged disagreeing sources
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
create index if not exists measurements_capture_idx on public.measurements (capture_id);
create index if not exists measurements_created_by_idx on public.measurements (created_by);

alter table public.measurements enable row level security;
drop policy if exists "Owner/admin manage measurements" on public.measurements;
create policy "Owner/admin manage measurements" on public.measurements
  for all using (exists (select 1 from public.profiles
    where user_id = (select auth.uid()) and role in ('owner','admin') and is_active = true));
