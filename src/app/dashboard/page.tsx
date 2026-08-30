import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import CreateTeamForm from "@/components/CreateTeamForm";
import JoinTeamForm from "@/components/JoinTeamForm";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user!.id)
    .single();

  // team_members -> teams via join; RLS already restricts to this user's rows
  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id, teams:team_id(id, name, invite_code)")
    .eq("user_id", user!.id);

  const teams = (memberships ?? [])
    .map((m: any) => m.teams)
    .filter(Boolean);

  return (
    <div>
      <Navbar userName={profile?.name} />

      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-gray-900">Your teams</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new team, or join one with an invite code from a teammate.
        </p>

        <div className="mt-6 grid gap-4 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-2">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-gray-700">Create a team</h2>
            <CreateTeamForm />
          </div>
          <div>
            <h2 className="mb-2 text-sm font-semibold text-gray-700">Join a team</h2>
            <JoinTeamForm />
          </div>
        </div>

        <div className="mt-8">
          {teams.length === 0 ? (
            <p className="text-sm text-gray-500">
              You're not on a team yet. Create one or join with an invite code above.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {teams.map((team: any) => (
                <li key={team.id}>
                  <Link
                    href={`/teams/${team.id}`}
                    className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:shadow-md"
                  >
                    <p className="font-medium text-gray-900">{team.name}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Invite code: <span className="font-mono">{team.invite_code}</span>
                    </p>
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
