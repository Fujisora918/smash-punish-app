"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { getMemoFighters, type Fighter } from "@/lib/frame-data";
import type { Memo } from "@/lib/types";

interface Props {
  initialMemos: Memo[];
  isAuthenticated: boolean;
  username?: string;
  newActivityNames: string[];
}

export default function MemosClient({ initialMemos, isAuthenticated, username, newActivityNames }: Props) {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [search, setSearch] = useState("");
  const memos = initialMemos;

  useEffect(() => {
    getMemoFighters().then(setFighters);
  }, []);

  const filteredFighters = fighters.filter(
    (f) =>
      f.name_jp.includes(search) ||
      f.name_en.toLowerCase().includes(search.toLowerCase())
  );

  const [newActivity, setNewActivity] = useState(new Set(newActivityNames));
  const memoMap = new Map(memos.map((m) => [m.character_name, m]));

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
  }

  return (
    <AppShell title="対策メモ" isAuthenticated={isAuthenticated} username={username}>
      <div className="px-4 py-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="キャラ名で検索..."
          className="w-full px-4 py-3 rounded-xl text-sm mb-4"
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            outline: "none",
          }}
        />

        {memos.length > 0 && !search && (
          <div className="mb-5">
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              メモあり ({memos.length})
            </p>
            <div className="flex flex-col gap-2">
              {memos.map((memo) => {
                const hasNew = newActivity.has(memo.character_name);
                return (
                  <Link
                    key={memo.id}
                    href={`/memos/${encodeURIComponent(memo.character_name)}`}
                    onClick={() => setNewActivity((prev) => { const next = new Set(prev); next.delete(memo.character_name); return next; })}
                    className="flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {hasNew && (
                        <span className="shrink-0 w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{memo.character_name}</p>
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)" }}>
                          {memo.content || "（空白）"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {formatDate(memo.updated_at)}
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>›</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            {search ? "検索結果" : "全キャラ"}
          </p>
          <div className="flex flex-col gap-1">
            {filteredFighters.map((f) => {
              const memo = memoMap.get(f.name_jp);
              const hasNew = newActivity.has(f.name_jp);
              return (
                <Link
                  key={f.id}
                  href={`/memos/${encodeURIComponent(f.name_jp)}`}
                  onClick={() => setNewActivity((prev) => { const next = new Set(prev); next.delete(f.name_jp); return next; })}
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{
                    background: "var(--surface)",
                    border: memo ? "1px solid var(--accent)" : "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    {hasNew && (
                      <span className="shrink-0 w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
                    )}
                    <div>
                      <p className="text-sm font-medium">{f.name_jp}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{f.name_en}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {memo && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(124,106,247,0.2)", color: "var(--accent)" }}
                      >
                        メモあり
                      </span>
                    )}
                    <span style={{ color: "var(--text-muted)" }}>›</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
