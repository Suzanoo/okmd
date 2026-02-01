import * as XLSX from "xlsx";
import type { BoqRow } from "./types";
import { REQUIRED_COLUMNS } from "./schema";

function toNumber(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const s = String(v).replace(/,/g, "").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function toText(v: unknown): string {
  return String(v ?? "").trim();
}

function findHeaderIndexMap(headerRow: unknown[]): Record<string, number> {
  const map: Record<string, number> = {};
  headerRow.forEach((h, idx) => {
    const key = toText(h);
    if (key) map[key] = idx;
  });
  return map;
}

export async function fetchWorkbookBuffer(publicPath: string): Promise<ArrayBuffer> {
  const res = await fetch(publicPath, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch: ${publicPath}`);
  return await res.arrayBuffer();
}

export function getValidSheetsFromBuffer(buf: ArrayBuffer) {
  const wb = XLSX.read(buf, { type: "array" });

  return wb.SheetNames.filter((name) => {
    const ws = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      blankrows: false,
      defval: "",
    });

    const header = Array.isArray(rows?.[0]) ? rows[0] : [];
    const headers = header.map(toText).filter(Boolean);

    return REQUIRED_COLUMNS.every((c) => headers.includes(c));
  });
}

export function parseBoqRowsFromBuffer(
  buf: ArrayBuffer,
  sheetName: string
): BoqRow[] {
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    blankrows: false,
    defval: "",
  });

  if (!Array.isArray(rows) || rows.length < 2) return [];

  const headerRow = Array.isArray(rows[0]) ? rows[0] : [];
  const idxMap = findHeaderIndexMap(headerRow);

  // sanity check (should already be valid)
  for (const col of REQUIRED_COLUMNS) {
    if (idxMap[col] === undefined) return [];
  }

  const out: BoqRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!Array.isArray(r)) continue;

    const wbs1 = toText(r[idxMap["WBS-1"]]);
    const wbs2 = toText(r[idxMap["WBS-2"]]);
    const wbs3 = toText(r[idxMap["WBS-3"]]);
    const wbs4 = toText(r[idxMap["WBS-4"]]);
    const description = toText(r[idxMap["Description"]]);

    // ข้ามแถวว่างหลัก ๆ
    if (!wbs1 && !wbs2 && !wbs3 && !wbs4 && !description) continue;

    out.push({
      wbs1,
      wbs2,
      wbs3,
      wbs4,
      description,
      unit: toText(r[idxMap["Unit"]]),
      qty: toNumber(r[idxMap["Qty"]]),
      material: toNumber(r[idxMap["Material"]]),
      labor: toNumber(r[idxMap["Labor"]]),
      amount: toNumber(r[idxMap["Amount"]]),
    });
  }

  return out;
}
