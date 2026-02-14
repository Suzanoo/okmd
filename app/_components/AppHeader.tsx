import { supabaseServer } from "@/lib/supabase/server";
import AppHeaderClient from "./AppHeaderClient";

export default async function AppHeader() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  return <AppHeaderClient user={data.user} />;
}
