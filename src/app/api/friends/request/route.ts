import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { friend_code } = await req.json();
  if (!friend_code) return NextResponse.json({ error: "フレンドコードが必要です" }, { status: 400 });

  // friend_code からプロフィールを検索
  const { data: target, error: profileErr } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("friend_code", friend_code.trim().toUpperCase())
    .single();

  if (profileErr || !target) {
    return NextResponse.json({ error: "そのフレンドコードのユーザーが見つかりません" }, { status: 404 });
  }

  if (target.id === user.id) {
    return NextResponse.json({ error: "自分自身にフレンド申請はできません" }, { status: 400 });
  }

  const { error: insertErr } = await supabase
    .from("friend_requests")
    .insert({ sender_id: user.id, receiver_id: target.id });

  if (insertErr) {
    if (insertErr.code === "23505") {
      return NextResponse.json({ error: "既にフレンド申請済みです" }, { status: 409 });
    }
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, username: target.username });
}
