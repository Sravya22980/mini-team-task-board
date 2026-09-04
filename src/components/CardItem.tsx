"use client";

import { Draggable } from "@hello-pangea/dnd";
import { CalendarDays } from "lucide-react";
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

function priorityLabel(dueDate: string | null) {
  if (!dueDate) return { text: "Low", className: "bg-emerald-50 text-emerald-600" };
  if (isOverdue(dueDate)) return { text: "High", className: "bg-red-50 text-red-600" };
  const days = Math.ceil(
    (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (days <= 3) return { text: "Medium", className: "bg-amber-50 text-amber-600" };
  return { text: "Low", className: "bg-emerald-50 text-emerald-600" };
}

export default function CardItem({
  card,
  index,
  assignee,
  onClick,
  dragDisabled,
}: {
  card: Card;
  index: number;
  assignee?: Profile;
  onClick?: () => void;
  dragDisabled?: boolean;
}) {
  const priority = priorityLabel(card.due_date);

  const body = (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900">{card.title}</p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${priority.className}`}
        >
          {priority.text}
        </span>
      </div>

      {card.description && (
        <p className="mt-1 line-clamp-2 text-xs text-gray-500">{card.description}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        {card.due_date ? (
          <span
            className={`flex items-center gap-1 text-xs ${
              isOverdue(card.due_date) ? "font-medium text-red-600" : "text-gray-400"
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {new Date(card.due_date).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        ) : (
          <span />
        )}
        {assignee && (
          <span
            title={assignee.name}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500 text-[10px] font-semibold text-white"
          >
            {initials(assignee.name)}
          </span>
        )}
      </div>
    </div>
  );

  if (dragDisabled) return body;

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className={snapshot.isDragging ? "ring-2 ring-indigo-400 rounded-xl" : ""}>
            {body}
          </div>
        </div>
      )}
    </Draggable>
  );
}