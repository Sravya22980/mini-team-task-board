"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutGrid,
  Users,
  KanbanSquare,
  CalendarDays,
  ListChecks,
  Activity,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Teams", icon: Users, match: ["/dashboard", "/teams"] },
  { href: "/boards", label: "Boards", icon: KanbanSquare, match: ["/boards"] },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, match: ["/calendar"] },
  { href: "/my-tasks", label: "My Tasks", icon: ListChecks, match: ["/my-tasks"] },
  { href: "/activity", label: "Activity", icon: Activity, match: ["/activity"] },
];

export default function Sidebar({
  userName,
  userEmail,
}: {
  userName?: string;
  userEmail?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initial = (userName || userEmail || "?").charAt(0).toUpperCase();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col justify-between bg-gradient-to-b from-indigo-950 via-indigo-900 to-violet-900 px-4 py-6">
      <div>
        <Link href="/dashboard" className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
            <LayoutGrid className="h-5 w-5 text-indigo-700" />
          </div>
          <div className="leading-tight">
            <p className="text-lg font-bold text-white">
              Task<span className="text-indigo-300">Gen</span>
            </p>
            <p className="text-[11px] text-indigo-300">Team Task Management</p>
          </div>
        </Link>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.match.some(
              (m) => pathname === m || pathname.startsWith(m + "/")
            );
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-indigo-200 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="rounded-xl bg-white/5 p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold text-white">
            {initial}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium text-white">
              Hi, {userName || "there"} 👋
            </p>
            {userEmail && (
              <p className="truncate text-xs text-indigo-300">{userEmail}</p>
            )}
          </div>
        </div>

        <div className="my-3 h-px bg-white/10" />

        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-indigo-200 transition hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
