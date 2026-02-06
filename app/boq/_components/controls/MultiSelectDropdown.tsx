"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Option = { value: string; label?: string };

type Props = {
  label: string;
  options: Option[];
  value: string[]; // selected values
  onChange: (next: string[]) => void;

  placeholder?: string; // shown when empty
  disabled?: boolean;

  // UI tokens (optional)
  className?: string; // wrapper
  buttonClassName?: string;
  panelClassName?: string;
};

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}

export default function MultiSelectDropdown({
  label,
  options,
  value,
  onChange,
  placeholder = "All",
  disabled,
  className,
  buttonClassName,
  panelClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Only keep selections that still exist in options
  const optionSet = useMemo(
    () => new Set(options.map((o) => o.value)),
    [options],
  );
  useEffect(() => {
    const cleaned = value.filter((v) => optionSet.has(v));
    if (cleaned.length !== value.length) onChange(cleaned);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionSet]);

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!open) return;
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open]);

  function toggle(v: string) {
    const next = value.includes(v)
      ? value.filter((x) => x !== v)
      : uniq([...value, v]);
    onChange(next);
  }

  function selectAll() {
    onChange(options.map((o) => o.value));
  }

  function clear() {
    onChange([]);
  }

  const selectedText =
    value.length === 0
      ? placeholder
      : value.length <= 2
        ? value.join(", ")
        : `${value.length} selected`;

  const btnBase =
    "h-8 w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] " +
    "px-2 text-[11px] text-[color:var(--color-foreground)] shadow-[var(--shadow-input)] " +
    "flex items-center justify-between gap-2 hover:opacity-95 " +
    "focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/25 disabled:opacity-40";

  const panelBase =
    "absolute left-0 top-[calc(100%+6px)] z-50 min-w-[260px] max-w-[360px] " +
    "rounded-2xl border border-[color:var(--color-border)] " +
    "bg-[color:var(--color-surface)] shadow-[var(--shadow-card)] p-2";

  const itemCls =
    "flex items-start gap-2 rounded-xl px-2 py-1.5 text-xs text-[color:var(--color-foreground)] " +
    "hover:bg-[color:var(--color-surface-2)]";

  const chkCls =
    "h-4 w-4 rounded border border-[color:var(--color-border)] accent-[color:var(--color-accent)]";

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <div className="text-[11px] font-semibold text-[color:var(--color-muted-foreground)]">
        {label}
      </div>

      <button
        type="button"
        disabled={disabled}
        className={`${btnBase} ${buttonClassName ?? ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="truncate">{selectedText}</span>
        <span className="text-[color:var(--color-muted-foreground)]">▾</span>
      </button>

      {open ? (
        <div className={`${panelBase} ${panelClassName ?? ""}`}>
          {/* actions */}
          <div className="flex items-center justify-between gap-2 px-1 pb-2">
            <div className="text-[11px] text-[color:var(--color-muted-foreground)]">
              {value.length === 0 ? "All" : `${value.length} selected`}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-[11px] text-[color:var(--color-foreground)] underline underline-offset-2 hover:opacity-80"
                onClick={selectAll}
              >
                Select all
              </button>
              <button
                type="button"
                className="text-[11px] text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]"
                onClick={clear}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="max-h-56 overflow-auto pr-1">
            {options.length === 0 ? (
              <div className="px-2 py-3 text-xs text-[color:var(--color-muted-foreground)]">
                No options
              </div>
            ) : (
              options.map((o) => {
                const checked = value.includes(o.value);
                return (
                  <label key={o.value} className={itemCls}>
                    <input
                      type="checkbox"
                      className={chkCls}
                      checked={checked}
                      onChange={() => toggle(o.value)}
                    />
                    <span className="whitespace-normal leading-4">
                      {o.label ?? o.value}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
