import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import { CheckCircle2, Circle } from "lucide-react";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default async function ActivityPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user!.id)
    .single();

  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user!.id);

  const teamIds = (memberships ?? []).map((m: any) => m.team_id);

  const { data: boards } = teamIds.length
    ? await supabase.from("boards").select("id, name").in("team_id", teamIds)
    : { data: [] };
  const boardIds = (boards ?? []).map((b: any) => b.id);
  const boardsById = Object.fromEntries((boards ?? []).map((b: any) => [b.id, b.name]));

  const { data: lists } = boardIds.length
    ? await supabase.from("lists").select("id, name, board_id").in("board_id", boardIds)
    : { data: [] };
  const listIds = (lists ?? []).map((l: any) => l.id);
  const listsById = Object.fromEntries((lists ?? []).map((l: any) => [l.id, l]));

  const { data: cards } = listIds.length
    ? await supabase
        .from("cards")
        .select("id, title, assignee, list_id, updated_at")
        .in("list_id", listIds)
        .order("updated_at", { ascending: false })
        .limit(60)
    : { data: [] };

  const assigneeIds = Array.from(
    new Set((cards ?? []).map((c: any) => c.assignee).filter(Boolean))
  );
  const { data: assignees } = assigneeIds.length
    ? await supabase.from("profiles").select("id, name").in("id", assigneeIds)
    : { data: [] };
  const assigneesById = Object.fromEntries((assignees ?? []).map((a: any) => [a.id, a.name]));

  function context(listId: string) {
    const list = listsById[listId];
    const boardName = list ? boardsById[list.board_id] : undefined;
    return { listName: list?.name ?? "—", boardName: boardName ?? "Board" };
  }

  const pending = (cards ?? []).filter((c: any) => listsById[c.list_id]?.name !== "Done");
  const completed = (cards ?? []).filter((c: any) => listsById[c.list_id]?.name === "Done");

  function CardRow({ card }: { card: any }) {
    const { listName, boardName } = context(card.list_id);
    const isDone = listName === "Done";
    return (
      <li className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-3">
        {isDone ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
        ) : (
          <Circle className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">{card.title}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {boardName} · {listName}
            {card.assignee && <> · {assigneesById[card.assignee] ?? "Someone"}</>}
          </p>
        </div>
        <span className="shrink-0 text-xs text-gray-400">{timeAgo(card.updated_at)}</span>
      </li>
    );
  }

  return (
    <AppShell
      userId={user!.id}
      userName={profile?.name}
      userEmail={user?.email}
      title="Activity"
      subtitle="Pending and completed tasks across all your teams."
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Circle className="h-4 w-4 text-gray-300" />
            Pending ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <p className="text-sm text-gray-400">Nothing pending right now.</p>
          ) : (
            <ul className="space-y-2">
              {pending.map((c: any) => (
                <CardRow key={c.id} card={c} />
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Completed ({completed.length})
          </h2>
          {completed.length === 0 ? (
            <p className="text-sm text-gray-400">Nothing completed yet.</p>
          ) : (
            <ul className="space-y-2">
              {completed.map((c: any) => (
                <CardRow key={c.id} card={c} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
