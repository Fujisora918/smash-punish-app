"use client";

import { useState } from "react";

interface Comment {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  author: { username: string };
}

interface Props {
  memoId: string;
  initialComments: Comment[];
  currentUsername: string;
}

export default function MemoSocial({ memoId, initialComments, currentUsername }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || sending) return;
    setSending(true);
    setError(null);

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
          author: { username: c.author?.username ?? currentUsername },
        },
      ]);
      setCommentText("");
    } else {
      setError(json.error ?? "送信に失敗しました");
    }
    setSending(false);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="flex flex-col gap-4">
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
        {error && (
          <p className="text-xs" style={{ color: "var(--red, #ef4444)" }}>{error}</p>
        )}
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
