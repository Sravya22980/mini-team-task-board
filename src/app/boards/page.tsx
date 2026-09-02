import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import TeamFilterSelect from "@/components/TeamFilterSelect";
import BoardCard from "@/components/BoardCard";

export default async function BoardsPage({
  searchParams,
}: {
  searchParams: { team?: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user!.id)
    .single();

  // Teams the user belongs to (for the filter dropdown + team-name labels)
  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id, teams:team_id(id, name)")
    .eq("user_id", user!.id);

  const myTeams = (memberships ?? [])
    .map((m: any) => m.teams)
    .filter(Boolean);

  const teamIds = myTeams.map((t: any) => t.id);
  const teamsById = Object.fromEntries(myTeams.map((t: any) => [t.id, t.name]));

  const selectedTeam = searchParams.team;
  const effectiveTeamIds =
    selectedTeam && teamIds.includes(selectedTeam) ? [selectedTeam] : teamIds;

  const { data: boards } =
    effectiveTeamIds.length > 0
      ? await supabase
          .from("boards")
          .select("id, name, team_id, created_at")
          .in("team_id", effectiveTeamIds)
          .order("created_at", { ascending: false })
      : { data: [] };

  return (
    <AppShell
      userId={user!.id}
      userName={profile?.name}
      userEmail={user?.email}
      title="Boards"
      subtitle="All boards across your teams."
      actions={<TeamFilterSelect teams={myTeams} />}
    >
      {!boards || boards.length === 0 ? (
        <p className="text-sm text-gray-500">
          No boards yet. Open a team and create one from there.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {boards.map((board: any) => (
            <BoardCard
              key={board.id}
              board={board}
              teamName={teamsById[board.team_id] ?? "Team"}
            />
          ))}
        </ul>
      )}
    </AppShell>
  );
}