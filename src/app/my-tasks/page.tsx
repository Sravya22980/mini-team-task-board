import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import { CalendarDays } from "lucide-react";

function isOverdue(dueDate: string | null) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export default async function MyTasksPage() {
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
    .select("id, title, description, due_date, list_id")
    .eq("assignee", user!.id);

  const listIds = Array.from(new Set((myCards ?? []).map((c: any) => c.list_id)));
  const { data: lists } = listIds.length
    ? await supabase.from("lists").select("id, name, board_id").in("id", listIds)
    : { data: [] };
  const listsById = Object.fromEntries((lists ?? []).map((l: any) => [l.id, l]));

  const boardIds = Array.from(new Set((lists ?? []).map((l: any) => l.board_id)));
  const { data: boards } = boardIds.length
    ? await supabase.from("boards").select("id, name").in("id", boardIds)
    : { data: [] };
  const boardsById = Object.fromEntries((boards ?? []).map((b: any) => [b.id, b.name]));

  const tasks = (myCards ?? [])
    .map((c: any) => {
      const list = listsById[c.list_id];
      return {
        ...c,
        listName: list?.name ?? "—",
        boardId: list?.board_id,
        boardName: boardsById[list?.board_id] ?? "Board",
      };
    })
    .sort((a: any, b: any) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

  return (
    <AppShell
      userId={user!.id}
      userName={profile?.name}
      userEmail={user?.email}
      title="My Tasks"
      subtitle="Every task assigned to you, across all your teams."
    >
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500">No tasks assigned to you yet.</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((t: any) => (
            <li key={t.id}>
              <Link
                href={`/boards/${t.boardId}`}
                className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{t.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {t.boardName} · {t.listName}
                  </p>
                </div>
                {t.due_date && (
                  <span
                    className={`ml-3 flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      isOverdue(t.due_date)
                        ? "bg-red-50 text-red-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(t.due_date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
