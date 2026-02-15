"use client";

import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { LogOut } from "lucide-react";

type Props = {
  variant?: "desktop" | "drawer";
  onAfterLogout?: () => void; // สำหรับปิด drawer
};

export default function LogoutButton({
  variant = "desktop",
  onAfterLogout,
}: Props) {
  const router = useRouter();

  const base =
    "inline-flex items-center justify-center gap-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-white/20";

  const styles =
    variant === "drawer"
      ? "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/90 hover:bg-white/10 hover:text-white"
      : "rounded-xl border border-border px-3 py-2 hover:bg-white/5";

  return (
    <button
      className={`${base} ${styles}`}
      onClick={async () => {
        const supabase = supabaseBrowser();
        await supabase.auth.signOut();

        if (onAfterLogout) onAfterLogout();

        router.replace("/");
        router.refresh();
      }}
    >
      <LogOut className="h-4 w-4" />
      Logout
    </button>
  );
}
