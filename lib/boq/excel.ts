import * as XLSX from "xlsx";
import { REQUIRED_COLUMNS } from "./schema";
import type { SheetCandidate } from "./types";

function normalizeHeader(v: unknown): string {
  return String(v ?? "").trim();
}

function readHeaderRow(sheet: XLSX.WorkSheet): string[] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
  });

  const header = Array.isArray(rows?.[0]) ? rows[0] : [];
  return header.map(normalizeHeader).filter(Boolean);
}

export async function getValidSheetsFromPublicXlsx(
  publicPath: string
): Promise<SheetCandidate[]> {
  const res = await fetch(publicPath, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch: ${publicPath}`);

  const buf = await res.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  const candidates: SheetCandidate[] = wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name];
    const headers = readHeaderRow(ws);

    const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));

    return {
      name,
      isValid: missing.length === 0,
      missingColumns: missing,
    };
  });

  return candidates.filter((s) => s.isValid);
}
