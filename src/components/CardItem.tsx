"use client";

import { Draggable } from "@hello-pangea/dnd";
import type { Card, Profile } from "@/lib/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function isOverdue(dueDate: string | null) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export default function CardItem({
  card,
  index,
  assignee,
  onClick,
}: {
  card: Card;
  index: number;
  assignee?: Profile;
  onClick: () => void;
}) {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`cursor-pointer rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md ${
            snapshot.isDragging ? "ring-2 ring-brand-400" : ""
          }`}
        >
          <p className="text-sm font-medium text-gray-900">{card.title}</p>
          {card.description && (
            <p className="mt-1 line-clamp-2 text-xs text-gray-500">{card.description}</p>
          )}
          <div className="mt-2 flex items-center justify-between">
            {card.due_date ? (
              <span
                className={`text-xs ${
                  isOverdue(card.due_date) ? "font-medium text-red-600" : "text-gray-400"
                }`}
              >
                {new Date(card.due_date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            ) : (
              <span />
            )}
            {assignee && (
              <span
                title={assignee.name}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700"
              >
                {initials(assignee.name)}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
