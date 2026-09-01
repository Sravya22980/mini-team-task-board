import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import CreateTeamForm from "@/components/CreateTeamForm";
import JoinTeamForm from "@/components/JoinTeamForm";
import TeamCard from "@/components/TeamCard";
import { UserPlus, ArrowRight } from "lucide-react";

const ICON_STYLES = [
  { bg: "bg-indigo-100", emoji: "🎓" },
  { bg: "bg-emerald-100", emoji: "🎁" },
  { bg: "bg-amber-100", emoji: "🚀" },
  { bg: "bg-sky-100", emoji: "📋" },
  { bg: "bg-pink-100", emoji: "✨" },
];

function iconFor(id: string) {
  const hash = Array.from(id).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return ICON_STYLES[hash % ICON_STYLES.length];
}

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
    .select(
      "team_id, teams:team_id(id, name, invite_code, created_at, created_by, creator:created_by(name))"
    )
    .eq("user_id", user!.id);

  const teams = (memberships ?? [])
    .map((m: any) => m.teams)
    .filter(Boolean);

  // Member counts per team (one query, grouped client-side since the
  // Supabase JS client doesn't support GROUP BY aggregates directly).
  const teamIds = teams.map((t: any) => t.id);
  let memberCounts: Record<string, number> = {};

  if (teamIds.length > 0) {
    const { data: allMembers } = await supabase
      .from("team_members")
      .select("team_id")
      .in("team_id", teamIds);

    memberCounts = (allMembers ?? []).reduce(
      (acc: Record<string, number>, row: any) => {
        acc[row.team_id] = (acc[row.team_id] ?? 0) + 1;
        return acc;
      },
      {}
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#F9F6FE" }}>
      <Navbar userName={profile?.name} userEmail={user?.email} />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900">Your teams</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new team, or join one with an invite code from a teammate.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">
                <UserPlus className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="font-semibold text-indigo-600">Create a team</h2>
                <p className="text-xs text-gray-500">
                  Start a new team and invite your teammates to collaborate.
                </p>
              </div>
            </div>
            <CreateTeamForm />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">
                <ArrowRight className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="font-semibold text-indigo-600">Join a team</h2>
                <p className="text-xs text-gray-500">
                  Enter an invite code to join an existing team.
                </p>
              </div>
            </div>
            <JoinTeamForm />
          </div>
        </div>

        <div className="mt-10">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Your Teams</h2>

          {teams.length === 0 ? (
            <p className="text-sm text-gray-500">
              You're not on a team yet. Create one or join with an invite code above.
            </p>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2">
              {teams.map((team: any) => (
                <TeamCard
                  key={team.id}
                  team={{
                    ...team,
                    memberCount: memberCounts[team.id] ?? 0,
                    creatorName: team.creator?.name ?? "Unknown",
                  }}
                  icon={iconFor(team.id)}
                  currentUserId={user!.id}
                />
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}