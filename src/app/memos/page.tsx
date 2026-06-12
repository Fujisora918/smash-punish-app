export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MemosClient from "./MemosClient";

export default async function MemosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const username = user.user_metadata?.username as string | undefined;
  const { data: memos } = await supabase
    .from("memos")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const memoList = memos ?? [];
  const memoIds = memoList.map((m) => m.id);

  // 未読判定: reactions / comments の最新日時を取得
  const newActivitySet = new Set<string>();

  if (memoIds.length > 0) {
    const [{ data: reactions }, { data: comments }] = await Promise.all([
      supabase.from("memo_reactions").select("memo_id, created_at").in("memo_id", memoIds),
      supabase.from("memo_comments").select("memo_id, created_at").in("memo_id", memoIds),
    ]);

    // memo_id ごとの最新アクティビティ日時マップ
    const latestMap = new Map<string, string>();
    for (const r of reactions ?? []) {
      const prev = latestMap.get(r.memo_id);
      if (!prev || r.created_at > prev) latestMap.set(r.memo_id, r.created_at);
    }
    for (const c of comments ?? []) {
      const prev = latestMap.get(c.memo_id);
      if (!prev || c.created_at > prev) latestMap.set(c.memo_id, c.created_at);
    }

    for (const memo of memoList) {
      const latest = latestMap.get(memo.id);
      if (!latest) continue;
      // last_viewed_at が null、または最新アクティビティより古ければ未読
      if (!memo.last_viewed_at || latest > memo.last_viewed_at) {
        newActivitySet.add(memo.character_name);
      }
    }
  }

  return (
    <MemosClient
      initialMemos={memoList}
      isAuthenticated={true}
      username={username}
      newActivityNames={[...newActivitySet]}
    />
  );
}
