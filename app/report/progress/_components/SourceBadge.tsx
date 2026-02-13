"use client";

export default function SourceBadge({
  source,
  filename,
}: {
  source: "template" | "upload";
  filename: string;
}) {
  const label = source === "template" ? "TEMPLATE" : "UPLOAD";

  return (
    <div className="flex items-center gap-2">
      <span className="rounded-full border border-border bg-surface-2 px-2 py-1 text-[11px] font-semibold text-foreground">
        {label}
      </span>
      <span className="text-xs text-muted-foreground">{filename}</span>
    </div>
  );
}
