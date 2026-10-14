-- Additive schema for the official government website crawler.
-- Existing posts/profiles schema and content workflow remain unchanged.
create table if not exists public.crawler_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  listing_url text not null unique,
  enabled boolean not null default true,
  last_checked_at timestamptz,
  last_status text not null default 'never' check (last_status in ('never','ok','error')),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crawler_discoveries (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.crawler_sources(id) on delete set null,
  source_name text not null,
  title text not null,
  official_url text not null unique,
  source_page_url text not null,
  content_type public.content_type not null default 'notice',
  fingerprint text not null,
  status text not null default 'pending' check (status in ('pending','converted','dismissed')),
  post_id uuid references public.posts(id) on delete set null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);
create index if not exists crawler_discoveries_status_seen_idx
  on public.crawler_discoveries(status, first_seen_at desc);
create index if not exists crawler_discoveries_source_idx
  on public.crawler_discoveries(source_id, last_seen_at desc);

create table if not exists public.crawler_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null,
  finished_at timestamptz,
  sources_checked integer not null default 0,
  discoveries_created integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  status text not null check (status in ('success','partial','failed')),
  created_at timestamptz not null default now()
);
create index if not exists crawler_runs_created_idx on public.crawler_runs(created_at desc);

create or replace function public.set_crawler_source_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists crawler_sources_set_updated_at on public.crawler_sources;
create trigger crawler_sources_set_updated_at before update on public.crawler_sources
for each row execute function public.set_crawler_source_updated_at();

alter table public.crawler_sources enable row level security;
alter table public.crawler_discoveries enable row level security;
alter table public.crawler_runs enable row level security;

drop policy if exists "Editors can read crawler sources" on public.crawler_sources;
create policy "Editors can read crawler sources" on public.crawler_sources
for select to authenticated using (exists (
  select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','editor')
));
drop policy if exists "Editors can read crawler discoveries" on public.crawler_discoveries;
create policy "Editors can read crawler discoveries" on public.crawler_discoveries
for select to authenticated using (exists (
  select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','editor')
));
drop policy if exists "Editors can update crawler discoveries" on public.crawler_discoveries;
create policy "Editors can update crawler discoveries" on public.crawler_discoveries
for update to authenticated using (exists (
  select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','editor')
)) with check (exists (
  select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','editor')
));
drop policy if exists "Editors can read crawler runs" on public.crawler_runs;
create policy "Editors can read crawler runs" on public.crawler_runs
for select to authenticated using (exists (
  select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','editor')
));
grant select on public.crawler_sources, public.crawler_discoveries, public.crawler_runs to authenticated;
grant update on public.crawler_discoveries to authenticated;
