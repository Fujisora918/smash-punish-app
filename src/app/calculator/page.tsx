import { createClient } from "@/lib/supabase/server";
import CalculatorClient from "./CalculatorClient";

export default async function CalculatorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const username = user?.user_metadata?.username as string | undefined;

  return <CalculatorClient isAuthenticated={!!user} username={username} />;
}
