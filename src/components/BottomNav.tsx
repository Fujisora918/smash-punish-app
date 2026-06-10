"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/calculator", label: "確反計算", icon: "⚔️", activeBase: "/calculator" },
  { href: "/memos", label: "対策メモ", icon: "📝", activeBase: "/memos" },
  { href: "/friends", label: "フレンド", icon: "👥", activeBase: "/friends" },
];

export default function BottomNav() {
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
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors"
            style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
