// Hand-written types matching supabase/schema.sql.
// (If you prefer, generate these with `supabase gen types typescript`.)

export type Profile = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

export type Team = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
};

export type TeamMember = {
  team_id: string;
  user_id: string;
  joined_at: string;
};

export type Board = {
  id: string;
  team_id: string;
  name: string;
  created_by: string;
  created_at: string;
};

export type List = {
  id: string;
  board_id: string;
  name: string;
  position: number;
  created_at: string;
};

export type Card = {
  id: string;
  list_id: string;
  title: string;
  description: string | null;
  assignee: string | null;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

// Minimal Database type so @supabase/ssr generics compile without
// running `supabase gen types`. Replace with generated types anytime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
