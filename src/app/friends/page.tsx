import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import FriendsSection from "@/app/mypage/FriendsSection";

export default async function FriendsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const username = (user.user_metadata?.username as string | undefined) ?? "";

  // フレンドリスト
  const { data: friendRows } = await supabase
    .from("friends")
    .select("friend_id")
    .eq("user_id", user.id);

  const friendIds = (friendRows ?? []).map((r: { friend_id: string }) => r.friend_id);

  let friends: { request_id: string; friend_id: string; username: string; friend_code: string }[] = [];
  if (friendIds.length > 0) {
    const { data: friendProfiles } = await supabase
      .from("profiles")
      .select("id, username, friend_code")
      .in("id", friendIds);
    friends = (friendProfiles ?? []).map((p: { id: string; username: string; friend_code: string }) => ({
      request_id: "",
      friend_id: p.id,
      username: p.username,
      friend_code: p.friend_code,
    }));
  }

  // 受信した pending フレンド申請
  const { data: pendingRows } = await supabase
    .from("friend_requests")
    .select("id, sender_id, profiles!friend_requests_sender_id_fkey(username)")
    .eq("receiver_id", user.id)
    .eq("status", "pending");

  type PendingRow = { id: string; sender_id: string; profiles: { username: string }[] };
  const pendingRequests = ((pendingRows ?? []) as PendingRow[]).map((r) => ({
    request_id: r.id,
    sender_id: r.sender_id,
    username: r.profiles?.[0]?.username ?? "不明",
  }));

  return (
    <AppShell title="フレンド" isAuthenticated={true} username={username} pendingCount={pendingRequests.length}>
      <FriendsSection friends={friends} pendingRequests={pendingRequests} />
    </AppShell>
  );
}
