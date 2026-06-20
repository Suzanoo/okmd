import type { KpiResult, ProgressRow } from "@/types/report"

function calculateDelayDays(row: ProgressRow) {
  const start = new Date(row.project_start).getTime()
  const finish = new Date(row.project_finish).getTime()
  const durationDays = (finish - start) / (1000 * 60 * 60 * 24)

  const variance = row.actual - row.plan

  return Math.round((variance / 100) * durationDays)
}

export function calculateKpi(
  rows: ProgressRow[],
  cutoffDate: string
): KpiResult | null {
  const selectedRow = rows.filter((row) => row.week_start <= cutoffDate).at(-1)

  if (!selectedRow) return null

  const variance = selectedRow.actual - selectedRow.plan
  const days = calculateDelayDays(selectedRow)

  return {
    plan: selectedRow.plan,
    actual: selectedRow.actual,
    variance,
    days,
    status: variance >= 0 ? "Ahead" : "Delay",
  }
}