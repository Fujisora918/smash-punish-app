"use client";

import { useRouter } from "next/navigation";
import MemoSocial from "@/components/MemoSocial";
import EmojiReaction from "@/components/EmojiReaction";

interface Comment {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  author: { username: string };
}

interface ReactionSummary {
  emoji: string;
  count: number;
  includesMe: boolean;
}

interface Props {
  characterName: string;
  friendId: string;
  friendUsername: string;
  memo: { id: string; content: string; updated_at: string } | null;
  memoId: string | null;
  initialComments: Comment[];
  initialMyReaction: string | null;
  initialReactions: ReactionSummary[];
  currentUsername: string;
}

export default function FriendMemoView({
  characterName,
  friendId,
  memo,
  memoId,
  initialComments,
  initialMyReaction,
  initialReactions,
  currentUsername,
}: Props) {
  const router = useRouter();

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <button
        onClick={() => router.push(`/friends/${friendId}`)}
        className="text-sm flex items-center gap-1 self-start"
        style={{ color: "var(--accent)" }}
      >
        ← 一覧に戻る
      </button>

      <h2 className="text-xl font-bold">{characterName}</h2>

      {memo ? (
        <div
          className="px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap"
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            minHeight: "120px",
          }}
        >
          {memo.content || <span style={{ color: "var(--text-muted)" }}>（メモなし）</span>}
        </div>
      ) : (
        <div
          className="px-4 py-8 rounded-xl text-sm text-center"
          style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          このキャラのメモはまだありません
        </div>
      )}

      {memoId && (
        <>
          <EmojiReaction
            memoId={memoId}
            initialMyReaction={initialMyReaction}
            initialReactions={initialReactions}
          />
          <MemoSocial
            memoId={memoId}
            initialComments={initialComments}
            currentUsername={currentUsername}
          />
        </>
      )}
    </div>
  );
}
