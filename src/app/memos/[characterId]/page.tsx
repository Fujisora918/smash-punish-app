import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MemoEditor from "./MemoEditor";

interface Props {
  params: Promise<{ characterId: string }>;
}

export default async function MemoPage({ params }: Props) {
  const { characterId } = await params;
  const characterName = decodeURIComponent(characterId);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const username = (user.user_metadata?.username as string | undefined) ?? "";

  const { data: memo } = await supabase
    .from("memos")
    .select("id, content")
    .eq("character_name", characterName)
    .eq("user_id", user.id)
    .maybeSingle();

  const memoId = memo?.id ?? null;
  let initialComments: { id: string; author_id: string; content: string; created_at: string; author: { username: string } }[] = [];
  let initialReactions: { emoji: string; count: number; includesMe: boolean }[] = [];

  if (memoId) {
    const [{ data: comments }, { data: allReactions }] = await Promise.all([
      supabase
        .from("memo_comments")
        .select("id, author_id, content, created_at")
        .eq("memo_id", memoId)
        .order("created_at", { ascending: true }),
      supabase.from("memo_reactions").select("user_id, emoji").eq("memo_id", memoId),
    ]);

    const authorIds = [...new Set((comments ?? []).map((c) => c.author_id))];
    const { data: commentProfiles } = authorIds.length > 0
      ? await supabase.from("profiles").select("id, username").in("id", authorIds)
      : { data: [] };
    const profileMap = new Map((commentProfiles ?? []).map((p) => [p.id, p.username]));

    initialComments = (comments ?? []).map((c) => ({
      id: c.id,
      author_id: c.author_id,
      content: c.content,
      created_at: c.created_at,
      author: { username: profileMap.get(c.author_id) ?? "不明" },
    }));

    const emojiMap = new Map<string, number>();
    for (const r of allReactions ?? []) {
      emojiMap.set(r.emoji, (emojiMap.get(r.emoji) ?? 0) + 1);
    }
    initialReactions = Array.from(emojiMap.entries()).map(([emoji, count]) => ({
      emoji,
      count,
      includesMe: false,
    }));
  }

  return (
    <MemoEditor
      characterName={characterName}
      initialMemo={memo ?? null}
      isAuthenticated={true}
      username={username}
      memoId={memoId}
      initialComments={initialComments}
      initialReactions={initialReactions}
    />
  );
}
