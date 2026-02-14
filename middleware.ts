import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
// ถ้าไม่มี alias @ ให้ใช้: import { updateSession } from "./lib/supabase/middleware";

export async function middleware(req: NextRequest) {
  return updateSession(req);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
