"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/calculator", label: "確反計算", icon: "⚔️", activeBase: "/calculator" },
  { href: "/memos", label: "対策メモ", icon: "📝", activeBase: "/memos" },
  { href: "/friends", label: "フレンド", icon: "👥", activeBase: "/friends" },
];

interface BottomNavProps {
  pendingCount?: number;
}

export default function BottomNav({ pendingCount = 0 }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex border-t"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.activeBase);
        const showBadge = item.activeBase === "/friends" && pendingCount > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors"
            style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}
          >
            <span className="text-xl relative inline-block">
              {item.icon}
              {showBadge && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ background: "#ef4444", fontSize: "10px" }}
                >
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
