"use client";

import { useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import { MoreVertical } from "lucide-react";
import CardItem from "./CardItem";
import ColumnEmptyState from "./ColumnEmptyState";
import { columnTheme } from "@/lib/columnTheme";
import type { Card, List, Profile } from "@/lib/types";

export default function ListColumn({
  list,
  cards,
  members,
  onAddCard,
  onCardClick,
}: {
  list: List;
  cards: Card[];
  members: Profile[];
  onAddCard: (listId: string, title: string) => void;
  onCardClick: (card: Card) => void;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const theme = columnTheme(list.name);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddCard(list.id, newTitle.trim());
    setNewTitle("");
    setAdding(false);
  }

  const membersById = Object.fromEntries(members.map((m) => [m.id, m]));

  return (
    <div className="flex min-h-[430px] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className={`h-1.5 w-full ${theme.bar}`} />

      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <h3 className="text-base font-semibold text-gray-900">{list.name}</h3>
          <span
            className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${theme.badge}`}
          >
            {cards.length}
          </span>
        </div>
        {/* <button
          type="button"
          className="rounded-md p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          aria-label={`${list.name} options`}
        >
          <MoreVertical className="h-4 w-4" />
        </button> */}
      </div>

      <Droppable droppableId={list.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-1 flex-col gap-3 px-4 pb-2 transition ${
              snapshot.isDraggingOver ? "bg-violet-50/60" : ""
            }`}
          >
            {cards.length === 0 && (
              <ColumnEmptyState
                variant={theme.variant}
                title={theme.emptyTitle}
                subtitle={theme.emptySub}
              />
            )}
            {cards.map((card, index) => (
              <CardItem
                key={card.id}
                card={card}
                index={index}
                assignee={card.assignee ? membersById[card.assignee] : undefined}
                onClick={() => onCardClick(card)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <div className="px-4 pb-4 pt-1">
        {adding ? (
          <form onSubmit={handleAdd}>
            <textarea
              autoFocus
              rows={2}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Card title…"
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="mt-1 flex gap-2">
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
              >
                Add card
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setNewTitle("");
                }}
                className="rounded-lg px-3 py-1 text-xs text-gray-500 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className={`w-full py-2.5 text-sm font-medium text-violet-600 transition hover:text-violet-700 ${
              cards.length > 0
                ? "rounded-xl border border-dashed border-gray-200 hover:border-violet-200 hover:bg-violet-50/50"
                : ""
            }`}
          >
            + Add a card
          </button>
        )}
      </div>
    </div>
  );
}