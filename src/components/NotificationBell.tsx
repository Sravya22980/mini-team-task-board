"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Bell, UserPlus, Clock, AlertTriangle } from "lucide-react";

type StoredNotification = {
  id: string;
  type: string;
  message: string;
  card_id: string | null;
  is_read: boolean;
  created_at: string;
};

type DueAlert = {
  id: string; // card id, prefixed
  title: string;
  boardId: string;
  boardName: string;
  dueDate: string;
  overdue: boolean;
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell({ userId }: { userId: string }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [dueAlerts, setDueAlerts] = useState<DueAlert[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: notifs } = await supabase
        .from("notifications")
        .select("id, type, message, card_id, is_read, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      // Live due-date check: cards assigned to me, not in a "Done" list,
      // with a due date today or in the past.
      const { data: myCards } = await supabase
        .from("cards")
        .select("id, title, due_date, list_id")
        .eq("assignee", userId)
        .not("due_date", "is", null);

      let alerts: DueAlert[] = [];
      if (myCards && myCards.length > 0) {
        const listIds = Array.from(new Set(myCards.map((c: any) => c.list_id)));
        const { data: lists } = await supabase
          .from("lists")
          .select("id, name, board_id")
          .in("id", listIds);

        const boardIds = Array.from(
          new Set((lists ?? []).map((l: any) => l.board_id))
        );
        const { data: boards } = await supabase
          .from("boards")
          .select("id, name")
          .in("id", boardIds);

        const listsById = Object.fromEntries((lists ?? []).map((l: any) => [l.id, l]));
        const boardsById = Object.fromEntries((boards ?? []).map((b: any) => [b.id, b]));
        const today = new Date(new Date().toDateString());

        alerts = myCards
          .filter((c: any) => {
            const list = listsById[c.list_id];
            if (!list || list.name === "Done") return false;
            return new Date(c.due_date) <= today;
          })
          .map((c: any) => {
            const list = listsById[c.list_id];
            const board = boardsById[list?.board_id];
            return {
              id: c.id,
              title: c.title,
              boardId: board?.id ?? "",
              boardName: board?.name ?? "Board",
              dueDate: c.due_date,
              overdue: new Date(c.due_date) < today,
            };
          });
      }

      setNotifications(notifs ?? []);
      setDueAlerts(alerts);
      setLoading(false);
    }

    load();
  }, [userId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  }

  const unreadCount =
    notifications.filter((n) => !n.is_read).length + dueAlerts.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[11px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">Loading…</p>
            ) : dueAlerts.length === 0 && notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">
                You're all caught up.
              </p>
            ) : (
              <>
                {dueAlerts.map((a) => (
                  <Link
                    key={`due-${a.id}`}
                    href={`/boards/${a.boardId}`}
                    className="flex gap-3 border-b border-gray-50 px-4 py-3 hover:bg-gray-50"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        a.overdue ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      {a.overdue ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800">
                        <span className="font-medium">
                          {a.overdue ? "Overdue: " : "Due today: "}
                        </span>
                        {a.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">{a.boardName}</p>
                    </div>
                  </Link>
                ))}

                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`flex w-full gap-3 border-b border-gray-50 px-4 py-3 text-left hover:bg-gray-50 ${
                      n.is_read ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                      <UserPlus className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800">{n.message}</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
