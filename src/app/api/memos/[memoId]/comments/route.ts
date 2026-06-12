import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ memoId: string }> }) {
  const { memoId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { data: comments, error } = await supabase
    .from("memo_comments")
    .select("id, author_id, content, created_at")
    .eq("memo_id", memoId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // author_id をまとめてプロフィール取得
  const authorIds = [...new Set((comments ?? []).map((c) => c.author_id))];
  const { data: profiles } = authorIds.length > 0
    ? await supabase.from("profiles").select("id, username").in("id", authorIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.username]));

  const result = (comments ?? []).map((c) => ({
    id: c.id,
    author_id: c.author_id,
    content: c.content,
    created_at: c.created_at,
    author: { username: profileMap.get(c.author_id) ?? "不明" },
  }));

  return NextResponse.json({ comments: result });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ memoId: string }> }) {
  const { memoId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "コメントが空です" }, { status: 400 });

  const { data, error } = await supabase
    .from("memo_comments")
    .insert({ memo_id: memoId, author_id: user.id, content: content.trim() })
    .select("id, author_id, content, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // username を別途取得
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    comment: {
      ...data,
      author: { username: profile?.username ?? "不明" },
    },
  });
}
