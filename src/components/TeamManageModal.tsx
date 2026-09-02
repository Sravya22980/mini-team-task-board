"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { X, Trash2 } from "lucide-react";

type Member = {
  id: string;
  name: string;
  email: string;
};

export default function TeamManageModal({
  teamId,
  teamName,
  currentUserId,
  onClose,
}: {
  teamId: string;
  teamName: string;
  currentUserId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(teamName);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMembers() {
      setLoadingMembers(true);
      const { data } = await supabase
        .from("team_members")
        .select("user_id, profiles:user_id(id, name, email)")
        .eq("team_id", teamId);

      const list = (data ?? [])
        .map((row: any) => row.profiles)
        .filter(Boolean) as Member[];

      setMembers(list);
      setLoadingMembers(false);
    }
    loadMembers();
  }, [teamId]);

  async function handleSaveName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === teamName) return;

    setSavingName(true);
    setError(null);
    const { error } = await supabase
      .from("teams")
      .update({ name: trimmed })
      .eq("id", teamId);
    setSavingName(false);

    if (error) {
      setError("Couldn't rename team.");
      return;
    }
    router.refresh();
  }

  async function handleRemoveMember(memberId: string) {
    setRemovingId(memberId);
    setError(null);
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", memberId);
    setRemovingId(null);

    if (error) {
      setError("Couldn't remove that member.");
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Manage team</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mb-1 block text-xs font-medium text-gray-500">
          Team name
        </label>
        <div className="mb-5 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={handleSaveName}
            disabled={savingName || !name.trim() || name.trim() === teamName}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {savingName ? "Saving…" : "Save"}
          </button>
        </div>

        <p className="mb-2 text-xs font-medium text-gray-500">Members</p>
        <div className="max-h-64 space-y-1.5 overflow-y-auto">
          {loadingMembers ? (
            <p className="py-4 text-center text-sm text-gray-400">Loading…</p>
          ) : members.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">No members found.</p>
          ) : (
            members.map((m) => {
              const isSelf = m.id === currentUserId;
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {m.name} {isSelf && <span className="text-gray-400">(you)</span>}
                    </p>
                    <p className="truncate text-xs text-gray-500">{m.email}</p>
                  </div>
                  {!isSelf && (
                    <button
                      onClick={() => handleRemoveMember(m.id)}
                      disabled={removingId === m.id}
                      aria-label={`Remove ${m.name}`}
                      className="ml-2 shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}