"use client";

import { useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import CardItem from "./CardItem";
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

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddCard(list.id, newTitle.trim());
    setNewTitle("");
    setAdding(false);
  }

  const membersById = Object.fromEntries(members.map((m) => [m.id, m]));

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-2xl bg-gray-100 p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-gray-700">{list.name}</h3>
        <span className="text-xs text-gray-400">{cards.length}</span>
      </div>

      <Droppable droppableId={list.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex min-h-[40px] flex-1 flex-col gap-2 rounded-lg transition ${
              snapshot.isDraggingOver ? "bg-brand-50" : ""
            }`}
          >
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

      {adding ? (
        <form onSubmit={handleAdd} className="mt-2">
          <textarea
            autoFocus
            rows={2}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Card title…"
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <div className="mt-1 flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-3 py-1 text-xs font-medium text-white hover:bg-brand-600"
            >
              Add card
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setNewTitle("");
              }}
              className="rounded-lg px-3 py-1 text-xs text-gray-500 hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 rounded-lg px-2 py-1.5 text-left text-sm text-gray-500 hover:bg-gray-200"
        >
          + Add a card
        </button>
      )}
    </div>
  );
}
