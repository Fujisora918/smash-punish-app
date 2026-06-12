"use client";

import { useState, useRef, useEffect } from "react";

const EMOJI_LIST = [
  "👍", "🔥", "😆", "😮", "💪", "🎯", "👀", "🤔",
  "💯", "🙏", "😎", "🥺", "😭", "🤯", "👏", "✨",
  "💀", "🤝", "😤", "🫡", "🧠", "⚔️", "🛡️", "🎮",
];

interface ReactionSummary {
  emoji: string;
  count: number;
  includesMe: boolean;
}

interface Props {
  memoId: string;
  initialMyReaction: string | null;
  initialReactions: ReactionSummary[];
}

export default function EmojiReaction({ memoId, initialMyReaction, initialReactions }: Props) {
  const [myReaction, setMyReaction] = useState<string | null>(initialMyReaction);
  const [reactions, setReactions] = useState<ReactionSummary[]>(initialReactions);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    if (pickerOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pickerOpen]);

  function applyReaction(prev: ReactionSummary[], oldEmoji: string | null, newEmoji: string | null): ReactionSummary[] {
    let next = prev.map((r) => ({ ...r }));

    if (oldEmoji) {
      next = next.map((r) =>
        r.emoji === oldEmoji
          ? { ...r, count: r.count - 1, includesMe: false }
          : r
      ).filter((r) => r.count > 0);
    }

    if (newEmoji) {
      const existing = next.find((r) => r.emoji === newEmoji);
      if (existing) {
        next = next.map((r) =>
          r.emoji === newEmoji ? { ...r, count: r.count + 1, includesMe: true } : r
        );
      } else {
        next = [...next, { emoji: newEmoji, count: 1, includesMe: true }];
      }
    }

    return next;
  }

  async function handleSelect(emoji: string) {
    if (loading) return;
    setPickerOpen(false);

    const isSame = myReaction === emoji;
    const prevReaction = myReaction;
    const prevReactions = reactions;

    // 楽観的UI更新
    if (isSame) {
      setMyReaction(null);
      setReactions((prev) => applyReaction(prev, emoji, null));
    } else {
      setMyReaction(emoji);
      setReactions((prev) => applyReaction(prev, prevReaction, emoji));
    }

    setLoading(true);
    try {
      if (isSame) {
        const res = await fetch(`/api/memos/${memoId}/reaction`, { method: "DELETE" });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch(`/api/memos/${memoId}/reaction`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji }),
        });
        if (!res.ok) throw new Error();
      }
    } catch {
      // ロールバック
      setMyReaction(prevReaction);
      setReactions(prevReactions);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* リアクション集計表示 */}
      {reactions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {reactions.map((r) => (
            <button
              key={r.emoji}
              onClick={() => handleSelect(r.emoji)}
              disabled={loading}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-sm transition-opacity disabled:opacity-50"
              style={{
                background: r.includesMe ? "var(--accent)" : "var(--surface2)",
                border: `1px solid ${r.includesMe ? "var(--accent)" : "var(--border)"}`,
                color: r.includesMe ? "#fff" : "var(--text)",
              }}
            >
              <span>{r.emoji}</span>
              <span className="text-xs">{r.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* リアクション追加ボタン */}
      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setPickerOpen((v) => !v)}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-opacity disabled:opacity-50"
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
          }}
        >
          {myReaction ? (
            <>
              <span>{myReaction}</span>
              <span className="text-xs">変更</span>
            </>
          ) : (
            <span>＋ リアクション</span>
          )}
        </button>

        {pickerOpen && (
          <div
            className="absolute bottom-full mb-2 left-0 z-50 rounded-2xl p-3 grid gap-1"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              gridTemplateColumns: "repeat(8, 1fr)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
              minWidth: "260px",
            }}
          >
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSelect(emoji)}
                className="text-xl rounded-lg p-1 transition-transform hover:scale-125 active:scale-110"
                style={{
                  background: myReaction === emoji ? "var(--accent)" : "transparent",
                  border: myReaction === emoji ? "2px solid var(--accent)" : "2px solid transparent",
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
