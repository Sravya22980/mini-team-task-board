import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";

export default function AppShell({
  userId,
  userName,
  userEmail,
  title,
  subtitle,
  actions,
  children,
}: {
  userId: string;
  userName?: string;
  userEmail?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen" style={{ background: "#F9F6FE" }}>
      <Sidebar userName={userName} userEmail={userEmail} />

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <NotificationBell userId={userId} />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
