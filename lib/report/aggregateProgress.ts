import type { ChartRow, ProgressRow, ViewMode } from "@/types/report"

function formatWeek(dateText: string) {
  const date = new Date(dateText)
  return `${date.getDate()}/${date.getMonth() + 1}`
}

function formatMonth(dateText: string) {
  const date = new Date(dateText)

  return date.toLocaleString("en-US", {
    month: "short",
    year: "2-digit",
  })
}

export function getMonthlyRows(rows: ProgressRow[]): ProgressRow[] {
  const map = new Map<string, ProgressRow>()

  rows.forEach((row) => {
    const key = row.week_start.slice(0, 7)
    const existing = map.get(key)

    if (!existing || new Date(row.week_start) > new Date(existing.week_start)) {
      map.set(key, row)
    }
  })

  return Array.from(map.values())
}

export function getBaseRows(rows: ProgressRow[], mode: ViewMode): ProgressRow[] {
  return mode === "weekly" ? rows : getMonthlyRows(rows)
}

export function getCutoffOptions(rows: ProgressRow[], mode: ViewMode) {
  return getBaseRows(rows, mode).map((row) => ({
    value: row.week_start,
    label: mode === "weekly" ? formatWeek(row.week_start) : formatMonth(row.week_start),
  }))
}

export function buildChartRows(
  rows: ProgressRow[],
  mode: ViewMode,
  cutoffDate: string
): ChartRow[] {
  return getBaseRows(rows, mode).map((row) => ({
    date: row.week_start,
    label: mode === "weekly" ? formatWeek(row.week_start) : formatMonth(row.week_start),
    plan: row.plan,
    actual: row.week_start <= cutoffDate ? row.actual : null,
  }))
}