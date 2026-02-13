// app/report/_data/adapters/parseProgressSummary.ts
import type { ProgressPoint } from "../models/progress";
import { isISODateKey, sortISODateKeys, detectCutoffDate } from "@/lib/report/time";

type Sheet2D = (string | number | boolean | Date | null | undefined)[][];

function toNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asString(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v.trim();
  return String(v);
}

/**
 * Excel date serial -> ISO "YYYY-MM-DD"
 * Excel serial is days since 1899-12-30 (the common Excel system).
 */
function excelSerialToISODate(serial: number): string | null {
  if (!Number.isFinite(serial)) return null;
  // sanity range (roughly years 2000-2100)
  if (serial < 36526 || serial > 73050) return null;

  const ms = Math.round((serial - 25569) * 86400 * 1000); // 25569 days from 1899-12-30 to 1970-01-01
  const d = new Date(ms);

  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Normalize a header cell into ISO date key if possible.
 * Accepts:
 * - ISO string "YYYY-MM-DD"
 * - Excel serial number (e.g., 45700)
 * - JS Date
 */
function toISODateKey(v: unknown): string | null {
  if (typeof v === "string") {
    const s = v.trim();
    if (isISODateKey(s)) return s;
    return null;
  }
  if (typeof v === "number") {
    return excelSerialToISODate(v);
  }
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const yyyy = v.getFullYear();
    const mm = String(v.getMonth() + 1).padStart(2, "0");
    const dd = String(v.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

export function parseProgressSummarySheet(rows: Sheet2D): {
  dates: string[];
  planAcc: Record<string, number>;
  actualAcc: Record<string, number>;
  cutoffAuto: string | null;
} {
  if (!rows.length) throw new Error("Progress_Summary is empty.");

  // -------- Pattern A: wide 3 rows --------
  // row0: dates (header)
  // row1: plan accumulate
  // row2: actual accumulate
  const row0 = rows[0] ?? [];
  const row1 = rows[1] ?? [];
  const row2 = rows[2] ?? [];

  const dateCols: { date: string; idx: number }[] = [];
  for (let i = 0; i < row0.length; i++) {
    const d = toISODateKey(row0[i]);
    if (d) dateCols.push({ date: d, idx: i });
  }

  // In your screenshot: it IS this pattern (dates row + 2 numeric rows)
  if (dateCols.length >= 2 && rows.length >= 3) {
    const planAcc: Record<string, number> = {};
    const actualAcc: Record<string, number> = {};

    for (const dc of dateCols) {
      const p = toNumber(row1[dc.idx]);
      const a = toNumber(row2[dc.idx]);
      if (p != null) planAcc[dc.date] = p;
      if (a != null) actualAcc[dc.date] = a;
    }

    const dates = sortISODateKeys(dateCols.map((x) => x.date));
    const cutoffAuto = detectCutoffDate(dates.map((d) => ({ date: d, actual: actualAcc[d] ?? null })));

    return { dates, planAcc, actualAcc, cutoffAuto };
  }

  // -------- Pattern B: tabular --------
  // header: Date | Plan_Acc | Actual_Acc (names flexible)
  const header = (rows[0] ?? []).map((x) => (asString(x) ?? "").toLowerCase());
  const dateIdx = header.findIndex((h) => h === "date" || h === "period" || h.includes("date"));
  const planIdx = header.findIndex((h) => h.includes("plan"));
  const actualIdx = header.findIndex((h) => h.includes("actual"));

  if (dateIdx === -1 || planIdx === -1 || actualIdx === -1) {
    throw new Error("Progress_Summary format not recognized. Expected wide (3-row) or tabular Date/Plan/Actual.");
  }

  const planAcc: Record<string, number> = {};
  const actualAcc: Record<string, number> = {};
  const dates: string[] = [];

  for (let r = 1; r < rows.length; r++) {
    const d = toISODateKey(rows[r]?.[dateIdx]);
    if (!d) continue;

    const p = toNumber(rows[r]?.[planIdx]);
    const a = toNumber(rows[r]?.[actualIdx]);
    if (p != null) planAcc[d] = p;
    if (a != null) actualAcc[d] = a;
    dates.push(d);
  }

  const sorted = sortISODateKeys(dates);
  const cutoffAuto = detectCutoffDate(sorted.map((d) => ({ date: d, actual: actualAcc[d] ?? null })));

  return { dates: sorted, planAcc, actualAcc, cutoffAuto };
}

/**
 * Build FULL series (no cutoff applied here)
 * NOTE: field name still "week" but it is now ISO date key.
 */
export function buildFullSeries(
  dates: string[],
  planAcc: Record<string, number>,
  actualAcc: Record<string, number>
): ProgressPoint[] {
  return dates.map((d) => ({
    week: d,
    plan: planAcc[d] ?? 0,
    actual: actualAcc[d] ?? null,
  }));
}