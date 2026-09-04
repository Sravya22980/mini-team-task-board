import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";
import FlashToast from "./FlashToast";

export default function AppShell({
  userId,
  userName,
  userEmail,
  title,
  subtitle,
  actions,
  fullWidth,
  children,
}: {
  userId: string;
  userName?: string;
  userEmail?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F9F6FE" }}>
      <Sidebar userName={userName} userEmail={userEmail} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-8 py-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <NotificationBell userId={userId} />
          </div>
        </header>

        <main
          className={`relative flex-1 overflow-y-auto px-8 py-8 ${
            fullWidth ? "" : "mx-auto w-full max-w-6xl"
          }`}
        >
          <FlashToast />
          {children}
        </main>
      </div>
    </div>
  );
}