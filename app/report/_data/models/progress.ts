// app/report/_data/models/progress.ts
export type ViewMode = "weekly" | "monthly";

export type ProgressPoint = {
  week: string;
  plan: number;
  actual: number | null; // null หลัง cutoff => ไม่ render
};

export type ProgressDataset = {
  source: "template" | "upload";
  filename: string;
  updatedAtISO: string;
  cutoffWeek: string | null;
  viewMode: ViewMode;
  weekly: ProgressPoint[];
  monthly: ProgressPoint[];
};
