export type ViewMode = "weekly" | "monthly"

export type ProgressRow = {
  project_start: string
  project_finish: string
  week_start: string
  plan: number
  actual: number
}

export type ChartRow = {
  date: string
  label: string
  plan: number
  actual: number | null
}

export type KpiResult = {
  plan: number
  actual: number
  variance: number
  days: number
  status: "Ahead" | "Delay"
}

export type ActivityType = "P" | "A"

export type ActivityRow = {
  wbs: string
  activity: string
  amount: number
  type: ActivityType
  originalProgress: number
  weeks: {
    date: string
    value: number
  }[]
}

export type ActivityTableRow = {
  wbs: string
  activity: string
  amount: number
  type: ActivityType
  progress: number
}