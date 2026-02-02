"use client";

import type { BoqBuilding } from "@/lib/boq/types";

type Props = {
  building: BoqBuilding;
  onChange: (b: BoqBuilding) => void;
};

export default function BuildingFilePicker({ building, onChange }: Props) {
  return (
    <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="text-sm font-medium text-[color:var(--color-muted-foreground)]">
        Select BOQ
      </div>

      <select
        className="mt-2 h-10 w-full rounded-xl border border-[color:var(--color-border)]
          bg-[color:var(--color-surface-2)] px-3 text-sm text-[color:var(--color-foreground)]
          shadow-[var(--shadow-input)] outline-none
          focus:ring-2 focus:ring-[color:var(--color-accent)]/35 disabled:opacity-60"
        value={building}
        onChange={(e) => onChange(e.target.value as BoqBuilding)}
      >
        <option value="NKC1">NKC1 — BOQ_NKC1.xlsx</option>
        <option value="NKC2">NKC2 — BOQ_NKC2.xlsx</option>
      </select>

      {/* Optional helper line
      <div className="mt-2 text-xs text-[color:var(--color-muted-foreground)]">
        Path: <span className="font-mono">/boq/BOQ_{building}.xlsx</span>
      </div>
      */}
    </section>
  );
}
