import { supabaseServer } from "@/lib/supabase/server";
import AppHeaderClient from "./AppHeaderClient";

export default async function AppHeader() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role,is_active")
      .eq("id", user.id)
      .single();

    isAdmin = !!profile?.is_active && profile.role === "admin";
  }

  return <AppHeaderClient user={user} isAdmin={isAdmin} />;
}
