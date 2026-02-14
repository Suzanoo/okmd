import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

import BOQClient from "./_components/BOQClient";

export default async function BOQPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login?next=/boq");

  return <BOQClient />;
}
