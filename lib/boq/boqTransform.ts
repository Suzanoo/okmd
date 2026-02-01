import type { BoqRow } from "./types";

export type ChartDatum = { name: string; value: number };

export type Filters = {
  wbs1?: string | null;
  wbs2?: string | null;
  wbs3?: string | null;
  wbs4?: string | null;
};

function keyText(v: unknown): string {
  return String(v ?? "").trim();
}

export function filterRows(rows: BoqRow[], f: Filters): BoqRow[] {
  return rows.filter((r) => {
    if (f.wbs1 && r.wbs1 !== f.wbs1) return false;
    if (f.wbs2 && r.wbs2 !== f.wbs2) return false;
    if (f.wbs3 && r.wbs3 !== f.wbs3) return false;
    if (f.wbs4 && r.wbs4 !== f.wbs4) return false;
    return true;
  });
}

export function sumBy(
  rows: BoqRow[],
  key: (r: BoqRow) => string
): ChartDatum[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = keyText(key(r));
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + (r.amount ?? 0));
  }
  return Array.from(m, ([name, value]) => ({ name, value }))
    .filter((d) => d.value !== 0)
    // .sort((a, b) => b.value - a.value);
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(n);
}
