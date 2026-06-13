"use client";

import Link from "next/link";
import BottomNav from "./BottomNav";
import AuthButton from "./AuthButton";
import ThemeToggle from "./ThemeToggle";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  username?: string;
  isAuthenticated: boolean;
  pendingCount?: number;
}

export default function AppShell({ children, title, username, isAuthenticated, pendingCount }: AppShellProps) {
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <Link
          href="/home"
          className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg"
          style={{ color: "var(--text-muted)", background: "var(--surface2)", border: "1px solid var(--border)" }}
        >
          ☰ メニュー
        </Link>
        <h1 className="text-base font-bold" style={{ color: "var(--accent)" }}>
          {title}
        </h1>
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <Link href="/mypage" className="flex items-center justify-center w-8 h-8 rounded-full" style={{ color: "var(--accent)", background: "rgba(124,106,247,0.15)" }} aria-label="マイページ">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            </Link>
          )}
          <AuthButton isAuthenticated={isAuthenticated} />
        </div>
      </header>
      {username && (
        <div
          className="px-4 py-2.5 flex items-center justify-between"
          style={{ background: "rgba(124,106,247,0.08)", borderBottom: "1px solid var(--border)" }}
        >
          <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
            ようこそ、{username} さん
          </span>
          <ThemeToggle />
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-safe">
        {children}
      </main>

      <BottomNav pendingCount={pendingCount} />
    </div>
  );
}
