-- Local RLS test. Run against a database with mock_supabase.sql + migrations applied.
\set ON_ERROR_STOP 0
insert into auth.users (id, email) values
 ('00000000-0000-0000-0000-00000000000a','owner@test'),
 ('00000000-0000-0000-0000-00000000000b','admin@test'),
 ('00000000-0000-0000-0000-00000000000c','emp@test'),
 ('00000000-0000-0000-0000-00000000000d','pending@test');
select public.make_owner('owner@test') as make_owner;
update profiles set role='admin' where email='admin@test';
update profiles set role='employee', permissions='{"gallery":true}' where email='emp@test';
insert into programs (slug,title,is_published) values ('pub','Published',true),('draft','Draft',false);

create or replace function t(label text, ok boolean) returns void language plpgsql as $$
begin raise notice '% %', case when ok then 'PASS' else 'FAIL' end, label; end $$;
grant execute on function t(text,boolean) to anon, authenticated;

-- anon
set role anon; select set_config('request.jwt.claim.sub','',false);
select t('anon sees only published programs', (select count(*) from programs)=1);
select t('anon reads settings', (select count(*) from site_settings)=1);
insert into registrations (parent_name,phone,consent) values ('Олена','+380671234567',true);
select t('anon cannot read registrations', (select count(*) from registrations)=0);
insert into registrations (parent_name,phone,consent,status) values ('Hack','+380671234567',true,'done'); -- must fail (column grant)
insert into registrations (parent_name,phone,consent) values ('Олена','+380671234567',false); -- must fail
insert into registrations (parent_name,phone,consent) values ('X','abc',true); -- must fail
update programs set title='hacked'; 
insert into programs (slug,title) values ('x','x'); -- must fail
reset role;
select t('anon program update had no effect', (select count(*) from programs where title='hacked')=0);

-- pending
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000d',false);
select t('pending sees only published', (select count(*) from programs)=1);
update profiles set role='owner' where id=auth.uid(); -- must fail
insert into change_requests (title) values ('pending try'); -- must fail
reset role;
select t('pending stays pending', (select role from profiles where email='pending@test')='pending');

-- employee
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000c',false);
select t('employee sees drafts (preview)', (select count(*) from programs)=2);
insert into programs (slug,title) values ('emp','Emp'); -- must fail
insert into change_requests (title,message,target_table,payload) values ('Нова група з грудня','Додати групу','programs','{"title":"Група"}');
select t('employee sees own request', (select count(*) from change_requests)=1);
update change_requests set status='published'; 
insert into gallery_photos (url, is_published) values ('u1', false);
insert into gallery_photos (url, is_published) values ('u2', true); -- must fail
select t('employee cannot read registrations', (select count(*) from registrations)=0);
insert into storage.objects (bucket_id,name) values ('media','e.webp');
update profiles set full_name='Марія' where id=auth.uid();
reset role;
select t('employee request still pending', (select status from change_requests limit 1)='pending');
select t('employee uploaded 1 draft photo', (select count(*) from gallery_photos)=1);
select t('employee storage upload ok', (select count(*) from storage.objects)=1);
select t('employee can set own name', (select full_name from profiles where email='emp@test')='Марія');

-- admin
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
insert into programs (slug,title,is_published) values ('adm','Admin prog',true);
select t('admin reads registrations', (select count(*) from registrations)=1);
update registrations set status='done';
select t('admin cannot read requests by default', (select count(*) from change_requests)=0);
update site_settings set data='{"x":1}';
update profiles set role='owner' where id=auth.uid(); -- must fail
reset role;
select t('admin created program', (select count(*) from programs where slug='adm')=1);
select t('admin processed registration', (select status from registrations limit 1)='done');
select t('admin cannot edit settings by default', (select data from site_settings)='{}'::jsonb);

-- owner
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
update profiles set permissions='{"settings":true}' where email='admin@test';
update change_requests set status='published', reviewer_note='ok';
update site_settings set data='{"phone":"1"}';
select t('owner dashboard counts', (dashboard_counts()->>'requests_pending')::int = 0);
update profiles set role='admin' where id=auth.uid(); -- must fail (last owner)
delete from registrations;
reset role;
select t('owner published request', (select status from change_requests limit 1)='published');
select t('reviewer recorded', (select reviewer_id from change_requests limit 1)='00000000-0000-0000-0000-00000000000a');
select t('owner edited settings', (select data->>'phone' from site_settings)='1');
select t('still one owner', (select count(*) from profiles where role='owner')=1);
select t('owner deleted registrations', (select count(*) from registrations)=0);

set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
update site_settings set data='{"phone":"2"}';
reset role;
select t('admin edits settings after owner grant', (select data->>'phone' from site_settings)='2');
select t('activity log written', (select count(*) from activity_log) > 3);

-- rate limit
set role anon; select set_config('request.jwt.claim.sub','',false);
insert into registrations (parent_name,phone,consent) values ('Ан','+380 50 000 00 01',true);
insert into registrations (parent_name,phone,consent) values ('Ab','+380500000001',true);
insert into registrations (parent_name,phone,consent) values ('Ab','+380500000001',true);
insert into registrations (parent_name,phone,consent) values ('Ab','+380500000001',true); -- must fail
reset role;
select t('rate limit keeps 3', (select count(*) from registrations)=3);
-- children consent
insert into gallery_photos (url, is_published, children_visible) values ('c', true, true); -- must fail
