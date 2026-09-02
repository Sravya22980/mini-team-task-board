"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function TeamFilterSelect({
  teams,
}: {
  teams: { id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("team") ?? "";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value) {
      router.push(`/boards?team=${value}`);
    } else {
      router.push("/boards");
    }
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
    >
      <option value="">All teams</option>
      {teams.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}
