"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import EmojiReaction from "@/components/EmojiReaction";
import MemoSocial from "@/components/MemoSocial";
import { createClient } from "@/lib/supabase/client";

import type { Memo } from "@/lib/types";

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
  initialMemo: Pick<Memo, "id" | "content"> | null;
  isAuthenticated: boolean;
  username?: string;
  memoId: string | null;
  initialComments: Comment[];
  initialReactions: ReactionSummary[];
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function MemoEditor({
  characterName,
  initialMemo,
  isAuthenticated,
  username,
  memoId,
  initialComments,
  initialReactions,
}: Props) {
  const router = useRouter();
  const [content, setContent] = useState(initialMemo?.content ?? "");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // メモを開いたら既読化し、一覧ページのキャッシュを破棄
  useEffect(() => {
    if (!memoId) return;
    const supabase = createClient();
    supabase.from("memos")
      .update({ last_viewed_at: new Date().toISOString() })
      .eq("id", memoId)
      .then(() => router.refresh());
  }, [memoId, router]);

  const handleSave = useCallback(async () => {
    setStatus("saving");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let error;
    if (initialMemo) {
      ({ error } = await supabase
        .from("memos")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", initialMemo.id));
    } else {
      ({ error } = await supabase
        .from("memos")
        .insert({ character_name: characterName, content, user_id: user.id }));
    }

    if (error) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
      router.refresh();
    }
  }, [content, characterName, initialMemo, router]);

  const handleDelete = useCallback(async () => {
    if (!initialMemo) return;
    const supabase = createClient();
    await supabase.from("memos").delete().eq("id", initialMemo.id);
    router.push("/memos");
    router.refresh();
  }, [initialMemo, router]);

  const statusColor = status === "saved" ? "var(--green)" : status === "error" ? "var(--red)" : "var(--text-muted)";
  const statusLabel = status === "saving" ? "保存中..." : status === "saved" ? "保存しました" : status === "error" ? "エラー" : "";

  return (
    <AppShell title={`${characterName} 対策メモ`} isAuthenticated={isAuthenticated} username={username}>
      <div className="px-4 py-4 flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/memos")}
            className="text-sm flex items-center gap-1"
            style={{ color: "var(--accent)" }}
          >
            ← 一覧に戻る
          </button>
          {statusLabel && (
            <span className="text-xs" style={{ color: statusColor }}>{statusLabel}</span>
          )}
        </div>

        <h2 className="text-xl font-bold">{characterName}</h2>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`${characterName} の対策をメモしよう...\n\n例:\n・横強は後ろに判定が強い\n・上Bは確定反撃あり\n・崖際は下スマ択が多い`}
          className="w-full flex-1 px-4 py-3 rounded-xl text-sm resize-none leading-relaxed"
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            outline: "none",
            minHeight: "280px",
          }}
        />

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={status === "saving"}
            className="flex-1 py-3 rounded-xl font-semibold text-white transition-opacity"
            style={{ background: "var(--accent)", opacity: status === "saving" ? 0.6 : 1 }}
          >
            {initialMemo ? "更新する" : "メモを保存"}
          </button>

          {initialMemo && !showDeleteConfirm && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-3 rounded-xl text-sm font-semibold"
              style={{ border: "1px solid var(--red)", color: "var(--red)" }}
            >
              削除
            </button>
          )}
        </div>

        {showDeleteConfirm && (
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <p className="text-sm mb-3">本当に削除しますか？</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-lg text-sm"
                style={{ background: "var(--surface2)", color: "var(--text-muted)" }}
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: "var(--red)" }}
              >
                削除する
              </button>
            </div>
          </div>
        )}

        {/* フレンドからのリアクション・コメント（メモが保存済みの場合のみ） */}
        {memoId && (
          <div className="flex flex-col gap-4 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              フレンドの反応
            </p>
            <EmojiReaction
              memoId={memoId}
              initialMyReaction={null}
              initialReactions={initialReactions}
              readOnly
            />
            <MemoSocial
              memoId={memoId}
              initialComments={initialComments}
              currentUsername={username ?? ""}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
