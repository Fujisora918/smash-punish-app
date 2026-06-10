import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import MyPageTabs from "./MyPageTabs";

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const username = (user.user_metadata?.username as string | undefined) ?? "";
  const email = user.email ?? "";

  const { data: profile } = await supabase
    .from("profiles")
    .select("friend_code")
    .eq("id", user.id)
    .single();

  const friendCode = profile?.friend_code ?? "";

  return (
    <AppShell title="マイページ" isAuthenticated={true} username={username}>
      <Suspense>
        <MyPageTabs
          account={{ username, email }}
          qrPayload={{ friend_code: friendCode, username }}
          hasFriendCode={!!friendCode}
        />
      </Suspense>
    </AppShell>
  );
}
