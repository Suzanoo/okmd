import { JSX } from "react";

/**
 * Highlight matched keywords in text
 * - รองรับ Thai / English
 * - case-insensitive
 * - ปลอดภัยกับ regex
 */
export function highlightText(
  text: string,
  keywords: string[],
): (string | JSX.Element)[] {
  if (!keywords.length) return [text];

  const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  const regex = new RegExp(`(${escaped.join("|")})`, "giu");

  return text.split(regex).map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        className="rounded px-0.5
             bg-amber-200/80 text-slate-900 ring-1 ring-amber-300/60
             dark:bg-amber-400/20 dark:text-amber-200 dark:ring-amber-300/20"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
