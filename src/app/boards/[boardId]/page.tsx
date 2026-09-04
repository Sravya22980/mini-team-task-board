import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import BoardView from "@/components/BoardView";

export default async function BoardPage({ params }: { params: { boardId: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user!.id)
    .single();

  // RLS returns null if the current user isn't a member of the board's team.
  const { data: board } = await supabase
    .from("boards")
    .select("id, name, team_id")
    .eq("id", params.boardId)
    .single();

  if (!board) notFound();

  const { data: lists } = await supabase
    .from("lists")
    .select("id, board_id, name, position, created_at")
    .eq("board_id", board.id)
    .order("position", { ascending: true });

  const listIds = (lists ?? []).map((l) => l.id);

  const { data: cards } = listIds.length
    ? await supabase
        .from("cards")
        .select("*")
        .in("list_id", listIds)
        .order("position", { ascending: true })
    : { data: [] };

  const { data: memberRows } = await supabase
    .from("team_members")
    .select("profiles:user_id(id, name, email, created_at)")
    .eq("team_id", board.team_id);

  const members = (memberRows ?? []).map((m: any) => m.profiles).filter(Boolean);

  return (
    <AppShell
      userId={user!.id}
      userName={profile?.name}
      userEmail={user?.email}
      title={board.name}
      fullWidth
    >
      <Link href={`/teams/${board.team_id}`} className="text-sm text-indigo-600 hover:underline">
        ← Back to team
      </Link>
      <div className="mt-2">
      <BoardView
        boardName={board.name}
        initialLists={lists ?? []}
        initialCards={cards ?? []}
        members={members}
        currentUserId={user!.id}
      />
      </div>
    </AppShell>
  );
}
