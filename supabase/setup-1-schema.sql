create extension if not exists pgcrypto;
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
create or replace function public.can_edit(section text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_editor() and public.has_perm(section);
$$;
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
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role
      or new.permissions is distinct from old.permissions
      or new.is_active is distinct from old.is_active
      or new.id is distinct from old.id
      or new.email is distinct from old.email)
     and not public.is_owner()
     and auth.uid() is not null then
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
create table if not exists public.site_settings (
  id         int primary key default 1 check (id = 1),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
insert into public.site_settings (id) values (1) on conflict do nothing;
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
create or replace function pg_temp.pol(name text, tbl text, cmd text, roles text, using_expr text, check_expr text)
returns void language plpgsql as $$
begin
  execute format('drop policy if exists %I on public.%I', name, tbl);
  execute format('create policy %I on public.%I for %s to %s %s %s', name, tbl, cmd, roles,
    case when using_expr is null then '' else 'using (' || using_expr || ')' end,
    case when check_expr is null then '' else 'with check (' || check_expr || ')' end);
end $$;
select pg_temp.pol('profiles_select', 'profiles', 'select', 'authenticated', 'id = auth.uid() or public.is_staff()', null);
select pg_temp.pol('profiles_update', 'profiles', 'update', 'authenticated', 'id = auth.uid() or public.is_owner()', 'id = auth.uid() or public.is_owner()');
select pg_temp.pol('profiles_delete', 'profiles', 'delete', 'authenticated', 'public.is_owner() and id <> auth.uid()', null);
select pg_temp.pol('settings_read', 'site_settings', 'select', 'anon, authenticated', 'true', null);
select pg_temp.pol('settings_write', 'site_settings', 'update', 'authenticated', 'public.can_edit(''settings'')', 'public.can_edit(''settings'')');
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
select pg_temp.pol('gallery_photos_read', 'gallery_photos', 'select', 'anon, authenticated', 'is_published or public.is_staff()', null);
select pg_temp.pol('gallery_photos_insert', 'gallery_photos', 'insert', 'authenticated', null,
  'public.can_edit(''gallery'') or (public.is_staff() and public.has_perm(''gallery'') and not is_published and uploaded_by = auth.uid())');
select pg_temp.pol('gallery_photos_update', 'gallery_photos', 'update', 'authenticated', 'public.can_edit(''gallery'')', 'public.can_edit(''gallery'')');
select pg_temp.pol('gallery_photos_delete', 'gallery_photos', 'delete', 'authenticated', 'public.can_edit(''gallery'')', null);
select pg_temp.pol('registrations_insert', 'registrations', 'insert', 'anon, authenticated', null, 'consent and status = ''new''');
select pg_temp.pol('registrations_read', 'registrations', 'select', 'authenticated', 'public.is_staff() and public.has_perm(''registrations'')', null);
select pg_temp.pol('registrations_update', 'registrations', 'update', 'authenticated', 'public.can_edit(''registrations'')', 'public.can_edit(''registrations'')');
select pg_temp.pol('registrations_delete', 'registrations', 'delete', 'authenticated', 'public.is_owner()', null);
select pg_temp.pol('cr_insert', 'change_requests', 'insert', 'authenticated', null, 'public.is_staff()');
select pg_temp.pol('cr_read', 'change_requests', 'select', 'authenticated',
  'author_id = auth.uid() or public.is_owner() or (public.is_editor() and public.has_perm(''requests_review''))', null);
select pg_temp.pol('cr_update', 'change_requests', 'update', 'authenticated',
  'public.is_owner() or (public.is_editor() and public.has_perm(''requests_review''))',
  'public.is_owner() or (public.is_editor() and public.has_perm(''requests_review''))');
select pg_temp.pol('cr_delete', 'change_requests', 'delete', 'authenticated', 'public.is_owner() or (author_id = auth.uid() and status = ''pending'')', null);
select pg_temp.pol('activity_read', 'activity_log', 'select', 'authenticated', 'public.is_editor()', null);
grant usage on schema public to anon, authenticated;
grant select on public.site_settings, public.programs, public.teachers, public.schedule_items, public.posts,
  public.gallery_albums, public.gallery_photos, public.testimonials to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke insert, update, delete on public.activity_log from authenticated;
revoke insert on public.registrations from anon;
grant insert (kind, parent_name, phone, child_age, program, contact_method, message, consent) on public.registrations to anon;
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
select 'STEP 1 OK' as result;
