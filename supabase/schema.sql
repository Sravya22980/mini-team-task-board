-- ============================================================
-- Mini Team Task Board — schema + Row Level Security policies
-- Run this whole file in the Supabase SQL editor.
-- ============================================================

-- Extensions we rely on (usually already enabled on Supabase)
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- PROFILES
-- One row per auth user. Created automatically on signup via trigger.
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

-- Trigger: create a profile row whenever a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- TEAMS
-- ------------------------------------------------------------
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;

-- Helper function: is the current user a member of a given team?
-- SECURITY DEFINER + a fixed search_path avoids recursive-RLS problems
-- (team_members policies would otherwise reference team_members again).
create or replace function public.is_team_member(target_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.team_members
    where team_id = target_team_id and user_id = auth.uid()
  );
$$;

-- Teams: only members can see a team's row
create policy "Members can view their teams"
  on public.teams for select
  to authenticated
  using (public.is_team_member(id));

-- Any logged-in user can create a team (they become the creator)
create policy "Authenticated users can create teams"
  on public.teams for insert
  to authenticated
  with check (created_by = auth.uid());

-- Team members: a user can see the membership rows for teams they belong to
create policy "Members can view team membership"
  on public.team_members for select
  to authenticated
  using (public.is_team_member(team_id));

-- A user can insert their own membership row (covers both "create team"
-- and "join team via invite code" flows, both done client-side)
create policy "Users can add themselves to a team"
  on public.team_members for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can leave a team"
  on public.team_members for delete
  to authenticated
  using (user_id = auth.uid());

-- ------------------------------------------------------------
-- BOARDS / LISTS / CARDS
-- ------------------------------------------------------------
create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  title text not null,
  description text default '',
  assignee uuid references public.profiles(id),
  due_date date,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.boards enable row level security;
alter table public.lists enable row level security;
alter table public.cards enable row level security;

-- Boards: visible/editable only to members of the owning team
create policy "Members can view team boards"
  on public.boards for select
  to authenticated
  using (public.is_team_member(team_id));

create policy "Members can create boards"
  on public.boards for insert
  to authenticated
  with check (public.is_team_member(team_id) and created_by = auth.uid());

create policy "Members can update boards"
  on public.boards for update
  to authenticated
  using (public.is_team_member(team_id));

create policy "Members can delete boards"
  on public.boards for delete
  to authenticated
  using (public.is_team_member(team_id));

-- Lists: gated through the board's team
create policy "Members can view lists"
  on public.lists for select
  to authenticated
  using (
    exists (
      select 1 from public.boards b
      where b.id = lists.board_id and public.is_team_member(b.team_id)
    )
  );

create policy "Members can create lists"
  on public.lists for insert
  to authenticated
  with check (
    exists (
      select 1 from public.boards b
      where b.id = lists.board_id and public.is_team_member(b.team_id)
    )
  );

create policy "Members can update lists"
  on public.lists for update
  to authenticated
  using (
    exists (
      select 1 from public.boards b
      where b.id = lists.board_id and public.is_team_member(b.team_id)
    )
  );

create policy "Members can delete lists"
  on public.lists for delete
  to authenticated
  using (
    exists (
      select 1 from public.boards b
      where b.id = lists.board_id and public.is_team_member(b.team_id)
    )
  );

-- Cards: gated through list -> board -> team
create policy "Members can view cards"
  on public.cards for select
  to authenticated
  using (
    exists (
      select 1 from public.lists l
      join public.boards b on b.id = l.board_id
      where l.id = cards.list_id and public.is_team_member(b.team_id)
    )
  );

create policy "Members can create cards"
  on public.cards for insert
  to authenticated
  with check (
    exists (
      select 1 from public.lists l
      join public.boards b on b.id = l.board_id
      where l.id = cards.list_id and public.is_team_member(b.team_id)
    )
  );

create policy "Members can update cards"
  on public.cards for update
  to authenticated
  using (
    exists (
      select 1 from public.lists l
      join public.boards b on b.id = l.board_id
      where l.id = cards.list_id and public.is_team_member(b.team_id)
    )
  );

create policy "Members can delete cards"
  on public.cards for delete
  to authenticated
  using (
    exists (
      select 1 from public.lists l
      join public.boards b on b.id = l.board_id
      where l.id = cards.list_id and public.is_team_member(b.team_id)
    )
  );

-- ------------------------------------------------------------
-- Convenience: join a team by invite code.
-- Needed because a non-member can't SELECT a team row under RLS,
-- so the lookup + membership insert has to happen inside a
-- SECURITY DEFINER function instead of two separate client calls.
-- ------------------------------------------------------------
create or replace function public.join_team_by_invite_code(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_team_id uuid;
begin
  select id into target_team_id
  from public.teams
  where invite_code = upper(p_invite_code);

  if target_team_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.team_members (team_id, user_id)
  values (target_team_id, auth.uid())
  on conflict (team_id, user_id) do nothing;

  return target_team_id;
end;
$$;

grant execute on function public.join_team_by_invite_code(text) to authenticated;

-- ------------------------------------------------------------
-- Convenience: create a board with the 3 default lists in one call
-- ------------------------------------------------------------
create or replace function public.create_board_with_defaults(
  p_team_id uuid,
  p_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_board_id uuid;
begin
  if not public.is_team_member(p_team_id) then
    raise exception 'not a team member';
  end if;

  insert into public.boards (team_id, name, created_by)
  values (p_team_id, p_name, auth.uid())
  returning id into new_board_id;

  insert into public.lists (board_id, name, position) values
    (new_board_id, 'To Do', 0),
    (new_board_id, 'In Progress', 1),
    (new_board_id, 'Done', 2);

  return new_board_id;
end;
$$;

grant execute on function public.create_board_with_defaults(uuid, text) to authenticated;
grant execute on function public.is_team_member(uuid) to authenticated;
