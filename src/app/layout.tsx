import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mini Team Task Board",
  description: "A small Trello-style board for teams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
