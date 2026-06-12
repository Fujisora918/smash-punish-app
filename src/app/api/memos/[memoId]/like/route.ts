import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ memoId: string }> }) {
  const { memoId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { error } = await supabase.from("memo_likes").insert({ memo_id: memoId, user_id: user.id });
  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true }); // already liked
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ memoId: string }> }) {
  const { memoId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { error } = await supabase
    .from("memo_likes")
    .delete()
    .eq("memo_id", memoId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
