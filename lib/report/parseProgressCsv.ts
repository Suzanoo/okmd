import type { ProgressRow } from "@/types/report"

function normalizeDate(value: string) {
  const clean = value.trim()

  if (clean.includes("-")) {
    const [y, m, d] = clean.split("-")
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
  }

  if (clean.includes("/")) {
    const [y, m, d] = clean.split("/")
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
  }

  return clean
}

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
        project_start: normalizeDate(row.project_start),
        project_finish: normalizeDate(row.project_finish),
        week_start: normalizeDate(row.week_start),
        plan: Number(row.plan),
        actual: Number(row.actual),
      }
    })
    .sort((a, b) => a.week_start.localeCompare(b.week_start))
}