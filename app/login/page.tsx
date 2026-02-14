"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();

  const nextPath = useMemo(() => {
    const n = params.get("next");
    // กัน open-redirect: ให้รับแค่ path ที่ขึ้นต้นด้วย /
    if (!n || !n.startsWith("/")) return "/report";
    return n;
  }, [params]);

  const supabase = useMemo(() => supabaseBrowser(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
        <h1 className="text-xl font-semibold text-foreground">KAMUI Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to access BOQ / Report / Progress.
        </p>

        <form
          className="mt-6 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setPending(true);
            setError(null);

            const { error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            setPending(false);

            if (error) {
              setError(error.message);
              return;
            }

            // สำคัญ: refresh หน้าเพื่อให้ server components เห็น session ทันที
            router.replace(nextPath);
            router.refresh();
          }}
        >
          <div className="space-y-1">
            <label className="text-sm text-foreground">Email</label>
            <input
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@company.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-foreground">Password</label>
            <input
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            disabled={pending}
            className="w-full rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
            type="submit"
          >
            {pending ? "Signing in..." : "Sign in"}
          </button>

          <p className="text-xs text-muted-foreground">
            (เดี๋ยวเราค่อยเพิ่มปุ่ม Reset password / Admin create user ทีหลัง)
          </p>
        </form>
      </div>
    </main>
  );
}
