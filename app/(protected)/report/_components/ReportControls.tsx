import type { ViewMode } from "@/types/report";

type Option = {
  value: string;
  label: string;
};

export function ReportControls({
  mode,
  setMode,
  cutoffDate,
  setCutoffDate,
  options,
}: {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
  cutoffDate: string;
  setCutoffDate: (date: string) => void;
  options: Option[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-2 shadow-card">
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as ViewMode)}
        className="h-11 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none"
      >
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>

      <select
        value={cutoffDate}
        onChange={(e) => setCutoffDate(e.target.value)}
        className="h-11 min-w-[160px] rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none"
      >
        <option value="">Select cutoff</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
