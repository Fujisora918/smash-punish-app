import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { request_id, status } = await req.json();
  if (!request_id || !["accepted", "rejected"].includes(status)) {
    return NextResponse.json({ error: "不正なリクエスト" }, { status: 400 });
  }

  // RLS により receiver のみ更新可
  const { error } = await supabase
    .from("friend_requests")
    .update({ status })
    .eq("id", request_id)
    .eq("receiver_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
