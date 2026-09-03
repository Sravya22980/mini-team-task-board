"use client";

import { useState } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { createClient } from "@/lib/supabase/client";
import ListColumn from "./ListColumn";
import CardModal from "./CardModal";
import type { Card, List, Profile } from "@/lib/types";

export default function BoardView({
  boardName,
  initialLists,
  initialCards,
  members,
  currentUserId,
}: {
  boardName: string;
  initialLists: List[];
  initialCards: Card[];
  members: Profile[];
  currentUserId: string;
}) {
  const supabase = createClient();
  const [lists] = useState<List[]>(initialLists);
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  function cardsForList(listId: string) {
    return cards
      .filter((c) => c.list_id === listId)
      .sort((a, b) => a.position - b.position);
  }

  async function handleAddCard(listId: string, title: string) {
    const listCards = cardsForList(listId);
    const position = listCards.length;

    const { data, error } = await supabase
      .from("cards")
      .insert({ list_id: listId, title, position })
      .select()
      .single();

    if (!error && data) {
      setCards((prev) => [...prev, data as Card]);
    }
  }

  function handleCardSaved(updated: Card) {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setActiveCard(null);
  }

  function handleCardDeleted(cardId: string) {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    setActiveCard(null);
  }

  async function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const movedCard = cards.find((c) => c.id === draggableId);
    if (!movedCard) return;

    // Build the new ordering locally (optimistic update).
    const sourceList = cardsForList(source.droppableId).filter((c) => c.id !== draggableId);
    const destListId = destination.droppableId;
    const destList =
      destListId === source.droppableId
        ? sourceList
        : cardsForList(destListId).filter((c) => c.id !== draggableId);

    destList.splice(destination.index, 0, { ...movedCard, list_id: destListId });

    const reindexed = destList.map((c, i) => ({ ...c, position: i }));

    setCards((prev) => {
      const untouched = prev.filter(
        (c) => c.list_id !== source.droppableId && c.list_id !== destListId
      );
      const otherSourceCards =
        destListId === source.droppableId ? [] : sourceList.map((c, i) => ({ ...c, position: i }));
      return [...untouched, ...otherSourceCards, ...reindexed];
    });

    // Persist: update moved card's list/position, then re-sequence affected list(s).
    await supabase
      .from("cards")
      .update({ list_id: destListId, position: destination.index })
      .eq("id", draggableId);

    await Promise.all(
      reindexed
        .filter((c) => c.id !== draggableId)
        .map((c) => supabase.from("cards").update({ position: c.position }).eq("id", c.id))
    );

    if (destListId !== source.droppableId) {
      await Promise.all(
        sourceList.map((c, i) =>
          supabase.from("cards").update({ position: i }).eq("id", c.id)
        )
      );
    }
  }

  return (
    <div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {lists.map((list) => (
            <ListColumn
              key={list.id}
              list={list}
              cards={cardsForList(list.id)}
              members={members}
              onAddCard={handleAddCard}
              onCardClick={setActiveCard}
            />
          ))}
        </div>
      </DragDropContext>

      {activeCard && (
        <CardModal
          card={activeCard}
          members={members}
          currentUserId={currentUserId}
          onClose={() => setActiveCard(null)}
          onSaved={handleCardSaved}
          onDeleted={handleCardDeleted}
        />
      )}
    </div>
  );
}