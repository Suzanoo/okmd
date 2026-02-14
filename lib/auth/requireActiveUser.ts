import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export type AppRole = "admin" | "editor" | "viewer";

export type ActiveUser = {
  userId: string;
  email: string | null;
  role: AppRole;
};

type Options = {
  nextPath?: string;          // ใช้สำหรับ redirect กลับหน้าที่ตั้งใจเข้า
  requireRole?: AppRole;      // ถ้าต้องการบังคับ role ขั้นต่ำแบบเฉพาะหน้า
  requireAdmin?: boolean;     // shortcut
};

export async function requireActiveUser(options: Options = {}): Promise<ActiveUser> {
  const { nextPath, requireRole, requireAdmin } = options;

  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login${next}`);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role,is_active,email")
    .eq("id", data.user.id)
    .single();

  // ถ้าไม่มี profile หรือถูก disable -> ให้ logout เชิง logic (redirect ออก)
  if (error || !profile || !profile.is_active) {
    redirect("/login");
  }

  const role = profile.role as AppRole;

  // บังคับ admin
  if (requireAdmin && role !== "admin") {
    redirect("/");
  }

  // บังคับ role แบบตรงตัว (ถ้าต้องการ)
  if (requireRole && role !== requireRole) {
    redirect("/");
  }

  return {
    userId: data.user.id,
    email: data.user.email ?? profile.email ?? null,
    role,
  };
}
