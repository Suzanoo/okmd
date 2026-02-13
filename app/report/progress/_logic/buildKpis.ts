// app/report/progress/_logic/buildKpis.ts
import type { ProgressDataset } from "@/app/report/_data/models/progress";

export type VarianceStatus = "ahead" | "ontrack" | "behind";

export type ProgressKpis = {
  overallPlanEnd: number;
  planAtCutoff: number;
  overallActual: number;
  varianceAtCutoff: number;
  varianceStatus: VarianceStatus;
  cutoffKey: string | null;
  updatedAtISO: string;
};

/**
 * buildProgressKpis
 * -----------------------------------------------------------------------------
 * Purpose:
 * - Produce KPI numbers for the dashboard cards from the *currently rendered*
 *   dataset (already cutoff-applied in store).
 *
 * Important note about cutoffKey:
 * - Weekly mode uses ISO date key: "YYYY-MM-DD"
 * - Monthly mode uses month key:    "YYYY-MM"
 *
 * This function supports BOTH:
 * - If cutoffKey is ISO date, we match weekly point by exact key.
 * - If cutoffKey is month key, we find the *last weekly point within that month*
 *   (because monthly view is a downsample of weekly).
 */
export function buildProgressKpis(ds: ProgressDataset): ProgressKpis {
  const weekly = ds.weekly ?? [];
  const cutoffKey = ds.cutoffWeek ?? null;

  // Plan end = last weekly plan (typically 100)
  const lastWeekly = weekly.length ? weekly[weekly.length - 1] : null;
  const overallPlanEnd = lastWeekly?.plan ?? 0;

  // Resolve cutoff point from weekly series (works for weekly + monthly cutoff keys)
  const cutoffPoint = resolveCutoffPointFromWeekly(weekly, cutoffKey);

  const planAtCutoff = cutoffPoint?.plan ?? 0;
  const overallActual = cutoffPoint?.actual ?? 0;

  const varianceAtCutoff = overallActual - planAtCutoff;

  let varianceStatus: VarianceStatus = "ontrack";
  if (varianceAtCutoff > 0) varianceStatus = "ahead";
  if (varianceAtCutoff < 0) varianceStatus = "behind";

  return {
    overallPlanEnd,
    planAtCutoff,
    overallActual,
    varianceAtCutoff,
    varianceStatus,
    cutoffKey,
    updatedAtISO: ds.updatedAtISO,
  };
}

/**
 * resolveCutoffPointFromWeekly
 * -----------------------------------------------------------------------------
 * Returns the weekly point that corresponds to the selected cutoffKey.
 *
 * Supported keys:
 * - "YYYY-MM-DD" (ISO date): exact match
 * - "YYYY-MM" (month key):   last weekly point where week starts with "YYYY-MM"
 */
function resolveCutoffPointFromWeekly(
  weekly: { week: string; plan: number; actual: number | null }[],
  cutoffKey: string | null
) {
  if (!cutoffKey || weekly.length === 0) return null;

  // Case A) Weekly cutoff key: ISO date
  if (/^\d{4}-\d{2}-\d{2}$/.test(cutoffKey)) {
    return weekly.find((p) => p.week === cutoffKey) ?? null;
  }

  // Case B) Monthly cutoff key: YYYY-MM -> pick the last weekly point in that month
  if (/^\d{4}-\d{2}$/.test(cutoffKey)) {
    let lastInMonth: (typeof weekly)[number] | null = null;
    for (const p of weekly) {
      if (p.week.startsWith(cutoffKey)) lastInMonth = p;
    }
    return lastInMonth;
  }

  // Unknown key format
  return null;
}
