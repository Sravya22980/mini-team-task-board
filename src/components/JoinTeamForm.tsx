"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function JoinTeamForm() {
  const router = useRouter();
  const supabase = createClient();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.rpc("join_team_by_invite_code", {
      p_invite_code: code.trim(),
    });

    setLoading(false);

    if (error) {
      setError("Invalid invite code, or you couldn't be added.");
      return;
    }

    setCode("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input
        type="text"
        required
        placeholder="Invite code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase tracking-widest focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg border border-brand-500 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-60"
      >
        {loading ? "Joining…" : "Join team"}
      </button>
      {error && <p className="text-sm text-red-600 sm:ml-2 sm:self-center">{error}</p>}
    </form>
  );
}
