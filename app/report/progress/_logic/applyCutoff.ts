// app/report/progress/_logic/applyCutoff.ts
import type { ProgressPoint } from "@/app/report/_data/models/progress";
import { compareISODate } from "@/lib/report/time";

/**
 * Apply cutoff to a time series:
 * - Plan renders fully.
 * - Actual becomes null AFTER cutoff date.
 */
export function applyCutoffToSeries(
  full: ProgressPoint[],
  cutoffDate: string | null
): ProgressPoint[] {
  if (!cutoffDate) {
    return full.map((p) => ({ ...p, actual: null }));
  }

  return full.map((p) => ({
    ...p,
    actual: compareISODate(p.week, cutoffDate) <= 0 ? p.actual : null,
  }));
}