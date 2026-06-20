import type { ProgressRow } from "@/types/report"

export function parseProgressCsv(text: string): ProgressRow[] {
  const lines = text.trim().split(/\r?\n/)
  const headers = lines[0].split(",").map((h) => h.trim())

  return lines
    .slice(1)
    .filter(Boolean)
    .map((line) => {
      const values = line.split(",").map((v) => v.trim())
      const row = Object.fromEntries(headers.map((h, i) => [h, values[i]]))

      return {
        project_start: row.project_start,
        project_finish: row.project_finish,
        week_start: row.week_start,
        plan: Number(row.plan),
        actual: Number(row.actual),
      }
    })
}