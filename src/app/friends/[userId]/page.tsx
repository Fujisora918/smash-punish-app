import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import FriendMemosClient from "./FriendMemosClient";
import type { Memo } from "@/lib/types";

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function FriendMemosPage({ params }: Props) {
  const { userId } = await params;

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

  // フレンドのプロフィール取得
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .single();

  if (!profile) notFound();

  // フレンドのメモ一覧取得
  const { data: memos } = await supabase
    .from("memos")
    .select("id, user_id, character_name, content, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  const username = (user.user_metadata?.username as string | undefined) ?? "";

  return (
    <AppShell title={`${profile.username} のメモ`} isAuthenticated={true} username={username}>
      <FriendMemosClient
        friendId={userId}
        friendUsername={profile.username}
        initialMemos={(memos ?? []) as Memo[]}
      />
    </AppShell>
  );
}
