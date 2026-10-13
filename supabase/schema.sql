-- Adarsh Result core schema. Safe to apply more than once.
create extension if not exists pgcrypto;
do $$ begin create type public.content_type as enum ('job','result','admit_card','answer_key','syllabus','notice'); exception when duplicate_object then null; end $$;
do $$ begin create type public.content_status as enum ('draft','review','published','archived'); exception when duplicate_object then null; end $$;
create table if not exists public.profiles (id uuid primary key references auth.users(id) on delete cascade, display_name text, role text not null default 'editor' check (role in ('admin','editor')), created_at timestamptz not null default now());
create table if not exists public.posts (
 id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null, excerpt text, content_md text not null default '', content_type public.content_type not null, status public.content_status not null default 'draft', organization text, state_name text, qualification text, vacancies integer check (vacancies is null or vacancies >= 0), application_start date, application_end date, exam_date date, result_date date, official_url text, notification_pdf_url text, seo_title text, seo_description text, published_at timestamptz, created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), view_count bigint not null default 0 check (view_count >= 0)
);
create index if not exists posts_status_type_published_idx on public.posts(status,content_type,published_at desc);
create index if not exists posts_dates_idx on public.posts(application_end,exam_date,result_date);
create index if not exists posts_title_search_idx on public.posts using gin(to_tsvector('simple',coalesce(title,'')||' '||coalesce(excerpt,'')));
create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at before update on public.posts for each row execute function public.set_updated_at();
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
drop policy if exists "Public can read published posts" on public.posts;
create policy "Public can read published posts" on public.posts for select to anon,authenticated using(status='published' and published_at is not null and published_at<=now());
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles for select to authenticated using(id=(select auth.uid()));
drop policy if exists "Editors and admins can read posts" on public.posts;
create policy "Editors and admins can read posts" on public.posts for select to authenticated using(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','editor')));
drop policy if exists "Editors and admins can insert posts" on public.posts;
create policy "Editors and admins can insert posts" on public.posts for insert to authenticated with check(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','editor')));
drop policy if exists "Editors and admins can update posts" on public.posts;
create policy "Editors and admins can update posts" on public.posts for update to authenticated using(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','editor'))) with check(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','editor')));
drop policy if exists "Admins can delete posts" on public.posts;
create policy "Admins can delete posts" on public.posts for delete to authenticated using(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));
grant usage on schema public to anon,authenticated;
grant select on public.posts to anon,authenticated;
grant select on public.profiles to authenticated;
grant insert,update,delete on public.posts to authenticated;
-- Create the first Auth user, then grant editor/admin by inserting its UUID into profiles.
-- Never expose service-role/secret keys to the browser.
