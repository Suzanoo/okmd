import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Body = { userId: string; newPassword: string };

export async function POST(req: Request) {
  // check caller session
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // check caller is admin + active
  const { data: me } = await supabase
    .from("profiles")
    .select("role,is_active")
    .eq("id", auth.user.id)
    .single();

  if (!me?.is_active || me.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as Body;
  const userId = String(body.userId ?? "").trim();
  const newPassword = String(body.newPassword ?? "");

  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true }, { status: 200 });
}
