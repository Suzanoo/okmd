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
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as ViewMode)}
        className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-xl"
      >
        <option className="bg-neutral-900" value="weekly">
          Weekly
        </option>
        <option className="bg-neutral-900" value="monthly">
          Monthly
        </option>
      </select>

      <select
        value={cutoffDate}
        onChange={(e) => setCutoffDate(e.target.value)}
        className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-xl"
      >
        {options.map((option) => (
          <option
            className="bg-neutral-900"
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
