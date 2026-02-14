"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  const nextPath = useMemo(() => {
    const n = params.get("next");
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

            router.replace(nextPath);
            router.refresh();
          }}
        >
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />

          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
          />

          {error && <div className="text-sm text-red-400">{error}</div>}

          <button
            disabled={pending}
            className="w-full rounded-xl bg-foreground px-4 py-2 text-sm text-background"
          >
            {pending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
