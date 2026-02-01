"use client";

import type { BoqBuilding } from "@/lib/boq/types";

type Props = {
  building: BoqBuilding;
  onChange: (b: BoqBuilding) => void;
};

export default function BuildingFilePicker({ building, onChange }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-medium">Select BOQ</div>

      <select
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm
           focus:outline-none focus:ring-2 focus:ring-sky-200"
        value={building}
        onChange={(e) => onChange(e.target.value as BoqBuilding)}
      >
        <option value="NKC1">NKC1 — BOQ_NKC1.xlsx</option>
        <option value="NKC2">NKC2 — BOQ_NKC2.xlsx</option>
      </select>
      {/* 
      <div className="mt-2 text-xs text-muted-foreground">
        Path: <span className="font-mono">/boq/BOQ_{building}.xlsx</span>
      </div> */}
    </div>
  );
}
