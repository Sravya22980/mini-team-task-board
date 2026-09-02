import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import CreateBoardForm from "@/components/CreateBoardForm";
import { ArrowLeft, KanbanSquare, Users } from "lucide-react";

export default async function TeamPage({ params }: { params: { teamId: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user!.id)
    .single();

  // RLS makes this return null/empty if the user isn't a member of the team.
  const { data: team } = await supabase
    .from("teams")
    .select("id, name, invite_code")
    .eq("id", params.teamId)
    .single();

  if (!team) notFound();

  const { data: boards } = await supabase
    .from("boards")
    .select("id, name, created_at")
    .eq("team_id", team.id)
    .order("created_at", { ascending: true });

  const { count: memberCount } = await supabase
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", team.id);

  return (
    <AppShell
      userId={user!.id}
      userName={profile?.name}
      userEmail={user?.email}
      title={team.name}
      subtitle={`Invite code: ${team.invite_code}`}
    >
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        All teams
      </Link>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 font-semibold text-gray-900">New board</h2>
        <CreateBoardForm teamId={team.id} />
      </div>

      <div className="mt-8">
        {!boards || boards.length === 0 ? (
          <p className="text-sm text-gray-500">No boards yet. Create the first one above.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {boards.map((board) => (
              <li key={board.id}>
                <Link
                  href={`/boards/${board.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
                    <KanbanSquare className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{board.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                      <Users className="h-3.5 w-3.5" />
                      {memberCount ?? "—"} members
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
