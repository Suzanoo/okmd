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

function getLabel(dateText: string, mode: ViewMode) {
  return mode === "weekly" ? formatWeek(dateText) : formatMonth(dateText)
}

export function getMonthlyRows(rows: ProgressRow[]): ProgressRow[] {
  const map = new Map<string, ProgressRow>()

  rows.forEach((row) => {
    const key = row.week_start.slice(0, 7)
    const existing = map.get(key)

    if (!existing || row.week_start > existing.week_start) {
      map.set(key, row)
    }
  })

  return Array.from(map.values()).sort((a, b) =>
    a.week_start.localeCompare(b.week_start)
  )
}

export function getBaseRows(rows: ProgressRow[], mode: ViewMode): ProgressRow[] {
  const source = mode === "weekly" ? rows : getMonthlyRows(rows)

  return [...source].sort((a, b) => a.week_start.localeCompare(b.week_start))
}

export function getCutoffOptions(rows: ProgressRow[], mode: ViewMode) {
  return getBaseRows(rows, mode).map((row) => ({
    value: row.week_start,
    label: getLabel(row.week_start, mode),
  }))
}

export function buildChartRows(
  rows: ProgressRow[],
  mode: ViewMode,
  cutoffDate: string
): ChartRow[] {
  if (!cutoffDate) return []

  const baseRows = getBaseRows(rows, mode)

  return baseRows.map((row) => ({
    date: row.week_start,
    label: getLabel(row.week_start, mode),
    plan: row.plan,
    actual: row.week_start <= cutoffDate ? row.actual : null,
  }))
}

export function buildTableRows(
  rows: ProgressRow[],
  mode: ViewMode,
  cutoffDate: string
): ChartRow[] {
  if (!cutoffDate) return []

  const baseRows = getBaseRows(rows, mode)

  return baseRows
    .filter((row) => row.week_start <= cutoffDate)
    .map((row) => ({
      date: row.week_start,
      label: getLabel(row.week_start, mode),
      plan: row.plan,
      actual: row.actual,
    }))
}