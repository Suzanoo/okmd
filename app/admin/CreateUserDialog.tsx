"use client";

import { useState } from "react";

type Role = "admin" | "editor" | "viewer";

export default function CreateUserDialog({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
        role,
      }),
    });

    const json = await res.json().catch(() => ({}));

    setPending(false);

    if (!res.ok || !json.ok) {
      setError(json.error ?? "Create user failed");
      return;
    }

    setOpen(false);
    setEmail("");
    setFullName("");
    setRole("viewer");
    setPassword("");
    onCreated();
  }

  return (
    <>
      <button
        className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-white/5"
        onClick={() => setOpen(true)}
      >
        Create User
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Create user</h2>
              <button
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <label className="text-sm">Email</label>
                <input
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@company.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm">Full name</label>
                <input
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Name Surname"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm">Role</label>
                <select
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                >
                  <option value="viewer">viewer</option>
                  <option value="editor">editor</option>
                  <option value="admin">admin</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm">Password (min 8 chars)</label>
                <input
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Temporary password"
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <button
                disabled={pending}
                onClick={submit}
                className="w-full rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
              >
                {pending ? "Creating..." : "Create"}
              </button>

              <p className="text-xs text-muted-foreground">
                * Admin ตั้ง password แล้วส่งให้ user (เช่น LINE) ได้เลย
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
