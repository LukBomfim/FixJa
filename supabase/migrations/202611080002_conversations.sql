create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint conversations_distinct_participants check (client_id <> provider_id),
  constraint conversations_unique_participants unique (client_id, provider_id)
);

create table if not exists public.conversation_messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 5000),
  sent_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists conversations_client_id_idx
  on public.conversations (client_id, created_at desc);
create index if not exists conversations_provider_id_idx
  on public.conversations (provider_id, created_at desc);
create index if not exists conversation_messages_history_idx
  on public.conversation_messages (conversation_id, sent_at desc);

grant select, insert on public.conversations to authenticated;
grant select, insert, update on public.conversation_messages to authenticated;
grant usage on sequence public.conversation_messages_id_seq to authenticated;

alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;

create or replace function public.chat_profile_has_type(profile_id uuid, profile_type text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = profile_id and tipo = profile_type
  );
$$;

revoke all on function public.chat_profile_has_type(uuid, text) from public;
grant execute on function public.chat_profile_has_type(uuid, text) to authenticated;

drop policy if exists conversations_participant_select on public.conversations;
create policy conversations_participant_select
  on public.conversations for select to authenticated
  using (auth.uid() in (client_id, provider_id));

drop policy if exists conversations_client_create on public.conversations;
create policy conversations_client_create
  on public.conversations for insert to authenticated
  with check (
    auth.uid() = client_id
    and public.chat_profile_has_type(client_id, 'CLIENTE')
    and public.chat_profile_has_type(provider_id, 'PRESTADOR')
  );

drop policy if exists conversation_messages_participant_select on public.conversation_messages;
create policy conversation_messages_participant_select
  on public.conversation_messages for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and auth.uid() in (c.client_id, c.provider_id)
    )
  );

drop policy if exists conversation_messages_participant_insert on public.conversation_messages;
create policy conversation_messages_participant_insert
  on public.conversation_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and auth.uid() in (c.client_id, c.provider_id)
    )
  );

drop policy if exists conversation_messages_recipient_update on public.conversation_messages;
create policy conversation_messages_recipient_update
  on public.conversation_messages for update to authenticated
  using (
    sender_id <> auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and auth.uid() in (c.client_id, c.provider_id)
    )
  )
  with check (sender_id <> auth.uid());

create or replace function public.protect_conversation_message_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.id <> old.id
    or new.conversation_id <> old.conversation_id
    or new.sender_id <> old.sender_id
    or new.body <> old.body
    or new.sent_at <> old.sent_at
    or old.sender_id = auth.uid()
    or new.read_at is null then
    raise exception 'Only recipients may mark messages as read.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_conversation_message_update
  on public.conversation_messages;
create trigger protect_conversation_message_update
  before update on public.conversation_messages
  for each row execute function public.protect_conversation_message_update();

do $$
begin
  alter publication supabase_realtime add table public.conversation_messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

notify pgrst, 'reload schema';
