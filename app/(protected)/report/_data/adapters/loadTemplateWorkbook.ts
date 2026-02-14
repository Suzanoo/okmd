// app/report/_data/adapters/loadTemplateWorkbook.ts
import { readWorkbookFromArrayBuffer, loadXlsxModule } from "@/lib/excel/readWorkbook";
import type { ProgressDataset, ProgressPoint } from "../models/progress";
import { parseProgressSummarySheet, buildFullSeries } from "./parseProgressSummary";
import { applyCutoffToSeries } from "@/app/(protected)/report/progress/_logic/applyCutoff";
import { monthKeyFromISODate } from "@/lib/report/time";

function nowISO(): string {
  return new Date().toISOString();
}

/** Monthly = pick last point of each YYYY-MM */
function buildMonthlyFromSeries(series: ProgressPoint[]): ProgressPoint[] {
  const lastByMonth = new Map<string, ProgressPoint>();
  for (const p of series) {
    const mk = monthKeyFromISODate(p.week);
    lastByMonth.set(mk, p);
  }
  return Array.from(lastByMonth.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([mk, p]) => ({ week: mk, plan: p.plan, actual: p.actual }));
}

export async function loadTemplateProgressDataset(): Promise<ProgressDataset> {
  const res = await fetch("/templates/sample.xlsx");
  if (!res.ok) throw new Error("Failed to load template workbook.");

  const buf = await res.arrayBuffer();
  const wb = await readWorkbookFromArrayBuffer(buf);

  const XLSX = await loadXlsxModule();
  const sheetName = "Progress_Summary";
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Missing sheet: ${sheetName}`);

  const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(ws, {
    header: 1,
    raw: true,
    defval: null,
  });

  const { dates, planAcc, actualAcc, cutoffAuto } = parseProgressSummarySheet(rows);

  const full = buildFullSeries(dates, planAcc, actualAcc);
  const weekly = applyCutoffToSeries(full, cutoffAuto);
  const monthly = buildMonthlyFromSeries(weekly);

  return {
    source: "template",
    filename: "sample.xlsx",
    updatedAtISO: nowISO(),
    cutoffWeek: cutoffAuto, // now ISO date
    viewMode: "weekly",
    weekly,
    monthly,
  };
}