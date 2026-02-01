import type { BoqRow } from "./types";

export type MatchMode = "all" | "any";

/** escape regex special chars (กัน user พิมพ์ * + ?) */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build regex for Thai + English
 * - unicode
 * - case-insensitive
 * - partial match
 */
export function buildDescriptionRegex(input: string, mode: MatchMode): RegExp | null {
  const q = input.trim();
  if (!q) return null;

  const parts = q.split(/\s+/).map(escapeRegExp);
  if (parts.length === 0) return null;

  if (mode === "any") {
    // OR
    return new RegExp(`(${parts.join("|")})`, "iu");
  }

  // ALL (AND)
  const pattern = parts.map((p) => `(?=.*${p})`).join("") + ".*";
  return new RegExp(pattern, "iu");
}

export function filterByDescription(
  rows: BoqRow[],
  regex: RegExp
): BoqRow[] {
  return rows.filter((r) => regex.test(r.description));
}

export function toCSV(rows: BoqRow[]): string {
  const header = [
    "WBS-1",
    "WBS-2",
    "WBS-3",
    "WBS-4",
    "Description",
    "Unit",
    "Qty",
    "Material",
    "Labor",
    "Amount",
  ];

  const lines = rows.map((r) => [
    r.wbs1,
    r.wbs2,
    r.wbs3,
    r.wbs4,
    r.description,
    r.unit,
    r.qty,
    r.material,
    r.labor,
    r.amount,
  ]);

  return [header, ...lines]
    .map((row) =>
      row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
}
