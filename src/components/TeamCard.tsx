"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Trash2, Users } from "lucide-react";
import TeamManageModal from "./TeamManageModal";

type Team = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  created_by: string;
  creatorName: string;
  memberCount: number;
};

type Icon = { bg: string; emoji: string };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TeamCard({
  team,
  icon,
  currentUserId,
}: {
  team: Team;
  icon: Icon;
  currentUserId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const isOwner = team.created_by === currentUserId;

  const [isManaging, setIsManaging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("teams").delete().eq("id", team.id);
    setSaving(false);
    if (error) {
      setError("Couldn't delete team.");
      setIsDeleting(false);
      return;
    }
    router.refresh();
  }

  return (
    <li className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="h-1 w-full bg-indigo-500" />
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ${icon.bg}`}
            >
              {icon.emoji}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{team.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                <Users className="h-3.5 w-3.5" />
                {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
                <span className="mx-1">·</span>
                Created on {formatDate(team.created_at)}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                Created by {isOwner ? "you" : team.creatorName}
              </p>
            </div>
          </div>

          {isOwner && (
            <div className="flex shrink-0 gap-1.5">
              <button
                onClick={() => setIsManaging(true)}
                aria-label="Manage team"
                className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 hover:text-indigo-600"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsDeleting(true)}
                aria-label="Delete team"
                className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

        {isDeleting && isOwner ? (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
            <p className="text-xs font-medium text-red-700">Delete this team?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsDeleting(false)}
                disabled={saving}
                className="rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {saving ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
            <div>
              <span className="px-1 py-1 font-mono text-xs text-gray-600">Invite code: </span>
              <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600">
                {team.invite_code}
              </span>
            </div>
            <Link
              href={`/teams/${team.id}`}
              className="rounded-lg border border-indigo-200 px-4 py-1.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50"
            >
              View boards
            </Link>
          </div>
        )}
      </div>

      {isManaging && (
        <TeamManageModal
          teamId={team.id}
          teamName={team.name}
          currentUserId={currentUserId}
          onClose={() => setIsManaging(false)}
        />
      )}
    </li>
  );
}