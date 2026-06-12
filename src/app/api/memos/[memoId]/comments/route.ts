import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ memoId: string }> }) {
  const { memoId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { data, error } = await supabase
    .from("memo_comments")
    .select("id, author_id, content, created_at, profiles!memo_comments_author_id_fkey(username)")
    .eq("memo_id", memoId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data ?? [] });
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
    .select("id, author_id, content, created_at, profiles!memo_comments_author_id_fkey(username)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data });
}
