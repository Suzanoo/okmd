import type { KpiResult, ProgressRow } from "@/types/report"

function calculateDelayDays(row: ProgressRow, variance: number) {
  const start = new Date(row.project_start).getTime()
  const finish = new Date(row.project_finish).getTime()
  const durationDays = (finish - start) / (1000 * 60 * 60 * 24)

  return Math.round((variance / 100) * durationDays)
}

export function calculateKpi(row: ProgressRow | null): KpiResult | null {
  if (!row) return null

  const variance = row.actual - row.plan
  const days = calculateDelayDays(row, variance)

  return {
    plan: row.plan,
    actual: row.actual,
    variance,
    days,
    status: variance >= 0 ? "Ahead" : "Delay",
  }
}