-- «Семицвіт»: full database setup. Paste everything into Supabase → SQL Editor → Run.

-- >>> 0001_init.sql
-- =====================================================================
--  «Семицвіт» — database schema, roles and Row Level Security
--  Run once in Supabase → SQL Editor (paste the whole file → Run).
--  Safe to re-run: objects are created with IF NOT EXISTS / OR REPLACE.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Staff profiles and roles
-- ---------------------------------------------------------------------
-- pending  : registered on /admin, waiting for the owner to grant access
-- employee : limited, proposes changes, may upload photos if allowed
-- admin    : manages content in sections the owner allows
-- owner    : full access, manages staff and permissions
do $$ begin
  create type public.staff_role as enum ('pending', 'employee', 'admin', 'owner');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text not null default '',
  role        public.staff_role not null default 'pending',
  permissions jsonb not null default '{}'::jsonb,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Sections that can be switched on/off per person by the owner.
--   programs, teachers, schedule, gallery, news, testimonials,
--   registrations, settings, requests_review
create or replace function public.role_default_perm(r public.staff_role, section text)
returns boolean language sql immutable as $$
  select case
    when r = 'owner' then true
    when r = 'admin' then section in ('programs','teachers','schedule','gallery','news','testimonials','registrations')
    else false
  end;
$$;

create or replace function public.current_role_name()
returns public.staff_role language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid() and is_active),
    'pending'::public.staff_role);
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_role_name() = 'owner';
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_role_name() in ('employee','admin','owner');
$$;

create or replace function public.is_editor()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_role_name() in ('admin','owner');
$$;

-- Does the current user have a permission for a section?
create or replace function public.has_perm(section text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select case
      when p.role = 'owner' then true
      when p.role = 'pending' then false
      else coalesce((p.permissions ->> section)::boolean, public.role_default_perm(p.role, section))
    end
    from public.profiles p
    where p.id = auth.uid() and p.is_active), false);
$$;

-- Can the current user write directly to a content section? (admins/owner only)
create or replace function public.can_edit(section text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_editor() and public.has_perm(section);
$$;

-- New auth user → pending profile
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only the owner may change roles/permissions/active flag; the last owner can't be removed.
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role
      or new.permissions is distinct from old.permissions
      or new.is_active is distinct from old.is_active
      or new.id is distinct from old.id
      or new.email is distinct from old.email)
     and not public.is_owner()
     and auth.uid() is not null then  -- SQL Editor / service calls have no auth.uid()
    raise exception 'Only the owner can change roles and permissions';
  end if;
  if old.role = 'owner' and (new.role <> 'owner' or not new.is_active)
     and (select count(*) from public.profiles where role = 'owner' and is_active and id <> old.id) = 0 then
    raise exception 'The site must keep at least one active owner';
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

create or replace function public.guard_profile_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.role = 'owner'
     and (select count(*) from public.profiles where role = 'owner' and is_active and id <> old.id) = 0 then
    raise exception 'The site must keep at least one active owner';
  end if;
  return old;
end $$;

drop trigger if exists profiles_guard_delete on public.profiles;
create trigger profiles_guard_delete before delete on public.profiles
  for each row execute function public.guard_profile_delete();

-- Owner bootstrap. Callable ONLY from the SQL Editor (not exposed to the website):
--   select public.make_owner('owner@example.com');
create or replace function public.make_owner(owner_email text)
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(owner_email);
  if uid is null then
    return 'User not found. Create it first: Authentication → Users → Add user.';
  end if;
  insert into public.profiles (id, email, role) values (uid, owner_email, 'owner')
  on conflict (id) do update set role = 'owner', is_active = true;
  return 'OK: ' || owner_email || ' is now the owner.';
end $$;
revoke all on function public.make_owner(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Site settings (contacts, social links, working hours, texts, SEO)
-- ---------------------------------------------------------------------
create table if not exists public.site_settings (
  id         int primary key default 1 check (id = 1),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
insert into public.site_settings (id) values (1) on conflict do nothing;

-- ---------------------------------------------------------------------
-- 3. Content
-- ---------------------------------------------------------------------
create table if not exists public.programs (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
  title         text not null check (char_length(title) between 2 and 120),
  short         text not null default '',
  description   text not null default '',
  age_group     text not null default '',
  schedule_text text not null default '',
  price_text    text not null default '',
  color         text not null default 'red',
  image_url     text,
  photos        text[] not null default '{}',
  is_active     boolean not null default true,
  is_published  boolean not null default false,
  sort_order    int not null default 100,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.teachers (
  id             uuid primary key default gen_random_uuid(),
  full_name      text not null check (char_length(full_name) between 2 and 120),
  position       text not null default '',
  qualifications text not null default '',
  bio            text not null default '',
  photo_url      text,
  is_published   boolean not null default false,
  sort_order     int not null default 100,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.schedule_items (
  id           uuid primary key default gen_random_uuid(),
  program_id   uuid references public.programs(id) on delete cascade,
  teacher_id   uuid references public.teachers(id) on delete set null,
  weekday      int not null check (weekday between 1 and 7),
  start_time   time not null,
  end_time     time,
  group_name   text not null default '',
  note         text not null default '',
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9-]{2,120}$'),
  kind         text not null default 'news' check (kind in ('news','event','workshop','announcement')),
  title        text not null check (char_length(title) between 2 and 200),
  excerpt      text not null default '',
  body         text not null default '',
  cover_url    text,
  event_date   timestamptz,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.gallery_albums (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
  title        text not null,
  category     text not null default 'activities' check (category in ('classrooms','activities','events','celebrations','other')),
  description  text not null default '',
  cover_url    text,
  is_published boolean not null default false,
  sort_order   int not null default 100,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.gallery_photos (
  id                uuid primary key default gen_random_uuid(),
  album_id          uuid references public.gallery_albums(id) on delete cascade,
  url               text not null,
  storage_path      text,
  caption           text not null default '',
  children_visible  boolean not null default false,
  consent_confirmed boolean not null default false,
  is_published      boolean not null default false,
  uploaded_by       uuid references auth.users(id) on delete set null default auth.uid(),
  sort_order        int not null default 100,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- A photo with recognisable children can be published only with parental consent
  constraint children_need_consent check (not (is_published and children_visible and not consent_confirmed))
);

create table if not exists public.testimonials (
  id           uuid primary key default gen_random_uuid(),
  author       text not null,
  text         text not null,
  source       text not null default '',
  is_verified  boolean not null default false,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint testimonial_verified check (not (is_published and not is_verified))
);

-- ---------------------------------------------------------------------
-- 4. Registration / contact requests from parents
-- ---------------------------------------------------------------------
create table if not exists public.registrations (
  id              uuid primary key default gen_random_uuid(),
  kind            text not null default 'registration' check (kind in ('registration','question','birthday')),
  parent_name     text not null check (char_length(btrim(parent_name)) between 2 and 80),
  phone           text not null check (phone ~ '^\+?[0-9 ()-]{9,20}$'),
  child_age       text not null default '' check (char_length(child_age) <= 40),
  program         text not null default '' check (char_length(program) <= 120),
  contact_method  text not null default 'phone' check (contact_method in ('phone','viber','telegram','whatsapp','instagram')),
  message         text not null default '' check (char_length(message) <= 1000),
  consent         boolean not null check (consent),
  status          text not null default 'new' check (status in ('new','in_progress','done','spam')),
  admin_note      text not null default '',
  processed_by    uuid references auth.users(id) on delete set null,
  processed_at    timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists registrations_created_idx on public.registrations (created_at desc);
create index if not exists registrations_phone_idx on public.registrations (phone, created_at desc);

-- Spam protection: max 3 requests per phone per day, max 60 per hour overall.
create or replace function public.registrations_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.status := 'new';
  new.admin_note := '';
  new.processed_by := null;
  new.processed_at := null;
  new.created_at := now();
  new.phone := regexp_replace(new.phone, '\s+', ' ', 'g');
  if (select count(*) from public.registrations
       where regexp_replace(phone, '[^0-9]', '', 'g') = regexp_replace(new.phone, '[^0-9]', '', 'g')
         and created_at > now() - interval '1 day') >= 3 then
    raise exception 'too_many_requests';
  end if;
  if (select count(*) from public.registrations where created_at > now() - interval '1 hour') >= 60 then
    raise exception 'too_many_requests';
  end if;
  return new;
end $$;

drop trigger if exists registrations_rate on public.registrations;
create trigger registrations_rate before insert on public.registrations
  for each row execute function public.registrations_rate_limit();

-- ---------------------------------------------------------------------
-- 5. Change requests (employees → owner approval)
-- ---------------------------------------------------------------------
create table if not exists public.change_requests (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name   text not null default '',
  title         text not null check (char_length(title) between 2 and 200),
  message       text not null default '',
  target_table  text check (target_table in ('programs','teachers','schedule_items','posts','gallery_albums','testimonials')),
  target_id     uuid,
  payload       jsonb,
  status        text not null default 'pending' check (status in ('pending','approved','rejected','published')),
  reviewer_id   uuid references auth.users(id) on delete set null,
  reviewer_note text not null default '',
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now()
);

create or replace function public.guard_change_request()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.author_id := auth.uid();
    new.status := 'pending';
    new.reviewer_id := null;
    new.reviewed_at := null;
    new.author_name := coalesce((select nullif(full_name,'') from public.profiles where id = auth.uid()),
                                (select email from public.profiles where id = auth.uid()), '');
  else
    -- reviewers can only change review fields
    new.author_id := old.author_id;
    new.author_name := old.author_name;
    new.created_at := old.created_at;
    if new.status is distinct from old.status then
      new.reviewer_id := auth.uid();
      new.reviewed_at := now();
    end if;
  end if;
  return new;
end $$;

drop trigger if exists change_requests_guard on public.change_requests;
create trigger change_requests_guard before insert or update on public.change_requests
  for each row execute function public.guard_change_request();

-- ---------------------------------------------------------------------
-- 6. Activity log
-- ---------------------------------------------------------------------
create table if not exists public.activity_log (
  id         bigint generated always as identity primary key,
  actor_id   uuid,
  actor_name text not null default '',
  action     text not null,
  table_name text not null,
  row_id     text,
  summary    text not null default '',
  created_at timestamptz not null default now()
);

create or replace function public.log_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare r jsonb; nm text;
begin
  r := to_jsonb(coalesce(new, old));
  select coalesce(nullif(full_name,''), email, '') into nm from public.profiles where id = auth.uid();
  insert into public.activity_log (actor_id, actor_name, action, table_name, row_id, summary)
  values (auth.uid(), coalesce(nm,''), lower(tg_op), tg_table_name, r ->> 'id',
          left(coalesce(r ->> 'title', r ->> 'full_name', r ->> 'caption', r ->> 'author', r ->> 'parent_name', ''), 140));
  return coalesce(new, old);
end $$;

-- updated_at helper
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array['programs','teachers','schedule_items','posts','gallery_albums','gallery_photos','testimonials','site_settings'] loop
    execute format('drop trigger if exists %I_log on public.%I', t, t);
    execute format('create trigger %I_log after insert or update or delete on public.%I for each row execute function public.log_activity()', t, t);
    execute format('drop trigger if exists %I_touch on public.%I', t, t);
    execute format('create trigger %I_touch before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 7. Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.site_settings   enable row level security;
alter table public.programs        enable row level security;
alter table public.teachers        enable row level security;
alter table public.schedule_items  enable row level security;
alter table public.posts           enable row level security;
alter table public.gallery_albums  enable row level security;
alter table public.gallery_photos  enable row level security;
alter table public.testimonials    enable row level security;
alter table public.registrations   enable row level security;
alter table public.change_requests enable row level security;
alter table public.activity_log    enable row level security;

-- helper to (re)create a policy idempotently
create or replace function pg_temp.pol(name text, tbl text, cmd text, roles text, using_expr text, check_expr text)
returns void language plpgsql as $$
begin
  execute format('drop policy if exists %I on public.%I', name, tbl);
  execute format('create policy %I on public.%I for %s to %s %s %s', name, tbl, cmd, roles,
    case when using_expr is null then '' else 'using (' || using_expr || ')' end,
    case when check_expr is null then '' else 'with check (' || check_expr || ')' end);
end $$;

-- profiles
select pg_temp.pol('profiles_select', 'profiles', 'select', 'authenticated', 'id = auth.uid() or public.is_staff()', null);
select pg_temp.pol('profiles_update', 'profiles', 'update', 'authenticated', 'id = auth.uid() or public.is_owner()', 'id = auth.uid() or public.is_owner()');
select pg_temp.pol('profiles_delete', 'profiles', 'delete', 'authenticated', 'public.is_owner() and id <> auth.uid()', null);

-- settings: everyone reads, permitted editors write
select pg_temp.pol('settings_read', 'site_settings', 'select', 'anon, authenticated', 'true', null);
select pg_temp.pol('settings_write', 'site_settings', 'update', 'authenticated', 'public.can_edit(''settings'')', 'public.can_edit(''settings'')');

-- published content is public; staff see drafts (for preview); editors write
do $$
declare t text; s text;
begin
  for t, s in select * from (values
      ('programs','programs'), ('teachers','teachers'), ('schedule_items','schedule'),
      ('posts','news'), ('gallery_albums','gallery'), ('testimonials','testimonials')) v(t, s)
  loop
    perform pg_temp.pol(t || '_read', t, 'select', 'anon, authenticated', 'is_published or public.is_staff()', null);
    perform pg_temp.pol(t || '_insert', t, 'insert', 'authenticated', null, format('public.can_edit(%L)', s));
    perform pg_temp.pol(t || '_update', t, 'update', 'authenticated', format('public.can_edit(%L)', s), format('public.can_edit(%L)', s));
    perform pg_temp.pol(t || '_delete', t, 'delete', 'authenticated', format('public.can_edit(%L)', s), null);
  end loop;
end $$;

-- gallery photos: editors manage; employees with the "gallery" permission may upload unpublished photos
select pg_temp.pol('gallery_photos_read', 'gallery_photos', 'select', 'anon, authenticated', 'is_published or public.is_staff()', null);
select pg_temp.pol('gallery_photos_insert', 'gallery_photos', 'insert', 'authenticated', null,
  'public.can_edit(''gallery'') or (public.is_staff() and public.has_perm(''gallery'') and not is_published and uploaded_by = auth.uid())');
select pg_temp.pol('gallery_photos_update', 'gallery_photos', 'update', 'authenticated', 'public.can_edit(''gallery'')', 'public.can_edit(''gallery'')');
select pg_temp.pol('gallery_photos_delete', 'gallery_photos', 'delete', 'authenticated', 'public.can_edit(''gallery'')', null);

-- registrations: anyone can submit (validated + rate limited), only permitted staff read/process
select pg_temp.pol('registrations_insert', 'registrations', 'insert', 'anon, authenticated', null, 'consent and status = ''new''');
select pg_temp.pol('registrations_read', 'registrations', 'select', 'authenticated', 'public.is_staff() and public.has_perm(''registrations'')', null);
select pg_temp.pol('registrations_update', 'registrations', 'update', 'authenticated', 'public.can_edit(''registrations'')', 'public.can_edit(''registrations'')');
select pg_temp.pol('registrations_delete', 'registrations', 'delete', 'authenticated', 'public.is_owner()', null);

-- change requests: any staff member submits; author sees own; owner (or permitted admin) reviews
select pg_temp.pol('cr_insert', 'change_requests', 'insert', 'authenticated', null, 'public.is_staff()');
select pg_temp.pol('cr_read', 'change_requests', 'select', 'authenticated',
  'author_id = auth.uid() or public.is_owner() or (public.is_editor() and public.has_perm(''requests_review''))', null);
select pg_temp.pol('cr_update', 'change_requests', 'update', 'authenticated',
  'public.is_owner() or (public.is_editor() and public.has_perm(''requests_review''))',
  'public.is_owner() or (public.is_editor() and public.has_perm(''requests_review''))');
select pg_temp.pol('cr_delete', 'change_requests', 'delete', 'authenticated', 'public.is_owner() or (author_id = auth.uid() and status = ''pending'')', null);

-- activity log: owner and admins read; nobody writes directly (triggers only)
select pg_temp.pol('activity_read', 'activity_log', 'select', 'authenticated', 'public.is_editor()', null);

-- Table privileges (RLS above still decides which rows each user may touch)
grant usage on schema public to anon, authenticated;
grant select on public.site_settings, public.programs, public.teachers, public.schedule_items, public.posts,
  public.gallery_albums, public.gallery_photos, public.testimonials to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke insert, update, delete on public.activity_log from authenticated;

-- Column-level hardening: the public may only send the registration form fields
revoke insert on public.registrations from anon;
grant insert (kind, parent_name, phone, child_age, program, contact_method, message, consent) on public.registrations to anon;

-- ---------------------------------------------------------------------
-- 8. Storage: public bucket "media" for photos
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists media_read on storage.objects;
create policy media_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'media');

drop policy if exists media_upload on storage.objects;
create policy media_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (
    public.is_editor()
    or (public.is_staff() and public.has_perm('gallery'))));

drop policy if exists media_delete on storage.objects;
create policy media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_editor());

-- ---------------------------------------------------------------------
-- 9. Dashboard helper: counters for the overview page
-- ---------------------------------------------------------------------
create or replace function public.dashboard_counts()
returns jsonb language sql stable security definer set search_path = public as $$
  select case when not public.is_staff() then '{}'::jsonb else jsonb_build_object(
    'registrations_new', case when public.has_perm('registrations') then (select count(*) from registrations where status = 'new') else null end,
    'requests_pending', case when public.is_owner() or (public.is_editor() and public.has_perm('requests_review'))
                             then (select count(*) from change_requests where status = 'pending') else null end,
    'programs', (select count(*) from programs),
    'teachers', (select count(*) from teachers),
    'posts', (select count(*) from posts),
    'photos', (select count(*) from gallery_photos),
    'staff_pending', case when public.is_owner() then (select count(*) from profiles where role = 'pending') else null end
  ) end;
$$;

grant execute on function public.dashboard_counts() to authenticated;
grant execute on function public.has_perm(text), public.is_staff(), public.is_owner(), public.is_editor(), public.can_edit(text), public.current_role_name() to anon, authenticated;


-- >>> seed.sql
-- Initial content for «Семицвіт». Run AFTER migrations/0001_init.sql.
-- Only verified facts are published; unconfirmed programs are inserted as drafts.

update public.site_settings set data = '{"name":"Семицвіт","fullName":"Дитячий центр «Семицвіт»","tagline":"Дитячий центр розвитку та міні-садок у Запоріжжі","heroTitle":"Місце, де дитина розквітає","heroText":"Міні-садок, розвиваючі заняття, підготовка до школи та логопед — для малюків від 1 року. Дбайливі педагоги, невеликі групи і затишний простір на вул. Українській, 4.","address":"вул. Українська, 4","city":"Запоріжжя","phones":["+380 67 780 16 39"],"email":"","hours":[],"hoursNote":"Графік роботи уточнюйте за телефоном або в Instagram.","instagram":"https://www.instagram.com/semitsvetik_detskiy.center/","facebook":"https://www.facebook.com/kidsclubsemitsvetik/","telegram":"","viber":"","whatsapp":"","mapsUrl":"https://www.google.com/maps/search/?api=1&query=%D0%94%D0%B8%D1%82%D1%8F%D1%87%D0%B8%D0%B9+%D1%86%D0%B5%D0%BD%D1%82%D1%80+%D0%A1%D0%B5%D0%BC%D0%B8%D1%86%D0%B2%D0%B5%D1%82%D0%B8%D0%BA+%D0%A3%D0%BA%D1%80%D0%B0%D1%97%D0%BD%D1%81%D1%8C%D0%BA%D0%B0+4+%D0%97%D0%B0%D0%BF%D0%BE%D1%80%D1%96%D0%B6%D0%B6%D1%8F","mapsQuery":"Дитячий центр Семицветик, вулиця Українська 4, Запоріжжя","directions":"","aboutIntro":"«Семицвіт» — дитячий центр розвитку та міні-садок у Запоріжжі. Ми допомагаємо малюкам від 1 року пізнавати світ, спілкуватися, творити й упевнено готуватися до школи.","aboutHistory":"","aboutPhilosophy":"Кожна дитина — як окрема пелюстка: зі своїм кольором, характером і темпом. Ми не підганяємо дітей під шаблон, а допомагаємо кожному розкрити власні сильні сторони — через гру, творчість, рух і спілкування.","values":[{"title":"Увага до кожного","text":"Невеликі групи, щоб педагог бачив і чув кожну дитину."},{"title":"Розвиток через гру","text":"Нові знання приходять легко, коли дитині цікаво."},{"title":"Безпека і затишок","text":"Простір, де дитина почувається спокійно, а батьки — впевнено."},{"title":"Партнерство з батьками","text":"Розповідаємо про успіхи дитини й разом шукаємо найкращий шлях."}],"whyUs":[{"title":"Усе в одному місці","text":"Міні-садок, розвиваючі заняття, підготовка до школи та логопед під одним дахом."},{"title":"Від 1 року до школи","text":"Програми для різного віку — дитина росте разом із нами."},{"title":"Свята, які запам''ятовуються","text":"Тематичні свята та дні народження для дітей."},{"title":"Зручне розташування","text":"Вул. Українська, 4 — легко дістатися з будь-якого району міста."}],"teamText":"Наші педагоги працюють із дітьми щодня: проводять заняття, свята й уважно стежать за розвитком кожного малюка. Профілі команди з''являться тут найближчим часом.","birthdayIntro":"Влаштуємо дитині день народження, який вона згадуватиме з усмішкою. Розкажіть нам про іменинника — і ми запропонуємо формат свята.","birthdayItems":[{"title":"Святкова програма","text":"Ігри, конкурси й веселощі для іменинника та гостей."},{"title":"Тематичне оформлення","text":"Обговоримо тему свята разом із вами."},{"title":"Фото на згадку","text":"Яскраві кадри для сімейного альбому."}],"birthdayConfirmed":false,"seoTitle":"Семицвіт — дитячий центр розвитку та міні-садок у Запоріжжі","seoDescription":"Дитячий центр «Семицвіт» на вул. Українській, 4 у Запоріжжі: міні-садок, розвиваючі заняття, підготовка до школи, логопед, дитячі свята. Запис онлайн.","announcement":""}'::jsonb where id = 1 and data = '{}'::jsonb;

insert into public.programs (slug,title,short,description,age_group,schedule_text,price_text,color,photos,is_active,is_published,sort_order) values ('mini-sadok','Міні-садок','Затишна альтернатива великому садочку: маленька група, турбота й розвиток щодня.','Міні-садок — це день, наповнений іграми, заняттями, творчістю та відпочинком у невеликій групі. Педагоги допомагають малюкам адаптуватися, вчитися самостійності й дружити.

Умови перебування, вік і вартість уточнюйте за телефоном.','','','','red',array[]::text[],true,true,10) on conflict (slug) do nothing;
insert into public.programs (slug,title,short,description,age_group,schedule_text,price_text,color,photos,is_active,is_published,sort_order) values ('rozvyvaiuchi-zaniattia','Розвиваючі заняття','Мовлення, логіка, моторика, творчість — заняття, які дитина чекає з нетерпінням.','Розвиваючі заняття допомагають дитині гармонійно рости: розвивати мовлення, увагу, пам''ять, дрібну моторику та уяву. Усе — у форматі гри, з урахуванням віку.

Групи, вік і розклад уточнюйте за телефоном.','','','','orange',array[]::text[],true,true,20) on conflict (slug) do nothing;
insert into public.programs (slug,title,short,description,age_group,schedule_text,price_text,color,photos,is_active,is_published,sort_order) values ('pidhotovka-do-shkoly','Підготовка до школи','Читання, письмо, математика й логіка — щоб перший клас став радісним стартом.','Готуємо дитину до школи комплексно: грамота, читання і письмо, математика та логіка, знайомство з навколишнім світом. А ще — вміння слухати педагога, працювати в групі й не боятися помилок.

Формат, розклад і вартість уточнюйте за телефоном.','','','','yellow',array[]::text[],true,true,30) on conflict (slug) do nothing;
insert into public.programs (slug,title,short,description,age_group,schedule_text,price_text,color,photos,is_active,is_published,sort_order) values ('lohoped','Логопед','Індивідуальні заняття для чистого, впевненого мовлення.','Логопед допомагає дитині правильно вимовляти звуки, збагачувати словник і будувати зв''язне мовлення. Заняття підбираються індивідуально після знайомства з дитиною.

Запишіться на консультацію — деталі уточнимо телефоном.','','','','blue',array[]::text[],true,true,40) on conflict (slug) do nothing;
insert into public.programs (slug,title,short,description,age_group,schedule_text,price_text,color,photos,is_active,is_published,sort_order) values ('anhliiska-mova','Англійська мова','Потребує підтвердження центром перед публікацією.','Чернетка. Згадується в старих публічних описах центру (2019). Опублікуйте, лише якщо напрям діє зараз.','','','','green',array[]::text[],false,false,50) on conflict (slug) do nothing;
insert into public.programs (slug,title,short,description,age_group,schedule_text,price_text,color,photos,is_active,is_published,sort_order) values ('mentalna-aryfmetyka','Ментальна арифметика','Потребує підтвердження центром перед публікацією.','Чернетка. Згадується в старих публічних описах центру (2019). Опублікуйте, лише якщо напрям діє зараз.','','','','cyan',array[]::text[],false,false,60) on conflict (slug) do nothing;
insert into public.programs (slug,title,short,description,age_group,schedule_text,price_text,color,photos,is_active,is_published,sort_order) values ('tvorcha-studiia','Творча студія','Потребує підтвердження центром перед публікацією.','Чернетка. Згадується в старих публічних описах центру (2019). Опублікуйте, лише якщо напрям діє зараз.','','','','violet',array[]::text[],false,false,70) on conflict (slug) do nothing;
insert into public.programs (slug,title,short,description,age_group,schedule_text,price_text,color,photos,is_active,is_published,sort_order) values ('khoreohrafiia','Хореографія','Потребує підтвердження центром перед публікацією.','Чернетка. Згадується в старих публічних описах центру (2019). Опублікуйте, лише якщо напрям діє зараз.','','','','orange',array[]::text[],false,false,80) on conflict (slug) do nothing;

insert into public.posts (slug,kind,title,excerpt,body,event_date,is_published,published_at) values ('sviato-sviatoho-mykolaia-2026','event','Свято Святого Миколая','Запрошуємо дітей на свято Святого Миколая 4 грудня!','Запрошуємо дітей на свято Святого Миколая!

На малюків чекають:
• яскраві фотографії з фотозоною;
• зустріч зі Святим Миколаєм;
• отримання подарунків;
• снігова дискотека.

Час і умови участі уточнюйте за телефоном або в Instagram центру.','2026-12-04T12:00:00+02:00',true,'2026-11-26T12:00:00+02:00') on conflict (slug) do nothing;
