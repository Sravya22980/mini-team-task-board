import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import CreateBoardForm from "@/components/CreateBoardForm";

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

  return (
    <div>
      <Navbar userName={profile?.name} />

      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/dashboard" className="text-sm text-brand-600 hover:underline">
          ← All teams
        </Link>

        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">{team.name}</h1>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
            Invite code: <span className="font-mono font-medium">{team.invite_code}</span>
          </span>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-gray-700">New board</h2>
          <CreateBoardForm teamId={team.id} />
        </div>

        <div className="mt-8">
          {!boards || boards.length === 0 ? (
            <p className="text-sm text-gray-500">No boards yet. Create the first one above.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {boards.map((board) => (
                <li key={board.id}>
                  <Link
                    href={`/boards/${board.id}`}
                    className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:shadow-md"
                  >
                    <p className="font-medium text-gray-900">{board.name}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
