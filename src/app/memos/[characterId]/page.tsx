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

  const username = user.user_metadata?.username as string | undefined;

  const { data: memo } = await supabase
    .from("memos")
    .select("id, content")
    .eq("character_name", characterName)
    .single();

  return (
    <MemoEditor
      characterName={characterName}
      initialMemo={memo ?? null}
      isAuthenticated={true}
      username={username}
    />
  );
}
