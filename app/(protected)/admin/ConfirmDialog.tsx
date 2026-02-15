"use client";

import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  danger?: boolean;

  // ถ้ามี ต้องพิมพ์ให้ตรงก่อน confirm
  requireMatchLabel?: string;
  requireMatchValue?: string;

  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirm",
  danger = false,
  requireMatchLabel,
  requireMatchValue,
  onCancel,
  onConfirm,
}: Props) {
  const [typed, setTyped] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      setTyped("");
      setPending(false);
    }
  }, [open]);

  if (!open) return null;

  const needsMatch = !!requireMatchValue;
  const okMatch = !needsMatch || typed.trim() === (requireMatchValue ?? "");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>

          <button
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => !pending && onCancel()}
          >
            Close
          </button>
        </div>

        {needsMatch ? (
          <div className="mt-4 space-y-2">
            <label className="text-sm">
              {requireMatchLabel ?? "Type to confirm"}
            </label>
            <input
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={requireMatchValue}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              ต้องพิมพ์ให้ตรง:{" "}
              <span className="text-foreground">{requireMatchValue}</span>
            </p>
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-white/5"
            onClick={() => !pending && onCancel()}
          >
            Cancel
          </button>

          <button
            disabled={!okMatch || pending}
            className={[
              "rounded-xl px-3 py-2 text-sm font-medium text-background disabled:opacity-60",
              danger ? "bg-red-600" : "bg-foreground",
            ].join(" ")}
            onClick={async () => {
              setPending(true);
              try {
                await onConfirm();
              } finally {
                setPending(false);
              }
            }}
          >
            {pending ? "Working..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
