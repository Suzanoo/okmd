import type { ActivityRow, ActivityType } from "@/types/report"

const BASE_COLUMNS = ["WBS", "Activities", "Amount", "P/A", "%Progress"]

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (char === '"' && inQuotes && next === '"') {
      cell += '"'
      i++
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      row.push(cell.trim())
      cell = ""
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (cell || row.length) {
        row.push(cell.trim())
        rows.push(row)
        row = []
        cell = ""
      }
      if (char === "\r" && next === "\n") i++
    } else {
      cell += char
    }
  }

  if (cell || row.length) {
    row.push(cell.trim())
    rows.push(row)
  }

  return rows
}

function normalizeDate(value: string) {
  const [day, month, year] = value.trim().split("/")
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}

function toNumber(value: string | undefined) {
  if (!value) return 0

  return (
    Number(
      value
        .replaceAll(",", "")
        .replace("%", "")
        .trim()
    ) || 0
  )
}

export function parseActivityCsv(text: string): ActivityRow[] {
  const table = parseCsv(text)
  const headers = table[0].map((h) => h.trim())

  const weekHeaders = headers.filter((header) => !BASE_COLUMNS.includes(header))

  return table
    .slice(1)
    .filter((values) => values.length > 1)
    .map((values) => {
      const row = Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]))

      const amount = toNumber(row.Amount)

      return {
        wbs: row.WBS ?? "",
        activity: row.Activities ?? "",
        amount,
        type: (row["P/A"] ?? "P") as ActivityType,
        originalProgress: toNumber(row["%Progress"]),
        weeks: weekHeaders.map((header) => ({
          date: normalizeDate(header),
          value: toNumber(row[header]),
        })),
      }
    })
    .filter((row) => row.amount > 0)
}