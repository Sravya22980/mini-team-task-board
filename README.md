# Mini Team Task Board

A small Trello-style task board built with Next.js (App Router), TypeScript, Tailwind CSS,
and Supabase (Auth + Postgres + Row Level Security).

## Features

- **Auth** — email/password sign up and log in via Supabase Auth. Logged-out users are
  redirected away from every page except `/login` and `/signup` (enforced in middleware).
  A `profiles` row is created automatically for every new user via a database trigger.
- **Teams** — create a team (generates a unique invite code) or join one by entering a code.
  A user can belong to more than one team.
- **Boards, Lists, Cards** — each team can create boards; every new board starts with
  **To Do / In Progress / Done** lists. Cards have a title, description, assignee, and due
  date, and can be created, edited, deleted, and dragged between lists.
- **Row Level Security** — every table (`teams`, `team_members`, `boards`, `lists`, `cards`)
  has RLS policies so a user can only ever read or write data belonging to a team they are a
  member of. This is enforced in the database, not just hidden in the UI.

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- `@hello-pangea/dnd` for drag-and-drop cards

## Project structure

```
src/
  app/
    login/, signup/              # auth pages
    auth/callback/route.ts       # handles email-confirmation redirect
    dashboard/                   # list + create/join teams
    teams/[teamId]/              # a team's boards
    boards/[boardId]/            # a single board (lists + cards)
  components/                    # forms, board UI, card modal
  lib/
    supabase/client.ts           # browser Supabase client
    supabase/server.ts           # server-component Supabase client
    supabase/middleware.ts       # session refresh + route protection
    types.ts                     # shared TS types
  middleware.ts
supabase/
  schema.sql                     # tables, RLS policies, helper functions
```

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, and grab:
- Project URL
- `anon` public API key

(Settings → API in the Supabase dashboard.)

### 2. Run the schema

Open the Supabase SQL Editor and run the entire contents of `supabase/schema.sql`.
This creates all tables, the `profiles`-on-signup trigger, and every RLS policy.

By default Supabase requires email confirmation for new signups. For faster local testing
you can turn this off under **Authentication → Providers → Email → Confirm email**.

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Install and run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` — you'll be redirected to `/signup`.

### 5. Deploy

Push to GitHub, import the repo into [Vercel](https://vercel.com), and add the same two
environment variables in the Vercel project settings. Deploy.

## How the pieces fit together

1. **Sign up** → Supabase Auth creates the user → a DB trigger inserts a matching row into
   `profiles`.
2. **Create a team** → inserts into `teams`, then inserts the creator into `team_members`.
3. **Join a team** → calls the `join_team_by_invite_code` Postgres function (SECURITY
   DEFINER), since a non-member can't `SELECT` a team row to find its ID under RLS.
4. **Create a board** → calls `create_board_with_defaults`, which creates the board and its
   three default lists in one transaction.
5. **Cards** → plain CRUD against the `cards` table; dragging a card updates its `list_id`
   and `position`, with an optimistic UI update on the client and a background write to
   Supabase.

All of the above are gated by RLS policies keyed off team membership — a user without a
`team_members` row for a given team gets zero rows back from `teams`, `boards`, `lists`, and
`cards` for that team, no matter what the client asks for.

## Who did what

_(Fill this in with your team's actual contributions before submitting.)_

- **Person A** — Auth pages, middleware/session handling
- **Person B** — Database schema and RLS policies
- **Person C** — Teams (create/join) UI and dashboard
- **Person D** — Board view, drag-and-drop, card modal

## Known limitations / next steps

- No email invites — invite codes are shared manually.
- No real-time sync between teammates viewing the same board (Supabase Realtime could be
  added to `lists`/`cards` subscriptions).
- No board/list deletion UI from the team page (lists are only editable via SQL for now,
  though the RLS policies already support it).
