"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { KanbanSquare, Pencil, Trash2, Check, X } from "lucide-react";

type Board = {
  id: string;
  name: string;
  created_at: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BoardCard({
  board,
  teamName,
}: {
  board: Board;
  teamName?: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(board.name);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSaveName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === board.name) {
      setName(board.name);
      setIsEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from("boards")
      .update({ name: trimmed })
      .eq("id", board.id);
    setSaving(false);
    if (error) {
      setError("Couldn't rename board.");
      return;
    }
    setIsEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("boards").delete().eq("id", board.id);
    setSaving(false);
    if (error) {
      setError("Couldn't delete board.");
      setIsDeleting(false);
      return;
    }
    router.refresh();
  }

  return (
    <li className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
            <KanbanSquare className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") {
                      setName(board.name);
                      setIsEditing(false);
                    }
                  }}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  aria-label="Save board name"
                  className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setName(board.name);
                    setIsEditing(false);
                  }}
                  aria-label="Cancel"
                  className="rounded-md p-1 text-gray-400 hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <p className="font-semibold text-gray-900">{board.name}</p>
            )}
            <p className="mt-0.5 text-xs text-gray-500">
              {teamName ? `${teamName} · ` : ""}Created on {formatDate(board.created_at)}
            </p>
          </div>
        </div>

        {!isEditing && (
          <div className="flex shrink-0 gap-1.5">
            <button
              onClick={() => setIsEditing(true)}
              aria-label="Rename board"
              className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 hover:text-indigo-600"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsDeleting(true)}
              aria-label="Delete board"
              className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {isDeleting ? (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
          <p className="text-xs font-medium text-red-700">Delete this board?</p>
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
        <div className="mt-4 flex justify-end border-t border-gray-100 pt-3">
          <Link
            href={`/boards/${board.id}`}
            className="rounded-lg border border-indigo-200 px-4 py-1.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50"
          >
            View tasks
          </Link>
        </div>
      )}
    </li>
  );
}