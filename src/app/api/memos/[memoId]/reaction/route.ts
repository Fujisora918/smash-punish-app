import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ memoId: string }>;
}

// POST: リアクションをupsert（既存があれば更新）
export async function POST(req: Request, { params }: Params) {
  const { memoId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { emoji } = await req.json();
  if (!emoji || typeof emoji !== "string") {
    return NextResponse.json({ error: "emoji required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("memo_reactions")
    .upsert({ memo_id: memoId, user_id: user.id, emoji }, { onConflict: "memo_id,user_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE: 自分のリアクションを削除
export async function DELETE(_req: Request, { params }: Params) {
  const { memoId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("memo_reactions")
    .delete()
    .eq("memo_id", memoId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
