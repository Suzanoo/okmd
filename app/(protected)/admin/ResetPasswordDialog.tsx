"use client";

import { useState } from "react";

import ConfirmDialog from "./ConfirmDialog";

export default function ResetPasswordDialog({
  userId,
  email,
  onDone,
}: {
  userId: string;
  email: string;
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [confirmWord, setConfirmWord] = useState("");

  async function submit() {
    setPending(true);
    setError(null);

    const res = await fetch("/api/admin/users/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, newPassword: pw }),
    });

    const json = await res.json().catch(() => ({}));
    setPending(false);

    if (!res.ok || !json.ok) {
      setError(json.error ?? "Reset failed");
      return;
    }

    setOpen(false);
    setPw("");
    onDone?.();
    setConfirmWord("");
  }

  return (
    <>
      <button
        className="rounded-md border border-border px-2 py-1 text-xs hover:bg-white/5 bg-amber-500"
        onClick={() => setOpen(true)}
      >
        Reset PW
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Reset password</h2>
              <button
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              User: <span className="text-foreground">{email}</span>
            </p>

            <div className="mt-4 space-y-2">
              <label className="text-sm">New password (min 8 chars)</label>
              <input
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="New password"
              />
              {error ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <label className="text-sm mt-3 block">
                Type RESET to confirm
              </label>
              <input
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={confirmWord}
                onChange={(e) => setConfirmWord(e.target.value)}
                placeholder="RESET"
              />

              <button
                disabled={pending || confirmWord.trim() !== "RESET"}
                onClick={submit}
                className="w-full rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
              >
                {pending ? "Resetting..." : "Reset password"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
