import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import CalendarView from "@/components/CalendarView";

export default async function CalendarPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user!.id)
    .single();

  const { data: myCards } = await supabase
    .from("cards")
    .select("id, title, due_date, list_id")
    .eq("assignee", user!.id)
    .not("due_date", "is", null);

  const listIds = Array.from(new Set((myCards ?? []).map((c: any) => c.list_id)));
  const { data: lists } = listIds.length
    ? await supabase.from("lists").select("id, board_id").in("id", listIds)
    : { data: [] };
  const listsById = Object.fromEntries((lists ?? []).map((l: any) => [l.id, l]));

  const boardIds = Array.from(new Set((lists ?? []).map((l: any) => l.board_id)));
  const { data: boards } = boardIds.length
    ? await supabase.from("boards").select("id, name").in("id", boardIds)
    : { data: [] };
  const boardsById = Object.fromEntries((boards ?? []).map((b: any) => [b.id, b.name]));

  const tasks = (myCards ?? []).map((c: any) => {
    const list = listsById[c.list_id];
    return {
      id: c.id,
      title: c.title,
      due_date: c.due_date,
      boardId: list?.board_id ?? "",
      boardName: boardsById[list?.board_id] ?? "Board",
    };
  });

  return (
    <AppShell
      userId={user!.id}
      userName={profile?.name}
      userEmail={user?.email}
      title="Calendar"
      subtitle="Your tasks, laid out by due date."
    >
      <CalendarView tasks={tasks} />
    </AppShell>
  );
}
