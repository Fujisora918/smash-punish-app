import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import FriendMemoView from "./FriendMemoView";

interface Props {
  params: Promise<{ userId: string; characterName: string }>;
}

export default async function FriendMemoDetailPage({ params }: Props) {
  const { userId, characterName } = await params;
  const decodedName = decodeURIComponent(characterName);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // フレンド関係チェック
  const { data: friendRow } = await supabase
    .from("friends")
    .select("friend_id")
    .eq("user_id", user.id)
    .eq("friend_id", userId)
    .single();

  if (!friendRow) notFound();

  // フレンドのプロフィール
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .single();

  if (!profile) notFound();

  // メモ取得
  const { data: memo } = await supabase
    .from("memos")
    .select("id, content, updated_at")
    .eq("user_id", userId)
    .eq("character_name", decodedName)
    .single();

  // いいね数・自分がいいね済みか
  const memoId = memo?.id ?? null;
  let likesCount = 0;
  let viewerHasLiked = false;
  let initialComments: { id: string; author_id: string; content: string; created_at: string; author: { username: string } }[] = [];

  let initialMyReaction: string | null = null;
  let initialReactions: { emoji: string; count: number; includesMe: boolean }[] = [];

  if (memoId) {
    const [{ count: lc }, { data: myLike }, { data: comments }, { data: allReactions }, { data: myReactionRow }] = await Promise.all([
      supabase.from("memo_likes").select("id", { count: "exact", head: true }).eq("memo_id", memoId),
      supabase.from("memo_likes").select("id").eq("memo_id", memoId).eq("user_id", user.id).maybeSingle(),
      supabase
        .from("memo_comments")
        .select("id, author_id, content, created_at, profiles!memo_comments_author_id_fkey(username)")
        .eq("memo_id", memoId)
        .order("created_at", { ascending: true }),
      supabase.from("memo_reactions").select("user_id, emoji").eq("memo_id", memoId),
      supabase.from("memo_reactions").select("emoji").eq("memo_id", memoId).eq("user_id", user.id).maybeSingle(),
    ]);
    likesCount = lc ?? 0;
    viewerHasLiked = !!myLike;
    initialComments = (comments ?? []).map((c: { id: string; author_id: string; content: string; created_at: string; profiles: { username: string } | { username: string }[] }) => ({
      id: c.id,
      author_id: c.author_id,
      content: c.content,
      created_at: c.created_at,
      author: { username: Array.isArray(c.profiles) ? (c.profiles[0]?.username ?? "不明") : (c.profiles?.username ?? "不明") },
    }));

    initialMyReaction = myReactionRow?.emoji ?? null;

    // 絵文字ごとに集計
    const emojiMap = new Map<string, number>();
    for (const r of allReactions ?? []) {
      emojiMap.set(r.emoji, (emojiMap.get(r.emoji) ?? 0) + 1);
    }
    initialReactions = Array.from(emojiMap.entries()).map(([emoji, count]) => ({
      emoji,
      count,
      includesMe: initialMyReaction === emoji,
    }));
  }

  const username = (user.user_metadata?.username as string | undefined) ?? "";

  const { count: pendingCount } = await supabase
    .from("friend_requests")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", user.id)
    .eq("status", "pending");

  return (
    <AppShell title={`${decodedName} — ${profile.username}`} isAuthenticated={true} username={username} pendingCount={pendingCount ?? 0}>
      <FriendMemoView
        characterName={decodedName}
        friendId={userId}
        friendUsername={profile.username}
        memo={memo ? { id: memo.id, content: memo.content, updated_at: memo.updated_at } : null}
        memoId={memoId}
        initialLikesCount={likesCount}
        initialViewerHasLiked={viewerHasLiked}
        initialComments={initialComments}
        initialMyReaction={initialMyReaction}
        initialReactions={initialReactions}
      />
    </AppShell>
  );
}
