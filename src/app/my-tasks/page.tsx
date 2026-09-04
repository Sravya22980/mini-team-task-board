import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import CardItem from "@/components/CardItem";
import ColumnEmptyState from "@/components/ColumnEmptyState";
import { MoreVertical } from "lucide-react";
import { columnTheme, type ColumnVariant } from "@/lib/columnTheme";
import type { Card, Profile } from "@/lib/types";

const COLUMNS: { key: ColumnVariant; title: string }[] = [
  { key: "todo", title: "To Do" },
  { key: "progress", title: "In Progress" },
  { key: "done", title: "Done" },
];

function variantFromListName(name: string) {
  return columnTheme(name).variant;
}

export default async function MyTasksPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, created_at")
    .eq("id", user!.id)
    .single();

  const { data: myCards } = await supabase
    .from("cards")
    .select("*")
    .eq("assignee", user!.id)
    .order("position", { ascending: true });

  const listIds = Array.from(new Set((myCards ?? []).map((c: any) => c.list_id)));
  const { data: lists } = listIds.length
    ? await supabase.from("lists").select("id, name, board_id").in("id", listIds)
    : { data: [] };
  const listsById = Object.fromEntries((lists ?? []).map((l: any) => [l.id, l]));

  const currentUser: Profile | undefined = profile
    ? {
        id: user!.id,
        name: profile.name,
        email: profile.email ?? user?.email ?? "",
        created_at: profile.created_at,
      }
    : undefined;

  const grouped: Record<ColumnVariant, Card[]> = {
    todo: [],
    progress: [],
    done: [],
  };

  for (const card of myCards ?? []) {
    const list = listsById[card.list_id];
    grouped[variantFromListName(list?.name ?? "To Do")].push(card as Card);
  }

  return (
    <AppShell
      userId={user!.id}
      userName={profile?.name}
      userEmail={user?.email}
      title="My Tasks"
      subtitle="Every task assigned to you, across all your teams."
      fullWidth
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const theme = columnTheme(col.title);
          const cards = grouped[col.key];

          return (
            <div
              key={col.key}
              className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              <div className={`h-1.5 w-full ${theme.bar}`} />
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-semibold text-gray-900">{col.title}</h3>
                  <span
                    className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${theme.badge}`}
                  >
                    {cards.length}
                  </span>
                </div>
                <MoreVertical className="h-4 w-4 text-gray-400" />
              </div>

              <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
                {cards.length === 0 ? (
                  <ColumnEmptyState
                    variant={theme.variant}
                    title={theme.emptyTitle}
                    subtitle={theme.emptySub}
                  />
                ) : (
                  cards.map((card, index) => {
                    const list = listsById[card.list_id];
                    const boardId = list?.board_id;
                    return (
                      <Link key={card.id} href={boardId ? `/boards/${boardId}` : "/boards"}>
                        <CardItem
                          card={card}
                          index={index}
                          assignee={currentUser}
                          onClick={() => {}}
                          dragDisabled
                        />
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}