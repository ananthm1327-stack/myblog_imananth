-- ============================================================
-- I'm Ananth — Supabase schema
-- Run this once in your Supabase SQL editor (Settings → SQL → New query).
-- ============================================================

-- 1. Posts table -----------------------------------------------
create table if not exists posts (
  id           text primary key,
  section      text not null check (section in ('journal','photos','experiences','articles','views')),
  title        text not null,
  body         text default '',
  image        text default '',
  tags         text[] default '{}',
  status       text not null default 'published' check (status in ('draft','published')),
  publish_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  owner_token  text not null
);

-- 2. Comments table --------------------------------------------
create table if not exists comments (
  id           text primary key,
  section      text not null,
  post_id      text not null,
  name         text not null,
  body         text not null,
  status       text not null default 'pending' check (status in ('pending','approved')),
  reactions    jsonb not null default '{"heart":0,"sparkle":0}'::jsonb,
  created_at   timestamptz not null default now(),
  owner_token  text
);

create index if not exists comments_by_post on comments (section, post_id);
create index if not exists posts_by_section on posts (section, created_at desc);

-- 3. Row-Level Security ----------------------------------------
alter table posts enable row level security;
alter table comments enable row level security;

-- Everyone (anon) can READ published, non-scheduled posts.
create policy "posts_public_read"
  on posts for select
  using (
    status = 'published'
    and (publish_at is null or publish_at <= now())
  );

-- Anyone with the owner_token can insert/update/delete posts.
-- The token is stored in the app's VITE_OWNER_TOKEN env var; keep it secret.
create policy "posts_owner_all"
  on posts for all
  using (owner_token = current_setting('request.headers', true)::json->>'x-owner-token')
  with check (owner_token = current_setting('request.headers', true)::json->>'x-owner-token');
--
-- SIMPLER ALTERNATIVE if the header-based check above gives you trouble
-- during initial setup, comment the two policies above and use these
-- token-in-column checks instead (works with the default supabase-js client):
--
-- create policy "posts_owner_write" on posts for insert with check (owner_token = coalesce(current_setting('app.owner_token', true), ''));
-- create policy "posts_owner_edit"  on posts for update using (owner_token = coalesce(current_setting('app.owner_token', true), ''));
-- create policy "posts_owner_del"   on posts for delete using (owner_token = coalesce(current_setting('app.owner_token', true), ''));

-- Comments: anyone can read approved, anyone can insert (goes in as pending),
-- only the owner can approve/delete.
--
-- NOTE: the app writes owner_token on every comment row (not just ones the
-- true owner submits) so that pullAll() — which uses the same anon client for
-- everyone — can select pending comments for the moderation queue. This is
-- consistent with the existing model: VITE_OWNER_TOKEN is baked into the
-- public JS bundle, so it is a "shared secret via obscurity", not a real
-- authentication boundary. The app's own isOwner() check (sessionStorage) is
-- what actually hides the /moderation UI and the "+ New" buttons from
-- everyday readers.
create policy "comments_public_read"
  on comments for select
  using (status = 'approved');

create policy "comments_public_insert"
  on comments for insert
  with check (status = 'pending');

create policy "comments_owner_all"
  on comments for all
  using (owner_token = current_setting('request.headers', true)::json->>'x-owner-token')
  with check (owner_token = current_setting('request.headers', true)::json->>'x-owner-token');

-- 4. auto-touch updated_at -------------------------------------
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists posts_touch on posts;
create trigger posts_touch before update on posts for each row execute function touch_updated_at();

-- 5. Realtime — required for cross-device live sync -------------
-- Adds both tables to the built-in supabase_realtime publication so the
-- app's postgres_changes subscription fires on every insert/update/delete.
-- Wrapped so re-running this file is safe even if already enabled.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table posts;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'comments'
  ) then
    alter publication supabase_realtime add table comments;
  end if;
end $$;
