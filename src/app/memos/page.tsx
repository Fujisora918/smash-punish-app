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

  return (
    <MemosClient
      initialMemos={memos ?? []}
      isAuthenticated={true}
      username={username}
    />
  );
}
