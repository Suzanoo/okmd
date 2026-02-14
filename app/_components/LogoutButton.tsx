"use client";

import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function LogoutButton() {
  const router = useRouter();

  return (
    <button
      className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-white/5"
      onClick={async () => {
        const supabase = supabaseBrowser();
        await supabase.auth.signOut();
        router.replace("/");
        router.refresh();
      }}
    >
      Logout
    </button>
  );
}
