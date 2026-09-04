"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Task = {
  id: string;
  title: string;
  due_date: string; // YYYY-MM-DD
  boardId: string;
  boardName: string;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateKey(d: Date) {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export default function CalendarView({ tasks }: { tasks: Task[] }) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      if (!t.due_date) continue;
      const key = t.due_date.slice(0, 10);
      map[key] = map[key] ? [...map[key], t] : [t];
    }
    return map;
  }, [tasks]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const startOffset = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = toDateKey(new Date());

  const cells: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const selectedTasks = selectedDate ? tasksByDate[selectedDate] ?? [] : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </h2>
          <div className="flex gap-1">
            <button
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, i) => {
            if (!date) return <div key={i} className="aspect-square" />;
            const key = toDateKey(date);
            const dayTasks = tasksByDate[key] ?? [];
            const isToday = key === todayKey;
            const isSelected = key === selectedDate;

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(key)}
                className={`flex aspect-square flex-col items-center justify-start rounded-lg p-1.5 text-sm transition ${
                  isSelected
                    ? "bg-indigo-600 text-white"
                    : isToday
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="font-medium">{date.getDate()}</span>
                {dayTasks.length > 0 && (
                  <span
                    className={`mt-1 h-1.5 w-1.5 rounded-full ${
                      isSelected ? "bg-white" : "bg-indigo-500"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          {selectedDate
            ? dateFromKey(selectedDate).toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })
            : "Select a date"}
        </h3>

        {!selectedDate ? (
          <p className="text-sm text-gray-400">
            Click a day with a dot to see your tasks due that day.
          </p>
        ) : selectedTasks.length === 0 ? (
          <p className="text-sm text-gray-400">No tasks due this day.</p>
        ) : (
          <ul className="space-y-2">
            {selectedTasks.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/boards/${t.boardId}`}
                  className="block rounded-xl border border-gray-100 p-3 text-sm hover:border-indigo-200 hover:bg-indigo-50/40"
                >
                  <p className="font-medium text-gray-900">{t.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{t.boardName}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
