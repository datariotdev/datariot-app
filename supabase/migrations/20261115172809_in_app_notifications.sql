-- Persistent, recipient-only activity. Client code can only change is_read.
alter table public.notifications
  add constraint notifications_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade,
  add column actor_id uuid references public.profiles(id) on delete set null,
  add column post_id uuid references public.posts(id) on delete set null,
  add column comment_id uuid references public.comments(id) on delete set null,
  add column chat_id uuid references public.chats(id) on delete set null,
  add column source_key text unique;
alter table public.notifications drop constraint notifications_video_id_fkey;
alter table public.notifications add constraint notifications_video_id_fkey
  foreign key (video_id) references public.videos(id) on delete set null;
update public.notifications set is_read = false where is_read is null;
update public.notifications set created_at = now() where created_at is null;
alter table public.notifications
  alter column is_read set default false, alter column is_read set not null,
  alter column created_at set default now(), alter column created_at set not null;

create index notifications_recipient_history_idx on public.notifications(user_id, created_at desc, id desc);
create index notifications_unread_idx on public.notifications(user_id, created_at desc, id desc) where is_read = false;
create index notifications_actor_idx on public.notifications(actor_id);
create index notifications_post_idx on public.notifications(post_id);
create index notifications_comment_idx on public.notifications(comment_id);
create index notifications_chat_idx on public.notifications(chat_id);
create index notifications_video_idx on public.notifications(video_id);

alter table public.notifications enable row level security;
drop policy "Users can insert own notifications" on public.notifications;
drop policy "Users can read own notifications" on public.notifications;
revoke all on public.notifications from public, anon, authenticated;
grant select on public.notifications to authenticated;
grant update(is_read) on public.notifications to authenticated;
create policy notifications_select_own on public.notifications for select to authenticated
  using ((select auth.uid()) = user_id);
create policy notifications_read_own on public.notifications for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Existing app code uses follows.following_id; the actual table is followers.followed_id.
-- This automatically updatable view retains the underlying owner policies.
create view public.follows with (security_invoker = true) as
  select id, follower_id, followed_id as following_id, created_at from public.followers;
revoke all on public.follows from public, anon, authenticated;
grant select on public.follows to anon, authenticated;
grant insert, delete on public.follows to authenticated;

create schema if not exists private;

-- Invoked only by the trigger below, never exposed as an RPC.
create function private.enqueue_activity(
  recipient uuid, actor uuid, kind text, event_key text,
  target_post uuid default null, target_video uuid default null,
  target_comment uuid default null, target_chat uuid default null
) returns void language plpgsql security invoker set search_path = '' as $$
begin
  if actor is distinct from (select auth.uid()) or actor is null
     or recipient is null or recipient = actor then return; end if;
  if not exists (select 1 from auth.users where id = recipient) then return; end if;
  insert into public.notifications(user_id, actor_id, type, title, post_id, video_id, comment_id, chat_id, source_key)
  values (recipient, actor, kind,
    case kind when 'follow' then 'started following you'
      when 'video_like' then 'liked your video' when 'post_like' then 'liked your post'
      when 'comment_like' then 'liked your comment' when 'comment' then 'commented on your content'
      when 'reply' then 'replied to your comment' when 'message' then 'sent you a message' end,
    target_post, target_video, target_comment, target_chat, event_key || ':' || recipient::text)
  on conflict (source_key) do nothing;
end;
$$;
revoke all on function private.enqueue_activity(uuid,uuid,text,text,uuid,uuid,uuid,uuid) from public, anon, authenticated, service_role;

-- Definer privileges are needed to deliver to OTHER users; no client gets INSERT.
-- Identity checks, a locked search_path and revoked EXECUTE keep this trigger internal.
create function private.notify_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid;
  recipient uuid;
  parent_recipient uuid;
  target_post uuid;
  target_video uuid;
  participant record;
begin
  if tg_table_name = 'followers' then actor := new.follower_id;
  elsif tg_table_name = 'messages' then actor := new.sender_id;
  else actor := new.user_id; end if;
  if actor is null or actor is distinct from (select auth.uid()) then return new; end if;

  if tg_table_name = 'followers' then
    perform private.enqueue_activity(new.followed_id, actor, 'follow', 'follow:' || actor || ':' || new.followed_id);
  elsif tg_table_name = 'likes' then
    select user_id into recipient from public.videos where id = new.video_id;
    perform private.enqueue_activity(recipient, actor, 'video_like', 'video_like:' || actor || ':' || new.video_id,
      target_video => new.video_id);
  elsif tg_table_name = 'post_likes' then
    select user_id into recipient from public.posts where id = new.post_id;
    perform private.enqueue_activity(recipient, actor, 'post_like', 'post_like:' || actor || ':' || new.post_id,
      target_post => new.post_id);
  elsif tg_table_name = 'comment_likes' then
    select user_id, post_id, video_id into recipient, target_post, target_video
      from public.comments where id = new.comment_id;
    perform private.enqueue_activity(recipient, actor, 'comment_like', 'comment_like:' || actor || ':' || new.comment_id,
      target_post, target_video, new.comment_id);
  elsif tg_table_name = 'comments' then
    if new.post_id is not null then
      select user_id into recipient from public.posts where id = new.post_id;
    elsif new.video_id is not null then
      select user_id into recipient from public.videos where id = new.video_id;
    end if;
    select user_id into parent_recipient from public.comments
      where id = coalesce(new.parent_id, new.parent_comment_id)
        and post_id is not distinct from new.post_id and video_id is not distinct from new.video_id;
    if parent_recipient is not null then
      perform private.enqueue_activity(parent_recipient, actor, 'reply', 'reply:' || new.id,
        new.post_id, new.video_id, new.id);
    end if;
    if recipient is distinct from parent_recipient then
      perform private.enqueue_activity(recipient, actor, 'comment', 'comment:' || new.id,
        new.post_id, new.video_id, new.id);
    end if;
  elsif tg_table_name = 'messages' then
    if not exists (select 1 from public.chat_participants where chat_id = new.chat_id and user_id = actor) then return new; end if;
    for participant in select user_id from public.chat_participants where chat_id = new.chat_id and user_id <> actor loop
      -- Message text stays in the participant-protected messages table.
      perform private.enqueue_activity(participant.user_id, actor, 'message', 'message:' || new.id, target_chat => new.chat_id);
    end loop;
  end if;
  return new;
end;
$$;
revoke all on function private.notify_activity() from public, anon, authenticated, service_role;

create trigger activity_notification after insert on public.followers for each row execute function private.notify_activity();
create trigger activity_notification after insert on public.likes for each row execute function private.notify_activity();
create trigger activity_notification after insert on public.post_likes for each row execute function private.notify_activity();
create trigger activity_notification after insert on public.comment_likes for each row execute function private.notify_activity();
create trigger activity_notification after insert on public.comments for each row execute function private.notify_activity();
create trigger activity_notification after insert on public.messages for each row execute function private.notify_activity();

alter publication supabase_realtime add table public.notifications;
