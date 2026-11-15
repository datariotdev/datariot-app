-- Execute as postgres against the migrated project. All fixtures roll back.
begin;
create temporary table notification_fixtures as
select gen_random_uuid() as alice, gen_random_uuid() as bob, gen_random_uuid() as outsider,
  gen_random_uuid() as post_id, gen_random_uuid() as video_id, gen_random_uuid() as parent_id, gen_random_uuid() as chat_id;
grant select on notification_fixtures to authenticated;
insert into auth.users(id, email, raw_user_meta_data)
select id, 'notification-test-' || id || '@example.invalid', jsonb_build_object('username', 'notification_test_' || replace(id::text, '-', ''))
from notification_fixtures f cross join lateral unnest(array[f.alice,f.bob,f.outsider]) id;
insert into public.posts(id, user_id, content, is_published) select post_id, alice, 'Notification test', true from notification_fixtures;
insert into public.videos(id, user_id, url) select video_id, alice, 'https://example.invalid/test.mp4' from notification_fixtures;
insert into public.comments(id, post_id, user_id, text) select parent_id, post_id, alice, 'Parent' from notification_fixtures;
insert into public.chats(id) select chat_id from notification_fixtures;
insert into public.chat_participants(chat_id, user_id)
select f.chat_id, id from notification_fixtures f cross join lateral unnest(array[f.alice,f.bob]) id;

select set_config('request.jwt.claims', jsonb_build_object('sub',bob,'role','authenticated')::text, true) from notification_fixtures;
set local role authenticated;
insert into public.follows(follower_id,following_id) select bob,alice from notification_fixtures;
insert into public.follows(follower_id,following_id) select bob,alice from notification_fixtures;
insert into public.post_likes(user_id,post_id) select bob,post_id from notification_fixtures;
delete from public.post_likes where user_id = (select bob from notification_fixtures) and post_id = (select post_id from notification_fixtures);
insert into public.post_likes(user_id,post_id) select bob,post_id from notification_fixtures;
insert into public.likes(user_id,video_id) select bob,video_id from notification_fixtures;
insert into public.comment_likes(user_id,comment_id) select bob,parent_id from notification_fixtures;
insert into public.comments(user_id,post_id,text) select bob,post_id,'Comment' from notification_fixtures;
insert into public.comments(user_id,post_id,parent_id,text) select bob,post_id,parent_id,'Reply' from notification_fixtures;
insert into public.messages(chat_id,sender_id,content) select chat_id,bob,'Private test message' from notification_fixtures;
reset role;

do $$ begin
  if (select count(*) from public.notifications where user_id = (select alice from notification_fixtures)) <> 7
    then raise exception 'Expected exactly seven deduplicated activity kinds'; end if;
  if (select count(distinct type) from public.notifications where user_id = (select alice from notification_fixtures)) <> 7
    then raise exception 'Missing notification kind'; end if;
  if exists (select 1 from public.notifications where user_id = (select alice from notification_fixtures) and body like '%Private test message%')
    then raise exception 'Message content leaked into notification payload'; end if;
end $$;

select set_config('request.jwt.claims', jsonb_build_object('sub',alice,'role','authenticated')::text, true) from notification_fixtures;
set local role authenticated;
-- Self-interactions must not create notifications.
insert into public.post_likes(user_id,post_id) select alice,post_id from notification_fixtures;
do $$ begin
  if (select count(*) from public.notifications) <> 7 then raise exception 'Owner visibility or self-notification check failed'; end if;
  begin
    insert into public.notifications(user_id,type) values (auth.uid(),'forged');
    raise exception 'Clients can forge notifications';
  exception when insufficient_privilege then null; end;
  begin
    update public.notifications set title = 'tampered';
    raise exception 'Clients can rewrite notification payloads';
  exception when insufficient_privilege then null; end;
end $$;
update public.notifications set is_read = true where type = 'follow';
do $$ begin
  if (select count(*) from public.notifications where is_read) <> 1 then raise exception 'Read persistence failed'; end if;
end $$;
reset role;

select set_config('request.jwt.claims', jsonb_build_object('sub',outsider,'role','authenticated')::text, true) from notification_fixtures;
set local role authenticated;
do $$ declare changed integer; begin
  if exists (select 1 from public.notifications) then raise exception 'Cross-user notification leak'; end if;
  update public.notifications set is_read = true;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Cross-user update permitted'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
  begin
    perform id from public.notifications;
    raise exception 'Anonymous notification access permitted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- Deleting content must not be blocked by notification references.
delete from public.videos where id = (select video_id from notification_fixtures);
do $$ begin
  if exists (select 1 from public.notifications where user_id = (select alice from notification_fixtures) and type = 'video_like' and video_id is not null)
    then raise exception 'Deleted-video target was not cleared'; end if;
end $$;

select 'PASS: 7 activity kinds; deduplication; no self-notifications; recipient-only reads/updates; payload/insert/anon denial; deleted-content references' as result;
rollback;
