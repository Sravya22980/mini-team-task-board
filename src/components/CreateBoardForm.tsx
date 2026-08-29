"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CreateBoardForm({ teamId }: { teamId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Uses the create_board_with_defaults RPC so the board and its
    // three default lists (To Do / In Progress / Done) are created together.
    const { error } = await supabase.rpc("create_board_with_defaults", {
      p_team_id: teamId,
      p_name: name,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setName("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input
        type="text"
        required
        placeholder="Board name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
      >
        {loading ? "Creating…" : "Create board"}
      </button>
      {error && <p className="text-sm text-red-600 sm:ml-2 sm:self-center">{error}</p>}
    </form>
  );
}
