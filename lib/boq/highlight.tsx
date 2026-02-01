import { JSX } from "react";

/**
 * Highlight matched keywords in text
 * - รองรับ Thai / English
 * - case-insensitive
 * - ปลอดภัยกับ regex
 */
export function highlightText(
  text: string,
  keywords: string[]
): (string | JSX.Element)[] {
  if (!keywords.length) return [text];

  const escaped = keywords.map((k) =>
    k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );

  const regex = new RegExp(`(${escaped.join("|")})`, "giu");

  return text.split(regex).map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        className="rounded bg-yellow-200 px-0.5 text-foreground"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}
