"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LayoutGrid, LogOut } from "lucide-react";

export default function Navbar({
  userName,
  userEmail,
}: {
  userName?: string;
  userEmail?: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initial = (userName || userEmail || "?").charAt(0).toUpperCase();

  return (
    // navbar
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600">
            <LayoutGrid className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">TaskGen</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
              {initial}
            </div>
            <div className="leading-tight">
              <p className="text-sm font-medium text-gray-900">{userName || "User"}</p>
              {userEmail && <p className="text-xs text-gray-500">{userEmail}</p>}
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 rounded-lg border border-indigo-200 px-3 py-1.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}