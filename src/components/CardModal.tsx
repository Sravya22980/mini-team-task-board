"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Card, Profile } from "@/lib/types";

export default function CardModal({
  card,
  members,
  onClose,
  onSaved,
  onDeleted,
}: {
  card: Card;
  members: Profile[];
  onClose: () => void;
  onSaved: (card: Card) => void;
  onDeleted: (cardId: string) => void;
}) {
  const supabase = createClient();
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [assignee, setAssignee] = useState(card.assignee ?? "");
  const [dueDate, setDueDate] = useState(card.due_date ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    const { data, error } = await supabase
      .from("cards")
      .update({
        title,
        description,
        assignee: assignee || null,
        due_date: dueDate || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", card.id)
      .select()
      .single();

    setSaving(false);

    if (error || !data) {
      setError(error?.message ?? "Could not save card.");
      return;
    }

    onSaved(data as Card);
  }

  async function handleDelete() {
    if (!confirm("Delete this card?")) return;
    setSaving(true);
    const { error } = await supabase.from("cards").delete().eq("id", card.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onDeleted(card.id);
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
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Edit card</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Assignee</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleDelete}
              disabled={saving}
              className="text-sm font-medium text-red-600 hover:underline disabled:opacity-60"
            >
              Delete card
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
