import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Body = {
  email: string;
  password: string;
  full_name?: string;
  role?: "admin" | "editor" | "viewer";
};

export async function POST(req: Request) {
  // 1) เช็คว่าผู้เรียกล็อกอิน + เป็น admin + active
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase
    .from("profiles")
    .select("role,is_active")
    .eq("id", auth.user.id)
    .single();

  if (!me?.is_active || me.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2) อ่าน body
  const body = (await req.json()) as Body;
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const full_name = String(body.full_name ?? "").trim();
  const role = (body.role ?? "viewer") as Body["role"];

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  // 3) สร้าง user ด้วย service role
  const admin = supabaseAdmin();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // ให้ใช้งานได้ทันที (ถ้าอยากให้ยืนยันเมลก่อน เปลี่ยนเป็น false)
    user_metadata: { full_name },
  });

  if (createErr || !created.user) {
    return NextResponse.json({ error: createErr?.message ?? "Create user failed" }, { status: 400 });
  }

  // 4) ตั้งค่า profile (role/full_name/email/is_active) ให้ทันที
  // (ทำแบบ upsert กัน trigger/เวลา sync ไม่ทัน)
  const { error: upsertErr } = await admin
    .from("profiles")
    .upsert({
      id: created.user.id,
      email,
      full_name: full_name ?? "",
      role,
      is_active: true,
    });

  if (upsertErr) {
    // user ถูกสร้างแล้ว แต่ profile อัปเดตไม่ได้ -> ส่ง warning
    return NextResponse.json(
      { ok: true, userId: created.user.id, email, warning: upsertErr.message },
      { status: 200 }
    );
  }

  return NextResponse.json({ ok: true, userId: created.user.id, email }, { status: 200 });
}
