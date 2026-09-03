"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Bell,
  UserPlus,
  MessageSquare,
  UserMinus,
  Clock,
  AlertTriangle,
  X,
} from "lucide-react";

type StoredNotification = {
  id: string;
  type: string;
  message: string;
  card_id: string | null;
  is_read: boolean;
  created_at: string;
};

type DueAlert = {
  id: string; // card id
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

function iconFor(type: string) {
  if (type === "comment") return { Icon: MessageSquare, cls: "bg-sky-100 text-sky-600" };
  if (type === "removed_from_team")
    return { Icon: UserMinus, cls: "bg-red-100 text-red-600" };
  return { Icon: UserPlus, cls: "bg-indigo-100 text-indigo-600" };
}

export default function NotificationBell({ userId }: { userId: string }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [dueAlerts, setDueAlerts] = useState<DueAlert[]>([]);
  const [cardToBoard, setCardToBoard] = useState<Record<string, string>>({});
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);

    const { data: notifs } = await supabase
      .from("notifications")
      .select("id, type, message, card_id, is_read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Resolve board links for notifications tied to a card (assigned / comment).
    const notifCardIds = Array.from(
      new Set((notifs ?? []).map((n: any) => n.card_id).filter(Boolean))
    );
    let cardBoardMap: Record<string, string> = {};
    if (notifCardIds.length > 0) {
      const { data: notifCards } = await supabase
        .from("cards")
        .select("id, list_id")
        .in("id", notifCardIds);
      const listIds = Array.from(
        new Set((notifCards ?? []).map((c: any) => c.list_id))
      );
      const { data: notifLists } = listIds.length
        ? await supabase.from("lists").select("id, board_id").in("id", listIds)
        : { data: [] };
      const listToBoard = Object.fromEntries(
        (notifLists ?? []).map((l: any) => [l.id, l.board_id])
      );
      cardBoardMap = Object.fromEntries(
        (notifCards ?? []).map((c: any) => [c.id, listToBoard[c.list_id]])
      );
    }

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

      const boardIds = Array.from(new Set((lists ?? []).map((l: any) => l.board_id)));
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
    setCardToBoard(cardBoardMap);
    setDueAlerts(alerts);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function handleDeleteNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  }

  function dismissDueAlert(id: string) {
    // Client-side only: due alerts are recomputed live, not stored,
    // so this just hides it for the current session.
    setDueAlerts((prev) => prev.filter((a) => a.id !== id));
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
                  <div
                    key={`due-${a.id}`}
                    className="group flex gap-3 border-b border-gray-50 px-4 py-3 hover:bg-gray-50"
                  >
                    <Link href={`/boards/${a.boardId}`} className="flex flex-1 gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          a.overdue
                            ? "bg-red-100 text-red-600"
                            : "bg-amber-100 text-amber-600"
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
                    <button
                      onClick={() => dismissDueAlert(a.id)}
                      aria-label="Dismiss"
                      className="shrink-0 self-start rounded-md p-1 text-gray-300 opacity-0 transition hover:bg-gray-100 hover:text-gray-500 group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {notifications.map((n) => {
                  const { Icon, cls } = iconFor(n.type);
                  const boardId = n.card_id ? cardToBoard[n.card_id] : undefined;

                  const body = (
                    <>
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cls}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-800">{n.message}</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                    </>
                  );

                  return (
                    <div
                      key={n.id}
                      className={`group flex items-center gap-3 border-b border-gray-50 px-4 py-3 hover:bg-gray-50 ${
                        n.is_read ? "opacity-60" : ""
                      }`}
                    >
                      {boardId ? (
                        <Link
                          href={`/boards/${boardId}`}
                          onClick={() => markAsRead(n.id)}
                          className="flex flex-1 gap-3"
                        >
                          {body}
                        </Link>
                      ) : (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="flex flex-1 gap-3 text-left"
                        >
                          {body}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(n.id)}
                        aria-label="Delete notification"
                        className="shrink-0 self-start rounded-md p-1 text-gray-300 opacity-0 transition hover:bg-gray-100 hover:text-gray-500 group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}