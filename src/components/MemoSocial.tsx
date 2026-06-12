"use client";

import { useState, useRef } from "react";

interface Comment {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  author: { username: string };
}

interface Props {
  memoId: string;
  initialLikesCount: number;
  initialViewerHasLiked: boolean;
  initialComments: Comment[];
}

export default function MemoSocial({ memoId, initialLikesCount, initialViewerHasLiked, initialComments }: Props) {
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [hasLiked, setHasLiked] = useState(initialViewerHasLiked);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function toggleLike() {
    const next = !hasLiked;
    setHasLiked(next);
    setLikesCount((c) => c + (next ? 1 : -1));

    const res = await fetch(`/api/memos/${memoId}/like`, {
      method: next ? "POST" : "DELETE",
    });
    if (!res.ok) {
      setHasLiked(!next);
      setLikesCount((c) => c + (next ? -1 : 1));
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || sending) return;
    setSending(true);

    const res = await fetch(`/api/memos/${memoId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText.trim() }),
    });
    const json = await res.json();
    if (res.ok && json.comment) {
      const c = json.comment;
      setComments((prev) => [
        ...prev,
        {
          id: c.id,
          author_id: c.author_id,
          content: c.content,
          created_at: c.created_at,
          author: {
            username: Array.isArray(c.profiles) ? (c.profiles[0]?.username ?? "不明") : (c.profiles?.username ?? "不明"),
          },
        },
      ]);
      setCommentText("");
    }
    setSending(false);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* いいねボタン */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleLike}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          style={{
            background: hasLiked ? "rgba(239,68,68,0.15)" : "var(--surface2)",
            border: hasLiked ? "1px solid rgba(239,68,68,0.4)" : "1px solid var(--border)",
            color: hasLiked ? "#ef4444" : "var(--text-muted)",
          }}
        >
          <span>{hasLiked ? "♥" : "♡"}</span>
          <span>{likesCount}</span>
        </button>
      </div>

      {/* コメント一覧 */}
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          コメント ({comments.length})
        </p>
        {comments.length === 0 ? (
          <p className="text-xs py-2" style={{ color: "var(--text-muted)" }}>まだコメントがありません</p>
        ) : (
          <div className="flex flex-col gap-2">
            {comments.map((c) => (
              <div
                key={c.id}
                className="px-3 py-2 rounded-xl"
                style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{c.author.username}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(c.created_at)}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{c.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* コメント入力 */}
      <form onSubmit={submitComment} className="flex flex-col gap-2">
        <textarea
          ref={textareaRef}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="コメントを入力..."
          rows={2}
          className="w-full px-3 py-2 rounded-xl text-sm resize-none"
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={!commentText.trim() || sending}
          className="self-end px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity"
          style={{ background: "var(--accent)", opacity: !commentText.trim() || sending ? 0.5 : 1 }}
        >
          {sending ? "送信中..." : "送信"}
        </button>
      </form>
    </div>
  );
}
