"use client";

import { useThemeStore } from "@/lib/theme/store";

export default function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="
        inline-flex items-center gap-2
        rounded-xl border border-[color:var(--color-border)]
        bg-[color:var(--color-surface)]
        px-3 py-2 text-xs font-medium
        text-[color:var(--color-foreground)]
        shadow-[var(--shadow-card)]
        transition
        hover:bg-[color:var(--color-surface-2)]
        focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/40
      "
    >
      {/* icon */}
      <span
        className="inline-flex h-4 w-4 items-center justify-center text-sm"
        aria-hidden
      >
        {isDark ? "🌙" : "☀️"}
      </span>

      {/* label */}
      <span>{isDark ? "Night" : "Day"}</span>
    </button>
  );
}
