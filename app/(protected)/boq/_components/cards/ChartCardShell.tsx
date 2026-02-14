"use client";

import { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
};

export default function ChartCardShell({
  title,
  subtitle,
  right,
  children,
}: Props) {
  return (
    <section
      className="
        rounded-3xl border border-[color:var(--color-border)]
        bg-[color:var(--color-surface)] p-5
        shadow-[var(--shadow-card)]
        transition
        hover:shadow-[var(--shadow-card-lg)]
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[color:var(--color-foreground)]">
            {title}
          </div>

          {subtitle ? (
            <div className="mt-0.5 text-xs text-[color:var(--color-muted-foreground)]">
              {subtitle}
            </div>
          ) : null}
        </div>

        {right ? <div className="shrink-0">{right}</div> : null}
      </div>

      <div className="mt-3">{children}</div>
    </section>
  );
}
